# Dependency Overrides

## `@coinbase/cdp-sdk > axios`

- Reason: `@coinbase/cdp-sdk@1.48.2` pins `axios@1.13.6`, which is affected by GHSA-3p68-rc4w-qgx5 and GHSA-fvcv-3m26-pcqx.
- Current upstream resolution without override: `node_modules/@coinbase/cdp-sdk/node_modules/axios@1.13.6`.
- Override target: `axios@1.15.2`.
- Remaining risk: this is a parent-scoped npm override for a transitive exact pin. Remove it once `@coinbase/cdp-sdk` publishes a version that depends on a non-vulnerable `axios` release.
- Validation: run `npm audit`, `npm run lint`, `npm run typecheck`, and `npm run build` after any change to this override.
