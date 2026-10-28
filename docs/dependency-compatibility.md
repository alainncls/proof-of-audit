# Dependency compatibility review

Reviewed 2026-10-28 against the committed `pnpm-lock.yaml`, `pnpm install --frozen-lockfile`, the
Verax SDK 5.4.0 runtime, and local-only GraphQL/JSON-RPC test servers.

## `@graphql-tools/utils` override

| Field                  | Evidence                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Advisory               | GHSA-7mx3-vvmw-hjmv; the prior audit recorded 16 high affected nodes at `<=12.0.0`. The lockfile now pins 12.0.3.                                                                                                                                                                                                                                          |
| Installed version      | 12.0.3, exact override in `pnpm-workspace.yaml` and `pnpm-lock.yaml`; `pnpm why @graphql-tools/utils` confirms it is reached through `@verax-attestation-registry/verax-sdk@5.4.0`.                                                                                                                                                                        |
| Parent requests        | Lockfile records 25 parent edges: 23 request `^11.x` (including `@envelop/extended-validation@7.1.1` `^11.0.0`, GraphQL Mesh packages, and GraphQL Tools packages); `graphql-yoga@5.21.0` requests `^10.11.0`. Only `@graphql-tools/executor-legacy-ws@1.1.37` requests `^12.0.3`.                                                                         |
| Runtime reachability   | Verax is imported by the browser application. Its SDK uses GraphQL Mesh for subgraph access; this is not proven development-only. The browser build and local HTTP GraphQL tests exercise the SDK path without public endpoints.                                                                                                                           |
| Compatibility evidence | `pnpm install --frozen-lockfile` succeeds; `pnpm why @graphql-tools/utils @graphql-tools/executor-legacy-ws graphql` is valid with GraphQL 16.13.2; full `pnpm audit` reports zero advisories. `src/veraxSdk.integration.test.ts` executes real SDK query/decode/error paths and `simulateAttest` using local HTTP/RPC for both Linea Mainnet and Sepolia. |
| Decision               | Retain the exact security override for now; do not claim SemVer compatibility. The major-range violations remain unresolved upstream compatibility risk. Revisit when Verax/GraphQL Mesh parents publish compatible ranges or after a reviewed parent upgrade. Do not downgrade Verax to 2.4.0 merely to satisfy npm's automatic fix.                      |

## Verax payload contract

The schema registered on-chain for `SCHEMA_ID` is
`(string commitHash, string repoUrl)`: one tuple parameter. The SDK encodes
`attestationData` with `encodeAbiParameters(parseAbiParameters(schema), data)`,
so the app passes `attestationData: [{ commitHash, repoUrl }]`. Positional
values (`[commitHash, repoUrl]`) fail with an ABI parameter/value count
mismatch. The integration test uses the registered schema string and verifies
transaction-call preparation; it never signs or sends a transaction.

## Local verification limits

Tests use local loopback servers only; they do not establish compatibility with
live subgraph or RPC deployments, wallets, or production signing. No GitHub CI
was run. `pnpm audit` is a point-in-time registry result, not evidence that
runtime attack reachability is impossible.

The final local install/gates ran with Node 24.22.1 and pnpm 12.16.1. The
frozen pnpm install, production build, and unit suite passed. `vite preview` returned the built
HTML and hashed entry/assets over loopback; no Chromium/browser executable was
available for a browser run in this worktree. These are environment
limitations, not certified passes.
