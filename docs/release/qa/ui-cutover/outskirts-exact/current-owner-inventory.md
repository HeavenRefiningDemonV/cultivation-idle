# Outskirts current-owner inventory (P0 freeze)

This inventory captures current live ownership/truth surfaces prior to exact visual replacement.

## Primary visible owners
- `src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx`
- `src/components/modals/WorldBuildingModal.tsx`
- `src/components/screens/world/buildings/CombatStyles.scss`

## Supporting visible truth surfaces
- `src/ui/world/OutskirtsSummaryCard.tsx`
- `src/ui/world/TrackedBountyProgressLine.tsx`
- `src/ui/status/RunCompassCompact.tsx`
- `src/ui/world/combat/CombatModuleTopLane.tsx`
- `src/ui/world/combat/combatModuleTopLaneModel.ts`

## Current truth surface checklist
- Title/role/best-used/boundary truth through Outskirts summary surfaces.
- RunCompassCompact placement in the current support lane.
- Tracked bounty line when OUTSKIRTS kill kinds are active.
- AI posture hint line when posture fit emits warnings/recommendations.
- Primary CTA semantics: Start/Stop (stateful).
- Combat truth surfaces: HP bars, active enemy state, combat log excerpt.
