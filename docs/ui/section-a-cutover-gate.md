# Section A.6 — Hard Cutover Gate

## Purpose

This file turns the v3 checklist into the legal definition of screen cutover. It exists so later UI packets cannot remove old layers by implication, confidence, or taste language. This file inherits Section A doctrine (`docs/ui/section-a-global-doctrine.md`), verified surface naming (`docs/ui/section-a-touchpoint-registry.md`), and family/layer planning (`docs/ui/section-a-four-layer-model.md`, `docs/ui/section-a-screen-family-matrix.md`). It governs cutover eligibility only; it does not implement UI changes.

## Scope note

This file governs:

- cutover eligibility;
- mandatory evidence requirements;
- automatic blocker conditions;
- cleanup unlock scope after approval;
- required packet declarations for additive-only vs cleanup requests.

This file does **not** govern:

- renderer stack;
- shell implementation;
- screenshot automation;
- release-wide signoff;
- per-screen redesign;
- code changes;
- asset generation;
- numeric tuning.

## Definitions

- **Target screen** — The exact live user-visible surface for which cleanup is requested; never a family abstraction and never an entire feature area.
- **Cutover** — The legal point where the project may remove an old conflicting visual layer from the target screen.
- **Conflicting layer** — Any duplicate old/new ribbon, frame, header, inspector rail, plaque system, or detached fragment that conflicts with intended final composition.
- **Additive version** — The completed new composition that still preserves required old scenic/base ownership until cleanup approval is granted.
- **Screenshot approval** — Explicit review of the required screenshot set for the exact target screen against this gate.
- **Cleanup unlock** — Narrow permission to remove only specific conflicting old layer(s) on the approved target screen.

## Global cutover rule

1. No screen is cut over by default.
2. Additive state is the default legal state.
3. Destructive cleanup is illegal until the exact target screen passes this gate.
4. Infrastructure packets are zero-destructive by doctrine and never qualify for cutover on their own.

## Exact legal cutover gate (pass/fail criteria)

A target screen is cleanup-eligible only when **all** criteria pass.

1. **A complete screenshot set exists for the exact target screen.**
2. **The old scenic/base layer is still present until approval.**
3. **No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition.**
4. **No icons, buttons, or labels are missing compared with the old screen’s live truth.**
5. **High FX, Low FX, and Reduced Motion all remain coherent and readable.**
6. **Hover, selected, recommended, and warning states do not shift layout.**
7. **The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully.**
8. **Only after all prior criteria pass may the old conflicting layer be removed.**

Any single fail keeps the screen in additive-only state.

## Automatic blockers

The following states automatically block cutover and force `REJECTED — REMAIN ADDITIVE` or `DEFERRED`:

- missing icon/button/label in reviewed composition;
- duplicate old/new framing, ribbons, headers, rails, or plaques;
- floating cutout or detached hero/plaque fragment;
- scenic/base owner stripped before approval;
- layout shift in interaction or state badge transitions;
- gameplay truth less clear than baseline;
- incomplete screenshot set;
- attempted approval on host shell abstraction instead of exact target screen.

## What approval unlocks (narrow permission)

Approval unlocks only:

- removal of specific old conflicting layer(s) listed in the signoff record;
- removal of obsolete duplicate framing specific to that exact target screen;
- cleanup of temporary fallback visual duplication on that exact target screen.

Approval does **not** unlock:

- broad refactors;
- replacement of preserved core families;
- asset-family ownership transfer;
- cleanup on sibling screens;
- removal of old scenic/base ownership beyond what the reviewed screen proved safe.

## Family applicability note

- The same hard gate applies to Hero ritual, Scenic world, Module activity, Dense management, and Ritual modal surfaces.
- Required screenshot states vary by surface relevance, but non-relevant states must be marked `N/A` with reason. They must not be omitted.
- Routing shells are never approved in abstract form. The active child visible surface is always the target screen.

## Packet declaration rule

Every later packet must declare one packet type:

- `docs-only`
- `infra-only`
- `additive screen enhancement`
- `cleanup request after cutover review`

If the packet is not explicitly `cleanup request after cutover review`, destructive cleanup is not allowed.

## Evidence and recording requirements

Cutover review must reference:

1. exact target screen id and human label;
2. family and touched layers from Section A.5 doctrine;
3. screenshot evidence folder path;
4. gate pass/fail per criterion;
5. final decision status;
6. unlocked cleanup scope if approved.

Required recording target is `docs/release/ui_screen_signoff_sheet.md`.
Operational publication companion: `docs/ui/phase-0-p0-14-universal-cutover-gate.md`.

## Failure handling rule

If any criterion fails:

- screen remains additive-only;
- old conflicting layer remains;
- failure is recorded by criterion id/wording;
- follow-up work must be additive or corrective;
- cleanup request may be resubmitted only with updated evidence.

## Evidence integrity requirement

- Evidence must be attached to the exact target screen id and packet id.
- Evidence must be reviewable by another person without hidden local context.
- Evidence timestamps and file names must be stable enough to audit after merge.
- Missing or ambiguous evidence metadata is a gate failure, not a documentation nit.

## Legal examples (doctrine interpretation)

### Example A — Legal additive-only packet

- Packet type: `additive screen enhancement`.
- Produces new chrome/readability improvements.
- Captures screenshots for future review.
- Does **not** remove old conflicting layers.

Result: legal packet, no cutover.

### Example B — Illegal infra cleanup attempt

- Packet type: `infra-only`.
- Removes old header framing while introducing shared shell helper.

Result: illegal. Infra packets never qualify for cutover and cannot remove old layers.

### Example C — Legal cleanup unlock

- Packet type: `cleanup request after cutover review`.
- Target screen evidence passes all eight criteria.
- Signoff sheet lists exact conflicting layers to remove.

Result: legal cleanup only for listed layers on approved target screen.

## Relationship to adjacent A.6 files

- Operational publication for packet-level citation: `docs/ui/phase-0-p0-14-universal-cutover-gate.md`.
- Workflow execution is defined in `docs/ui/section-a-screenshot-approval-workflow.md`.
- Screen-level recording template is defined in `docs/release/ui_screen_signoff_sheet.md`.
- This file remains the legal doctrine source for pass/fail cutover eligibility.

## Non-goals

- no screenshot automation;
- no code enforcement;
- no real cleanup execution;
- no redesign specification;
- no release go/no-go decision logic.
