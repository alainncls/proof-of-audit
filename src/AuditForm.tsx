import {
  type ChangeEvent,
  type FormEvent,
  memo,
  useCallback,
  useState,
} from 'react';
import { useAccount } from 'wagmi';
import ConnectButton from './components/ConnectButton.tsx';
import { waitForTransactionReceipt } from 'viem/actions';
import { type Hex, isAddress } from 'viem';
import { wagmiConfig } from './wagmiConfig.ts';
import { useVeraxSdk } from './hooks/useVeraxSdk.ts';
import {
  ATTESTATION_VALIDITY_SECONDS,
  getBlockExplorerTxUrl,
  getVeraxExplorerAttestationUrl,
  isSupportedLineaChainId,
  PORTAL_ID,
  SCHEMA_ID,
} from './utils/constants.ts';

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

type StatusState = {
  type: 'idle' | 'pending' | 'success' | 'error';
  txHash?: Hex;
  attestationId?: Hex;
  errorMessage?: string;
};

const COMMIT_HASH_PATTERN = /^[0-9a-f]{40}$/;
const GITHUB_REPO_URL_PATTERN = /^https:\/\/github\.com\/[^/]+\/[^/]+$/;

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
      return GITHUB_REPO_URL_PATTERN.test(value)
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

type AuditFormFieldProps = FormFieldConfig & {
  value: string;
  error: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
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

  const { address, chainId } = useAccount();
  const veraxSdk = useVeraxSdk(chainId, address);
  const { commitHash, repoUrl, contractAddress } = inputValues;

  const isValidChain = isSupportedLineaChainId(chainId);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as FormFieldName;

    setInputValues((prev) => ({ ...prev, [fieldName]: value }));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: validateField(fieldName, value),
    }));
  }, []);

  const issueAttestation = useCallback(async () => {
    if (!address || !veraxSdk || !chainId) return;

    setStatus({ type: 'pending' });

    try {
      const expirationDate =
        Math.floor(Date.now() / 1000) + ATTESTATION_VALIDITY_SECONDS;

      const receipt = await veraxSdk.portal.attest(
        PORTAL_ID,
        {
          schemaId: SCHEMA_ID,
          expirationDate,
          subject: contractAddress,
          attestationData: [
            {
              commitHash,
              repoUrl,
            },
          ],
        },
        [],
      );

      if (!receipt.transactionHash) {
        setStatus({
          type: 'error',
          errorMessage: 'Transaction failed - no hash received',
        });
        return;
      }

      setStatus({ type: 'pending', txHash: receipt.transactionHash });

      const finalReceipt = await waitForTransactionReceipt(
        wagmiConfig.getClient(),
        { hash: receipt.transactionHash },
      );

      const attestationId = finalReceipt.logs?.[0]?.topics[1] as
        | Hex
        | undefined;

      if (attestationId) {
        setStatus({
          type: 'success',
          txHash: receipt.transactionHash,
          attestationId,
        });
      } else {
        setStatus({
          type: 'error',
          txHash: receipt.transactionHash,
          errorMessage: 'Could not extract attestation ID from transaction',
        });
      }
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'An unexpected error occurred';
      setStatus({ type: 'error', errorMessage });
    }
  }, [address, chainId, commitHash, contractAddress, repoUrl, veraxSdk]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate all fields before submit
      const newErrors: FormErrors = {
        commitHash: validateField('commitHash', commitHash),
        repoUrl: validateField('repoUrl', repoUrl),
        contractAddress: validateField('contractAddress', contractAddress),
      };
      setErrors(newErrors);

      const hasValidationErrors = Boolean(
        newErrors.commitHash || newErrors.repoUrl || newErrors.contractAddress,
      );
      if (hasValidationErrors) return;

      setStatus({ type: 'idle' });
      await issueAttestation();
    },
    [commitHash, contractAddress, issueAttestation, repoUrl],
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

      {status.txHash && chainId ? (
        <div
          className={`status-message ${transactionStatusClass}`}
          role="status"
          aria-live="polite"
        >
          Transaction:{' '}
          <a
            href={getBlockExplorerTxUrl(chainId, status.txHash)}
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

      {status.type === 'success' && status.attestationId && chainId ? (
        <div
          className="status-message success"
          role="status"
          aria-live="polite"
        >
          Attestation ID:{' '}
          <a
            href={getVeraxExplorerAttestationUrl(chainId, status.attestationId)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {truncateHexString(status.attestationId)}
          </a>
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
