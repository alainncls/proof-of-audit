import {ChangeEvent, FormEvent, useState} from 'react'
import './App.css'
import {useAccount} from "wagmi";
import ConnectButton from "./components/ConnectButton.tsx";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
import {waitForTransactionReceipt} from "viem/actions";
import {Hex, isAddress} from "viem";
import {wagmiConfig} from "./wagmiConfig.ts";
import {useVeraxSdk} from "./hooks/useVeraxSdk.ts";
import {PORTAL_ID, SCHEMA_ID} from "./utils/constants.ts";

function App() {
    const [inputValues, setInputValues] = useState({commitHash: '', repoUrl: '', contractAddress: ''});
    const [errors, setErrors] = useState({commitHash: '', repoUrl: '', contractAddress: ''});
    const [txHash, setTxHash] = useState<Hex>();
    const [attestationId, setAttestationId] = useState<Hex>();

    const {address, chainId} = useAccount();
    const {veraxSdk} = useVeraxSdk(chainId, address);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValues({...inputValues, [e.target.name]: e.target.value});
        validateField(e.target.name, e.target.value);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (Object.values(errors).every(error => error === '')) {
            setTxHash(undefined);
            setAttestationId(undefined);
            await issueAttestation();
        }
    };

    const validateField = (name: string, value: string) => {
        let error = '';
        switch (name) {
            case 'commitHash':
                if (!/^[0-9a-f]{40}$/.test(value)) {
                    error = 'Commit hash is not valid. It should be a 40 character hexadecimal string.';
                }
                break;
            case 'repoUrl':
                if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(value)) {
                    error = 'GitHub repo URL is not valid. It should be in the format https://github.com/username/repo.';
                }
                break;
            case 'contractAddress':
                if (!isAddress(value)) {
                    error = 'Contract address is not valid. It must be a valid Ethereum address.';
                }
                break;
            default:
                break;
        }
        setErrors({...errors, [name]: error});
    };

    const issueAttestation = async () => {
        if (address && veraxSdk) {
            try {
                let receipt = await veraxSdk.portal.attest(
                    PORTAL_ID,
                    {
                        schemaId: SCHEMA_ID,
                        expirationDate: Math.floor(Date.now() / 1000) + 2592000,
                        subject: inputValues.contractAddress,
                        attestationData: [{
                            commitHash: inputValues.commitHash,
                            repoUrl: inputValues.repoUrl,
                        }],
                    },
                    [],
                );
                if (receipt.transactionHash) {
                    setTxHash(receipt.transactionHash)
                    receipt = await waitForTransactionReceipt(wagmiConfig.getClient(), {
                        hash: receipt.transactionHash,
                    });
                    setAttestationId(receipt.logs?.[0].topics[1])
                } else {
                    alert(`Oops, something went wrong!`);
                }
            } catch (e) {
                console.log(e);
                if (e instanceof Error) {
                    alert(`Oops, something went wrong: ${e.message}`);
                }
            }
        }
    };

    const isError = () => {
        return errors.commitHash !== '' || errors.repoUrl !== '' || errors.contractAddress !== ''
    }

    const isEmpty = () => {
        return inputValues.commitHash === '' || inputValues.repoUrl === '' || inputValues.contractAddress === ''
    }

    const truncateHexString = (hexString: string) => {
        return `${hexString.slice(0, 7)}...${hexString.slice(hexString.length - 5, hexString.length)}`
    }

    return (
        <>
            <Header/>
            <div className={'main-container'}>
                <ConnectButton/>
                <form onSubmit={handleSubmit}>
                    <input type="text" name="repoUrl" value={inputValues.repoUrl} onChange={handleChange}
                           placeholder="GitHub Repo URL"/>
                    {errors.repoUrl && <div className="error">{errors.repoUrl}</div>}
                    <input type="text" name="commitHash" value={inputValues.commitHash} onChange={handleChange}
                           placeholder="Commit Hash"/>
                    {errors.commitHash && <div className="error">{errors.commitHash}</div>}
                    <input type="text" name="contractAddress" value={inputValues.contractAddress}
                           onChange={handleChange}
                           placeholder="Smart contract address"/>
                    {errors.contractAddress && <div className="error">{errors.contractAddress}</div>}
                    <button type="submit" disabled={!address || !veraxSdk || isError() || isEmpty()}>Issue attestation
                    </button>
                </form>
                {txHash && <div className={'message'}>Transaction Hash: <a
                  href={`${chainId === 59144 ? 'https://lineascan.build/tx/' : 'https://sepolia.lineascan.build/tx/'}${txHash}`}
                  target="_blank" rel="noopener noreferrer">{truncateHexString(txHash)}</a></div>}
                {txHash && !attestationId && <div className={'message pending'}>Transaction pending...</div>}
                {attestationId && <div className={'message success'}>Attestation ID: <a
                  href={`${chainId === 59144 ? 'https://explorer.ver.ax/linea/attestations/' : 'https://explorer.ver.ax/linea-sepolia/attestations/'}${attestationId}`}
                  target="_blank" rel="noopener noreferrer">{truncateHexString(attestationId)}</a></div>}
            </div>
            <Footer/>
        </>
    );
}

export default App
