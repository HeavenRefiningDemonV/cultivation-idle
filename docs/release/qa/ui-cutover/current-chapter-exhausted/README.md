# current-chapter-exhausted baseline capture

- Surface id: `current-chapter-exhausted`
- Family: `ritual modal`
- Harness URL: `/?uiAudit=section-c&surface=current-chapter-exhausted&fx=high`
- Capture routes: `/?uiAudit=section-c&surface=current-chapter-exhausted&fx=high`, `/?uiAudit=section-c&surface=current-chapter-exhausted&fx=low`, `/?uiAudit=section-c&surface=current-chapter-exhausted&fx=reduced`
- Reachability: `state-gated (harnessed)`
- Capture status (P3-12B): **FINAL INGEST BLOCKED — REQUIRED PNG EVIDENCE MISSING**
- Capture mechanism: manual capture is the approved baseline. Automation attempt in this environment failed because Playwright/Chromium is not available.
- Scope note: Truth-state slot is intentionally N/A for this surface.

## Screenshot slots
- `01-base.png` — required.
- `02-interaction.png` — required (three action buttons).
- `03-truth-states.png` — **N/A**.
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
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`

## Evidence debt status
- No required evidence PNG files are currently present in this folder.
- Surface remains additive/deferred until evidence + human reviewer signoff (G1–G8) are complete.
