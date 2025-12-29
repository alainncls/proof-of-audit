import { http } from 'wagmi';
import { linea, lineaSepolia } from 'wagmi/chains';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { AppKitNetwork } from '@reown/appkit/networks';

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const infuraApiKey = import.meta.env.VITE_INFURA_API_KEY;

if (!walletConnectProjectId) {
  throw new Error('Missing VITE_WALLETCONNECT_PROJECT_ID environment variable');
}

if (!infuraApiKey) {
  throw new Error('Missing VITE_INFURA_API_KEY environment variable');
}

export { walletConnectProjectId };

export const metadata = {
  name: 'Proof of Audit',
  description: 'Issue attestation of audits',
  url: 'https://audit.examples.ver.ax',
  icons: ['https://audit.examples.ver.ax/verax-logo-circle.svg'],
};

// Cast to mutable array for appkit compatibility
export const chains: [AppKitNetwork, ...AppKitNetwork[]] = [
  lineaSepolia,
  linea,
];

export const wagmiAdapter = new WagmiAdapter({
  networks: chains,
  transports: {
    [linea.id]: http(`https://linea-mainnet.infura.io/v3/${infuraApiKey}`, {
      timeout: 10_000,
      retryCount: 3,
      retryDelay: 1_000,
    }),
    [lineaSepolia.id]: http(
      `https://linea-sepolia.infura.io/v3/${infuraApiKey}`,
      {
        timeout: 10_000,
        retryCount: 3,
        retryDelay: 1_000,
      },
    ),
  },
  projectId: walletConnectProjectId,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
