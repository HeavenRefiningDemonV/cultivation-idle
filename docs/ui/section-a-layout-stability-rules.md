# Section A.9 — Layout Stability Rules

## Purpose

This file locks the Section A layout-stability doctrine for all future UI packets. It converts the global law from A.1, the family/layer model from A.5, and the cutover gate from A.6 into explicit screen-review rules that can be applied during implementation and release audits.

This file is doctrine and review law. It is not an implementation guide.

## Inheritance and authority

This doctrine inherits and operationalizes:

- A.1 global doctrine and source hierarchy (`docs/ui/section-a-global-doctrine.md`);
- A.5 family/layer ownership (`docs/ui/section-a-four-layer-model.md`, `docs/ui/section-a-screen-family-matrix.md`);
- A.6 cutover legality (`docs/ui/section-a-cutover-gate.md`);
- A.8 packet schema field requirements (`docs/codex/UI_PACKET_SCHEMA.md`).

When wording conflicts occur, A.1/A.5/A.6 remain higher-level authority and this file provides exact stability interpretation.

## Scope

This file governs:

- interaction-state geometry stability;
- reserved state space requirements;
- allowed vs forbidden emphasis behavior;
- family-sensitive layout-stability expectations;
- packet declaration and reviewer rejection rules.

This file does **not** govern:

- renderer/package decisions;
- gameplay tuning;
- art production pipeline;
- animation flavor beyond geometry legality;
- per-screen visual style targets.

## Canonical definitions

- **Layout shift** — any user-visible movement or reflow caused by interaction or state change that alters neighboring geometry unexpectedly.
- **Geometry change** — mutation of element size, box metrics, or flow contribution (including width, height, padding, border thickness, margin, min/max dimensions).
- **Reserved state space** — pre-allocated space for all state indicators and labels that may appear while the surface is active.
- **Stable emphasis** — state emphasis that changes color, ink value, glow, outline color, shadow, icon fill, or opacity without changing geometry.
- **State-bearing surface** — any control/card/row/tab/chip/header/module block that communicates readiness, warning, selected, recommended, active, or disabled meaning.

## Global law: no geometry mutation for state signals

All state-bearing surfaces must keep identical box geometry across hover/focus/active/selected/recommended/warning/ready/disabled states unless a deliberate expand-collapse interaction is explicitly defined.

Legal state feedback:

- color/ink shifts;
- alpha/opacity shifts;
- non-layout shadows and glows;
- interior icon swap with fixed footprint;
- text/value replacement inside pre-reserved bounds.

Illegal state feedback:

- border thickness growth on hover or selected;
- padding inflation to “feel pressable”;
- width or height growth on focus/ready;
- baseline shifts from weight changes without reserved space;
- badge insertion that pushes sibling content.

## Reserved state space requirements

Any truth-bearing badge, tag, chip, warning marker, or readiness label must reserve space before the state appears.

Required practices:

1. Reserve the max-width slot for mutually exclusive labels.
2. Keep row and card baseline alignment constant when state text changes.
3. Pre-allocate icon-bearing button footprints for all icon variants.
4. Keep tab, segment, and module-header heights fixed across active/inactive states.
5. Keep list/grid item tracks stable when warning/recommended marks toggle.

Reviewer rejection rule: if a newly appearing state indicator moves neighboring controls or changes parent size, the implementation is rejected.

## Expand/collapse and disclosure boundaries

Expand/collapse behavior is legal only when the structural change is explicit, user-intentful, and bounded.

Required conditions:

- collapsed and expanded regions are clearly designated;
- trigger intent is explicit (no hover-only expansion);
- surrounding critical controls maintain predictable positions;
- transition does not impersonate incidental hover emphasis.

Forbidden behavior:

- hidden hover expansions that push layout;
- surprise row growth from implicit status changes;
- accordion-style shifts on routine selection where no disclosure intent exists.

## Family-level stability interpretation (A.5 aligned)

### Hero ritual surfaces

- Scenic depth and ritual emphasis are allowed.
- CTA clusters, progression panels, and readiness strips must keep stable geometry.
- Focal ornament cannot push decision controls between states.

### Scenic world surfaces

- World/map ownership remains visual center.
- Route/module overlays, destination chips, and action rails must remain dimensionally stable.
- Selection emphasis must not resize route cards or command strips.

### Module activity surfaces

- Role/status clarity is primary.
- Module cards, queues, and requirement rows must reserve all status slots.
- Warning/ready changes must not reflow sibling module controls.

### Dense management surfaces

- Highest strictness for no-shift behavior.
- Rows, columns, and inspector controls remain fixed under rapid interactions.
- Hover/selected feedback must be tint/outline, never box growth.

### Ritual modal surfaces

- Modal framing may be ornate, but action bands and decision blocks must be stable.
- Modal content swaps must preserve core action-region geometry.
- Confirmation/summary states cannot push primary/secondary buttons.

## Mechanic-truth coupling

Layout stability supports gameplay truth. If state visibility requires geometry shifts to become readable, the surface design is wrong and must be redesigned with reserved space.

No packet may trade truthful readability for unstable motion.

## Packet declaration requirements (A.8 aligned)

Every screen packet touching a state-bearing surface must declare:

1. Target visible surface(s).
2. Dominant screen family.
3. Touched layers.
4. Reserved state-space strategy for all critical indicators.
5. Explicit statement that state emphasis is geometry-stable.

Acceptable declaration sentence:

- “All readiness/warning/selected/recommended signals use reserved slots and stable emphasis with no box-geometry mutation.”

If this declaration is missing, packet review is incomplete.

## Reviewer fail conditions

Reject with `REJECTED — LAYOUT STABILITY VIOLATION` when any of the following is present:

1. Hover/focus/selected/recommended/warning changes modify dimensions.
2. State badges appear without reserved space and push content.
3. Dense-management controls jump under rapid pointer or keyboard traversal.
4. Modal action rows shift between precondition and ready states.
5. Implementation relies on future polish to fix current shifts.

## Relationship to release diagnostics

This doctrine is enforced in practice by the live-surface audit stack:

- `docs/release/live_surface_visual_audit.md`;
- `src/services/diagnostics/release/liveSurfaceVisualAudit.ts`;
- `src/services/diagnostics/release/liveSurfaceVisualManifest.ts`;
- `tests/integration/release/liveSurfaceVisualAudit.test.ts`.

Those artifacts are enforcement hooks, not doctrine authority.

## Non-goals

- no mandate for a specific CSS strategy;
- no prohibition on tasteful animation that preserves geometry;
- no permission for cleanup outside A.6 cutover law;
- no redefinition of family ownership from A.5.
