# Known Issues Ledger

- Generated: 2026-03-27T13:55:49.408Z
- Release gate headline: PASS

## Open blockers
- None

## Accepted waivers
- None

## Post-semester debt
- None

## Untracked findings (must classify)
- None

## Typed ledger entries
- waiver_build_npm_env_http_proxy_warning [accepted_waiver] (accepted)
  - sourceCheckId: build_audit
  - owner: release_engineering
  - rationale: The warning is environment/tooling metadata and does not indicate product/runtime drift.
  - mitigation: Track npm config cleanup outside the semester RC critical path.
  - evidence: docs/release/build_warning_inventory.md
