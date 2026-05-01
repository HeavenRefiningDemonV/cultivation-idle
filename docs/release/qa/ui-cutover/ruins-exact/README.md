# Ruins Exact cutover track

Ruins Exact is the screen-owned player-facing route for Ruins.

## Current player-facing route
`WorldBuildingModal -> RuinsBuildingPanel -> RuinsScreenOwner -> RuinsExactMockupScreen`

## Packet progression summary
- Packets 1–12: exact route/scaffold, regional composition, live binding, evidence harness integration, and exact-surface contracts.
- Packet 13: cleanup/cutover authority only (no gameplay/store/reward/content mutation).

## Evidence lanes
- Preflight capture/evidence folder: `docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/`
- P0 freeze baseline artifacts: `docs/release/qa/ui-cutover/ruins-exact/p0-freeze/`

The `02-ruins` preflight folder is operational evidence staging, not permanent cleanup authority.

## Final cleanup gate
Use `docs/release/qa/ui-cutover/ruins-exact/cutover/ruinsExactCleanupApproval.json` as the machine-readable authority.
Cleanup/destructive removal is permitted only when status is `APPROVED_FOR_EXACT_CLEANUP`.
