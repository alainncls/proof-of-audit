# Dependency Overrides

## `@base-org/account`

- Reason: `@wagmi/connectors@8.2.0` requires `@base-org/account@^2.5.1`, while `@reown/appkit-utils@1.8.24` pins `2.4.0`.
- Current upstream resolution without override: `@base-org/account@2.4.0` nested under `@reown/appkit-utils`, leaving the `@wagmi/connectors` peer unmet.
- Override target: `@base-org/account@2.5.13`.
- Remaining risk: this bridges an upstream peer mismatch. Remove it when the Reown package aligns its dependency.
- Validation: run `npm ls --all`, `npm run lint`, `npm run typecheck`, and `npm run build` after any change.
