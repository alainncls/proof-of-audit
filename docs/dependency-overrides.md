# Dependency Overrides

## `@base-org/account`

- Reason: `@wagmi/connectors@8.2.0` requires `@base-org/account@^2.5.1`, while `@reown/appkit-utils@1.8.24` pins `2.4.0`.
- Current upstream resolution without override: `@base-org/account@2.4.0` nested under `@reown/appkit-utils`, leaving the `@wagmi/connectors` peer unmet.
- Override target: `@base-org/account@2.5.13`.
- Remaining risk: this bridges an upstream peer mismatch. Remove it when the Reown package aligns its dependency.
- Validation: run `pnpm why @base-org/account`, `pnpm run lint`, `pnpm run typecheck`, and `pnpm run build` after any change.
