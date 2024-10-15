import { ChangeEvent, FormEvent, useCallback, useMemo, useState } from 'react';
import './App.css';
import { useAccount } from 'wagmi';
import ConnectButton from './components/ConnectButton.tsx';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import { waitForTransactionReceipt } from 'viem/actions';
import { Hex, isAddress } from 'viem';
import { wagmiConfig } from './wagmiConfig.ts';
import { useVeraxSdk } from './hooks/useVeraxSdk.ts';
import { PORTAL_ID, SCHEMA_ID } from './utils/constants.ts';

const App = () => {
  const [formState, setFormState] = useState({
    inputValues: { commitHash: '', repoUrl: '', contractAddress: '' },
    errors: { commitHash: '', repoUrl: '', contractAddress: '' },
  });
  const [txHash, setTxHash] = useState<Hex>();
  const [attestationId, setAttestationId] = useState<Hex>();

  const { address, chainId } = useAccount();
  const { veraxSdk } = useVeraxSdk(chainId, address);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      inputValues: { ...prevState.inputValues, [name]: value },
      errors: { ...prevState.errors, [name]: validateField(name, value) },
    }));
  }, []);

  const issueAttestation = useCallback(async () => {
    if (address && veraxSdk) {
      try {
        let receipt = await veraxSdk.portal.attest(
          PORTAL_ID,
          {
            schemaId: SCHEMA_ID,
            expirationDate: Math.floor(Date.now() / 1000) + 2592000,
            subject: formState.inputValues.contractAddress,
            attestationData: [
              {
                commitHash: formState.inputValues.commitHash,
                repoUrl: formState.inputValues.repoUrl,
              },
            ],
          },
          [],
        );
        if (receipt.transactionHash) {
          setTxHash(receipt.transactionHash);
          receipt = await waitForTransactionReceipt(wagmiConfig.getClient(), {
            hash: receipt.transactionHash,
          });
          setAttestationId(receipt.logs?.[0].topics[1]);
        } else {
          alert('Oops, something went wrong!');
        }
      } catch (e) {
        console.log(e);
        if (e instanceof Error) {
          alert(`Oops, something went wrong: ${e.message}`);
        }
      }
    }
  }, [address, veraxSdk, formState.inputValues]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (Object.values(formState.errors).every((error) => error === '')) {
        setTxHash(undefined);
        setAttestationId(undefined);
        await issueAttestation();
      }
    },
    [formState.errors, issueAttestation],
  );

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'commitHash':
        return /^[0-9a-f]{40}$/.test(value) ? '' : 'Commit hash is not valid.';
      case 'repoUrl':
        return /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(value)
          ? ''
          : 'GitHub repo URL is not valid.';
      case 'contractAddress':
        return isAddress(value) ? '' : 'Contract address is not valid.';
      default:
        return '';
    }
  };

  const isError = useMemo(
    () => Object.values(formState.errors).some((error) => error !== ''),
    [formState.errors],
  );
  const isEmpty = useMemo(
    () => Object.values(formState.inputValues).some((value) => value === ''),
    [formState.inputValues],
  );

  const truncateHexString = (hexString: string) =>
    `${hexString.slice(0, 7)}...${hexString.slice(hexString.length - 5)}`;

  return (
    <>
      <Header />
      <div className="main-container">
        <ConnectButton />
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="repoUrl"
            value={formState.inputValues.repoUrl}
            onChange={handleChange}
            placeholder="GitHub Repo URL"
          />
          {formState.errors.repoUrl && (
            <div className="error">{formState.errors.repoUrl}</div>
          )}
          <input
            type="text"
            name="commitHash"
            value={formState.inputValues.commitHash}
            onChange={handleChange}
            placeholder="Commit Hash"
          />
          {formState.errors.commitHash && (
            <div className="error">{formState.errors.commitHash}</div>
          )}
          <input
            type="text"
            name="contractAddress"
            value={formState.inputValues.contractAddress}
            onChange={handleChange}
            placeholder="Smart contract address"
          />
          {formState.errors.contractAddress && (
            <div className="error">{formState.errors.contractAddress}</div>
          )}
          <button
            type="submit"
            disabled={!address || !veraxSdk || isError || isEmpty}
          >
            Issue attestation
          </button>
        </form>
        {txHash && (
          <div className="message">
            Transaction Hash:{' '}
            <a
              href={`${chainId === 59144 ? 'https://lineascan.build/tx/' : 'https://sepolia.lineascan.build/tx/'}${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {truncateHexString(txHash)}
            </a>
          </div>
        )}
        {txHash && !attestationId && (
          <div className="message pending">Transaction pending...</div>
        )}
        {attestationId && (
          <div className="message success">
            Attestation ID:{' '}
            <a
              href={`${chainId === 59144 ? 'https://explorer.ver.ax/linea/attestations/' : 'https://explorer.ver.ax/linea-sepolia/attestations/'}${attestationId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {truncateHexString(attestationId)}
            </a>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default App;
