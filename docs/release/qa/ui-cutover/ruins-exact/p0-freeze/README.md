# Ruins exact P0 freeze package

Packet objective: freeze current live Ruins baseline and lock exact future target artifacts without redesigning live ownership/layout.

## Canonical baseline evidence source (current live truth)
- `docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/`
- Required slots:
  - `01-base.png`
  - `02-interaction.png`
  - `03-truth-states.png`
  - `04-high-fx.png`
  - `05-low-fx.png`
  - `06-reduced-motion.png`

## Target fixture lock artifacts (exact future truth)
- `review-anchor-sheet.md`
- `ruinsExactReviewFixture.json`

## Baseline artifacts in this folder
- `ruinsExactP0Baseline.md`
- `ruinsExactP0Baseline.json`
- `ruinsExactP0CaptureAttempt.json` (only if capture is run)

## Regeneration commands
1. `npm run typecheck`
2. `npm run release:ruins-exact-p0:report -- --json`
3. `npm run release:ruins-exact-p0:report -- --write`
4. `npm run release:ruins-exact-p0:audit -- --json`
5. Optional capture: `npm run release:ruins-exact-p0:capture -- --json`

If capture is blocked by missing Playwright, record the failure and do not fabricate PNGs.
