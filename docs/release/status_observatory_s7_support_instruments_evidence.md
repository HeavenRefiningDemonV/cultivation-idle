# Status Observatory S7 Support Instruments Evidence

Date: 2026-06-11

## Verdict

Packet-local verdict: GO.

S7 replaced the lower inline shells in the isolated Status Living State Observatory with physical support instruments: Build & Preparation Scales, Reserve Jars, Current Work Time Wheel, folded Recent Changes / How Calculated / Source Coverage ledgers, and exact drawer surfaces.

Full release verdict: NO_GO. The S7 slice passes targeted and contract verification, but `npm run release:gate:json` still reports broad release blockers outside this packet.

## Scope Kept

- Kept `STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED = false`; the public Status route remains preserved and is not silently cut over to the Observatory renderer.
- Kept S0-S6 Observatory anchors visible in the isolated preview: `status-ledger-root`, `status-ledger-hero`, `status-ledger-metrics`, `status-ledger-grid`, `status-ledger-mission-requirements`, `status-ledger-cultivation-base`, `status-ledger-current-work`, and `status-ledger-build-preparation`.
- Did not mutate gameplay, stores, rewards, combat, trial lifecycle, progression, or prestige services.
- Did not add default public Dao/Omen/Proof/Source labels in the S7 preview.
- Did not reintroduce default row dump tables/lists/cards for S7 support instruments; exact rows live behind drawers.

## Changed Files

- `src/systems/ui/status/statusObservatoryTypes.ts`
- `src/systems/ui/status/statusObservatorySurface.ts`
- `src/ui/status/observatory/StatusBuildPreparationScales.tsx`
- `src/ui/status/observatory/StatusReserveJars.tsx`
- `src/ui/status/observatory/StatusCurrentWorkTimeWheel.tsx`
- `src/ui/status/observatory/StatusFoldedLedgerRail.tsx`
- `src/ui/status/observatory/StatusObservatoryDrawers.tsx`
- `src/ui/status/observatory/StatusLivingStateObservatory.tsx`
- `src/ui/status/observatory/StatusLifeDecreeScroll.tsx`
- `src/ui/status/observatory/StatusBottleneckTalismanCanopy.tsx`
- `src/ui/status/observatory/StatusLivingStateObservatory.scss`
- `src/ui/status/observatory/index.ts`
- `tests/contracts/statusObservatorySupportInstruments.test.ts`
- `artifacts/s7-status-observatory/status-observatory-s7-preview.html`

## Visual Evidence

Browser direct tool was unavailable in the exposed tool set, so capture used Playwright through the Node REPL against a temporary Vite server.

- Default isolated S7 preview: `artifacts/s7-status-observatory/status_observatory_s7_preview.png`
- Build / Prep drawer proof: `artifacts/s7-status-observatory/status_observatory_s7_build_prep_drawer.png`
- Smoke JSON: `artifacts/s7-status-observatory/status_observatory_s7_smoke.json`
- Temporary server logs: `artifacts/s7-status-observatory/vite-dev.out.log`, `artifacts/s7-status-observatory/vite-dev.err.log`

Smoke result:

- All checked anchors visible: root, hero, metrics, grid, mission requirements, cultivation base, Build/Preparation Scales, Reserve Jars, Current Work Time Wheel, Folded Ledger Rail.
- Drawers opened: Build/Preparation row count 11, Current Work row count 8, Recent Changes row count 1, How Calculated row count 7.
- Forbidden public Status text found in preview: none.
- Page errors: none.
- Console warnings were content validation / prestige getter warnings already emitted by content-store preview boot, not S7 render failures.

## Commands Run

Preflight:

- `npm run release:implementation-baseline:json` - passed.
- `npm run release:runtime-content-manifest:json` - passed.
- `npm run typecheck` - passed.
- `npm run check:icons` - passed.
- `npm exec tsc -- --project tsconfig.tests.json` - passed.

Red/green targeted:

- Red run: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/statusObservatorySupportInstruments.test.js` - failed before S7 files/drawers/styles existed.
- Green run after implementation: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/statusObservatorySupportInstruments.test.js` - passed, 4/4.
- Observatory slice: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/statusObservatory*.test.js` - passed, 40/40 after removing an orphan generated JS test with no source TS file.

Final verification after the last anchor edit:

- `npm exec tsc -- --project tsconfig.tests.json` - passed.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/statusObservatorySupportInstruments.test.js` - passed, 4/4.
- `npm run typecheck` - passed.
- `npm run check:icons` - passed.
- `npm run validate:content` - passed.
- `npm run build` - passed with the known Vite large-chunk warning.
- `npm run test:contracts` - passed, `[runNodeTestFilesSequential] passed=505 total=505`.
- `npm run release:gate:json` - failed broad release gate, `NO_GO`.
- `npm run test` - failed broad suite; full log captured at `artifacts/s7-status-observatory/npm-test.log`.

## Broad Release Blockers

`npm run release:gate:json` reported:

- `overallPass=false`, `releaseReady=false`, headline `NO_GO`.
- Two unresolved blockers.
- One pending manual check.
- Five unaccepted waiver-candidate findings.

Main blocker families:

- Fresh-run manual coverage incomplete for normal, cautious, and aggressive routes.
- Full test suite fails outside this packet.

Direct `npm run test` blocker evidence includes:

- Playwright `.spec.js` files under `tmp-tests/tests/e2e/` are being loaded by Node test runner and fail with Playwright Test context errors.
- `tmp-tests/tests/integration/balanceTelemetryExportFlow.test.js` cannot resolve `src/services/events/GameEvents.js`.
- City arrival / unlock integration expectations fail false-vs-true assertions.
- Cultivation scheduler / hot-path tests expect 600 Qi and receive 0.
- Gate Trial safety-net wording contract still sees old `Fail-safe` / `Eligible Failures` wording in touched legacy surfaces.
- World / Ruins / route integration contracts contain stale source-shape expectations.
- `tmp-tests/tests/integration/worldBuildingModalRouteIntent.test.js` still expects older modal intent and legacy alchemy panel wiring.
- `tmp-tests/tests/migrations/migrationRunner.test.js` expects only the old six migration steps and zero planned transforms, but current runtime includes later onboarding/training/prestige migration steps.

These blockers are not caused by the S7 support-instrument files; the focused S7 contract and full sequential contract suite both pass.

## Deferred / Not Done

- No public Status route cutover was performed. This is intentional for S7 isolation and existing source-backed route-safety contracts.
- No broad release blockers were fixed. They are outside the S7 implementation contract.
- No generated release blocker assertions were weakened, deleted, or waived.
