import { type Address } from 'viem';
import { linea, lineaSepolia } from 'wagmi/chains';

// Verax Portal and Schema IDs
export const PORTAL_ID: Address = '0xbb92965c718852a8dc1b6e930239de4e08d93e60';
export const SCHEMA_ID: Address =
  '0x59ffe1d5bdbd99d418fc1dba03b136176ca52da322cab38fed6f29c2ca29bd71';

// Attestation validity period (30 days in seconds)
export const ATTESTATION_VALIDITY_SECONDS = 30 * 24 * 60 * 60; // 2_592_000

// Chain IDs
export const LINEA_MAINNET_CHAIN_ID = linea.id;
export const LINEA_SEPOLIA_CHAIN_ID = lineaSepolia.id;

// Block explorer URLs
export const getBlockExplorerTxUrl = (chainId: number, txHash: string) => {
  return chainId === LINEA_MAINNET_CHAIN_ID
    ? `https://lineascan.build/tx/${txHash}`
    : `https://sepolia.lineascan.build/tx/${txHash}`;
};

export const getVeraxExplorerAttestationUrl = (
  chainId: number,
  attestationId: string,
) => {
  return chainId === LINEA_MAINNET_CHAIN_ID
    ? `https://explorer.ver.ax/linea/attestations/${attestationId}`
    : `https://explorer.ver.ax/linea-sepolia/attestations/${attestationId}`;
};
