# gate-trial-main Wave 0 capture

- Surface id: `gate-trial-main`
- Family: `module activity screen`
- Capture mechanism: `manual live navigation`
- Reachability: `live`
- Screenshot folder path: `docs/release/qa/ui-cutover/gate-trial-main/`

## Required slots
- `01-base.png` — required.
- `02-interaction.png` — required.
- `03-truth-states.png` — required.
- `04-high-fx.png` — required.
- `05-low-fx.png` — required.
- `06-reduced-motion.png` — required.
- `07-narrow.png` — recommended.

## Manual capture steps
1. Open an active run and navigate to **World → current city → Gate Trial**.
2. Capture `01-base.png` with current gate/trial shell visible.
3. Capture `02-interaction.png` for actionable interaction state.
4. Capture `03-truth-states.png` with readiness/fail-safe truth states visible.
5. Capture `04-high-fx.png`, `05-low-fx.png`, and `06-reduced-motion.png` with equivalent panel content.
6. Optionally capture `07-narrow.png` after viewport reduction.

## Preserved-owner reminder
Keep current gate/trial shell and readiness/fail-safe truth surfaces visible; Wave 0 does not authorize shell replacement.

## Likely missing-role candidates
- No shared state underlay/stamp family currently marks readiness/lock/fail-safe states with reusable semantics.
- No shared titleplate/plaque family currently standardizes trial heading hierarchy across module surfaces.

## Wave 0 warning
This folder is for Wave 0 support-art proof only. It grants no cleanup authority and does not allow destructive replacement.
