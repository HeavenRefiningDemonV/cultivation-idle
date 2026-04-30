# Ruins Exact Mockup — P0 Freeze Baseline

- Generated at: 2026-04-30T16:35:41.981Z
- Packet: P0
- Objective: freeze current live Ruins baseline and lock approved exact mockup target before visual/shell packets begin
- Why now: later packets will replace combat-path presentation with full-screen exact Ruins composition, so current truth must be recorded first

## Developer rule note
- Ruins implementation is now exact-mockup-driven and may not inherit generalized combat-shell assumptions without explicit approval. The current combat-shell Ruins screen is evidence-only baseline material until exact replacement is approved.

## Dependencies
- scripts/release/capturePhase6CombatEvidence.ts
- scripts/release/validatePhase6CombatEvidence.ts
- scripts/release/buildPhase6CombatPreflightReport.ts
- src/dev/phase6CombatAudit/Phase6CombatAuditHarness.tsx
- src/dev/phase6CombatAudit/phase6CombatEvidenceManifest.ts
- src/dev/phase6CombatAudit/phase6CombatSurfaceIds.ts
- docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/README.md

## Exact file touchpoints
- src/components/screens/world/buildings/RuinsBuildingPanel.tsx
- src/ui/world/RuinsSummaryCard.tsx
- src/ui/world/TrackedBountyProgressLine.tsx
- src/ui/status/RunCompassCompact.tsx
- src/ui/world/combat/CombatModuleTopLane.tsx
- src/ui/world/combat/combatModuleTopLaneModel.ts
- src/components/screens/world/buildings/CombatStyles.scss
- src/components/modals/WorldBuildingModal.tsx
- src/systems/world/moduleCardRegistry.ts
- src/systems/economy/activityRewardReadModel.ts
- src/ui/world/buildRuinsInformationHierarchySurface.ts
- src/ui/world/buildRuinsActionStripState.ts
- src/ui/world/buildRuinsSupportContextSurface.ts
- src/ui/world/buildRuinsFxProfile.ts

## Current primary owner files
- src/components/modals/WorldBuildingModal.tsx
- src/components/screens/world/buildings/RuinsBuildingPanel.tsx
- src/ui/world/RuinsSummaryCard.tsx
- src/ui/world/combat/CombatModuleTopLane.tsx

## Current supporting touchpoints
- src/ui/status/RunCompassCompact.tsx
- src/ui/world/TrackedBountyProgressLine.tsx
- src/ui/world/combat/combatModuleTopLaneModel.ts
- src/systems/world/moduleCardRegistry.ts
- src/systems/economy/activityRewardReadModel.ts
- src/ui/world/buildRuinsInformationHierarchySurface.ts
- src/ui/world/buildRuinsActionStripState.ts
- src/ui/world/buildRuinsSupportContextSurface.ts
- src/ui/world/buildRuinsFxProfile.ts

## Current visible truth surfaces
- RunCompassCompact appears in top lane as compact routing truth.
- Ruins role tag / best-used / boundary lines are shown in RuinsSummaryCard and sourced from activityRewardReadModel constants.
- TrackedBountyProgressLine appears when tracked bounty overlaps RUINS_CLEAR or RUINS_BOSS.
- AI posture hint affordance appears via RuinsSummaryCard recommendation line and secondary posture line.
- HP bars and active enemy interaction truth are shown via InkHealthBar and enemy name in active fight state.
- CTA semantics are Start/Stop from buildRuinsActionStripState primaryActionLabel.
- Support/utility surfaces include route hints, bounty reward summary, combat options controls, and utility tray context blocks.

## Must preserve rules for later packets
- Preserve current Ruins role, best-used-when, and boundary copy lines exactly.
- Preserve current combat interaction truth surfaces (HP bars, active enemy, combat state affordances).
- Preserve tracked bounty and AI hint affordances as explicit truth surfaces during exact rebuild.
- Preserve canonical evidence slot model and canonical raw screenshot folder.

## No-go rules for later packets
- Do not redesign or refactor current Ruins visuals in P0.
- Do not change Ruins reward, readiness, combat, or routing semantics in P0.
- Do not start exact-mockup page implementation or shell convergence packets in P0.
- Do not treat current combat-shell composition as future design authority; it is baseline evidence only.

## Known copy / CTA drift
- World card CTA is "Open Ruins" while panel primary CTA reads "Start" (plus stateful "Stop").

## Known parity / owner ambiguity
- Current Ruins screen is composed inside WorldBuildingModal and InkCombatShell-oriented ownership, creating owner ambiguity for later exact scenic ownership.
- Combat options and support context are represented in multiple nearby blocks (top-lane/context/action strip), producing deliberate but duplicated truth surfaces in current baseline.
- Existing phase-6 audit notes route continuity through RunCompass and module routing, but composition ownership remains shell-centric in the current state.

## Known rendered regressions vs approved exact mockup target
- Current rendered Ruins is combat-shell-driven rather than a full exact scenic 16:9 page composition.
- Current surface does not render a centered area plaque matching the approved exact mockup structure.
- Current layout does not match the approved left setup card / right rewards card / lower encounter-chain arrangement.
- Current summary + utility tray + action strip architecture differs materially from approved exact mockup hierarchy.
- Current scenic ownership is fight-stage/theater-centric instead of page page-centric.

## Evidence coverage status
- Canonical raw folder: docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins
- Required slots: 01-base.png, 02-interaction.png, 03-truth-states.png, 04-high-fx.png, 05-low-fx.png, 06-reduced-motion.png
- Present slots: (none)
- Missing slots: 01-base.png, 02-interaction.png, 03-truth-states.png, 04-high-fx.png, 05-low-fx.png, 06-reduced-motion.png
- Audit pass: FAIL
- Screenshot capture status: pending
- Screenshots captured in this run: no
- Capture attempted this run: no attempt record found.
- Audit findings:
  - [error] required_slot_missing: Missing required evidence file docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/01-base.png
  - [error] required_slot_missing: Missing required evidence file docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/02-interaction.png
  - [error] required_slot_missing: Missing required evidence file docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/03-truth-states.png
  - [error] required_slot_missing: Missing required evidence file docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/04-high-fx.png
  - [error] required_slot_missing: Missing required evidence file docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/05-low-fx.png
  - [error] required_slot_missing: Missing required evidence file docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins/06-reduced-motion.png

## Commands to regenerate evidence and baseline
- npm run typecheck
- npm run release:ruins-exact-p0:capture
- npm run release:ruins-exact-p0:audit
- npm run release:ruins-exact-p0:report

