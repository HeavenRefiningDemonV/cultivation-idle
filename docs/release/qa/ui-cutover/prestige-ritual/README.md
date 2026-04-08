# prestige-ritual baseline capture

- Surface id: `prestige-ritual`
- Family: `ritual modal`
- Harness URL: `/?uiAudit=section-c&surface=prestige-ritual&fx=high`
- Capture routes: `/?uiAudit=section-c&surface=prestige-ritual&fx=high`, `/?uiAudit=section-c&surface=prestige-ritual&fx=low`, `/?uiAudit=section-c&surface=prestige-ritual&fx=reduced`
- Reachability: `live`
- Capture status (this pass): **CAPTURE PENDING — MANUAL**
- Capture mechanism: manual screenshots or `node --experimental-strip-types scripts/release/captureSectionCEvidence.ts --json` (automation requires Playwright).

## Required slots
- `01-base.png` — required.
- `02-interaction.png` — required (hold-to-confirm interaction state).
- `03-truth-states.png` — required (advisor/AP breakdown/reset buckets visible).
- `04-high-fx.png` — required.
- `05-low-fx.png` — required.
- `06-reduced-motion.png` — required.
- Optional: `07-narrow.png`.

## Manual capture steps
1. Open harness URL and confirm ritual modal state.
2. Capture base, interaction, and truth-state slots.
3. Capture low/reduced FX variants.
4. Resize browser for optional narrow image.


## Missing required files
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`
