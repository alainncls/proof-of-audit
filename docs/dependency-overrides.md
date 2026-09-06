# Dependency Overrides

## `@base-org/account`

- Reason: `@wagmi/connectors@8.2.0` requires `@base-org/account@^2.5.1`, while `@reown/appkit-utils@1.8.23` exposes `2.4.0`.
- Current upstream resolution without override: `@base-org/account@2.4.0`.
- Override target: `@base-org/account@2.5.10`.
- Remaining risk: this bridges an upstream peer mismatch. Remove it when the Reown package aligns its optional dependency.
- Validation: run `npm ls --all`, `npm run lint`, `npm run typecheck`, and `npm run build` after any change.

## `@coinbase/cdp-sdk > axios`

- Reason: `@coinbase/cdp-sdk@1.48.2` pins `axios@1.13.6`, which is affected by GHSA-3p68-rc4w-qgx5 and GHSA-fvcv-3m26-pcqx.
- Current upstream resolution without override: `axios@1.16.0`.
- Override target: `axios@1.20.0`.
- Remaining risk: this is a parent-scoped npm override for a transitive exact pin. Remove it once `@coinbase/cdp-sdk` publishes a version that depends on a non-vulnerable `axios` release.
- Validation: run `npm audit`, `npm run lint`, `npm run typecheck`, and `npm run build` after any change to this override.

## `@wagmi/connectors`

- Reason: the adapter otherwise resolves `8.0.14`, while `wagmi@3.7.7` uses `8.2.0`.
- Current upstream resolution without override: two connector and `@wagmi/core` versions.
- Override target: `@wagmi/connectors@8.2.0`.
- Remaining risk: keep this until the adapter and `wagmi` resolve one compatible connector version natively.
- Validation: run `npm ls --all`, `npm run typecheck`, and `npm run build` after any change.

## `@verax-attestation-registry/verax-sdk > axios`

- Reason: the SDK resolves a vulnerable transitive `axios` version.
- Current upstream resolution without override: `node_modules/axios@1.16.0`.
- Override target: `axios@1.20.0`.
- Remaining risk: this is a scoped security override until the SDK updates its axios dependency.
- Validation: run `npm audit`, `npm run lint`, `npm run typecheck`, and `npm run build` after any change.
