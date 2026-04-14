# 02-ruins preflight evidence

- Screen: Ruins
- Signoff state: `DEFERRED (baseline freeze)`
- Evidence status: Required slots declared; capture pending unless PNGs are present.
- Approved capture pipeline: `release:phase6-combat-capture` → `release:phase6-combat-evidence-audit` → `release:phase6-combat-preflight`
- Fixture/save condition: `?uiAudit=phase-6-combat&surface=ruins&slot=<slot>&fx=<mode>&controls=0`

## Required states to capture
- `01-base.png` — idle / default open-from-world state
- `02-interaction.png` — active/in-progress ruins run state
- `03-truth-states.png` — room count / guaranteed anchor / lead materials / pity / auto-repeat truth capture
- `04-high-fx.png` — default Ruins state in High FX
- `05-low-fx.png` — default Ruins state in Low FX
- `06-reduced-motion.png` — default Ruins state in Reduced Motion

## Slot exceptions if any
- None.

## Missing required files
- Determined by `npm run release:phase6-combat-evidence-audit`.

## Must preserve
- Lead-material + deterministic-anchor + pity truth lines.
- In-progress room/track visibility and auto-repeat state.
- Gold-secondary boundary statement.

## Current owner files
- `src/components/screens/world/buildings/RuinsBuildingPanel.tsx`
- `src/ui/world/RuinsSummaryCard.tsx`
- `src/features/ruins/ui/RuinsProgress.tsx`
- `src/ui/world/TrackedBountyProgressLine.tsx`
- `src/ui/status/RunCompassCompact.tsx`
- `src/components/screens/world/buildings/CombatStyles.scss`

## Visible truth surfaces
- RunCompassCompact, RuinsSummaryCard, room/pity run progress, tracked bounty line.

## Current parity status
- World role and best-used lines align with panel summary; CTA naming differs (`Open Ruins` vs `Start`).

## Detected issues / blockers
- No blocker beyond missing screenshot files until capture executes.

## Next packet dependency notes
- P6.0B/P6.0C should keep deterministic anchor + pity evidence visible across shell adjustments.
- 6.2 should consume this artifact as baseline guardrail.
