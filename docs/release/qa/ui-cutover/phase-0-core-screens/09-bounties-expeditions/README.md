# 09-bounties-expeditions evidence status

- Screen: Bounties / Expeditions
- Signoff state: `DEFERRED`
- Evidence status: proof gap (no `01-06` image set present in-repo)
- Existing packet evidence reference: `docs/release/qa/ui-cutover/phase-0-p0-12-bounties-expeditions/README.md`

## Manual capture route
1. Run app in dev.
2. Navigate to World > Bounties/Expeditions board.
3. Capture both Bounties and Expeditions states.

## Fixture/save condition
- Save with at least one tracked/claim-ready bounty and one expedition slot state.

## Required states to capture
- default board owner view
- interaction state (selected route/offer/slot)
- truth state (tracked/claim-ready/recommendation)
- High FX / Low FX / Reduced Motion coherence

## Missing required files
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`
