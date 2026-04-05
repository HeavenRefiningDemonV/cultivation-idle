# 08-forge evidence status

- Screen: Forge
- Signoff state: `DEFERRED`
- Evidence status: proof gap (no `01-06` image set present in-repo)
- Existing packet evidence reference: `docs/release/qa/ui-cutover/phase-0-p0-11-forge/README.md`

## Manual capture route
1. Run app in dev.
2. Navigate to Forge screen.
3. Capture at least one refine/temper/runes state transition.

## Fixture/save condition
- Save with forge workflow and material-routing states available.

## Required states to capture
- default forge owner view
- interaction state (mode or slot selected)
- truth state (missing material/routing/readiness)
- High FX / Low FX / Reduced Motion coherence

## Missing required files
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`
