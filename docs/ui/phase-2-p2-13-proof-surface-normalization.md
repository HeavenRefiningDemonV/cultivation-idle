# P2-13 — Proof-surface normalization pass

## Objective
Normalize the already-opted-in Phase 2 proof surfaces to the frozen shell/FX/state contracts without changing each screen's owner identity or introducing new proof-surface opt-ins.

## Why now
- P2-06 through P2-12 froze shell APIs, ribbon/dock behavior, modal contracts, quality tiers, and no-layout-shift rules.
- The proof set is broad enough that P2-14 cannot audit it reliably unless the primary/secondary boundaries and evidence routes are explicit.
- Existing proof surfaces already demonstrate shell adoption; this packet hardens documentation + QA truth so follow-on packets can consume it safely.

## Dependency chain
- `docs/ui/phase-2-p2-06-shell-api-freeze.md`
- `docs/ui/phase-2-p2-07-ribbon-dock-convergence.md`
- `docs/ui/phase-2-p2-08-inspector-panel-drawer.md`
- `docs/ui/phase-2-p2-09-ritual-modal-contract.md`
- `docs/ui/phase-2-p2-10-secondary-consumer-containment.md`
- `docs/ui/phase-2-p2-11-quality-tier-matrix.md`
- `docs/ui/phase-2-p2-12-no-layout-shift.md`

## Actual current repo truth
Primary proof surfaces already in live code:
- `WorldScreen` keeps map ownership and uses `TopRibbon`, `InspectorPanel`/`InspectorDrawer`, and `RunCompass`.
- `CultivateScreen` keeps altar/cultivator ownership and uses `ScreenFxStage` + `FxStagePortal` + `RunCompassCompact`.
- `StatusScreen` keeps diagnostic-center ownership and uses `ScreenFxStage` + `FxStagePortal` + `RunCompass` + `StatusSummaryHeader`.
- `PrestigeScreen` keeps decree/reincarnation ownership and uses `TopRibbon` + `PaperStamp` + `RunCompassCompact` + ritual launch points.
- Ritual proof modals (`PrestigeRitualModal`, `CurrentChapterExhaustedModal`, `LifeSummaryModal`, `ChangeHeartLawModal`) all mount through `RitualModalFrame`.
- `BottomTabBar` remains the compatibility wrapper over `BottomNavDock` with canonical tab labels/order.

## Primary proof surfaces
1. `WorldScreen`
2. `CultivateScreen`
3. `StatusScreen`
4. `PrestigeScreen`
5. `PrestigeRitualModal`
6. `CurrentChapterExhaustedModal`
7. `LifeSummaryModal`
8. `ChangeHeartLawModal`
9. `BottomTabBar`

## Secondary already-opted-in compact consumers
- `ApothecaryPanel`
- `BountyBoardPanel`
- `ExpeditionBoardPanel`
- `ManualPavilionPanel`
- `TechniqueLibraryScreen`
- `OutskirtsBuildingPanel`
- `RuinsBuildingPanel`
- `ForgeWorkshop`

## Preserved owner rules (must remain true)
- **World:** city map remains dominant owner; inspector/routing shell is contextual support.
- **Cultivation:** altar/cultivator center remains primary truth owner.
- **Status:** diagnostic chamber and troubleshooting hierarchy remain primary.
- **Prestige:** decree/reincarnation panel flow remains primary.
- **Ritual modals:** title/consequence/action truth remains modal-owned and `RitualModalFrame`-hosted.
- **Bottom dock:** canonical tab order/labels/no-shift behavior remain dock-owned.

## What was normalized in P2-13
- Added an explicit proof-surface matrix (`docs/ui/phase-2-proof-surface-matrix.md`) that classifies primary vs secondary consumers and documents QA/evidence routes.
- Added packet-bounded contracts to lock:
  - primary-proof-surface membership,
  - legal shell/FX usage on primary surfaces,
  - evidence-route and Section C / Phase 0 mapping truth.
- Updated visual diagnostics scope to include primary proof-surface style files used by this packet's normalization matrix.

## Explicitly deferred
- New proof-surface opt-ins.
- World/Cultivation/Status/Prestige redesign work.
- Broad secondary-consumer restyling.
- P2-14 exit-audit verdict/handoff.
- New FX rollouts or motion retuning beyond existing frozen contracts.

## QA / evidence route rules
- Reuse `phase0CoreAudit` for core screen proof routes (world/cultivation/status/prestige + forge + compact consumers).
- Reuse `sectionCAudit` for ritual/modal proof routes (`prestige-ritual`, `current-chapter-exhausted`, `life-summary`, `change-heart-law`).
- Use existing capture slot conventions and legal screenshot folders; do not invent a parallel evidence family.
- High / Low / Reduced Motion routes are required per existing harness mode support.
- If a mode/surface is forced-only or state-gated, the matrix must say so explicitly.

## Non-goals
- No art requests or asset generation.
- No broad module-screen redesign.
- No shell primitive API redesign.
- No hidden expansion into Phase 2 exit audit.

## Acceptance gate
P2-13 is complete when:
1. Primary and secondary proof surfaces are explicitly documented.
2. Primary owner identities are preserved and contract-tested.
3. World/Cultivate/Status/Prestige and ritual modal proof paths remain aligned with frozen shell/FX contracts.
4. Existing QA harness/evidence routes are explicitly mapped and validated.
5. No new proof surfaces are silently introduced.
6. No art dependencies are introduced.
