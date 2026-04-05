# expedition-board-main Wave 0 capture

- Surface id: `expedition-board-main`
- Family: `module activity screen`
- Capture mechanism: `manual live navigation`
- Reachability: `live`
- Screenshot folder path: `docs/release/qa/ui-cutover/expedition-board-main/`

## Required slots
- `01-base.png` — required.
- `02-interaction.png` — required.
- `03-truth-states.png` — required.
- `04-high-fx.png` — required.
- `05-low-fx.png` — required.
- `06-reduced-motion.png` — required.
- `07-narrow.png` — optional.

## Manual capture steps
1. Open an active run and navigate to **World → current city → Expeditions**.
2. Capture `01-base.png` with route-paper/board shell and hourglass family visible.
3. Capture `02-interaction.png` for route selection or queue interaction.
4. Capture `03-truth-states.png` with route readiness/progress truth states visible.
5. Capture `04-high-fx.png`, `05-low-fx.png`, and `06-reduced-motion.png` with equivalent composition.
6. Optionally capture `07-narrow.png` after viewport reduction.

## Preserved-owner reminder
Keep route-paper/board shell and hourglass (`hourglass_empty.png`, `hourglass_progress.png`) ownership visible; Wave 0 does not authorize shell replacement.

## Likely missing-role candidates
- No shared route-plaque family currently supports route hierarchy and timing truth without row-local one-off treatment.
- No shared state stamp family currently expresses queued/in-progress/ready semantics with reusable markers.

## Wave 0 warning
This folder is for Wave 0 support-art proof only. It grants no cleanup authority and does not allow board/semantic-owner replacement.
