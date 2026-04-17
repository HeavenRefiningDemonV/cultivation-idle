# Outskirts exact P0 freeze package

Packet: `P0 — Freeze and evidence capture`

This folder stores the Outskirts-only baseline package that freezes the current live screen before exact-mockup implementation begins.

## Canonical raw capture source
Raw screenshots stay in the existing Phase 6 canonical folder:
- `docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts/`

Required slots:
- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`

## Baseline artifacts in this folder
- `outskirtsExactP0Baseline.md`
- `outskirtsExactP0Baseline.json`
- `outskirtsExactP0CaptureAttempt.json` (written when capture is attempted)

## Regeneration commands
1. `npm run typecheck`
2. `npm run release:outskirts-exact-p0:capture`
3. `npm run release:outskirts-exact-p0:audit`
4. `npm run release:outskirts-exact-p0:report`

If capture fails due environment limitations (e.g., Playwright/Chromium unavailable), do not create fake PNGs; keep status explicit in baseline outputs.
