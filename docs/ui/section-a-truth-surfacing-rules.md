# Section A.9 — Truth Surfacing Rules

## Purpose

This file locks the Section A truth-surfacing doctrine for all future UI packets. It defines how critical gameplay meaning must remain visible, scannable, and interaction-independent across all screen families.

This file operationalizes doctrine only. It does not authorize mechanic changes.

## Inheritance and authority

This doctrine inherits and operationalizes:

- A.1 global doctrine and current-gameplay-truth priority (`docs/ui/section-a-global-doctrine.md`);
- A.5 family/layer ownership and readability obligations (`docs/ui/section-a-four-layer-model.md`, `docs/ui/section-a-screen-family-matrix.md`);
- A.6 cutover legality and screen-level coherence checks (`docs/ui/section-a-cutover-gate.md`);
- A.8 packet schema field discipline (`docs/codex/UI_PACKET_SCHEMA.md`).

When conflicts occur, gameplay truth priority from A.1 is final authority.

## Scope

This file governs:

- what truth is critical vs support;
- visible-without-hover requirements;
- tooltip and disclosure boundaries;
- family-sensitive truth presentation standards;
- reviewer rejection conditions for truth failures.

This file does **not** govern:

- economy balance;
- combat simulation internals;
- copy tone preferences outside clarity requirements;
- art style choices unrelated to truth visibility.

## Canonical definitions

- **Critical truth** — gameplay information required for a correct immediate decision or accurate understanding of current state.
- **Support truth** — secondary explanatory detail that deepens context without changing immediate decision validity.
- **Hover-only truth** — information available solely through hover/focus tooltip or transient microstate.
- **DOM-readable truth surface** — critical truth visible in baseline rendered UI without requiring hover.
- **Mechanic implication drift** — visual or textual presentation that implies unsupported mechanics, actions, guarantees, or states.

## Global law: no hover-only critical truth

Critical truth must be visible without hover.

Requirements:

1. A user can identify readiness, blockers, and next meaningful action from baseline surface state.
2. A user can identify warning or failure implications without discovering hidden tooltips.
3. A user can distinguish selected/active/recommended meanings without color-only dependence.
4. A user can inspect resource shortfall direction and requirement category without relying on hover text.

Tooltip-only critical truth is illegal.

## Critical truth classes (when relevant)

When a surface includes the associated mechanic, these truths are critical and must be baseline-visible:

- readiness vs blocked state;
- blocker reason category and shortfall direction;
- next milestone or progression checkpoint;
- chapter/exhaustion terminal state significance;
- failure/safety-net/fail-safe consequence clarity;
- route or destination commitment clarity;
- build/role/loadout-impact choice clarity;
- irreversible action consequence summary.

If a truth class is absent because the mechanic is absent on that surface, packet docs must mark it `N/A` with reason.

## Support truth and tooltip boundary

Tooltips and disclosures are allowed for support truth only.

Allowed tooltip roles:

- expanded formula detail;
- historical context;
- explanatory flavor text;
- additional comparative numbers after baseline recommendation/readiness is already visible.

Forbidden tooltip roles:

- sole source of readiness status;
- sole source of blocker reason;
- sole source of irreversible-choice warning;
- sole source of active route/selection meaning.

## Color and icon dependency rules

Critical truth must not depend on color alone.

Required redundancy patterns:

- icon + label;
- label + structured status chip;
- textual state keyword paired with tone change.

Forbidden patterns:

- green/red-only readiness encoding with no text;
- tint-only selected state where label/state token is absent;
- glow-only warning semantics.

## Family-level truth interpretation (A.5 aligned)

### Hero ritual surfaces

- Ritual atmosphere may be rich, but ritual decisions must expose readiness, stakes, and consequence at baseline.
- Hero centerpiece cannot occlude action truth.
- Key progression and risk meaning must remain legible before hover.

### Scenic world surfaces

- Scenic ownership remains primary visual anchor.
- Route/module/command truths must stay explicit in overlays or adjacent rails.
- Destination status and consequence must be understandable without tooltip discovery.

### Module activity surfaces

- Operational role truth is primary.
- Inputs, blockers, and output implications must be directly visible.
- Module recommendations must include visible rationale token or short reason label.

### Dense management surfaces

- Strongest truth density requirement.
- Rows/cards/chips must expose decisive state at scan speed without hover dependency.
- Inspector/detail hover may enrich but cannot unlock first-time comprehension of critical states.

### Ritual modal surfaces

- Modal confirms decisions and consequences; critical summaries must appear before confirm action.
- Chapter/life terminal and summary modals must state outcome status directly in-body.
- Action buttons must not carry hidden-only consequence text.

## Mechanic implication guardrail

UI text, iconography, and ornament must not imply mechanics that the current gameplay systems do not support.

Invalid implication examples:

- suggesting manual combat agency where combat is automated;
- implying guaranteed survival where safety-net is conditional;
- implying action availability when the gate is blocked.

If atmospheric styling introduces implication drift, atmospheric styling must be revised.

## Packet declaration requirements (A.8 aligned)

Every screen packet touching critical truth surfaces must declare:

1. Which critical truth classes are present.
2. Where each class is baseline-visible without hover.
3. Which tooltip/disclosure fields are support-only.
4. How non-color redundancy is provided for each critical state.

Acceptable declaration sentence:

- “All readiness/blocker/next-action truths are baseline-visible and not color-only; tooltips provide support detail only.”

## Reviewer fail conditions

Reject with `REJECTED — TRUTH SURFACING VIOLATION` when any of the following is present:

1. Critical truth exists only in hover tooltip.
2. Critical state encoding is color-only with no textual or icon redundancy.
3. Action consequence is hidden until late interaction.
4. Surface implies unsupported mechanics or guarantees.
5. Scenic/ornamental treatment obscures immediate decision truth.

## Relationship to release diagnostics

This doctrine aligns with release-truth and visual audits, including:

- `docs/release/live_surface_visual_audit.md`;
- `docs/release/surface_truth_audit.md`;
- `src/services/diagnostics/release/liveSurfaceVisualAudit.ts`;
- `tests/integration/release/liveSurfaceVisualAudit.test.ts`.

These artifacts are operational checks and should reflect this doctrine; they do not replace it.

## Non-goals

- no rewrite of gameplay rules;
- no mandate for dense prose or long labels;
- no permission to defer critical truth to future packets;
- no conflict with A.6 cutover gate requirements.
