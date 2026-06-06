# MP0 Command Log

## Environment
- Date/time: 2026-05-28
- Branch: Latest
- Commit: 969de0ab4602a37ba3edf6ed6233419328f21924
- Node version: v24.14.0
- NPM version: 11.9.0
- Package manager: npm
- OS/shell: Windows PowerShell 5.1

## Commands

| Command | Status | Notes | Artifact |
|---|---|---|---|
| `git status --short` | PASS | Initial pre-artifact status was clean. | `artifacts/mp0/git/status-before.txt` |
| `npm run typecheck` | PASS | Baseline TypeScript passed. | `artifacts/mp0/logs/typecheck.before.log` |
| `npm run check:icons` | PASS | No emoji icon usage found. | `artifacts/mp0/logs/check-icons.before.log` |
| `npm run validate:content` | PASS | Runtime content validation passed. | `artifacts/mp0/logs/validate-content.before.log` |
| `npm run build` | PASS/WARN | Build passed with Browserslist, unresolved InsideDungeon asset, and chunk-size warnings. | `artifacts/mp0/logs/build.before.log` |
| `npm run release:gate:json` | NO_GO | Baseline exit 2; 5 blockers, 1 pending manual, 6 unresolved waiver candidates. | `artifacts/mp0/logs/release-gate.before.log` |
| `npm run test:contracts` | FAIL | Baseline stopped at TS5033 writing `tmp-progression-fixtures`. | `artifacts/mp0/logs/test-contracts.before.log` |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | Tests compiled before fixture changes. | `artifacts/mp0/logs/tsc-tests.before.log` |
| direct `trialLifecycle.test.js` | FAIL | Baseline failed on `[PavilionContent] manifest root must be an object`. | `artifacts/mp0/logs/trial-lifecycle.before.log` |
| `npx tsc --project tsconfig.progression-fixtures.json --outDir artifacts/mp0/contracts/progression-fixtures-probe` | PASS | Proved TS5033 was tied to the tracked legacy output tree. | `artifacts/mp0/logs/build-progression-fixtures-alt-outdir.log` |
| direct progression fixture regression test | PASS | New regression passes after `.tmp/progression-fixtures` script/output migration. | `artifacts/mp0/logs/progression-fixture-regression.green.log` |
| `npm run build:progression-fixtures` | PASS | Fixture build emits to ignored `.tmp/progression-fixtures`. | `artifacts/mp0/logs/build-progression-fixtures.green.log` |
| direct `trialLifecycle.test.js` | PASS | Shape fix and expanded lifecycle coverage pass. | `artifacts/mp0/logs/trial-lifecycle.expanded.log` |
| direct `trialLifecycle.test.js` repeat | PASS | Repeat run passed. | `artifacts/mp0/logs/trial-lifecycle.after-2.log` |
| targeted Pavilion fixture tests | FAIL | Manifest-root errors gone; one real consumable assertion remains. | `artifacts/mp0/logs/pavilion-record-fixtures.targeted.log` |
| `npm run test:contracts` | FAIL | Fixture-output and Pavilion root failures gone; broad real/stale contract debt remains. | `artifacts/mp0/logs/test-contracts.after-2b.log` |
| `npm run release:gate:json` run 1 | NO_GO | Stable semantic decision. | `artifacts/mp0/release/release-gate.after-1.json` |
| `npm run release:gate:json` run 2 | NO_GO | Same blocker/manual/waiver counts and per-check statuses as run 1. | `artifacts/mp0/release/release-gate.after-2.json` |
| `npm run typecheck` final | PASS | Final baseline after MP0 edits. | `artifacts/mp0/logs/typecheck.final.log` |
| `npm run check:icons` final | PASS | Final icon/emoji check after AGENTS update. | `artifacts/mp0/logs/check-icons.final.log` |
| `npm run validate:content` final | PASS | Final content validation after fixture-map changes. | `artifacts/mp0/logs/validate-content.final.log` |
| `npm run build` final | PASS/WARN | Final build passed with same warning class. | `artifacts/mp0/logs/build.final.log` |
| `npm exec tsc -- --project tsconfig.tests.json` final | PASS | Final test compile. | `artifacts/mp0/logs/tsc-tests.final.log` |
| direct `trialLifecycle.test.js` final | PASS | Final lifecycle repeat. | `artifacts/mp0/logs/trial-lifecycle.final.log` |
| `npm run build:progression-fixtures` final | PASS | Repeat fixture emit to `.tmp/progression-fixtures`. | `artifacts/mp0/logs/build-progression-fixtures.final.log` |
| `npm run test:contracts` final repeat | TIMEOUT/FAIL | Reached broad real/stale contract failures with no TS5033/Pavilion root hits, then hung in existing `cultivationConsumables` contract and was stopped. | `artifacts/mp0/logs/test-contracts.final-repeat.log` |
| `npm run release:fresh-run-report:json` | PASS/NO_GO payload | Script exited 0 but automatedPass/releaseReady false; final realm `soul_formation`. | `artifacts/mp0/logs/fresh-run-report.before.log` |
| `npm run balance:report:json` | FAIL | Timing probe ended without `foundation_entry`. | `artifacts/mp0/logs/balance-report.before.log` |
| `npm run release:route-report:json` | FAIL | `foundation_entry` failure; prestige getter warning. | `artifacts/mp0/logs/route-report.before.log` |
| `npm run release:reclaim-route-report` | FAIL | `foundation_entry` failure. | `artifacts/mp0/logs/reclaim-route-report.before.log` |
| `npm audit --audit-level=moderate --json` | FAIL | 4 vulnerabilities: 2 moderate, 2 high. Deferred to MP5. | `artifacts/mp0/logs/npm-audit.before.json` |
