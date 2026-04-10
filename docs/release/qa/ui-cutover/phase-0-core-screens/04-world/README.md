# 04-world evidence status

- Screen: World
- Signoff state: `DEFERRED`
- Evidence status: proof gap (no complete legal `01-06` image set committed yet)
- Existing packet evidence reference: `docs/release/qa/ui-cutover/phase-0-p0-07-world/README.md`
- Latest acceptance review packet: `P5-11` (Phase 5 World screenshot QA, cutover review, and acceptance hardening)
- Latest review date: `2026-04-10`

## Approved capture pipeline
1. Run `npm run release:phase0-core-capture:world` (or all-surfaces `npm run release:phase0-core-capture`).
2. The harness route for this surface is `/?uiAudit=phase-0&surface=world&fx=<high|low|reduced>&slot=<slot>`.
3. Files are written into this folder using legal filenames (`01-base.png` through `06-reduced-motion.png`).
4. Run `npm run release:phase0-core-evidence-audit:world` (or all-surfaces `npm run release:phase0-core-evidence-audit`) to verify slot completeness.

## Fixture/save condition
- Harness-driven Phase 0 core audit state (`uiAudit=phase-0`) with deterministic slot routing.

## Required states to capture
- default owner view (`01-base.png`)
- interaction state (`02-interaction.png`)
- truth state (`03-truth-states.png`)
- High FX / Low FX / Reduced Motion (`04`/`05`/`06`)

## Missing required files
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`

## P5-11 acceptance audit status (2026-04-10)
- Cutover gate remains blocked at `G1` because the canonical screenshot set is still missing.
- Evidence capture was attempted via `npm run release:phase0-core-capture:world`, but capture is blocked in this environment because Playwright is not installed/configured.
- World remains preserve-first/additive; no destructive cleanup is authorized.
