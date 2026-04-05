# 02-cultivation evidence status

- Screen: Cultivation
- Signoff state: `DEFERRED`
- Evidence status: proof gap (no `01-06` image set present in-repo)
- Existing packet evidence reference: `docs/release/qa/ui-cutover/phase-0-p0-05-cultivation/README.md`

## Manual capture route
1. Run app in dev.
2. Navigate to Cultivation tab from main shell.
3. Capture High/Low/Reduced mode variants through in-app quality toggles.

## Fixture/save condition
- Live save with cultivation available and readiness states reachable.

## Required states to capture
- default center owner view (cultivator+dantian+lotus)
- interaction state (selected/hovered actionable control)
- truth state (readiness/recommended/warning)
- High FX / Low FX / Reduced Motion coherence

## Missing required files
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`
