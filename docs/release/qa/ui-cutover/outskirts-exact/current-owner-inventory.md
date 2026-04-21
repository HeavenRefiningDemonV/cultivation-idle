# Outskirts current owner inventory (baseline truth only)

This file inventories **current live ownership** and does not define the exact target fixture.

## Live owner path (preserved in P0)
- `World -> WorldBuildingModal -> OutskirtsBuildingPanel`
- Current live Outskirts remains inside the combat-path shell family and boxed modal host.

## Primary live owner files
- `src/components/modals/WorldBuildingModal.tsx`
- `src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx`
- `src/systems/ui/world/worldBuildingModalEntrySurface.ts`

## Context-only supporting surfaces
- `src/components/screens/world/buildings/CombatStyles.scss`
- `src/ui/world/OutskirtsSummaryCard.tsx`
- `src/ui/world/TrackedBountyProgressLine.tsx`
- `src/ui/status/RunCompassCompact.tsx`
- `src/ui/world/combat/CombatModuleTopLane.tsx`

## P0 guardrail
- This baseline owner inventory is frozen for evidence/diffing.
- Exact review fixture values are defined separately in `p0-freeze/review-anchor-sheet.md` and `p0-freeze/outskirtsExactReviewFixture.json`.
