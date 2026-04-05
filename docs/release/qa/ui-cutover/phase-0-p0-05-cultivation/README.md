# phase-0-p0-05-cultivation evidence

- Packet: `P0-05`
- Target screen: `cultivation`
- Evidence status (this pass): **MANUAL-PENDING**
- Capture mechanism: manual screenshots only (no approved automated capture pipeline available in this Codex runtime).

## Before reference

- Baseline reference folder: `docs/release/qa/ui-cutover/cultivation/before/`
- Baseline index context: `docs/release/qa/ui-cutover/section-d-baseline-index.md` (`cultivation` row)

## Recommended capture routes (manual)

- Standard route: open app and navigate to Cultivation tab on a normal life state.
- If Section D harness route is available in your local runbook, capture with equivalent High / Low / Reduced presets.

## Required after-state slots

1. `01-after-default.png` — default Cultivation view.
2. `02-after-interaction.png` — one Cultivation-local interaction state (open detail, primary/secondary action hover/focus, or disclosure state).
3. `03-after-truth-state.png` — readiness/breakthrough-visible state (or nearest truthful blocker state).
4. `04-after-high-fx.png` — high FX view if available.
5. `05-after-low-fx.png` — low FX view if available.
6. `06-after-reduced-motion.png` — reduced-motion view if available.

## Manual QA checklist for captures

1. Confirm central cultivator/dantian remains the screen owner.
2. Confirm top key bar is visible by default and Qi bar remains dominant.
3. Confirm readiness/breakthrough truth is visible without hover-only dependency.
4. Confirm no duplicate header/wrapper owner residue appears.
5. Confirm Verse and lotus remain readable (not icon-only ambiguity, not layout competition).
6. Confirm no layout shift between touched interaction states.

## Integrity notes

- Do not fabricate screenshots.
- If a slot cannot be captured, log exact blocker in this README and the packet report.
