import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { linea, lineaSepolia, mainnet } from 'wagmi/chains';
import { http } from 'wagmi';

export const walletConnectProjectId = '68b9b40fbc3c45a909f03f864745955e';
const infuraApiKey: string = '2VbuXFYphoB468fyFPinOmis7o5';

const metadata = {
  name: 'Proof of Audit',
  description: 'Issue attestation of audits',
  url: 'https://audit.examples.ver.ax',
  icons: ['https://audit.examples.ver.ax/verax-logo-circle.svg'],
};
const chains = [lineaSepolia, linea, mainnet] as const;
export const wagmiConfig = defaultWagmiConfig({
  chains,
  transports: {
    [linea.id]: http(`https://linea-mainnet.infura.io/v3/${infuraApiKey}`),
    [lineaSepolia.id]: http(
      `https://linea-sepolia.infura.io/v3/${infuraApiKey}`,
    ),
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${infuraApiKey}`),
  },
  projectId: walletConnectProjectId,
  metadata,
  enableCoinbase: false,
});
