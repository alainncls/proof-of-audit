# Proof of Audit

[![Netlify Status](https://api.netlify.com/api/v1/badges/c888dd91-7201-4051-a7c9-193656295b9a/deploy-status)](https://app.netlify.com/sites/proof-of-audit/deploys)

This project aims to provide a way to issue attestations of audits, leveraging
the [Verax Attestation Registry](https://www.ver.ax/).

The demo webapp is available at [audit.alainnicolas.fr](https://audit.alainnicolas.fr/).

## Disclaimer

This is a proof of concept, without any decent UI and should not be used in production.

## How to use

```bash
npm i
```

```bash
npm run dev
```

## Example of parameters to use

1. Commit hash: `37f8ecd53a64ba2395b7de0a8d7ecb0dbfdced64`
2. Repository URL: `https://github.com/alainncls/strava-segments-to-nfts-dapp`
3. Smart contract address: `0x2fafe2c217be096e09b64c49825fe46b7c3e33b2`

## Portal on Linea testnet

[`0x2fafe2c217be096e09b64c49825fe46b7c3e33b2`](https://explorer.ver.ax/linea-testnet/portals/0x2fafe2c217be096e09b64c49825fe46b7c3e33b2)

## Schema on Linea testnet

[`0x59ffe1d5bdbd99d418fc1dba03b136176ca52da322cab38fed6f29c2ca29bd71`](https://explorer.ver.ax/linea-testnet/schemas/0x59ffe1d5bdbd99d418fc1dba03b136176ca52da322cab38fed6f29c2ca29bd71)  
`(string commitHash, string repoUrl)`
