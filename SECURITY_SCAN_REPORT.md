# Proof of Audit Security Scan and Remediation Report

Generated: 2026-05-08

Scan type: repository-wide security scan with targeted remediation

Base commit scanned: `4e9c1ed674664cceb0a8745f5a7bb0c33c0f4331`

## Executive Summary

No critical or high-severity vulnerabilities were found.

Both reportable findings from the scan have been remediated in this branch:

| Priority | Severity | Finding                                                         | Remediation                                                                                                                                     |
| -------- | -------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| P2       | Medium   | Frontend-prefixed Infura API key was bundled into public assets | Removed the client-side Infura key entirely and switched Wagmi RPC transports to public Linea RPC URLs from the chain definitions.              |
| P3       | Low      | Attestation ID was derived from an unchecked first receipt log  | Added verified receipt-log extraction that requires the expected Verax Attestation Registry address and `AttestationRegistered(bytes32)` topic. |

## Remediation 1: Remove client-side Infura key exposure

### Original Issue

`VITE_INFURA_API_KEY` was referenced by browser code and interpolated into the Wagmi RPC URLs. Because Vite exposes referenced `VITE_*` values in public client bundles, a deployed user could recover the Infura key from built assets.

### Fix

Changed `src/wagmiConfig.ts` so the app no longer reads `VITE_INFURA_API_KEY`. The Wagmi transports now use the public RPC URLs already defined by `wagmi/chains` for Linea Mainnet and Linea Sepolia.

Also removed the Infura variable from:

- `.env.example`
- `README.md`
- `src/vite-env.d.ts`

### Verification

The old failure mode was reproduced with a sentinel build variable:

```bash
VITE_WALLETCONNECT_PROJECT_ID=codex_wc_project VITE_INFURA_API_KEY=codex_infura_key VITE_GA_ID=G-CODEXTEST npm run build
```

After the fix, the sentinel value did not appear in `dist/`, and the application source/config files no longer reference `VITE_INFURA_API_KEY`.

## Remediation 2: Verify the Verax attestation event before using an attestation ID

### Original Issue

`src/AuditForm.tsx` treated `finalReceipt.logs?.[0]?.topics[1]` as the attestation ID. The code did not verify receipt status, the emitting contract address, or the expected event topic before showing a success state and Verax Explorer link.

### Fix

Added `src/utils/attestationReceipt.ts` with `extractAttestationIdFromReceipt`. The helper only returns an attestation ID when a receipt log:

- was emitted by the expected Verax Attestation Registry address for the active chain
- has the `AttestationRegistered(bytes32)` event topic
- contains the indexed attestation ID topic

`src/AuditForm.tsx` now checks `finalReceipt.status === 'success'` and uses that helper before setting the success state.

### Verification

Added `scripts/verify-security-fixes.mjs` and the `npm run security:verify` script. The verification covers:

- the Infura key variable is absent from application source/config files
- a built `dist/` does not contain the `codex_infura_key` sentinel
- receipt parsing skips an unrelated first log and returns only the valid Verax attestation event
- receipt parsing returns `undefined` for unsupported chains or receipts without the expected event

## Commands Run

Passed:

- `npm run security:verify`
- `VITE_WALLETCONNECT_PROJECT_ID=codex_wc_project VITE_INFURA_API_KEY=codex_infura_key VITE_GA_ID=G-CODEXTEST npm run build`
- `rg -n "codex_infura_key|infura.io/v3|linea-mainnet.infura.io|linea-sepolia.infura.io" dist`
- `rg -n "VITE_INFURA_API_KEY|infuraApiKey|infura.io/v3" src .env.example README.md package.json vite.config.ts`
- `npm run lint`
- `npm run typecheck`
- `VITE_WALLETCONNECT_PROJECT_ID=codex_wc_project VITE_GA_ID=G-CODEXTEST npm run build`
- `npm audit --json`
- `npm audit signatures --json`

Note: `npm run format` passes in a clean branch. In the local working tree used for this remediation, an unrelated untracked `lighthouse-reports/` directory contains generated JSON files that are not part of this branch and can make the broad glob-based formatter fail unless those local artifacts are removed or ignored.

## Remaining Risk

The app now uses public Linea RPC endpoints instead of a bundled Infura key. Public RPC availability and rate limits are operational dependencies, so production operators should monitor RPC reliability and switch to a backend/proxy or restricted provider configuration if stronger availability guarantees are required.
