# MP4 Spirit Root Observation Closeout

Generated: 2026-06-05

## Packet Verdict

MP4 packet-local acceptance is **GO**.

Full release gate remains **NO_GO** because of broad, pre-existing release blockers outside the MP4 Spirit Root Observation packet boundary. See "Broad Release Blockers" below.

## Scope Implemented

- Added `rootHeartFitResolver` with Resonant, Compatible, Neutral, Strained, and Opposed tiers.
- Added fire-root playstyle language for explosive, volatile, burst, and harsh routes.
- Added root/Heart fit effects for cultivation speed, Heart Law XP, root resonance gain, turbulence, expression caps, proc chance caps, and no hard invalid locks.
- Added recovery variants for opposed/strained pairings, including Fire + Quiet Breath -> Banked Ember.
- Extended Spirit Root progression snapshots to consume fit, cap expression, and carry fit rows.
- Applied fit effects to cultivation Qi rate, Dao Heart practice XP/turbulence/root resonance, breakthrough risk resonance, and combat proc snapshots.
- Added Status-owned `SpiritRootObservationSurfaceV1` with Profile, Fit, Effects, Variants, Practice Routes, and History tabs.
- Routed Status, Cultivation doctrine detail, and Dao Heart Sanctuary into the same Status-owned Observation drawer.
- Kept global navigation free of a standalone Spirit Root tab.

## MP4 Files Touched

- `src/systems/spiritRoots/rootHeartFitResolver.ts`
- `src/systems/spiritRoots/spiritRootProgressionResolver.ts`
- `src/systems/spiritRoots/index.ts`
- `src/features/spiritRootObservation/*`
- `src/systems/ui/status/statusDashboardSurface.ts`
- `src/systems/ui/status/statusLedgerSurface.ts`
- `src/systems/ui/status/statusLedgerTypes.ts`
- `src/systems/ui/status/statusRouteActions.ts`
- `src/stores/uiStore.ts`
- `src/stores/gameStore.ts`
- `src/stores/cultivationStore.ts`
- `src/stores/combatStore.ts`
- `src/systems/daoHeart/daoHeartProgressionResolver.ts`
- `src/components/screens/StatusScreen.tsx`
- `src/ui/status/ledger/StatusSpiritRootBadge.tsx`
- `src/ui/status/ledger/StatusIdentityDoctrinePanel.tsx`
- `src/ui/status/ledger/StatusLedgerHero.tsx`
- `src/ui/status/ledger/StatusLedgerPage.tsx`
- `src/ui/status/useStatusDashboardSurface.ts`
- `src/features/cultivation/exact/buildCultivationExactSurface.ts`
- `src/features/cultivation/exact/cultivationExactTypes.ts`
- `src/features/cultivation/exact/useCultivationExactActionController.ts`
- `src/features/daoHeartSanctuary/daoHeartSanctuaryTypes.ts`
- `src/features/daoHeartSanctuary/buildDaoHeartSanctuarySurface.ts`
- `src/features/daoHeartSanctuary/useDaoHeartSanctuaryActionController.ts`
- `src/features/daoHeartSanctuary/DaoHeartSanctuaryView.tsx`
- `tests/contracts/rootHeartFitResolver.test.ts`
- `tests/contracts/spiritRootObservationSurface.test.ts`
- `tests/contracts/mp4SpiritRootTechniqueAdapters.test.ts`

## Evidence

Preflight:

- PASS: `npm run ensure:vendor-links`
  - `artifacts/mp4/spirit-root-observation/preflight/ensure-vendor-links.log`
- PASS: `npm exec tsc -- --project tsconfig.tests.json`
  - `artifacts/mp4/spirit-root-observation/preflight/tsconfig-tests.log`
- PASS: existing MP4 focused suite
  - `artifacts/mp4/spirit-root-observation/preflight/existing-mp4-focused.log`

Implementation:

- RED captured: new MP4 tests failed before implementation
  - `artifacts/mp4/spirit-root-observation/implementation/mp4-new-tests-red.log`
- PASS: new MP4 TypeScript test build
  - `artifacts/mp4/spirit-root-observation/implementation/mp4-new-tests-green-tsc.log`
- PASS: new MP4 contracts, 7/7 passing
  - `artifacts/mp4/spirit-root-observation/implementation/mp4-new-tests-green.log`
- PASS: existing MP4 focused suite after changes, 13/13 passing
  - `artifacts/mp4/spirit-root-observation/implementation/existing-mp4-focused-after.log`

