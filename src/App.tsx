import { ChangeEvent, FormEvent, useCallback, useMemo, useState } from 'react';
import './App.css';
import { useAccount } from 'wagmi';
import ConnectButton from './components/ConnectButton.tsx';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import { waitForTransactionReceipt } from 'viem/actions';
import { type Hex, isAddress } from 'viem';
import { wagmiConfig } from './wagmiConfig.ts';
import { useVeraxSdk } from './hooks/useVeraxSdk.ts';
import {
  ATTESTATION_VALIDITY_SECONDS,
  getBlockExplorerTxUrl,
  getVeraxExplorerAttestationUrl,
  LINEA_MAINNET_CHAIN_ID,
  LINEA_SEPOLIA_CHAIN_ID,
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

type StatusState = {
  type: 'idle' | 'pending' | 'success' | 'error';
  txHash?: Hex;
  attestationId?: Hex;
  errorMessage?: string;
};

const validateField = (name: keyof FormValues, value: string): string => {
  switch (name) {
    case 'commitHash':
      return /^[0-9a-f]{40}$/.test(value)
        ? ''
        : 'Invalid commit hash (40 hex characters expected)';
    case 'repoUrl':
      return /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(value)
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

const App = () => {
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
  const { veraxSdk } = useVeraxSdk(chainId, address);

  const isValidChain =
    chainId === LINEA_MAINNET_CHAIN_ID || chainId === LINEA_SEPOLIA_CHAIN_ID;

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof FormValues, value),
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
          subject: inputValues.contractAddress,
          attestationData: [
            {
              commitHash: inputValues.commitHash,
              repoUrl: inputValues.repoUrl,
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
  }, [address, veraxSdk, chainId, inputValues]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate all fields before submit
      const newErrors: FormErrors = {
        commitHash: validateField('commitHash', inputValues.commitHash),
        repoUrl: validateField('repoUrl', inputValues.repoUrl),
        contractAddress: validateField(
          'contractAddress',
          inputValues.contractAddress,
        ),
      };
      setErrors(newErrors);

      const hasErrors = Object.values(newErrors).some((error) => error !== '');
      if (hasErrors) return;

      setStatus({ type: 'idle' });
      await issueAttestation();
    },
    [inputValues, issueAttestation],
  );

  const hasErrors = useMemo(
    () => Object.values(errors).some((error) => error !== ''),
    [errors],
  );

  const isEmpty = useMemo(
    () => Object.values(inputValues).some((value) => value === ''),
    [inputValues],
  );

  const isSubmitDisabled =
    !address ||
    !veraxSdk ||
    !isValidChain ||
    hasErrors ||
    isEmpty ||
    status.type === 'pending';

  return (
    <>
      <Header />
      <main className="main-container">
        <ConnectButton />

        {address && !isValidChain && (
          <div className="status-message error" role="alert">
            Please switch to Linea Mainnet or Linea Sepolia
          </div>
        )}

        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="form-group">
            <label htmlFor="repoUrl" className="form-label">
              GitHub Repository URL
            </label>
            <input
              id="repoUrl"
              type="url"
              name="repoUrl"
              value={inputValues.repoUrl}
              onChange={handleChange}
              placeholder="https://github.com/owner/repo"
              className={`form-input ${errors.repoUrl ? 'has-error' : ''}`}
              aria-invalid={!!errors.repoUrl}
              aria-describedby={errors.repoUrl ? 'repoUrl-error' : undefined}
              autoComplete="url"
            />
            {errors.repoUrl && (
              <div id="repoUrl-error" className="form-error" role="alert">
                {errors.repoUrl}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="commitHash" className="form-label">
              Commit Hash
            </label>
            <input
              id="commitHash"
              type="text"
              name="commitHash"
              value={inputValues.commitHash}
              onChange={handleChange}
              placeholder="37f8ecd53a64ba2395b7de0a8d7ecb0dbfdced64"
              className={`form-input ${errors.commitHash ? 'has-error' : ''}`}
              aria-invalid={!!errors.commitHash}
              aria-describedby={
                errors.commitHash ? 'commitHash-error' : undefined
              }
              autoComplete="off"
              spellCheck="false"
            />
            {errors.commitHash && (
              <div id="commitHash-error" className="form-error" role="alert">
                {errors.commitHash}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contractAddress" className="form-label">
              Smart Contract Address
            </label>
            <input
              id="contractAddress"
              type="text"
              name="contractAddress"
              value={inputValues.contractAddress}
              onChange={handleChange}
              placeholder="0x..."
              className={`form-input ${errors.contractAddress ? 'has-error' : ''}`}
              aria-invalid={!!errors.contractAddress}
              aria-describedby={
                errors.contractAddress ? 'contractAddress-error' : undefined
              }
              autoComplete="off"
              spellCheck="false"
            />
            {errors.contractAddress && (
              <div
                id="contractAddress-error"
                className="form-error"
                role="alert"
              >
                {errors.contractAddress}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`submit-button ${status.type === 'pending' ? 'loading' : ''}`}
            aria-busy={status.type === 'pending'}
          >
            {status.type === 'pending' ? 'Issuing...' : 'Issue Attestation'}
          </button>
        </form>

        {status.txHash && chainId && (
          <div
            className={`status-message ${status.type === 'success' ? 'success' : 'pending'}`}
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
        )}

        {status.type === 'pending' && status.txHash && (
          <div
            className="status-message pending"
            role="status"
            aria-live="polite"
          >
            Waiting for confirmation...
          </div>
        )}

        {status.type === 'success' && status.attestationId && chainId && (
          <div
            className="status-message success"
            role="status"
            aria-live="polite"
          >
            Attestation ID:{' '}
            <a
              href={getVeraxExplorerAttestationUrl(
                chainId,
                status.attestationId,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              {truncateHexString(status.attestationId)}
            </a>
          </div>
        )}

        {status.type === 'error' && status.errorMessage && (
          <div className="status-message error" role="alert">
            {status.errorMessage}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default App;
