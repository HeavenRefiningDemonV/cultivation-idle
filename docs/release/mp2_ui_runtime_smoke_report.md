# MP2 UI Runtime Smoke Report

Generated: 2026-05-29T00:10:12+03:00
Packet result: PARTIAL

## Summary

MP2 added a repeatable Playwright UI runtime smoke harness and captured fresh-life traversal evidence for required main screens and world modules. The harness writes screenshots, DOM summaries, console logs, and a machine-readable screen matrix under `artifacts/mp2/`.

Final result is PARTIAL because the main traversal is green, but Gate Trial advanced lifecycle screenshots still need safe fixture/state proof and the broad release gate timed out.

## Evidence

| Artifact | Path |
|---|---|
| Final report | `artifacts/mp2/final/MP2_FINAL_REPORT.md` |
| Blocker status | `artifacts/mp2/final/MP2_BLOCKER_STATUS.json` |
| Screen matrix CSV | `artifacts/mp2/final/screen-matrix.final.csv` |
| Screen matrix JSON | `artifacts/mp2/final/screen-matrix.final.json` |
| Laptop contact sheet | `artifacts/mp2/final/contact-sheet-laptop.png` |
| Desktop contact sheet | `artifacts/mp2/final/contact-sheet-desktop.png` |
| Exact screens contact sheet | `artifacts/mp2/final/exact-screens-contact-sheet.png` |
| Screenshots | `artifacts/mp2/final/screenshots/` |
| DOM summaries | `artifacts/mp2/final/dom-summaries/` |
| Console summary | `artifacts/mp2/final/console-summary.md` |
| Art preservation | `artifacts/mp2/final/art-preservation-report.md` |

## Commands

| Command | Result | Artifact |
|---|---:|---|
| `npm run typecheck` | PASS | `artifacts/mp2/final/logs/typecheck.final.log` |
| `npm run check:icons` | PASS | `artifacts/mp2/final/logs/check-icons.final.log` |
| `npm run validate:content` | PASS | `artifacts/mp2/final/logs/validate-content.final.log` |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | `artifacts/mp2/final/logs/tsconfig-tests.final.log` |
| `npm run build` | PASS with warnings | `artifacts/mp2/final/logs/build.final.log` |
| `npx playwright test tests/e2e/mp2-ui-runtime-smoke.spec.ts` | PASS | `artifacts/mp2/final/logs/mp2-ui-runtime-smoke.final.log` |
| `npm run release:gate:json` | TIMEOUT | `artifacts/mp2/final/logs/release-gate.final.log` |

## Fixed In MP2

- Ruins planning screen now has an intentional central chamber/route plane instead of blank parchment.
- Gate Trial laptop layout keeps the readiness rail and Trial Summary from colliding.
- Inventory first-run state explains why the satchel is empty and routes to first item sources.
- Techniques first-run state routes to Manual Pavilion and explains manual-to-loadout progression.
- Prestige compact laptop state explains `+0 AP` as not ready without tuning AP.
- Status removes a duplicated top-warning row when the same warning is already promoted to the primary preparation callout.

## Remaining Ownership

- MP2 follow-up: Gate Trial active, defeat, fail-safe, cleared, bypassed, and breakthrough handoff captures.
- MP3: reward/source parity, manual coverage, economy urgency, and support-loop incentives.
- MP4: timing bands, AP/reclaim tuning, and route pacing.
- MP5: release gate timeout, waivers, security/dependency, and observability hardening.
- Story/tutorial: onboarding narration and final menu polish.

## Scope Confirmation

MP2 did not add story tutorial content, tune balance/AP/reclaim values, rewrite economy/reward systems, duplicate RewardService/CombatStore/ActivityStore ownership in UI, remove old scenic/base art, or introduce emoji icons.
