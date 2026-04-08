# current-chapter-exhausted baseline capture

- Surface id: `current-chapter-exhausted`
- Family: `ritual modal`
- Harness URL: `/?uiAudit=section-c&surface=current-chapter-exhausted&fx=high`
- Capture routes: `/?uiAudit=section-c&surface=current-chapter-exhausted&fx=high`, `/?uiAudit=section-c&surface=current-chapter-exhausted&fx=low`, `/?uiAudit=section-c&surface=current-chapter-exhausted&fx=reduced`
- Reachability: `gated by another state` (opened by harness)
- Capture status (this pass): **CAPTURE PENDING — MANUAL**
- Capture mechanism: manual screenshots or `node --experimental-strip-types scripts/release/captureSectionCEvidence.ts --json` (automation requires Playwright).

## Required slots
- `01-base.png` — required.
- `02-interaction.png` — required (three action buttons).
- `03-truth-states.png` — **N/A** (no separate ready/warning/recommended state family).
- `04-high-fx.png` — required.
- `05-low-fx.png` — required.
- `06-reduced-motion.png` — required.
- Optional: `07-narrow.png`.

## Manual capture steps
1. Open harness URL and verify modal opens cleanly.
2. Capture base and interaction states.
3. Capture low/reduced FX variants.
4. Resize browser for optional narrow screenshot.


## Missing required files
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png` — **N/A** for this surface
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`
