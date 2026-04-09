# prestige-ritual baseline capture

- Surface id: `prestige-ritual`
- Family: `ritual modal`
- Harness URL: `/?uiAudit=section-c&surface=prestige-ritual&fx=high`
- Capture routes: `/?uiAudit=section-c&surface=prestige-ritual&fx=high`, `/?uiAudit=section-c&surface=prestige-ritual&fx=low`, `/?uiAudit=section-c&surface=prestige-ritual&fx=reduced`
- Reachability: `live`
- Capture status (P3-12B): **FINAL INGEST BLOCKED — REQUIRED PNG EVIDENCE MISSING**
- Capture mechanism: manual capture is the approved baseline. Automation attempt in this environment failed because Playwright/Chromium is not available.

## Screenshot slots
- `01-base.png` — required.
- `02-interaction.png` — required (hold-to-confirm interaction state).
- `03-truth-states.png` — required.
- `04-high-fx.png` — required.
- `05-low-fx.png` — required.
- `06-reduced-motion.png` — required.
- `07-narrow.png` — optional.

## Manual capture steps
1. Open the harness route with `fx=high` and `&controls=0` when cleaner framing is needed.
2. Capture `01-base.png` and `02-interaction.png` for the exact target surface.
3. Capture truth-state slot according to the rules above (required vs explicit N/A).
4. Capture `04-high-fx.png`, then switch to `fx=low` for `05-low-fx.png` and `fx=reduced` for `06-reduced-motion.png`.
5. Optional: capture `07-narrow.png` via manual browser resize.

## Missing required files (audit-truth)
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`

## Evidence debt status
- No required evidence PNG files are currently present in this folder.
- Surface remains additive/deferred until evidence + human reviewer signoff (G1–G8) are complete.
