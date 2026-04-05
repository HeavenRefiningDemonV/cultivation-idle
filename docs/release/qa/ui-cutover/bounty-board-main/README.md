# bounty-board-main Wave 0 capture

- Surface id: `bounty-board-main`
- Family: `module activity screen`
- Capture mechanism: `manual live navigation`
- Reachability: `live`
- Screenshot folder path: `docs/release/qa/ui-cutover/bounty-board-main/`

## Required slots
- `01-base.png` — required.
- `02-interaction.png` — required.
- `03-truth-states.png` — required.
- `04-high-fx.png` — required.
- `05-low-fx.png` — required.
- `06-reduced-motion.png` — required.
- `07-narrow.png` — optional.

## Manual capture steps
1. Open an active run and navigate to **World → current city → Bounties**.
2. Capture `01-base.png` with bounty board scene and posted-paper identity visible.
3. Capture `02-interaction.png` for bounty selection/interaction state.
4. Capture `03-truth-states.png` with tracked/available/completed truth states visible.
5. Capture `04-high-fx.png`, `05-low-fx.png`, and `06-reduced-motion.png` with equivalent content.
6. Optionally capture `07-narrow.png` after viewport reduction.

## Preserved-owner reminder
Keep `bountyboard.png` scene ownership and posted-paper identity visible; Wave 0 does not authorize board repaint.

## Likely missing-role candidates
- No shared state underlay/stamp family currently marks tracked/recommended/completed bounty states with reusable semantics.
- No shared plaque/ribbon family currently standardizes heading and priority hierarchy across board entries.

## Wave 0 warning
This folder is for Wave 0 support-art proof only. It grants no cleanup authority and does not allow scenic-owner replacement.