Final baselines:

- PASS: `npm run typecheck`
  - `artifacts/mp4/spirit-root-observation/final/typecheck.log`
- PASS: `npm run check:icons`
  - `artifacts/mp4/spirit-root-observation/final/check-icons.log`
- PASS: `npm run validate:content`
  - `artifacts/mp4/spirit-root-observation/final/validate-content.log`
- PASS: `npm run build`
  - `artifacts/mp4/spirit-root-observation/final/build.log`
  - Existing Vite large-chunk warning remains.
- PASS: `npm run test:contracts`
  - `artifacts/mp4/spirit-root-observation/final/test-contracts.log`
  - `passed=486 total=486`
- PASS: `npm run test:balance-regression`
  - `artifacts/mp4/spirit-root-observation/final/test-balance-regression.log`
- NO_GO: `npm run release:gate:json`
  - `artifacts/mp4/spirit-root-observation/final/release-gate-json.log`

UI smoke:

- In-app Browser control tool was unavailable in this turn; Playwright fallback was used.
- Dev server: `http://127.0.0.1:4178/`
- PASS: Status Observe opens drawer with `data-owner="status"` and `data-active-tab="profile"`.
  - `artifacts/mp4/spirit-root-observation/final/spirit-root-observation-status-desktop.png`
- PASS: Cultivation doctrine `Observe Spirit Root` routes to Status and opens the same drawer.
  - `artifacts/mp4/spirit-root-observation/final/spirit-root-observation-cultivation-route-desktop.png`
- PASS: Mobile viewport drawer remains visible and bounded.
  - `artifacts/mp4/spirit-root-observation/final/spirit-root-observation-mobile.png`

## Acceptance Mapping

- Fire root explosive/volatile playstyle: covered by `rootHeartFitResolver.test.ts`.
- Fire root burst/harsh route bias: covered by `rootHeartFitResolver.test.ts`.
- Opposed fit penalties: covered by `rootHeartFitResolver.test.ts` and Observation effects rows.
- Recovery route instead of hard invalid: covered by Fire + Quiet Breath Banked Ember and Earth + Stormstep Dust Step tests.
- Variant unlock improves mismatch without hard lock: covered by `rootHeartFitResolver.test.ts`.
- Status-owned Observation surface with required tabs: covered by `spiritRootObservationSurface.test.ts`.
- No global Spirit Root nav tab: covered by `spiritRootObservationSurface.test.ts`.
- Cultivation and Dao Heart route to Status-owned surface: implemented in owners/controllers and verified by Playwright for Cultivation; Dao Heart uses the same `uiStore.openSpiritRootObservation('fit')` route.

## Broad Release Blockers

These are full-release blockers and are not MP4 packet-local regressions.

1. `npm run release:gate:json` reports `NO_GO`.
   - Evidence: `artifacts/mp4/spirit-root-observation/final/release-gate-json.log`
   - Summary: 2 unresolved blockers, 1 pending manual check, 5 untracked waiver-candidate findings.
   - Next packet: release gate cleanup / full-release closeout.

2. Fresh-run manual coverage is incomplete.
   - Evidence command: `npm run release:fresh-run-report:json`
   - Release finding: `fresh_run_manual_pending`
   - Next packet: manual fresh-run evidence capture packet.

3. Full `npm run test` fails in broad suites outside MP4.
   - Evidence: `artifacts/mp4/spirit-root-observation/final/npm-test.log`
   - Concrete failures include:
     - `tests/integration/worldBuildingModalRouteIntent.test.ts:21` expects legacy `ApothecaryPanel` alchemy routing while `src/components/modals/WorldBuildingModal.tsx` now routes alchemy through `ApothecaryExactScreenOwner`.
     - `tests/migrations/migrationRunner.test.ts:30` and `tests/migrations/migrationRunner.test.ts:81` expect the old v2.0.0-only migration plan while current migration steps include `src/save/migrations/steps/v2_1_0/` and `src/save/migrations/steps/v2_2_0/`.
   - Next packet: broad test-suite realignment for current exact-screen and migration truth.

## Notes

- The repo had extensive dirty worktree state before this MP4 pass; unrelated dirty files were preserved.
- No RewardService, CombatStore, ActivityStore, or PrestigeResetService ownership was bypassed.
- Combat changes remain bounded to CombatStore consumption of pure Spirit Root snapshots/procs.
