# Training Heart Law MP2 Final

Date: 2026-06-01

## Packet Verdict

MP2 focused acceptance: GO.

Full release verdict: NO_GO. The broad release gate still reports unrelated repository blockers; those are separated below and were not treated as MP2 failures.

## Implemented Scope

- Added screen-owned Training Hall UI under `src/features/trainingHall/`.
- Added a pure Training Hall surface builder with path rooms for Heaven, Earth, and Martial, six regimens per selected path, active, blocked, fatigue, cap, offline-return, and reduced-motion states.
- Added a Training Hall action controller that delegates only to `trainingStore.startTraining` and `trainingStore.stopTraining`.
- Added read-only training snapshot support under `src/systems/training/`.
- Wired Training Hall as a live non-combat World module through city content, onboarding/module registries, command surfaces, city map hub placement, and `WorldBuildingModal`.
- Added read-only Status, Gate Trial, and Techniques hooks for Path Foundation and training bottleneck/prep context.
- Did not add Dao Heart runtime, combat scaling, reward grants, prestige reset behavior, gate threshold changes, or destructive art replacement.

## Focused Verification

All focused commands passed after the final source changes. Summary artifact: `artifacts/training-heart-law/mp2/final/focused-command-summary.json`.

- `npm exec tsc -- --project tsconfig.tests.json`
- focused node tests for Training Hall surface, route/action, read-only integrations, MP1 runtime/store, and updated world/onboarding/module registry pins
- `npm run typecheck`
- `npm run check:icons`
- `npm run validate:content`
- `npm run build`

## Browser Evidence

The Browser plugin was able to open the local app, but deterministic setup through module imports was not available from the in-app Browser evaluation context. The observed blocker was: `module loading is not available in playwright.evaluate`.

Fallback used: local Playwright against `http://127.0.0.1:5173/`.

Playwright evidence artifact: `artifacts/training-heart-law/mp2/browser/browser-evidence.json`.

The matrix captured 9 rendered scenarios with no blocking console/page errors, six regimens in every selected-path case, no cross-path regimen leakage, and no horizontal overflow:

- `01-heaven-idle.png`
- `02-earth-idle.png`
- `03-martial-idle.png`
- `04-active-practice.png`
- `05-blocked-combat.png`
- `06-fatigue-high.png`
- `07-cap-reached.png`
- `08-offline-return.png`
- `09-reduced-motion.png`

Screenshots are under `artifacts/training-heart-law/mp2/browser/screenshots/`.

## Broad Verification

Current broad command summary: `artifacts/training-heart-law/mp2/final/broad-command-summary.json`.

`npm run test:contracts` completed within the bounded run and remained non-green. Training Hall focused tests passed inside the broad run, including:

- `training hall surface renders only the selected path six-regimen room`
- `training hall surface exposes no-path, blocked-combat, fatigue, cap, offline, and reduced-motion states`

Representative broad failures remain outside the MP2 packet, including Gate Trial exact fixture locks, Outskirts exact generated-source expectations, ScenicLabel CityMapHub frozen-variant expectations, and `statusToneUtils` ready/blocked tone mapping.

`npm run release:gate:json` completed and produced structured JSON with:

- `overallPass: false`
- `unresolvedBlockerCount: 3`
- `pendingManualCount: 1`
- decision headline: `NO_GO`

The release blockers reported by the gate are:

- `fresh_run_acceptance`: required manual fresh-run coverage is incomplete.
- `migration_matrix`: current-save migration matrix failed.
- `full_test_suite`: full test suite timed out inside the release gate.

## Evidence Paths

- Preflight: `artifacts/training-heart-law/mp2/preflight/preflight-summary.json`
- Focused command logs: `artifacts/training-heart-law/mp2/final/`
- Browser matrix: `artifacts/training-heart-law/mp2/browser/browser-evidence.json`
- Browser screenshots: `artifacts/training-heart-law/mp2/browser/screenshots/`
- Browser console: `artifacts/training-heart-law/mp2/browser/console.log`
