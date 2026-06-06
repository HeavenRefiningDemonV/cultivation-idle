# MP2 Final Report - UI Runtime Smoke, Preservation, Exact-Screen Repair

Generated: 2026-05-29T00:10:12+03:00  
Branch: Latest  
Commit: 969de0ab4602a37ba3edf6ed6233419328f21924  
Packet result: PARTIAL  
Release gate after MP2: NOT_RUN/TIMEOUT  
Story tutorial readiness: No  
Final menu polish readiness: No  
Final number tuning readiness: No; MP4 still owns timing/AP/reclaim tuning.

## 1. Previous Packet Verification
- MP1 status: `MP2_PARTIAL_GO`.
- Acceptable for MP2: life-start mechanical pause fixed, content/build/typecheck green, route/reclaim/offline/vocab evidence present, MP1 Playwright route proof reran green.
- Outside MP2: balance timing bands, manual coverage warnings, full contract-suite timeout, security/waiver hardening.
- Evidence: `artifacts/mp2/preflight/previous-packet-verification.md`.

## 2. Implementation Summary
- Added `tests/e2e/mp2-ui-runtime-smoke.spec.ts` for fresh-life traversal, screenshots, DOM summaries, console logs, and screen matrix output.
- Repaired Ruins blank central plane and grid variable layout.
- Repaired Gate Trial laptop rail/summary overlap.
- Repaired Techniques laptop layout pressure and empty-state route.
- Repaired Inventory first-run empty state with direct world-module routes.
- Repaired Prestige laptop `+0 AP` truth readability with a compact current-life summary.
- Reduced Status warning density by dropping the duplicated top-warning row when promoted to the primary callout.

## 3. Files Changed
- Screens: `InventoryScreen.tsx/.scss`, `TechniquesExactScreen.tsx/.scss`, `PrestigeLedgerExactScreen.tsx/.scss`.
- Exact screens: `GateTrialExactScreen.scss`, `RuinsExactMockupScreen.scss`.
- Status surface: `statusLedgerSurface.ts`.
- Tests/scripts: `tests/e2e/mp2-ui-runtime-smoke.spec.ts`.
- Docs/artifacts: `artifacts/mp2/**`, `docs/release/mp2_ui_runtime_smoke_report.md`, `docs/release/current_readiness.md`, `docs/release/known_issues.md`.

## 4. Commands Run
| Command | Result | Artifact | Notes |
|---|---:|---|---|
| `npm run typecheck` | PASS | `artifacts/mp2/final/logs/typecheck.final.log` | Final gate |
| `npm run check:icons` | PASS | `artifacts/mp2/final/logs/check-icons.final.log` | No emoji icon usage found |
| `npm run validate:content` | PASS | `artifacts/mp2/final/logs/validate-content.final.log` | Existing Node loader warning only |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | `artifacts/mp2/final/logs/tsconfig-tests.final.log` | Test compile |
| `npm run build` | PASS with warnings | `artifacts/mp2/final/logs/build.final.log` | Existing chunk-size warning |
| `npx playwright test tests/e2e/mp2-ui-runtime-smoke.spec.ts` | PASS | `artifacts/mp2/final/logs/mp2-ui-runtime-smoke.final.log` | 3 passed |
| `npm run release:gate:json` | TIMEOUT | `artifacts/mp2/final/logs/release-gate.final.log` | Broad gate exceeded 5 minutes; classified, not hidden |

## 5. Screen Matrix
- Final machine matrix: `artifacts/mp2/final/screen-matrix.final.json`
- Final CSV matrix: `artifacts/mp2/final/screen-matrix.final.csv`
- Summary: 53 rows captured; 47 pass, 6 partial by automated suspected-clipping audit; 0 console errors.

## 6. Exact Screen Matrix
| Screen | Captured states | Status | Evidence |
|---|---|---:|---|
| Gate Trial | planning/locked at 1366, 1920, 2048 | partial | `artifacts/mp2/final/screenshots/2048x1152/SS-200-gate-trial-planning-gate-trial-planning-exact.png` |
| Outskirts | planning/default at 1366, 1920, 2048 | pass | `artifacts/mp2/final/screenshots/2048x1152/SS-210-outskirts-planning-outskirts-planning-exact.png` |
| Ruins | planning/default at 1366, 1920, 2048 | pass | `artifacts/mp2/final/screenshots/2048x1152/SS-220-ruins-planning-ruins-planning-exact.png` |

## 7. Game-Feel Findings
- Improved: Ruins now reads as a targeted support route; Gate Trial rail/summary no longer collide; Inventory/Techniques now route first-run players toward source systems; Prestige `+0 AP` reads as not-ready rather than broken.
- Still weak: advanced Gate Trial active/defeat/clear/bypass states need a safe fixture/state harness.
- MP3: reward parity, source/sink urgency, manual coverage.
- MP4: timing bands, AP/reclaim tuning.
- MP5: release gate timeout/root hardening/security/observability.

## 8. Art Preservation Report
- Full report: `artifacts/mp2/final/art-preservation-report.md`
- No old scenic/base art was removed.
- No new image assets were added.

## 9. Remaining Blockers
- MP2 follow-up: Gate Trial advanced state capture matrix.
- MP3: manual/reward/economy parity warnings.
- MP4: balance timing bands and AP/reclaim tuning.
- MP5: release gate timeout, dependency/security/waiver hardening.
- Story/tutorial: not started.

## 10. Artifact Links
- Screenshots: `artifacts/mp2/final/screenshots/`
- DOM summaries: `artifacts/mp2/final/dom-summaries/`
- Console logs: `artifacts/mp2/browser/console-logs/`
- Contact sheets: `artifacts/mp2/final/contact-sheet-laptop.png`, `artifacts/mp2/final/contact-sheet-desktop.png`, `artifacts/mp2/final/exact-screens-contact-sheet.png`
- Final matrix: `artifacts/mp2/final/screen-matrix.final.csv`

## 11. No-Scope Confirmation
- No story tutorial.
- No final balance tuning.
- No AP/reclaim target changes.
- No broad economy rewrite.
- No RewardService/CombatStore/ActivityStore ownership duplicated in UI.
- No destructive art cutover.
- No emoji icons introduced.
