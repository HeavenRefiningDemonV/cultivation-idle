# Outskirts Exact Mockup — P10 Approval Checklist

> Supersession note (2026-04-22): P10 is historical checklist context only. Current acceptance authority has moved to `docs/release/qa/ui-cutover/outskirts-exact/p14-acceptance/README.md`.

Status: **pending screenshot gate review in this environment** (browser capture tool unavailable in this run).

## Required captures

1. `01-default-idle.png` — default planning state
2. `02-focus-state.png` — one interaction state (focus/hover)
3. `03-tracked-bounty-present.png` — tracked bounty present
4. `04-boss-ready.png` — boss-ready state
5. `05-low-fx.png` — low FX composition
6. `06-reduced-motion.png` — reduced motion composition
7. `07-narrow-width.png` — narrow modal width (if supported)

## Human review checklist

- Planning state reads as exact Outskirts mockup, not old combat shell.
- Top rhythm (title → macro line → tactical strip → plaque → subtitle) is stable.
- Scenic stage remains dominant.
- Left/right cards are present, tall, and subordinate to the scenic center.
- Encounter strip remains centered and readable.
- One dominant Start Hunt CTA remains centered under strip.
- Grind Summary remains lower-right and subordinate.
- No planning-state bleed of RunCompass, top lane, utility tray, combat log, or HP bars.
- No layout shift between bounty present/absent and boss-ready/not-ready states.
- High/Low FX and Reduced Motion preserve composition.

## Notes

- This packet updates tests and layout hardening for the checklist states.
- Capture slot naming is intentionally deterministic for review parity.
