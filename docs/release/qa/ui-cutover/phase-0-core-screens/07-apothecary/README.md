# 07-apothecary evidence status

- Screen: Apothecary
- Signoff state: `DEFERRED`
- Evidence status: proof gap (no `01-06` image set present in-repo)
- Existing packet evidence reference: `docs/release/qa/ui-cutover/phase-0-p0-10-apothecary/README.md`

## Manual capture route
1. Run app in dev.
2. Navigate to Apothecary screen.
3. Open at least one readiness-warning and one package/action state.

## Fixture/save condition
- Save with visible recipe/package states and pouch summary access.

## Required states to capture
- default room owner view
- interaction state (selected route/package)
- truth state (warning/recommended/readiness)
- High FX / Low FX / Reduced Motion coherence

## Missing required files
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`
