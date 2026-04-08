# life-summary baseline capture

- Surface id: `life-summary`
- Family: `ritual modal`
- Harness URL: `/?uiAudit=section-c&surface=life-summary&fx=high`
- Capture routes: `/?uiAudit=section-c&surface=life-summary&fx=high`, `/?uiAudit=section-c&surface=life-summary&fx=low`, `/?uiAudit=section-c&surface=life-summary&fx=reduced`
- Reachability: `gated by another state` (harness uses `current` mode baseline)
- Capture status (this pass): **CAPTURE PENDING — MANUAL**
- Capture mechanism: manual screenshots or `node --experimental-strip-types scripts/release/captureSectionCEvidence.ts --json` (automation requires Playwright).

## Required slots
- `01-base.png` — required.
- `02-interaction.png` — required (footer actions and scroll interactions if present).
- `03-truth-states.png` — required (advisor/AP/meta + summary blocks).
- `04-high-fx.png` — required.
- `05-low-fx.png` — required.
- `06-reduced-motion.png` — required.
- Optional: `07-narrow.png`.

## Manual capture steps
1. Open harness URL and confirm `current` mode surface.
2. Capture base, interaction, and truth-state slots.
3. Capture low/reduced FX variants.
4. Resize browser for optional narrow screenshot.

## Scope note
- `last_completed` is intentionally out-of-scope for this C.0 baseline family.


## Missing required files
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`
