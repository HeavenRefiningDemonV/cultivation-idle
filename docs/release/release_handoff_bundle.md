# Release Handoff Bundle

## What this build is
- semester slice: semester_0 (Five-city / five-trial authored slice ending at Spirit Severing)
- content cap realm: spirit_severing
- live city chain: city_pinewind_hamlet -> city_stonecrag_town -> city_spirit_cavern_city -> city_lotusford -> city_ironpeak_bastion
- live gate chain: trial_novices_clearing -> trial_stone_core_sanctum -> trial_patriarchs_seal -> trial_soul_lantern_vault -> trial_severing_court
- live route matrix scope: fail_safe, offline_heavy, low_attention, high_skill, reclaim (packet 7.3 route comparison).
- prestige/current-cap truth scope: fresh-run acceptance final-truth checks for cap reach, life summary, and chapter-exhausted signal.
- section 7 verification scope: fresh-run acceptance, migration matrix, balance regression, route comparison, runtime diagnostics, vocabulary/build audits, release gate aggregation.

## Current release status
- release gate headline: PASS_WITH_ACCEPTED_WAIVERS
- binary decision: GO
- cleanPass: false
- acceptedWaivers: 1
- unresolvedBlockers: 0
- pendingManual: 0

## Command map
- `npm run release:gate`
- `npm run release:handoff`
- `npm run release:fresh-run-report`
- `npm run release:migration-matrix`
- `npm run balance:report`
- `npm run release:route-report`
- `npm run release:runtime-diagnostics`
- `npm run release:vocab-audit`
- `npm run release:build-audit`
- `npm run validate:content`
- `npm run progression:report`
- `npm run test`

## Evidence/doc map
- `docs/release/known_issues.md`: Current known-issues snapshot generated from ledger + gate findings.
- `docs/release/waiver_policy.md`: Waiver classification and never-waivable rules.
- `docs/release/go_no_go_checklist.md`: Fixed binary rubric rendered from manifest/report.
- `docs/release/signoff_sheet.md`: Reviewer-facing sign-off sheet with evidence and owner fields.
- `docs/release/build_warning_inventory.md`: Build warning inventory and disposition.
- `docs/release/migration_fixture_catalog.md`: Supported migration fixture coverage matrix.
- `docs/release/vocabulary_audit.md`: Player-facing copy audit report.
- `docs/release/surface_truth_audit.md`: Surface truth verification notes.
- `docs/release/live_surface_visual_audit.md`: Live surface visual/icon consistency audit notes.
- `docs/release/save_load_safety_matrix.md`: Save/reload safety coverage reference.
- `docs/release/performance_smoke_checklist.md`: Performance smoke checklist reference.
- `docs/release/qa`: Fresh-save and alternative-route QA route docs.

## Report/source map
- progression contract: script=`scripts/progressionContractReport.ts`, source=`src/systems/progression/diagnostics/index.ts`
- fresh-run acceptance: script=`scripts/release/buildFreshRunAcceptanceReport.ts`, source=`src/services/diagnostics/release/freshRunAcceptanceReport.ts`
- migration matrix: script=`scripts/release/runMigrationMatrix.ts`, source=`src/save/migrations/migrationMatrix.ts`
- balance regression: script=`scripts/balanceRegressionReport.ts`, source=`tmp-tests/scripts/balanceRegressionReport.js`
- route comparison: script=`scripts/release/buildRouteComparisonReport.ts`, source=`src/services/diagnostics/release/routeComparisonReport.ts`
- runtime diagnostics: script=`scripts/release/runRuntimeDiagnostics.ts`, source=`src/services/diagnostics/release/runtimeDiagnosticsReport.ts`
- release gate: script=`scripts/release/runReleaseGate.ts`, source=`src/services/diagnostics/release/releaseGate.ts`

## Known issues snapshot
- open blockers: 0
- accepted waivers: 1
  - waiver_build_npm_env_http_proxy_warning (release_engineering)
- post-semester debt: 0

## How to continue
- First command: run `npm run release:gate` to refresh the canonical gate report for this branch.
- First docs to read: `docs/release/signoff_sheet.md`, `docs/release/go_no_go_checklist.md`, and `docs/release/known_issues.md`.
- Do not assume oral-history approvals or cached CI state; always regenerate gate + handoff artifacts locally for the current commit.
- Release truth lives in structured modules: `releaseGateManifest.ts`, `releaseGate.ts`, `knownIssuesLedger.ts`, and report builders under `src/services/diagnostics/release/`.
