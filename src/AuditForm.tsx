import {
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  memo,
  useCallback,
  useRef,
  useState,
} from 'react';
import { useAccount } from 'wagmi';
import ConnectButton from './components/ConnectButton.tsx';
import { waitForTransactionReceipt } from 'viem/actions';
import { type Address, type Hex, isAddress } from 'viem';
import { wagmiConfig } from './wagmiConfig.ts';
import { useVeraxSdk } from './hooks/useVeraxSdk.ts';
import {
  ATTESTATION_VALIDITY_SECONDS,
  getBlockExplorerTxUrl,
  getVeraxExplorerAttestationUrl,
  isSupportedLineaChainId,
  LINEA_MAINNET_CHAIN_ID,
  LINEA_SEPOLIA_CHAIN_ID,
  PORTAL_ID,
  SCHEMA_ID,
} from './utils/constants.ts';
import { extractAttestationIdFromReceipt } from './utils/attestationReceipt.ts';
import { isValidGithubRepositoryUrl } from './utils/repoUrl.ts';

type FormValues = {
  commitHash: string;
  repoUrl: string;
  contractAddress: string;
};

type FormErrors = {
  commitHash: string;
  repoUrl: string;
  contractAddress: string;
};

type FormFieldName = keyof FormValues;

type FormFieldConfig = {
  name: FormFieldName;
  label: string;
  type: 'text' | 'url';
  placeholder: string;
  autoComplete: string;
  spellCheck?: boolean;
};

type SubmissionOrigin = {
  account: Address;
  chainId: number;
  txExplorerUrl?: string;
  attestationExplorerUrl?: string;
};

type StatusState = {
  type: 'idle' | 'pending' | 'success' | 'error';
  txHash?: Hex;
  attestationId?: Hex;
  errorMessage?: string;
  origin?: SubmissionOrigin;
};

const COMMIT_HASH_PATTERN = /^[0-9a-f]{40}$/;
const FORM_FIELDS: readonly FormFieldConfig[] = [
  {
    name: 'repoUrl',
    label: 'GitHub Repository URL',
    type: 'url',
    placeholder: 'https://github.com/owner/repo',
    autoComplete: 'url',
  },
  {
    name: 'commitHash',
    label: 'Commit Hash',
    type: 'text',
    placeholder: '37f8ecd53a64ba2395b7de0a8d7ecb0dbfdced64',
    autoComplete: 'off',
    spellCheck: false,
  },
  {
    name: 'contractAddress',
    label: 'Smart Contract Address',
    type: 'text',
    placeholder: '0x...',
    autoComplete: 'off',
    spellCheck: false,
  },
];

const validateField = (name: FormFieldName, value: string): string => {
  switch (name) {
    case 'commitHash':
      return COMMIT_HASH_PATTERN.test(value)
        ? ''
        : 'Invalid commit hash (40 hex characters expected)';
    case 'repoUrl':
      return isValidGithubRepositoryUrl(value)
        ? ''
        : 'Invalid GitHub URL (e.g., https://github.com/owner/repo)';
    case 'contractAddress':
      return isAddress(value) ? '' : 'Invalid Ethereum address';
    default:
      return '';
  }
};

const truncateHexString = (hexString: string): string =>
  `${hexString.slice(0, 7)}...${hexString.slice(-5)}`;

const lineaChainLabel = (chainId: number): string => {
  if (chainId === LINEA_MAINNET_CHAIN_ID) {
    return 'Linea Mainnet';
  }
  if (chainId === LINEA_SEPOLIA_CHAIN_ID) {
    return 'Linea Sepolia';
  }
  return `chain ${chainId}`;
};

type AuditFormFieldProps = FormFieldConfig & {
  value: string;
  error: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement>) => void;
};

