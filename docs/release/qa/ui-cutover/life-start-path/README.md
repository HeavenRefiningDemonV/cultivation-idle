# life-start-path baseline capture

- Surface id: `life-start-path`
- Family: `hero ritual screen`
- Harness URL: `/?uiAudit=section-c&surface=life-start-path&fx=high`
- Reachability: `live`
- Capture status (this pass): **CAPTURE PENDING — MANUAL**

## Required slots
- `01-base.png` — required.
- `02-interaction.png` — required (hover/selected path panels).
- `03-truth-states.png` — **N/A** (no ready/warning/recommended state family on this screen).
- `04-high-fx.png` — required.
- `05-low-fx.png` — required.
- `06-reduced-motion.png` — required.
- Optional: `07-narrow.png` (manual browser resize).

## Manual capture steps
1. Open harness URL with `fx=high` and hide controls (`&controls=0`) if needed.
2. Capture base and interaction states.
3. Switch to `fx=low`, capture `05-low-fx.png`.
4. Switch to `fx=reduced`, capture `06-reduced-motion.png`.
5. Resize browser for optional `07-narrow.png`.
