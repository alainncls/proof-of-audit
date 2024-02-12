import {createWeb3Modal} from '@web3modal/wagmi/react'
import {defaultWagmiConfig} from '@web3modal/wagmi/react/config'

import {WagmiProvider} from 'wagmi'
import {linea, lineaTestnet, mainnet} from 'wagmi/chains'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {ReactNode} from "react";

import LineaMainnetIcon from "./assets/linea-mainnet.svg";
import LineaTestnetIcon from "./assets/linea-testnet.svg";

const queryClient = new QueryClient()
const projectId = '68b9b40fbc3c45a909f03f864745955e'
const metadata = {
    name: 'Proof of Audit',
    description: 'Issue attestation of audits',
    url: 'https://example.org', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886']
}
const chains = [lineaTestnet, linea, mainnet] as const
const config = defaultWagmiConfig({
    chains,
    projectId,
    metadata,
    enableCoinbase: false
})

createWeb3Modal({
    wagmiConfig: config,
    projectId,
    enableAnalytics: true,
    themeMode: 'light',
    defaultChain: lineaTestnet,
    chainImages: {
        59144: LineaMainnetIcon,
        59140: LineaTestnetIcon,
    },
})

interface Web3ModalProviderProps {
    children: ReactNode;
}

export function Web3ModalProvider({children}: Readonly<Web3ModalProviderProps>) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    )
}
