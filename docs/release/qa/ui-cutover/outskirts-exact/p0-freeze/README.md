# Outskirts exact P0 freeze package

Packet objective: freeze current live baseline and lock exact target review fixture without redesigning live ownership/layout.

## Canonical baseline evidence source (current live truth)
- `docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts/`
- Required slots:
  - `01-base.png`
  - `02-interaction.png`
  - `03-truth-states.png`
  - `04-high-fx.png`
  - `05-low-fx.png`
  - `06-reduced-motion.png`

## Target fixture lock artifacts (exact future truth)
- `review-anchor-sheet.md`
- `outskirtsExactReviewFixture.json`

## Baseline artifacts in this folder
- `outskirtsExactP0Baseline.md`
- `outskirtsExactP0Baseline.json`
- `outskirtsExactP0CaptureAttempt.json` (capture attempt record, including honest failure)

## Regeneration commands
1. `npm run typecheck`
2. `npm run release:outskirts-exact-p0:report`
3. `npm run release:outskirts-exact-p0:audit`
4. `npm run release:outskirts-exact-p0:capture`

If capture is blocked, keep explicit failure status and do not fabricate PNGs.
