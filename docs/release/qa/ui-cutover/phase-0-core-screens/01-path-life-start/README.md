# 01-path-life-start evidence status

- Screen: Path / Life Start
- Signoff state: `DEFERRED`
- Evidence status: proof gap (no complete legal `01-06` image set committed yet)
- Existing packet evidence reference: `docs/release/qa/ui-cutover/phase-0-p0-04-path-life-start/README.md`

## Approved capture pipeline
1. Run `npm run release:phase0-core-capture`.
2. The harness route for this surface is `/?uiAudit=phase-0&surface=path-life-start&fx=<high|low|reduced>&slot=<slot>`.
3. Files are written into this folder using legal filenames (`01-base.png` through `06-reduced-motion.png`).
4. Run `npm run release:phase0-core-evidence-audit` to verify slot completeness.

## Fixture/save condition
- Harness-driven Phase 0 core audit state (`uiAudit=phase-0`) with deterministic slot routing.

## Required states to capture
- default owner view (`01-base.png`)
- interaction state (`02-interaction.png`)
- truth state (`03-truth-states.png`) — optional for this screen
- High FX / Low FX / Reduced Motion (`04`/`05`/`06`)

## Slot exceptions
- `03-truth-states.png` — **N/A** when the selected-path interaction already communicates the full state truth for this surface.

## Missing required files
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png` (**N/A only with explicit reason in this README and signoff sheet**)
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`
