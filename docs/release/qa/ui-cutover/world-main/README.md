# world-main baseline/manual reference (non-approval)

- Surface id: `world-main` (adjacent reference root)
- Family: `scenic world screen`
- Capture mechanism: `manual live navigation`
- Reachability: `live`
- Screenshot folder path: `docs/release/qa/ui-cutover/world-main/`

## Required slots
- `01-base.png` — required.
- `02-interaction.png` — required.
- `03-truth-states.png` — required.
- `04-high-fx.png` — required.
- `05-low-fx.png` — required.
- `06-reduced-motion.png` — required.
- `07-narrow.png` — recommended.

## Manual capture steps
1. Open an active run and navigate to **World** with the current city visible.
2. Capture `01-base.png` with city map and citystate overlays clearly visible.
3. Capture `02-interaction.png` for meaningful hover/selection/module-entry interaction.
4. Capture `03-truth-states.png` for world-level readiness or recommendation truth states.
5. Capture `04-high-fx.png`, `05-low-fx.png`, and `06-reduced-motion.png` with equivalent scene framing.
6. Optionally capture `07-narrow.png` after viewport reduction.

## Preserved-owner reminder
Keep `city.png` + citystate overlay ownership visible; Wave 0 does not authorize world scenic replacement.

## Wave 0 warning
This folder is for Wave 0 support-art proof only. It grants no cleanup authority and does not allow world repaint.

## WR-00 recovery note
- This folder is baseline/manual reference only.
- This folder grants **no** cleanup approval authority.
- Preserve-first map + city overlay ownership still applies while recovery is in progress.
- If failure screenshots are referenced here, they are baseline diagnostics only and are not legal cutover evidence.
- Canonical legal approval evidence remains owned by `docs/release/qa/ui-cutover/phase-0-core-screens/04-world/`.
