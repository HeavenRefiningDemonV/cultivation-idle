# 01-outskirts preflight evidence

- Screen: Outskirts
- Signoff state: `DEFERRED (baseline freeze)`
- Evidence status: Required slots declared; capture pending unless PNGs are present.
- Approved capture pipeline: `release:phase6-combat-capture` → `release:phase6-combat-evidence-audit` → `release:phase6-combat-preflight`
- Fixture/save condition: `?uiAudit=phase-6-combat&surface=outskirts&slot=<slot>&fx=<mode>&controls=0`

## Required states to capture
- `01-base.png` — idle / non-combat / default open-from-world state
- `02-interaction.png` — active outskirts combat mid-fight, with HP bars and current enemy visible
- `03-truth-states.png` — reward/role/RunCompass/CTA/tracked-bounty/AI-hint truth capture
- `04-high-fx.png` — default Outskirts state in High FX
- `05-low-fx.png` — default Outskirts state in Low FX
- `06-reduced-motion.png` — default Outskirts state in Reduced Motion

## Slot exceptions if any
- None.

## Missing required files
- Determined by `npm run release:phase6-combat-evidence-audit`.

## Must preserve
- OutskirtsSummaryCard role/best-used/boundary truth.
- HP bars + active enemy combat truth.
- Tracked bounty line and AI posture hint affordances.

## Current owner files
- `src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx`
- `src/ui/world/OutskirtsSummaryCard.tsx`
- `src/ui/world/TrackedBountyProgressLine.tsx`
- `src/ui/status/RunCompassCompact.tsx`
- `src/components/screens/world/buildings/CombatStyles.scss`

## Visible truth surfaces
- RunCompassCompact, OutskirtsSummaryCard, tracked bounty line, AI/posture hint, combat bars/log excerpt.

## Current parity status
- World and panel role/best-used copy align; CTA wording differs (`Open Outskirts` vs `Start`).

## Detected issues / blockers
- CTA naming drift is documented for future handoff packet; not changed here.

## Next packet dependency notes
- P6.0B should preserve Outskirts truth block while converging shell chrome.
- 6.1 can consume this baseline for visual revision without copy/routing drift.
