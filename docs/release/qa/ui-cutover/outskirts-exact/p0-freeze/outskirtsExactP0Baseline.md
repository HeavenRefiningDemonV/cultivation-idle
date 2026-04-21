# Outskirts Exact Mockup — P0 Freeze Baseline

- Generated at: 2026-04-21T14:01:58.931Z
- Packet: P0
- Objective: Freeze and evidence-capture the current live Outskirts surface so later exact-mockup work can diff against a deterministic baseline.
- Why now: Outskirts replacement work is expected to move from combat-shell composition to exact-mockup composition; this packet freezes current truth before that change starts.

## Developer rule note
- Outskirts implementation is now exact-mockup-driven and may not inherit generalized combat-shell assumptions without explicit approval. The current combat-shell Outskirts screen is evidence-only baseline material until exact replacement is approved.

## Dependencies
- scripts/release/capturePhase6CombatEvidence.ts
- scripts/release/validatePhase6CombatEvidence.ts
- scripts/release/buildPhase6CombatPreflightReport.ts
- src/dev/phase6CombatAudit/Phase6CombatAuditHarness.tsx
- src/dev/phase6CombatAudit/phase6CombatEvidenceManifest.ts
- src/dev/phase6CombatAudit/phase6CombatSurfaceIds.ts
- docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts/README.md

## Exact file touchpoints
- src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx
- src/ui/world/OutskirtsSummaryCard.tsx
- src/ui/world/TrackedBountyProgressLine.tsx
- src/ui/status/RunCompassCompact.tsx
- src/ui/world/combat/CombatModuleTopLane.tsx
- src/ui/world/combat/combatModuleTopLaneModel.ts
- src/components/screens/world/buildings/CombatStyles.scss
- src/components/modals/WorldBuildingModal.tsx
- src/systems/world/moduleCardRegistry.ts
- src/systems/economy/activityRewardReadModel.ts
- src/ui/world/buildOutskirtsInformationHierarchySurface.ts
- src/ui/world/buildOutskirtsActionStripState.ts
- src/ui/world/buildOutskirtsSupportContextSurface.ts
- src/ui/world/buildOutskirtsFxProfile.ts

## Current primary owner files
- src/components/modals/WorldBuildingModal.tsx
- src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx
- src/ui/world/OutskirtsSummaryCard.tsx
- src/ui/world/combat/CombatModuleTopLane.tsx

## Current supporting touchpoints
- src/ui/status/RunCompassCompact.tsx
- src/ui/world/TrackedBountyProgressLine.tsx
- src/ui/world/combat/combatModuleTopLaneModel.ts
- src/systems/world/moduleCardRegistry.ts
- src/systems/economy/activityRewardReadModel.ts
- src/ui/world/buildOutskirtsInformationHierarchySurface.ts
- src/ui/world/buildOutskirtsActionStripState.ts
- src/ui/world/buildOutskirtsSupportContextSurface.ts
- src/ui/world/buildOutskirtsFxProfile.ts

## Current visible truth surfaces
- RunCompassCompact appears in top lane as compact routing truth.
- Outskirts role tag / best-used / boundary lines are shown in OutskirtsSummaryCard and sourced from activityRewardReadModel constants.
- TrackedBountyProgressLine appears when tracked bounty overlaps OUTSKIRTS_KILL or OUTSKIRTS_BOSS_KILL.
- AI posture hint affordance appears via OutskirtsSummaryCard recommendation line and secondary posture line.
- HP bars and active enemy interaction truth are shown via InkHealthBar and enemy name in active fight state.
- CTA semantics are Start/Stop from buildOutskirtsActionStripState primaryActionLabel.
- Support/utility surfaces include route hints, bounty reward summary, combat options controls, and utility tray context blocks.

## Must preserve rules for later packets
- Preserve current Outskirts role, best-used-when, and boundary copy lines exactly.
- Preserve current combat interaction truth surfaces (HP bars, active enemy, combat state affordances).
- Preserve tracked bounty and AI hint affordances as explicit truth surfaces during exact rebuild.
- Preserve canonical evidence slot model and canonical raw screenshot folder.

## No-go rules for later packets
- Do not redesign or refactor current Outskirts visuals in P0.
- Do not change Outskirts reward, readiness, combat, or routing semantics in P0.
- Do not start exact-mockup page implementation or shell convergence packets in P0.
- Do not treat current combat-shell composition as future design authority; it is baseline evidence only.

## Known copy / CTA drift
- World card CTA is "Open Outskirts" while panel primary CTA reads "Start" (plus stateful "Stop").

## Known parity / owner ambiguity
- Current Outskirts screen is composed inside WorldBuildingModal and InkCombatShell-oriented ownership, creating owner ambiguity for later exact scenic ownership.
- Combat options and support context are represented in multiple nearby blocks (top-lane/context/action strip), producing deliberate but duplicated truth surfaces in current baseline.
- Existing phase-6 audit notes route continuity through RunCompass and module routing, but composition ownership remains shell-centric in the current state.

## Known rendered regressions vs approved exact mockup target
- Current rendered Outskirts is combat-shell-driven rather than a full exact scenic 16:9 page composition.
- Current surface does not render a centered area plaque matching the approved exact mockup structure.
- Current layout does not match the approved left setup card / right rewards card / lower encounter-chain arrangement.
- Current summary + utility tray + action strip architecture differs materially from approved exact mockup hierarchy.
- Current scenic ownership is fight-stage/theater-centric instead of field-hunt page-centric.

## Evidence coverage status
- Canonical raw folder: docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts
- Required slots: 01-base.png, 02-interaction.png, 03-truth-states.png, 04-high-fx.png, 05-low-fx.png, 06-reduced-motion.png
- Present slots: (none)
- Missing slots: 01-base.png, 02-interaction.png, 03-truth-states.png, 04-high-fx.png, 05-low-fx.png, 06-reduced-motion.png
- Audit pass: FAIL
- Screenshot capture status: pending
- Screenshots captured in this run: no
- Capture attempted at: 2026-04-21T14:01:14.625Z
- Capture command: npm run release:phase6-combat-capture -- --surface=outskirts --json
- Capture command success: no
- Capture failure reason: [phase6-combat-capture] failed: Playwright is required for release:phase6-combat-capture. Install it with `npm i -D playwright` and run `npx playwright install chromium`.
- Audit findings:
  - [error] required_slot_missing: Missing required evidence file docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts/01-base.png
  - [error] required_slot_missing: Missing required evidence file docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts/02-interaction.png
  - [error] required_slot_missing: Missing required evidence file docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts/03-truth-states.png
  - [error] required_slot_missing: Missing required evidence file docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts/04-high-fx.png
  - [error] required_slot_missing: Missing required evidence file docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts/05-low-fx.png
  - [error] required_slot_missing: Missing required evidence file docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts/06-reduced-motion.png

## Commands to regenerate evidence and baseline
- npm run typecheck
- npm run release:outskirts-exact-p0:capture
- npm run release:outskirts-exact-p0:audit
- npm run release:outskirts-exact-p0:report

