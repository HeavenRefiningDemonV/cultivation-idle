# 03-gate-trial preflight evidence

- Screen: Gate Trial
- Signoff state: `DEFERRED (baseline freeze)`
- Evidence status: Required slots declared; capture pending unless PNGs are present.
- Approved capture pipeline: `release:phase6-combat-capture` → `release:phase6-combat-evidence-audit` → `release:phase6-combat-preflight`
- Fixture/save condition: `?uiAudit=phase-6-combat&surface=gate-trial&slot=<slot>&fx=<mode>&controls=0`

## Required states to capture
- `01-base.png` — default available/idle gate state
- `02-interaction.png` — post-failure state with diagnosis/top fixes/fail-safe progress visible
- `03-truth-states.png` — readiness/checklists/fail-safe/CTA truth capture
- `04-high-fx.png` — default Gate Trial state in High FX
- `05-low-fx.png` — default Gate Trial state in Low FX
- `06-reduced-motion.png` — default Gate Trial state in Reduced Motion

## Slot exceptions if any
- None.

## Missing required files
- Determined by `npm run release:phase6-combat-evidence-audit`.

## Must preserve
- Gate readiness card/checklists.
- Fail-safe status and support reserve lines.
- PostFailureDiagnosisPanel integration via GateTrialTopFixes.

## Current owner files
- `src/components/screens/world/buildings/GateTrialBuildingPanel.tsx`
- `src/ui/trials/GateTrialReadinessCard.tsx`
- `src/ui/trials/GateTrialChecklist.tsx`
- `src/ui/trials/GateTrialSafetyNetCard.tsx`
- `src/ui/trials/GateTrialTopFixes.tsx`
- `src/ui/status/PostFailureDiagnosisPanel.tsx`
- `src/components/screens/world/buildings/CombatStyles.scss`

## Visible truth surfaces
- Attempt cluster, readiness, minimum/recommended checklists, fail-safe status, top fixes diagnosis.

## Current parity status
- World card role/best-used copy is not mirrored as a dedicated panel role tag; panel uses readiness+diagnosis lead.

## Detected issues / blockers
- Copy parity drift is documented for handoff normalization; no behavior changes in this packet.

## Next packet dependency notes
- P6.0C should consume this baseline to normalize world-to-panel copy and CTA framing.
- 6.3 should preserve diagnosis + fail-safe visibility as non-negotiable truth.
