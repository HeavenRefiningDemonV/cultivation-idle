# Packet A — Runtime/source reconciliation baseline (2026-04-22)

## Scope guard
This checkpoint is limited to Packet A reconciliation work only:
- owner/render-path truth audit
- asset-resolution repair
- baseline evidence capture

No Packet B/C/D/E composition tuning was performed.

## Source owner truth (planning path)
1. `WorldBuildingModal` routes Outskirts to `OutskirtsBuildingPanel`.
2. `OutskirtsBuildingPanel` routes planning state to `OutskirtsPlanningOwner` and active state to `OutskirtsLegacyActiveSurface`.
3. `OutskirtsPlanningOwner` mounts `OutskirtsExactMockupScreen`.
4. `OutskirtsExactMockupScreen` mounts the exact planning children (title, tactical strip, scenic stage, identity row, encounter strip, CTA, grind summary).

## Runtime/source mismatch reconciliation
- The provided runtime screenshot can legitimately include the large top-left `Outskirts` title; this is still in current source by design for Packet A.
- The provided runtime screenshot showing `Start Hunt` and `Snarling Wolf` is consistent with current exact-screen source.
- A `Watch` control is **not** part of current identity-row render tree; source currently renders a safety chip only.
- Lower band owners (encounter strip, CTA, grind summary) are present in source and verified in render-tree tests.
- Stale-bundle/cache hypothesis is documented as **possible but unproven in this runner** because browser capture tooling is unavailable; owner-path/source contracts are used as the trustworthy fallback baseline.

## Asset issues found
- Outskirts exact-screen modules used raw `/assets/...` strings for files living under `src/assets/...`.
- Scenic fallback, strip art, tactical/setup/rewards/grind icons, and wolf overlay all relied on raw string paths.
- This was a likely root cause for broken-image placeholders in some runtime contexts.

## Fixes applied
- Added centralized Outskirts asset registry: `src/features/world/outskirts/outskirtsAssetRegistry.ts`.
- Migrated Outskirts exact-screen asset access to registry-backed URLs.
- Removed raw `/assets/...` path usage from Outskirts exact-screen TS modules.
- Updated contract tests to lock this behavior and prevent regressions.

## Remaining issues intentionally deferred to Packet B+
- No visual composition tuning performed (no scenic-plane conversion, no title removal, no strip shrink, no vertical rebalance).
- Any remaining spacing/visibility harmonization is deferred to Packet B+.

## Baseline evidence status
- Automated screenshot capture attempt was run and failed due missing Playwright in this environment.
- Honest capture attempt record:
  - `docs/release/qa/ui-cutover/outskirts-exact/p0-freeze/outskirtsExactP0CaptureAttempt.json`
- Build + render-tree contracts now provide the trustworthy source-aligned baseline for Packet B.
