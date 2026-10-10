# Dependency compatibility review

Reviewed 2026-10-10 against the committed `package-lock.json`, `npm ci`, the
Verax SDK 5.4.0 runtime, and local-only GraphQL/JSON-RPC test servers.

## `@graphql-tools/utils` override

| Field                  | Evidence                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Advisory               | GHSA-7mx3-vvmw-hjmv; the prior audit recorded 16 high affected nodes at `<=12.0.0`. The lockfile now pins 12.0.3.                                                                                                                                                                                                                     |
| Installed version      | 12.0.3, exact override in `package.json` and `package-lock.json`; `npm explain @graphql-tools/utils` confirms it is reached through `@verax-attestation-registry/verax-sdk@5.4.0`.                                                                                                                                                    |
| Parent requests        | Lockfile records 25 parent edges: 23 request `^11.x` (including `@envelop/extended-validation@7.1.1` `^11.0.0`, GraphQL Mesh packages, and GraphQL Tools packages); `graphql-yoga@5.21.0` requests `^10.11.0`. Only `@graphql-tools/executor-legacy-ws@1.1.37` requests `^12.0.3`.                                                    |
| Runtime reachability   | Verax is imported by the browser application. Its SDK uses GraphQL Mesh for subgraph access; this is not proven development-only. The browser build and local HTTP GraphQL tests exercise the SDK path without public endpoints.                                                                                                      |
| Compatibility evidence | `npm ci` succeeds; `npm ls @graphql-tools/utils @graphql-tools/executor-legacy-ws graphql --all` is valid with GraphQL 16.13.2; full `npm audit` reports zero advisories. `src/veraxSdk.integration.test.ts` executes real SDK query/decode/error paths and `simulateAttest` using local HTTP/RPC for both Linea Mainnet and Sepolia. |
| Decision               | Retain the exact security override for now; do not claim SemVer compatibility. The major-range violations remain unresolved upstream compatibility risk. Revisit when Verax/GraphQL Mesh parents publish compatible ranges or after a reviewed parent upgrade. Do not downgrade Verax to 2.4.0 merely to satisfy npm's automatic fix. |

## Verax payload contract correction

The application previously passed `attestationData: [{ commitHash, repoUrl }]`.
The real Verax SDK 5.4.0 ABI encoder treated that as one value for the
two-field schema (`string commitHash,string repoUrl`) and failed with an ABI
parameter/value count mismatch. It also declares `AttestationPayload`
`attestationData` as `object[]`, which does not describe the runtime encoder's
positional string tuple. The app now passes `[commitHash, repoUrl]` at this
SDK boundary (with a narrow documented type cast), matching the on-chain ABI.
The integration test verifies the valid query/decode and transaction-call
preparation; it never signs or sends a transaction.

## Local verification limits

Tests use local loopback servers only; they do not establish compatibility with
live subgraph or RPC deployments, wallets, or production signing. No GitHub CI
was run. `npm audit` is a point-in-time registry result, not evidence that
runtime attack reachability is impossible.

The final local install/gates ran with Node 24.21.0 and npm 11.19.0. The repo
declares exact Node 24.18.0, so npm emitted `EBADENGINE`; a 24.18.0 executable
was not available in the active shell. `npm ci` succeeded, but npm's local
`allowScripts` policy declined `@reown/appkit`'s postinstall. The production
build and unit suite passed regardless. `vite preview` returned the built
HTML and hashed entry/assets over loopback; no Chromium/browser executable was
available for a browser run in this worktree. These are environment
limitations, not certified passes.
