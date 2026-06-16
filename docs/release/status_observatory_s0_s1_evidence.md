# Status Living State Observatory S0/S1 Evidence

Generated: 2026-06-09

## Packet verdict

S0/S1 packet-local acceptance passes.

This packet adds the Status Living State Observatory source and surface foundation only. It does not mount a new public Status renderer, does not add Status observatory styles, and does not change the visible Status UI.

## Implemented scope

- Added `StatusObservatorySurfaceV1` source types for Life Decree, Vitals Ribbon, Root/Law instrument, Meridian Vessel, Stat Meridian Constellation, Bottleneck Canopy, Build & Preparation, Work Wheel, ledger rail, drawers, and no-loss coverage.
- Added a pure `buildStatusObservatorySurface(ledger)` adapter sourced from `StatusLedgerSurfaceV1`.
- Added presentation constants for the observed mockup frame atlas, instrument roles, organ order, branch counts, legends, and visual-state labels.
- Added fixture seeds for blocked, healthy, post-failure, and prestige-pressure states.
- Added a no-loss mapper that keeps every existing Status Ledger source family assigned to an observatory home.
- Extended `StatusLedgerSurfaceV1` with typed named-stat source data so the future constellation renderer has all 28 content-pack stats available.

## No visible UI change proof

- `src/ui/status/ledger/StatusLedgerPage.tsx` remains on the existing Status Ledger renderer.
- No tracked files exist under `src/ui/status/observatory`.
- `StatusLivingStateObservatory` appears only in negative contract assertions.
- New observatory source files under `src/systems/ui/status/statusObservatory*.ts` have no React, style, store, reward, or combat imports.
- Browser smoke was skipped because the accepted S0/S1 scope intentionally has no live DOM/style renderer change; route-safety is covered by contracts.

## Tests added or updated

- `tests/contracts/statusObservatorySurface.test.ts`
- `tests/contracts/statusObservatoryNoLoss.test.ts`
- `tests/contracts/statusObservatoryStatConstellation.test.ts`
- `tests/contracts/statusObservatoryTargetContract.test.ts`
- `tests/contracts/statusObservatoryLayoutContract.test.ts`
- `tests/contracts/statusObservatoryLifeDecree.test.ts`
- `tests/contracts/statusObservatoryVitals.test.ts`
- `tests/contracts/statusObservatoryTestUtils.ts`

## Command evidence

- `npm exec tsc -- --project tsconfig.tests.json` - pass
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/statusObservatorySurface.test.js tmp-tests/tests/contracts/statusObservatoryNoLoss.test.js tmp-tests/tests/contracts/statusObservatoryStatConstellation.test.js tmp-tests/tests/contracts/statusObservatoryTargetContract.test.js tmp-tests/tests/contracts/statusObservatoryLayoutContract.test.js tmp-tests/tests/contracts/statusObservatoryLifeDecree.test.js tmp-tests/tests/contracts/statusObservatoryVitals.test.js` - pass, 14/14
- `npm run typecheck` - pass
- `npm run check:icons` - pass
- `npm run validate:content` - pass
- `npm run build` - pass with the existing large chunk warning
- `npm run test:contracts` - pass, `passed=500 total=500`
- `npm run release:gate:json` - fail, broad release `NO_GO`; see blocker section below
- `npm run test` - fail, broad suite failures outside the Status Observatory S0/S1 contracts; rerun log: `tmp/npm-test-rerun.log`
- `git diff --check` - pass with Windows line-ending warnings only

## Broad release blockers

These do not block the S0/S1 packet-local acceptance but keep full release at `NO_GO`.

- `fresh_run_acceptance`: `fresh_run_manual_pending`; required manual fresh-run coverage is incomplete for normal, cautious, and aggressive routes.
- `full_test_suite`: `npm run test` fails in broad non-Status areas including e2e specs, city-arrival/world unlock tests, gate trial wording, world/ruins routing and support-art tests, prestige reset/catalog tests, release interaction sanity, visual audit, technique taxonomy, world command runtime, and migration runner expectations.
- Release gate also reports five unaccepted waiver candidates and the existing large chunk build warning as release debt.

## Deferred to later Status packets

- Public renderer construction and visual cutover remain deferred.
- Exact Status Observatory CSS/layout, screenshot proof, and browser smoke belong to the later renderer packet.
- Public non-Status Dao/Omen cleanup remains deferred to the dedicated decommission packet.
