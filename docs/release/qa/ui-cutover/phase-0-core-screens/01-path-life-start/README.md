# 01-path-life-start evidence status

- Screen: Path / Life Start
- Signoff state: `DEFERRED`
- Evidence status: proof gap (no `01-06` image set present in-repo)
- Existing packet evidence reference: `docs/release/qa/ui-cutover/phase-0-p0-04-path-life-start/README.md`

## Manual capture route
1. Run app in dev.
2. Open `/?uiAudit=section-c&surface=life-start-path&fx=high`.
3. Repeat with `fx=low` and `fx=reduced`.

## Fixture/save condition
- Fresh start flow with Life Start modal visible at Path step.
- No cleanup edits; additive state only.

## Required states to capture
- default path owner view (triptych + plaque)
- hovered/selected path state (no layout shift)
- truth-state slot: `N/A` (document reason in signoff)
- High FX / Low FX / Reduced Motion coherence

## Missing required files
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png` (N/A allowed with reason)
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`
