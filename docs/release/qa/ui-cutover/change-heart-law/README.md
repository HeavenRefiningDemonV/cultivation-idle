# change-heart-law baseline capture

- Surface id: `change-heart-law`
- Family: `ritual modal`
- Harness URL: `/?uiAudit=section-c&surface=change-heart-law&fx=high`
- Capture routes: `/?uiAudit=section-c&surface=change-heart-law&fx=high`, `/?uiAudit=section-c&surface=change-heart-law&fx=low`, `/?uiAudit=section-c&surface=change-heart-law&fx=reduced`
- Reachability: `gated by another state` (opened directly by harness)
- Capture status (this pass): **CAPTURE PENDING — MANUAL**
- Capture mechanism: manual screenshots or `node --experimental-strip-types scripts/release/captureSectionCEvidence.ts --json` (automation requires Playwright).

## Required slots
- `01-base.png` — required.
- `02-interaction.png` — required (option select + confirm enabled/disabled).
- `03-truth-states.png` — required (locked/unlocked/cost warning states).
- `04-high-fx.png` — required.
- `05-low-fx.png` — required.
- `06-reduced-motion.png` — required.
- Optional: `07-narrow.png`.

## Manual capture steps
1. Open harness URL and verify the overlay is visible.
2. Use the harness "Change-law truth state" control to capture current, affordable, unaffordable, locked, and restricted states.
3. Capture base + interaction and ensure `03-truth-states.png` includes the five required truth states.
4. Capture low/reduced FX variants, then resize browser for optional narrow screenshot.


## Missing required files
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`
