# phase-0-p0-06-status evidence

- Packet: `P0-06`
- Target screen: `status`
- Evidence status (this pass): **MANUAL-PENDING**
- Capture mechanism: manual screenshots (no approved automated browser/image capture pipeline in this runtime).

## Before reference

- Baseline references:
  - `docs/release/qa/ui-cutover/status/before/`
  - `docs/release/qa/ui-cutover/section-d-baseline-index.md` (`status` row)

## Required after-state slots

1. `01-after-default.png`
2. `02-after-diagnosis-visible.png`
3. `03-after-biggest-shortfall-actionable.png`
4. `04-after-high-fx.png` (if applicable)
5. `05-after-low-fx.png` (if applicable)
6. `06-after-reduced-motion.png` (if applicable)
7. `07-after-interaction.png` (if touched expand/hover/selected states)
8. `08-after-narrow.png` (if touched responsive composition)

## Manual capture checklist

1. Confirm one-pass diagnosis: realm/stage, identity, readiness band, biggest shortfall, best next fix.
2. Confirm Spirit Root emphasis is visible in summary + identity card.
3. Confirm six-card family coverage remains complete and clearly labeled.
4. Confirm full Run Compass actions are visible and actionable.
5. Confirm biggest-shortfall panel exposes actionable top-fix route when available.
6. Confirm no layout shift in touched interaction states.
7. Confirm Low FX / Reduced Motion preserve critical truth readability.

## Integrity notes

- Do not fabricate screenshots.
- If any slot cannot be captured, log exact blocker in this README and packet report.
