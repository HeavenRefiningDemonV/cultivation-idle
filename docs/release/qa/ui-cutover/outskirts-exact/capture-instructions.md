# Outskirts P0 capture instructions

Canonical capture/audit stack is Phase 6 combat preflight.

## Canonical evidence location
- `docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts/`

## Deterministic capture route shape
Use this route model (through audit harness):
- `/?uiAudit=phase-6-combat&surface=outskirts&slot=<slot>&fx=<mode>&controls=0`

Where:
- `slot` is one of: `base`, `interaction`, `truth-states`, `high-fx`, `low-fx`, `reduced-motion`
- `fx` is one of: `high`, `low`, `reduced`

## Required slot files and meanings
- `01-base.png` — idle / non-combat / default open-from-world state
- `02-interaction.png` — active outskirts combat mid-fight, with HP bars and current enemy visible
- `03-truth-states.png` — reward / role / RunCompass / CTA / tracked-bounty / AI-hint truth capture
- `04-high-fx.png` — default Outskirts state in High FX
- `05-low-fx.png` — default Outskirts state in Low FX
- `06-reduced-motion.png` — default Outskirts state in Reduced Motion

## Commands
1. `npm run release:phase6-combat-capture -- --surface=outskirts`
2. `npm run release:phase6-combat-evidence-audit -- --surface=outskirts`
3. `npm run release:phase6-combat-preflight -- --json`

Or using Outskirts P0 wrappers:
1. `npm run release:outskirts-exact-p0:capture`
2. `npm run release:outskirts-exact-p0:audit`
3. `npm run release:outskirts-exact-p0:report`

If capture is blocked (e.g., Playwright missing), do not fake PNGs. Record blocker explicitly.
