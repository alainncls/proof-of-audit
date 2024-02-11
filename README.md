# Proof of Audit

This project aims to provide a way to issue attestations of audits, leveraging
the [Verax Attestation Registry](https://www.ver.ax/).

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
3. EIP-712
   signature: `0x4355c47d63924e8a72e509b65029052eb6c299d53a04e167c5775fd466751c9d07299936d304c153f6443dfa05f40ff007d72911b6f72307f996231605b915621c`

## Portal on Linea testnet

[`0x2fafe2c217be096e09b64c49825fe46b7c3e33b2`](https://explorer.ver.ax/linea-testnet/portals/0x2fafe2c217be096e09b64c49825fe46b7c3e33b2)

## Schema on Linea testnet

[`0x7a8e589a49ae82796725224b6bcdb9b911a97911f9a1c06a7fed9f23ab07bec2`](https://explorer.ver.ax/linea-testnet/schemas/0x7a8e589a49ae82796725224b6bcdb9b911a97911f9a1c06a7fed9f23ab07bec2)  
`(string commitHash, string repoUrl, string eip712Signature)`
