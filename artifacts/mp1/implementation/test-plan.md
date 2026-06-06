# MP1 Test Plan

## TDD rule

No MP1 production/source behavior changes are allowed before a focused failing test or report reproduction exists. The preflight reproductions are:

- `release:fresh-run-report:json` still ends at `soul_formation` while expected cap is `spirit_severing`.
- `balance:report:json`, `release:route-report:json`, and `release:reclaim-route-report` all fail before `foundation_entry`.
- Full `release:gate:json` hangs through broad `full_test_suite` debt; a skip-full-test release gate remains structured `NO_GO`.

## First focused tests to add or update

1. Life identity predicate/mechanical pause:
   - fresh save incomplete;
   - path-only incomplete;
   - path + Heart Law incomplete;
   - path + Heart Law + breath/focus + commit complete;
   - pre-identity tick/offline does not mutate cultivation;
   - post-identity tick uses normal mechanics.
2. First gate route/catalyst parity:
   - trial entry does not require the reward catalyst unless `requiredItemId` exists;
   - clear and bypass grant the same catalyst;
   - breakthrough consumes that catalyst once.
3. Timing/foundation report harness:
   - canonical route setup completes life identity before timing probes;
   - `foundation_entry` marker is emitted only after actual Foundation realm state.
4. City handoff/save-load/offline/prestige:
   - add the narrowest route or scenario tests after the first failing source of truth is identified.

## Report reruns after fixes

- `npm run release:fresh-run-report:json`
- `npm run balance:report:json`
- `npm run release:route-report:json`
- `npm run release:reclaim-route-report`
- targeted compiled tests with `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/...`

## Browser proof

Use repo Playwright/browser tooling if a stable local app path is available after targeted tests. Capture screenshots, DOM summaries, and console logs under `artifacts/mp1/browser/`.

## Final coverage executed

| Area | Test/report | Result | Artifact |
|---|---:|---:|---|
| Life identity predicate | `tmp-tests/tests/contracts/lifeIdentityPredicate.test.js` | PASS | `artifacts/mp1/implementation/life-identity-predicate.green.log` |
| Mechanical pause | `tmp-tests/tests/integration/lifeStartMechanicalPause.test.js` | PASS | `artifacts/mp1/implementation/life-start-mechanical-pause.green.log` |
| Fresh route harness | `tmp-tests/tests/integration/freshSaveRouteHarness.test.js` | PASS | `artifacts/mp1/implementation/fresh-save-route-harness.green.log` |
| Gate/catalyst/city truth | `tmp-tests/tests/contracts/p0ProgressionTruth.test.js`, `tmp-tests/tests/contracts/trialLifecycle.test.js` | PASS | `artifacts/mp1/implementation/mp1-targeted-tests.log` |
| Failure diagnosis | `tmp-tests/tests/integration/failureDiagnosisRuntimeBridge.test.js` | PASS | `artifacts/mp1/implementation/mp1-targeted-tests.log` |
| Manual/technique proof | `tmp-tests/tests/integration/manualPavilionBridge.test.js` | PASS | `artifacts/mp1/implementation/mp1-targeted-tests.log` |
| Prestige reset | `tmp-tests/tests/integration/prestigeResetRuntime.test.js` | PASS | `artifacts/mp1/implementation/mp1-targeted-tests.log` |
| Save/reload matrix | `tmp-tests/tests/integration/release/saveReloadSafetyMatrix.test.js` | PASS | `artifacts/mp1/implementation/mp1-targeted-tests.log` |
| Browser route smoke | `tests/e2e/mp1-route-proof.spec.ts` | PASS | `artifacts/mp1/browser/mp1-route-proof.playwright.green.log` |
| Fresh-run report | `npm run release:fresh-run-report:json` | PASS with warnings | `artifacts/mp1/reports/fresh-run/final.log` |
| Balance report | `npm run balance:report:json` | FAIL timing bands, `foundation_entry` present | `artifacts/mp1/reports/balance/final.log` |
| Route report | `npm run release:route-report:json` | PASS with warning | `artifacts/mp1/reports/route/final.log` |
| Reclaim report | `npm run release:reclaim-route-report` | PASS | `artifacts/mp1/reports/reclaim/final.log` |
| Migration matrix | `npm run release:migration-matrix:json` | PASS | `artifacts/mp1/reports/migration-matrix.final.log` |
| Offline route | `npm run release:offline-route-report` | PASS | `artifacts/mp1/reports/offline-route.final.log` |
| Runtime diagnostics | `npm run release:runtime-diagnostics:json` | PASS | `artifacts/mp1/reports/runtime-diagnostics.final.log` |
| Vocabulary audit | `npm run release:vocab-audit:json` | PASS | `artifacts/mp1/reports/vocab-audit.final.log` |
| Full contracts | `npm run test:contracts` | TIMEOUT | `artifacts/mp1/implementation/test-contracts.final.log` |
