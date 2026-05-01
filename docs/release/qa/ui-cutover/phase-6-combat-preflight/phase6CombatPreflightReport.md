# Phase 6 Combat Preflight Report

- Generated at: 2026-05-01T22:35:21.490Z
- Packet objective: Freeze pre-redesign combat-trio truth (Outskirts/Ruins/Gate Trial) with deterministic screenshots and parity/conflict audit artifacts.
- Why now: Phase 6 visual packets depend on a preserve-first baseline that prevents role/copy/routing drift from being masked by shell work.

## Dependencies
- phase0CoreAudit capture + validation pipeline patterns
- sectionCAudit harness lifecycle patterns
- existing world module routing + world building modal ownership

## File touchpoints
- src/dev/phase6CombatAudit/*
- scripts/release/capturePhase6CombatEvidence.ts
- scripts/release/validatePhase6CombatEvidence.ts
- scripts/release/buildPhase6CombatPreflightReport.ts
- docs/release/qa/ui-cutover/phase-6-combat-preflight/*
- src/components/GameLayout.tsx

## Preserve / enhance / defer summary
### Preserve
- Current player-facing owners and panel truth blocks (Ruins now exact screen-owned)
- World shell routing into Outskirts, Ruins, and Gate Trial
- Current CTA/action semantics and readiness logic
### Enhance
- Deterministic screenshot harness coverage and evidence validation
- Audit-level parity/conflict reporting for world-to-panel copy and ownership
### Defer
- P6.0B shared combat-shell convergence
- P6.0C world-to-combat handoff normalization
- 6.1/6.2/6.3 per-surface visual refinement

## No-go list
- No redesign/restyle of combat trio surfaces
- No reward/balance/readiness rule mutation
- No world module ordering changes
- No shell refactor crossing packet scope

## Summary of detected parity conflicts
- [copy_parity_drift] gate-trial: World card role-tag/best-used copy does not appear as a stable role block inside panel. (Panel prioritizes readiness, checklists, fail-safe, and diagnosis truth clusters instead of repeating world card role tagline.)
- [duplicate_truth_surface] outskirts: Combat options appear in multiple places (shell controls and summary/context). (Audit-only note for future shell convergence packet; preserve current redundancy for now.)
- [routing_ambiguity] gate-trial: Top-fix action handlers can route to different systems without explicit route map in panel copy. (Routing remains functional but implicit; document before handoff normalization packet.)
- [screenshot_gap] outskirts: Missing required screenshot slot 01-base.png. (Capture slot 01-base.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts.)
- [screenshot_gap] outskirts: Missing required screenshot slot 02-interaction.png. (Capture slot 02-interaction.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts.)
- [screenshot_gap] outskirts: Missing required screenshot slot 03-truth-states.png. (Capture slot 03-truth-states.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts.)
- [screenshot_gap] outskirts: Missing required screenshot slot 04-high-fx.png. (Capture slot 04-high-fx.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts.)
- [screenshot_gap] outskirts: Missing required screenshot slot 05-low-fx.png. (Capture slot 05-low-fx.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts.)
- [screenshot_gap] outskirts: Missing required screenshot slot 06-reduced-motion.png. (Capture slot 06-reduced-motion.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/01-outskirts.)
- [screenshot_gap] ruins: Missing required screenshot slot 01-base.png. (Capture slot 01-base.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins.)
- [screenshot_gap] ruins: Missing required screenshot slot 02-interaction.png. (Capture slot 02-interaction.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins.)
- [screenshot_gap] ruins: Missing required screenshot slot 03-truth-states.png. (Capture slot 03-truth-states.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins.)
- [screenshot_gap] ruins: Missing required screenshot slot 04-high-fx.png. (Capture slot 04-high-fx.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins.)
- [screenshot_gap] ruins: Missing required screenshot slot 05-low-fx.png. (Capture slot 05-low-fx.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins.)
- [screenshot_gap] ruins: Missing required screenshot slot 06-reduced-motion.png. (Capture slot 06-reduced-motion.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/02-ruins.)
- [screenshot_gap] gate-trial: Missing required screenshot slot 01-base.png. (Capture slot 01-base.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/03-gate-trial.)
- [screenshot_gap] gate-trial: Missing required screenshot slot 02-interaction.png. (Capture slot 02-interaction.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/03-gate-trial.)
- [screenshot_gap] gate-trial: Missing required screenshot slot 03-truth-states.png. (Capture slot 03-truth-states.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/03-gate-trial.)
- [screenshot_gap] gate-trial: Missing required screenshot slot 04-high-fx.png. (Capture slot 04-high-fx.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/03-gate-trial.)
- [screenshot_gap] gate-trial: Missing required screenshot slot 05-low-fx.png. (Capture slot 05-low-fx.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/03-gate-trial.)
- [screenshot_gap] gate-trial: Missing required screenshot slot 06-reduced-motion.png. (Capture slot 06-reduced-motion.png is missing in docs/release/qa/ui-cutover/phase-6-combat-preflight/03-gate-trial.)

## Summary of screenshot coverage
- outskirts: 0/6 present
  - Missing: 01-base.png, 02-interaction.png, 03-truth-states.png, 04-high-fx.png, 05-low-fx.png, 06-reduced-motion.png
- ruins: 0/6 present
  - Missing: 01-base.png, 02-interaction.png, 03-truth-states.png, 04-high-fx.png, 05-low-fx.png, 06-reduced-motion.png
- gate-trial: 0/6 present
  - Missing: 01-base.png, 02-interaction.png, 03-truth-states.png, 04-high-fx.png, 05-low-fx.png, 06-reduced-motion.png

## World-to-panel copy parity table
| Surface | World roleTag | World bestUsedWhen | Panel role/lead | Boundary | World CTA | Panel CTA | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| outskirts | Gold & Common Mats | Best used when you need gold, common materials, or low-risk combat reps. | Gold & Common Mats | Not the best source for targeted city materials. | Open Outskirts | Start | aligned |
| ruins | Targeted Mats | Best used when you need targeted local materials and deterministic support rewards. | Targeted Mats | Gold is secondary here; the run is for targeted local materials and support stability. | Open Ruins | Start | aligned |
| gate-trial | Gate Progress | Best used when you are ready to resolve the current gate trial. | Gate state + readiness detail (no explicit role tag) | — | Open Gate Trial | Challenge Trial / Break Through (state-driven) | drift |

## Owner-file matrix
### outskirts
- moduleCardRegistry.ts
- OutskirtsBuildingPanel.tsx
- OutskirtsSummaryCard.tsx
- TrackedBountyProgressLine.tsx
### ruins
- moduleCardRegistry.ts
- RuinsBuildingPanel.tsx
- RuinsScreenOwner.tsx
- RuinsExactMockupScreen.ts
- buildRuinsExactSurface.ts
### gate-trial
- moduleCardRegistry.ts
- GateTrialBuildingPanel.tsx
- GateTrialReadinessCard.tsx
- GateTrialTopFixes.tsx

## Recommended next packets
- P6.0B shared combat-shell convergence
- P6.0C World-to-combat handoff normalization
- 6.1 Outskirts
- 6.2 Ruins
- 6.3 Gate Trial

