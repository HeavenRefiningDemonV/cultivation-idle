# MP1 Content Cap Decision

Generated: 2026-05-28T21:51:27+03:00

## Observed failure

- Fresh-run report final realm before MP1: `soul_formation`
- Expected cap before MP1: `spirit_severing`
- Failing command/artifact: `artifacts/mp1/reports/fresh-run/final.log` before the route harness repair, plus preflight `artifacts/mp1/preflight/logs/fresh-run-report.preflight.log`

## Evidence reviewed

- `public/cultivation_idle_content_bible_v1_config/cities.json`: authored city chain reaches `city_ironpeak_bastion`.
- `public/cultivation_idle_content_bible_v1_config/trials.json`: authored gates support progression through Spirit Severing.
- Runtime constants/projection: the release slice summary reports `contentCapRealmId: spirit_severing`.
- `scripts/release` and `tests/helpers/release/runFreshSaveRoute.ts`: fresh-save route harness expected Spirit Severing.
- `docs/release/current_readiness.md`: MP0 recorded the Soul Formation vs Spirit Severing mismatch as MP1-owned.
- `artifacts/mp1/reports/fresh-run/final.log`: after MP1, `spiritSeveringReached`, `currentCapReached`, and `fiveCityChainHonest` are all true.

## Root cause

The mismatch was a harness/simulation truth bug, not a real content-cap change. MP1 introduced a mechanical life-start pause, so report harnesses had to complete identity before simulating real cultivation. The fresh route also depended on synthetic ticks without flushing accumulated Qi on each simulated tick, which made the automated route stall short of the authored cap.

## Decision

Spirit Severing remains the current content cap.

## Why this is not a hidden downgrade

No cap was lowered. The fresh-run harness was repaired to follow the same life identity requirements as runtime, then flush synthetic cultivation ticks deterministically. The final fresh-run report reaches Spirit Severing and Ironpeak Bastion without changing live balance values or authored content.

## Files changed

- `tests/helpers/release/runFreshSaveRoute.ts`
- `tests/helpers/balance/createTimingProbeScenario.ts`
- `tests/helpers/balance/runPhaseTimingProbe.ts`
- `tests/integration/freshSaveRouteHarness.test.ts`

## Proof

- `npm run release:fresh-run-report:json`: `artifacts/mp1/reports/fresh-run/final.log`
- `npm run release:route-report:json`: `artifacts/mp1/reports/route/final.log`
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/integration/freshSaveRouteHarness.test.js`: `artifacts/mp1/implementation/fresh-save-route-harness.green.log`
