# Outskirts exact P2 shell prep package

Status: scaffold-only shell preparation.

## Objective
Prepare a shared-shell composition scaffold for the Outskirts exact-mockup surface **without** replacing or wiring the current live Outskirts panel.

## Scope in this packet
- Add `OutskirtsExactShellScaffold` as a non-live composition target for later packets.
- Keep live world route ownership in `OutskirtsBuildingPanel` unchanged.
- Preserve P0 baseline diffability while giving later packets a typed shell-prep entry point.

## Explicit non-goals
- No world route cutover.
- No combat-shell cleanup/removal.
- No visual parity claim against approved mockup capture set.

## Evidence hooks
- Contract test: `tests/contracts/outskirtsExactShellScaffoldContract.test.ts`.
