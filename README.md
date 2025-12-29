# Proof of Audit

[![Netlify Status](https://api.netlify.com/api/v1/badges/c888dd91-7201-4051-a7c9-193656295b9a/deploy-status)](https://app.netlify.com/sites/proof-of-audit/deploys)

Issue attestations of smart contract audits on the [Verax Attestation Registry](https://www.ver.ax/).

**Demo:** [audit.examples.ver.ax](https://audit.examples.ver.ax/)

## Prerequisites

- Node.js 22.21.1
- npm

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

| Variable                        | Required | Description                                                                               |
| ------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `VITE_WALLETCONNECT_PROJECT_ID` | Yes      | WalletConnect Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com/) |
| `VITE_INFURA_API_KEY`           | Yes      | Infura API Key from [infura.io](https://infura.io/)                                       |
| `VITE_GA_ID`                    | No       | Google Analytics Measurement ID                                                           |

## Development

```bash
npm install
npm run dev
```

## Scripts

| Script               | Description                  |
| -------------------- | ---------------------------- |
| `npm run dev`        | Start development server     |
| `npm run build`      | Build for production         |
| `npm run preview`    | Preview production build     |
| `npm run lint`       | Run ESLint                   |
| `npm run lint:fix`   | Fix ESLint errors            |
| `npm run format`     | Check formatting             |
| `npm run format:fix` | Format code with Prettier    |
| `npm run typecheck`  | Run TypeScript type checking |

## Supported Networks

- **Linea Sepolia** (testnet) - Default
- **Linea Mainnet**

## Portal & Schema (Linea Sepolia)

**Portal:** [
`0xbb92965c718852a8dc1b6e930239de4e08d93e60`](https://explorer.ver.ax/linea-sepolia/portals/0xbb92965c718852a8dc1b6e930239de4e08d93e60)

**Schema:** [
`0x59ffe1d5bdbd99d418fc1dba03b136176ca52da322cab38fed6f29c2ca29bd71`](https://explorer.ver.ax/linea-sepolia/schemas/0x59ffe1d5bdbd99d418fc1dba03b136176ca52da322cab38fed6f29c2ca29bd71)

Schema format: `(string commitHash, string repoUrl)`

## Example Input

| Field            | Example Value                                               |
| ---------------- | ----------------------------------------------------------- |
| GitHub Repo URL  | `https://github.com/alainncls/strava-segments-to-nfts-dapp` |
| Commit Hash      | `37f8ecd53a64ba2395b7de0a8d7ecb0dbfdced64`                  |
| Contract Address | `0x2fafe2c217be096e09b64c49825fe46b7c3e33b2`                |

## Deployment

This project is deployed on Netlify. Environment variables must be configured in the Netlify dashboard:

1. Go to **Site settings** > **Environment variables**
2. Add `VITE_WALLETCONNECT_PROJECT_ID`, `VITE_INFURA_API_KEY`, and optionally `VITE_GA_ID`

## License

MIT
