import {ChangeEvent, FormEvent, useEffect, useState} from 'react'
import './App.css'
import {VeraxSdk} from "@verax-attestation-registry/verax-sdk";
import {useAccount} from "wagmi";
import ConnectButton from "./components/ConnectButton.tsx";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
import {waitForTransactionReceipt} from "viem/actions";
import {Hex} from "viem";
import {wagmiConfig} from "./wagmiConfig.ts";

function App() {
    const [inputValues, setInputValues] = useState({commitHash: '', repoUrl: '', eip712Signature: ''});
    const [errors, setErrors] = useState({commitHash: '', repoUrl: '', eip712Signature: ''});
    const [veraxSdk, setVeraxSdk] = useState<VeraxSdk>();
    const [txHash, setTxHash] = useState<Hex>();
    const [attestationId, setAttestationId] = useState<Hex>();

    const {address, chainId} = useAccount();

    const schemaId = "0x7a8e589a49ae82796725224b6bcdb9b911a97911f9a1c06a7fed9f23ab07bec2"
    const portalId = "0x2fafe2c217be096e09b64c49825fe46b7c3e33b2"

    useEffect(() => {
        if (chainId && address) {
            const sdkConf =
                chainId === 59144 ? VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND : VeraxSdk.DEFAULT_LINEA_TESTNET_FRONTEND;
            const sdk = new VeraxSdk(sdkConf, address);
            setVeraxSdk(sdk);
        }
    }, [chainId, address]);

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
            case 'eip712Signature':
                if (!/^0x[a-fA-F0-9]{130}$/.test(value)) {
                    error = 'EIP712 Signature is not valid. It should be a 130 character string starting with 0x.';
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
                    portalId,
                    {
                        schemaId,
                        expirationDate: Math.floor(Date.now() / 1000) + 2592000,
                        subject: address, // TODO: who/what should be attested? Project address? Commit hash?
                        attestationData: [{
                            commitHash: inputValues.commitHash,
                            repoUrl: inputValues.repoUrl,
                            eip712Signature: inputValues.eip712Signature
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
        return errors.commitHash !== '' || errors.repoUrl !== '' || errors.eip712Signature !== ''
    }

    const isEmpty = () => {
        return inputValues.commitHash === '' || inputValues.repoUrl === '' || inputValues.eip712Signature === ''
    }

    const truncateHexString = (hexString: string) => {
        return `${hexString.slice(0, 6)}••••${hexString.slice(hexString.length - 4, hexString.length)}`
    }

    return (
        <>
            <Header/>
            <div className={'main-container'}>
                <ConnectButton/>
                <form onSubmit={handleSubmit}>
                    <input type="text" name="commitHash" value={inputValues.commitHash} onChange={handleChange}
                           placeholder="Commit Hash"/>
                    {errors.commitHash && <div className="error">{errors.commitHash}</div>}
                    <input type="text" name="repoUrl" value={inputValues.repoUrl} onChange={handleChange}
                           placeholder="GitHub Repo URL"/>
                    {errors.repoUrl && <div className="error">{errors.repoUrl}</div>}
                    <input type="text" name="eip712Signature" value={inputValues.eip712Signature}
                           onChange={handleChange}
                           placeholder="EIP712 Signature"/>
                    {errors.eip712Signature && <div className="error">{errors.eip712Signature}</div>}
                    <button type="submit" disabled={!address || !veraxSdk || isError() || isEmpty()}>Submit</button>
                </form>
                {txHash && <div className={'message'}>Transaction Hash: <a
                  href={`${chainId === 59144 ? 'https://lineascan.build/tx/' : 'https://goerli.lineascan.build/tx/'}${txHash}`}
                  target="_blank" rel="noopener noreferrer">{truncateHexString(txHash)}</a></div>}
                {txHash && !attestationId && <div className={'message pending'}>Transaction pending...</div>}
                {attestationId && <div className={'message success'}>Attestation ID: <a
                  href={`${chainId === 59144 ? 'https://explorer.ver.ax/linea/attestations/' : 'https://explorer.ver.ax/linea-testnet/attestations/'}${attestationId}`}
                  target="_blank" rel="noopener noreferrer">{truncateHexString(attestationId)}</a></div>}
            </div>
            <Footer/>
        </>
    );
}

export default App
