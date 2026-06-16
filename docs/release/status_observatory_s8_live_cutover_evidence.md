# S8 Status Observatory Live Cutover Evidence

Generated: 2026-06-11

## Packet verdict

- S8 packet-local verdict: GO.
- Full release verdict: NO_GO from broad release gate blockers outside the S8 Status route cutover.
- Public Status route now renders the live Living State Observatory from `StatusObservatorySurface` by default.
- Legacy Status Ledger rendering remains available only through the explicit `forceLegacy` fallback boundary.

## S8 files changed

- `src/ui/status/ledger/StatusLedgerPage.tsx`
- `src/ui/status/observatory/StatusLivingStateObservatory.tsx`
- `tests/contracts/statusObservatoryRouteSafety.test.ts`
- `tests/contracts/statusRouteActionsContract.test.ts`
- `tests/contracts/statusObservatoryBottleneckCanopy.test.ts`
- `tests/contracts/statusObservatoryMeridianVessel.test.ts`
- `tests/contracts/statusObservatoryRootLawInstrument.test.ts`
- `tests/contracts/statusObservatorySupportInstruments.test.ts`
- `tests/contracts/statusObservatorySurface.test.ts`
- `tests/contracts/statusObservatoryStatConstellation.test.ts`
- `tests/contracts/statusObservatoryLayoutContract.test.ts`
- `tests/contracts/statusObservatoryRendererContract.test.ts`
- `tests/contracts/statusV2LayoutContract.test.ts`
- `tests/contracts/statusLedgerLayoutContract.test.ts`
- `tests/contracts/layoutStabilityContract.test.ts`
- `tests/e2e/status-observatory-default.spec.ts`
- `tests/e2e/status-current-state.spec.ts`
- `docs/release/status_observatory_s8_live_cutover_evidence.md`

## Cutover proof

- `StatusLedgerPage` imports `buildStatusObservatorySurface(surface)` and mounts `StatusLivingStateObservatory` in the public default path.
- `STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED` is `true`.
- Old card-ledger rendering is isolated in `StatusLegacyLedgerPage` and requires `forceLegacy`; fallback markup is tagged with `data-ledger-mode="legacy-fallback"` and `data-status-ledger-fallback="legacy"`.
- Route action ownership is preserved: `StatusScreen` still owns `useStatusDashboardSurface`, `performStatusLedgerAction`, and the Spirit Root Observation drawer host; `statusRouteActions` owns `status_observation` and `dao_heart_sanctuary` routing.
- S8 route-safety contract scans Observatory visual components for store reads and gameplay mutations.

## Screenshot and DOM evidence

- Public default Status route screenshot: `artifacts/s8-status-observatory/screenshots/status-observatory-default-route.png`
- Public default Status route DOM summary: `artifacts/s8-status-observatory/dom-summaries/status-observatory-default-route.json`
- Spirit Root route-action drawer screenshot: `artifacts/s8-status-observatory/screenshots/status-observatory-root-observation-drawer.png`
- Spirit Root route-action drawer DOM summary: `artifacts/s8-status-observatory/dom-summaries/status-observatory-root-observation-drawer.json`
- Current-state compatibility screenshot: `artifacts/s8-status-observatory/status-current-state/screenshots/status-current-state-root-observation.png`
- Current-state compatibility DOM summary: `artifacts/s8-status-observatory/status-current-state/dom-summaries/status-current-state-root-observation.json`

Observed DOM facts:

- `observatoryRoot`: `status-living-state-observatory`
- `observatoryMode`: `live`
- `noHorizontalOverflow`: `true`
- Default public route drawer state: `null`
- Drawer route action state: `owner=status`, `activeTab=fit`
- Forbidden public labels checked absent in e2e: `Current Omen`, `Gate Proof`, `Source Thread`, `Dao Mandate Interface`, `Omen evidence`, `Proof Detail`, `undefined`, `NaN`, `[object Object]`

## Checks run

- Preflight: `npm run release:implementation-baseline:json` - pass
- Preflight: `npm run release:runtime-content-manifest:json` - pass
- Preflight/baseline: `npm run typecheck` - pass
- Preflight/baseline: `npm run check:icons` - pass
- Preflight/baseline: `npm exec tsc -- --project tsconfig.tests.json` - pass
- Preflight/baseline: `npm run validate:content` - pass
- Preflight/baseline: `npm run build` - pass, with existing Vite large-chunk warning
- S8 red test: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/statusObservatoryRouteSafety.test.js` - failed before production cutover as expected
- S8 focused: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/statusObservatoryRouteSafety.test.js` - pass
- S8 focused: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/statusObservatory*.test.js` - pass, 44/44
- S8 focused: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/statusRouteActionsContract.test.js tmp-tests/tests/contracts/statusObservatoryRouteSafety.test.js` - pass, 7/7
- S8 focused: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/layoutStabilityContract.test.js` - pass
- S8 focused: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/statusLedgerLayoutContract.test.js` - pass, 5/5
- Full contracts: `npm run test:contracts` - pass, 506/506
- Browser smoke: in-app Browser on `http://127.0.0.1:5173` - pass after clearing return/migration/new-life modals; `activeTab=Status`, `rootMode=live`, `missing=[]`, `oldCardCount=0`, `forbiddenHits=[]`
- E2E: `npx playwright test tests/e2e/status-observatory-default.spec.ts` - pass
- E2E: `npx playwright test tests/e2e/status-current-state.spec.ts` - pass
- Release gate: `npm run release:gate:json` - first attempt timed out after 304040 ms with no gate output; second attempt completed with exit 1 and broad NO_GO

## Release gate blockers

`npm run release:gate:json` completed with:

- `overallPass=false`
- `cleanPass=false`
- `releaseReady=false`
- `unresolvedBlockerCount=2`
- `pendingManualCount=1`
- `unresolvedWaiverCandidateCount=5`

Blocking checks reported by the gate:

- `fresh_run_acceptance`: `fresh_run_manual_pending`; required manual fresh-run coverage is incomplete.
- `full_test_suite`: `test_suite_failed`; `npm run test` failed inside the release gate.

These are broad release blockers. The focused S8 route-safety, contracts, Browser smoke, screenshots, and e2e checks passed.

## Deferred items

- Complete or ingest required manual fresh-run coverage for `normal`, `cautious`, and `aggressive` routes.
- Fix the broad `npm run test` failure reported by release gate.
- Classify or accept the five release-gate waiver candidates with owner, reason, evidence, and expiry.
- Keep further visual polish or exact mockup fidelity work in a future packet; S8 only cut over the public route safely to the live Observatory and preserved S0-S7 ownership/actions.
