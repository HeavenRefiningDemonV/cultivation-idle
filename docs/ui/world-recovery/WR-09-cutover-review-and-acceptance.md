# WR-09 — World truth purge, screenshot QA, cutover review, and acceptance hardening

## Blocker problems found
1. Canonical World cutover screenshots are still missing from `docs/release/qa/ui-cutover/phase-0-core-screens/04-world/` (`01-base` through `06-reduced-motion`).
2. Because canonical evidence is incomplete, legal cutover criteria G3–G7 cannot be certified honestly.
3. `world-main` baseline notes contained stale “likely missing-role” language that implied unresolved WR-07 art gaps without screenshot-backed WR-09 acceptance evidence.
4. World top-ribbon title used `Adventure` wording instead of explicit World-facing truth.

## WR-09 truth purge + acceptance hardening actions
- Updated canonical World evidence README with explicit WR-09 gate table (G1–G8) and DEFERRED decision.
- Removed stale missing-role assertions from `world-main` baseline/manual reference README.
- Added a dedicated World WR-09 signoff block in `docs/release/ui_screen_signoff_sheet.md`.
- Updated Phase-0/Phase-2 evidence docs to align with WR-09 deferred state and current World FX ownership truth.
- Normalized the World top-ribbon title text to `World`.

## Canonical screenshot status
- Required canonical slots: `01-base.png`, `02-interaction.png`, `03-truth-states.png`, `04-high-fx.png`, `05-low-fx.png`, `06-reduced-motion.png`.
- Current status at WR-09 close: **missing** (not committed).
- Legal implication: cleanup authority remains locked; screen stays additive.

## Cutover gate evaluation (G1–G8)
| Gate | Result | Reason |
| --- | --- | --- |
| G1 | FAIL | Canonical screenshot set incomplete. |
| G2 | PASS | Preserve-first additive ownership retained. |
| G3 | FAIL | Duplicate-system absence cannot be certified without canonical screenshots. |
| G4 | FAIL | Missing-label/button parity cannot be certified without canonical screenshots. |
| G5 | FAIL | High/Low/Reduced coherence evidence incomplete. |
| G6 | FAIL | Layout-shift claims cannot be certified without interaction/truth-state captures. |
| G7 | FAIL | Gameplay-truth parity cannot be approved without visual proof. |
| G8 | FAIL | Cleanup prohibited until G1–G7 pass. |

## Final signoff state
**DEFERRED**

## Deferred follow-up
- Capture canonical World screenshot set (`01-06`, plus optional `07-narrow`).
- Re-run WR-09 gate review with human reviewer signoff.
- Only then evaluate `APPROVED FOR CLEANUP` vs `REJECTED — REMAIN ADDITIVE`.