const AuditFormField = memo(function AuditFormField({
  name,
  label,
  type,
  placeholder,
  autoComplete,
  spellCheck,
  value,
  error,
  onChange,
  onBlur,
}: Readonly<AuditFormFieldProps>) {
  const errorId = `${name}-error`;

  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`form-input ${error ? 'has-error' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
      />
      {error ? (
        <div id={errorId} className="form-error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
});

// Verax encodes ABI fields positionally at runtime, although its public type
// declares object[]. Keep the runtime-correct tuple at this boundary.
const veraxAbiValues = (values: string[]): object[] =>
  values as unknown as object[];

const AuditForm = () => {
  const [inputValues, setInputValues] = useState<FormValues>({
    commitHash: '',
    repoUrl: '',
    contractAddress: '',
  });
  const [errors, setErrors] = useState<FormErrors>({
    commitHash: '',
    repoUrl: '',
    contractAddress: '',
  });
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });
  const inFlightRef = useRef(false);

  const { address, chainId } = useAccount();
  const veraxSdk = useVeraxSdk(chainId, address);
  const { commitHash, repoUrl, contractAddress } = inputValues;

  const isValidChain = isSupportedLineaChainId(chainId);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as FormFieldName;

    setInputValues((prev) => ({ ...prev, [fieldName]: value }));

    setErrors((prev) =>
      prev[fieldName] ? { ...prev, [fieldName]: '' } : prev,
    );
  }, []);

  const handleBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as FormFieldName;

    setErrors((prev) => ({
      ...prev,
      [fieldName]: validateField(fieldName, value),
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Disabling the button is not a mutex: React applies it only after
      // render. A second submit can run before that unless this ref is set
      // synchronously, before any await.
      if (inFlightRef.current) {
        return;
      }

      const newErrors: FormErrors = {
        commitHash: validateField('commitHash', commitHash),
        repoUrl: validateField('repoUrl', repoUrl),
        contractAddress: validateField('contractAddress', contractAddress),
      };
      setErrors(newErrors);

      const hasValidationErrors = Boolean(
        newErrors.commitHash || newErrors.repoUrl || newErrors.contractAddress,
      );
      if (hasValidationErrors) {
        return;
      }

      inFlightRef.current = true;

      const capturedAccount = address;
      const capturedChainId = chainId;
      const capturedSdk = veraxSdk;
      const capturedSubject = contractAddress;
      const capturedCommitHash = commitHash;
      const capturedRepoUrl = repoUrl;
      const capturedPortalId = PORTAL_ID;
      const origin: SubmissionOrigin | undefined =
        capturedAccount && typeof capturedChainId === 'number'
          ? { account: capturedAccount, chainId: capturedChainId }
          : undefined;

      setStatus({ type: 'pending', origin });

      try {
        if (!isSupportedLineaChainId(capturedChainId)) {
          setStatus({
            type: 'error',
            origin,
            errorMessage:
              'Please switch to Linea Mainnet or Linea Sepolia before issuing an attestation.',
          });
          return;
        }

        const supportedChainId =
          capturedChainId === LINEA_MAINNET_CHAIN_ID
            ? LINEA_MAINNET_CHAIN_ID
            : LINEA_SEPOLIA_CHAIN_ID;

        if (!capturedAccount || !capturedSdk) {
          setStatus({
            type: 'error',
            origin,
            errorMessage:
              'Connect a wallet on Linea Mainnet or Linea Sepolia before issuing an attestation.',
          });
          return;
        }

        const receiptClient = wagmiConfig.getClient({
          chainId: supportedChainId,
        });

        if (!receiptClient) {
          setStatus({
            type: 'error',
            origin,
            errorMessage:
              'Could not open a wallet client for the submitting Linea network. Switch to that network and try again.',
          });
          return;
        }

        const expirationDate =
          Math.floor(Date.now() / 1000) + ATTESTATION_VALIDITY_SECONDS;

        const receipt = await capturedSdk.portal.attest(
          capturedPortalId,
          {
            schemaId: SCHEMA_ID,
            expirationDate,
            subject: capturedSubject,
            attestationData: veraxAbiValues([
              capturedCommitHash,
              capturedRepoUrl,
            ]),
          },
          [],
        );

        if (!receipt.transactionHash) {
          setStatus({
            type: 'error',
            origin,
            errorMessage: 'Transaction failed - no hash received',
          });
          return;
        }

        const pendingOrigin: SubmissionOrigin = {
          account: capturedAccount,
          chainId: supportedChainId,
          txExplorerUrl: getBlockExplorerTxUrl(
            supportedChainId,
            receipt.transactionHash,
          ),
        };

        setStatus({
          type: 'pending',
          txHash: receipt.transactionHash,
          origin: pendingOrigin,
        });

        const finalReceipt = await waitForTransactionReceipt(receiptClient, {
          hash: receipt.transactionHash,
        });

        if (finalReceipt.status !== 'success') {
          setStatus({
            type: 'error',
            txHash: receipt.transactionHash,
            origin: pendingOrigin,
            errorMessage: 'Transaction failed',
          });
          return;
        }

        const attestationId = extractAttestationIdFromReceipt(
          supportedChainId,
          finalReceipt.logs,
        );

        if (!attestationId) {
          setStatus({
            type: 'error',
            txHash: receipt.transactionHash,
            origin: pendingOrigin,
            errorMessage: 'Could not extract attestation ID from transaction',
          });
          return;
        }

        setStatus({
          type: 'success',
          txHash: receipt.transactionHash,
          attestationId,
          origin: {
            ...pendingOrigin,
            attestationExplorerUrl: getVeraxExplorerAttestationUrl(
              supportedChainId,
              attestationId,
            ),
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred';
        setStatus({ type: 'error', origin, errorMessage });
      } finally {
        inFlightRef.current = false;
      }
    },
    [address, chainId, commitHash, contractAddress, repoUrl, veraxSdk],
  );

  const hasErrors = Boolean(
    errors.commitHash || errors.repoUrl || errors.contractAddress,
  );
  const isEmpty = !commitHash || !repoUrl || !contractAddress;
  const transactionStatusClass =
    status.type === 'error' ? 'error' : status.type;

  const isSubmitDisabled =
    !address ||
    !veraxSdk ||
    !isValidChain ||
    hasErrors ||
    isEmpty ||
    status.type === 'pending';

  return (
    <>
      <ConnectButton />

      {address && !isValidChain ? (
        <div className="status-message error" role="alert">
          Please switch to Linea Mainnet or Linea Sepolia
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="form" noValidate>
        {FORM_FIELDS.map((field) => (
          <AuditFormField
            key={field.name}
            {...field}
            value={inputValues[field.name]}
            error={errors[field.name]}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        ))}

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`submit-button ${status.type === 'pending' ? 'loading' : ''}`}
          aria-busy={status.type === 'pending'}
        >
          {status.type === 'pending' ? 'Issuing...' : 'Issue Attestation'}
        </button>
      </form>

      {status.txHash && status.origin?.txExplorerUrl ? (
        <div
          className={`status-message ${transactionStatusClass}`}
          role="status"
          aria-live="polite"
        >
          Transaction:{' '}
          <a
            href={status.origin.txExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {truncateHexString(status.txHash)}
          </a>
        </div>
      ) : null}

      {status.type === 'pending' && status.txHash ? (
        <div
          className="status-message pending"
          role="status"
          aria-live="polite"
        >
          Waiting for confirmation...
        </div>
      ) : null}

      {status.type === 'success' &&
      status.attestationId &&
      status.origin?.attestationExplorerUrl ? (
        <div
          className="status-message success"
          role="status"
          aria-live="polite"
        >
          Attestation ID:{' '}
          <a
            href={status.origin.attestationExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {truncateHexString(status.attestationId)}
          </a>
        </div>
      ) : null}

      {status.origin &&
      (address !== status.origin.account ||
        chainId !== status.origin.chainId) ? (
        <div className="status-message notice" role="status">
          This result belongs to the submitting account {status.origin.account}{' '}
          on {lineaChainLabel(status.origin.chainId)}. The connected account or
          network has changed.
        </div>
      ) : null}

      {status.type === 'error' && status.errorMessage ? (
        <div className="status-message error" role="alert">
          {status.errorMessage}
        </div>
      ) : null}
    </>
  );
};

export default AuditForm;
