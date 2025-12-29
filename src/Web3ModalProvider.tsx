import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { lineaSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

import LineaMainnetIcon from './assets/linea-mainnet.svg';
import LineaSepoliaIcon from './assets/linea-sepolia.svg';
import {
  chains,
  metadata,
  wagmiAdapter,
  wagmiConfig,
  walletConnectProjectId,
} from './wagmiConfig.ts';

const queryClient = new QueryClient();

createAppKit({
  adapters: [wagmiAdapter],
  networks: chains,
  projectId: walletConnectProjectId,
  metadata,
  defaultNetwork: lineaSepolia,
  features: {
    analytics: true,
  },
  chainImages: {
    59144: LineaMainnetIcon,
    59141: LineaSepoliaIcon,
  },
  themeMode: 'dark',
});

interface Web3ModalProviderProps {
  children: ReactNode;
}

export function Web3ModalProvider({
  children,
}: Readonly<Web3ModalProviderProps>) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
