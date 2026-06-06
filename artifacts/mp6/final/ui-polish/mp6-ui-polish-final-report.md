# MP6 UI Polish Final Report

## Verdict Split
- MP6 UI-polish targeted readiness: GO.
- Full release readiness: NO_GO.

MP6 targeted scope passed focused contracts, screenshot evidence, typecheck, icon check, content validation, and build. Full release remains blocked by broad release-gate findings that are outside this additive UI/VFX/accessibility packet.

## MP6 Scope Implemented
- Training Hall: additive `visual` surface state, path/activity/reduced-motion markers, capped local mote budget of 36, capped text-overlay opacity, stable visual anchors, focus/reduced-motion CSS, high-fatigue/capped active evidence.
- Dao Heart Sanctuary: additive `visual` surface state for clarity/turbulence/seal/practice, reduced-motion marker, capped local mote budget of 48, focus/reduced-motion CSS, high-turbulence active evidence.
- Cultivation breakthrough readiness: stable row ids, tone metadata, ARIA summaries, risk band and confirmation-required display metadata, fixed row height, and best-improvement action display without changing resolver math.
- Gate Trial readiness: reduced-motion fallback CSS and failure-shake limits of 3px/120ms preserved under exact owner rows.
- Techniques: modal training-scaling preview now uses `buildTechniqueScalingTooltipRows`; fixed a runtime loop by replacing direct `toSaveState()` subscription with a stable training snapshot signature; no coefficients or formulas duplicated.
- Status Ledger: screenshot and copy guard evidence captured; no public Dao/Omen/Proof/Source regression introduced by MP6.

## MP6-Touched Files
- `src/features/trainingHall/trainingHallTypes.ts`
- `src/features/trainingHall/buildTrainingHallSurface.ts`
- `src/features/trainingHall/TrainingHallScreen.tsx`
- `src/features/trainingHall/TrainingHallScreen.scss`
- `src/features/daoHeartSanctuary/daoHeartSanctuaryTypes.ts`
- `src/features/daoHeartSanctuary/buildDaoHeartSanctuarySurface.ts`
- `src/features/daoHeartSanctuary/DaoHeartSanctuaryView.tsx`
- `src/features/daoHeartSanctuary/DaoHeartSanctuaryView.scss`
- `src/features/cultivation/exact/CultivationExactScreen.tsx`
- `src/features/cultivation/exact/CultivationExactScreen.scss`
- `src/features/world/gateTrialExact/GateTrialExactScreen.scss`
- `src/ui/fx/scenes/GateTrialFxScene.scss`
- `src/components/modals/TechniqueDetailModal.tsx`
- `src/components/modals/TechniqueDetailModal.scss`
- `tests/contracts/mp6UiPolishSurfaceContract.test.ts`
- `tests/e2e/mp6-ui-polish.spec.ts`

The repository had substantial pre-existing dirty/untracked work before MP6; this report names only the MP6-touched subset.

## Screenshot Evidence
- Manifest: `artifacts/mp6/final/ui-polish/screenshot-manifest.json`.
- Captured slots: Cultivation breakthrough rows, Dao Heart active/high turbulence, Training Hall idle, Training Hall active/high-fatigue/capped, Status Ledger base, Status Ledger reduced motion, Gate Trial readiness fixture, Gate Trial reduced motion, Techniques collapsed, Techniques expanded modal.
- Screenshots live under `artifacts/mp6/final/ui-polish/screenshots/` with DOM summaries under `artifacts/mp6/final/ui-polish/dom-summaries/`.

## Commands
- PASS: focused MP6 contracts.
- PASS: MP6 Playwright screenshot spec.
- PASS: `npm run typecheck`.
- PASS: `npm run check:icons`.
- PASS: `npm run validate:content`.
- PASS: `npm run build`.
- BROAD FAIL: `npm run test:contracts` fails in existing `balanceRegressionScripts.test.js`: `Timing probe ended without milestone: spirit_severing_entry`.
- BROAD FAIL: `npm run release:gate:json` exits 2 with full release NO_GO: 5 unresolved blockers, 1 pending manual check, 4 untracked waiver candidates.

Command summary JSON: `artifacts/mp6/final/ui-polish/mp6-command-summary.final.json`.

## Full-Release Blockers From Gate Rerun
- `fresh_run_acceptance`: required manual fresh-run coverage incomplete.
- `migration_matrix`: current-save migration matrix failed.
- `balance_regression`: balance report command returned non-zero.
- `route_comparison`: route comparison command returned non-zero.
- `full_test_suite`: `npm run test` timed out after 180793ms.

These blockers were not waived or hidden.

## Cleanup Boundary
No scenic/base art was removed. Cleanup stayed additive and screenshot-backed. Remaining broad failures are documented as release blockers, not treated as MP6 polish failures.
