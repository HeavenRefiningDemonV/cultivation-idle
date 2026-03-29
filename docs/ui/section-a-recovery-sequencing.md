# Section A.7 — Recovery-First Sequencing

## Purpose

This file turns the v3 recovery rollout into an operational sequencing doctrine. It exists so future packets cannot jump phases, hide fallback debt, or treat recovery-first as optional advice. This file inherits Section A doctrine (`docs/ui/section-a-global-doctrine.md`), cutover legality (`docs/ui/section-a-cutover-gate.md`), and family/layer naming (`docs/ui/section-a-four-layer-model.md`, `docs/ui/section-a-screen-family-matrix.md`). It governs sequencing and fallback behavior, not implementation.

## Scope note

This file governs:

- phase definitions for R0/R1/I1–I9;
- legal and illegal phase transitions;
- stop conditions;
- fallback behavior when stop conditions fire;
- required phase/fallback declarations in future packets.

This file does **not** govern:

- screenshot approval workflow details (see A.6 docs);
- shell implementation;
- renderer/package choices;
- redesign content;
- art-request specification details;
- code changes;
- numeric tuning.

## Definitions

- **Phase** — The current permitted class of work, not a taste label.
- **Stable additive baseline** — Minimum coherent state where old scenic/base ownership is intact, core controls are present, dominant duplicate conflict is absent, and readability does not depend on nonexistent future art.
- **Broken screen** — A live surface that has fallen below stable additive baseline.
- **Stop condition** — Hard observed state that halts forward progress for the affected surface.
- **Fallback** — Returning an affected surface to recovery status instead of forcing forward phase progress.
- **Phase jump** — Attempt to move into a later implementation or cleanup phase without required prior state.

## Global sequencing rules

1. R0 is always in force as a standing destructive-freeze constraint.
2. R1 restores broken screens; it is required before forward phase progress on those screens.
3. I1 and I2 are additive-only support phases.
4. I3–I7 are visible implementation waves by screen family.
5. I8 is proof-gated art escalation only.
6. I9 is cleanup-only and requires exact-screen cutover approval.
7. No phase jump is legal without required prior state.

## Phase table

| Phase | Purpose | Allowed work | Forbidden work | Entry condition | Exit condition |
| --- | --- | --- | --- | --- | --- |
| **R0** | Freeze destructive migration | Docs, explicit freeze behavior, retention of scenic/base ownership, additive stabilization | Stripping scenic backgrounds, early stripping of headers/ribbons/icons/frames, cleanup by implication | Always active doctrine | Never fully exits; remains standing rule |
| **R1** | Restore broken screens to stable additive fallback | Restore scenic/base owner, restore critical affordances, remove immediate half-migrated breakage, additive stabilization | Aesthetic overreach, cleanup, dependence on future nonexistent art | Stop condition observed or known broken surface | Affected surface reaches stable additive baseline |
| **I1** | Infrastructure only | Package/folder/provider scaffolds, tokens, standards docs, support groundwork | Destructive visual consequence, cleanup | R0 standing; no unresolved blockers on targeted infra effect | Groundwork exists with zero destructive visual consequence |
| **I2** | Shared shell and chrome | Additive shell/chrome support, shared plaques/ribbons/dock/inspector shell behaviors | Removal of old ownership, cleanup | I1 groundwork stable | Shared shell wraps surfaces additively without destructive consequence |
| **I3** | Ritual selection screens | Additive work on Life Start / Path / Heart Law ritual-selection experiences | Cleanup without approval, phase-jump changes outside declared wave | R1-restored target surfaces for I3 scope | Declared I3 surfaces stable in additive form |
| **I4** | Hero screens | Additive work on Cultivation and Status hero surfaces | Cleanup without approval, hero flattening shortcuts | I3 in declared good state for dependent surfaces | Declared I4 hero surfaces stable additive |
| **I5** | World hub | Additive work on world map/city shell/inspector/module cards | Cleanup without approval, module/dense misclassification drift | I4 dependencies stable where required | World hub additive state coherent and stable |
| **I6** | Module panels | Additive module work: Outskirts, Ruins, Gate Trial, Pavilion, Apothecary, Forge, Bounties, Expeditions | Cleanup without approval, speculative art dependency | I5 dependencies stable where required | Declared modules stable additive |
| **I7** | Dense screens | Additive dense work: Inventory, Techniques, Prestige polish pass | Cleanup without approval, scenic takeover | I6 dependencies stable where required | Dense surfaces stable, readable, and non-broken |
| **I8** | Proof-gated art escalation | Support-part requests justified by additive screenshots proving missing role | Whole-screen repaint requests, speculative art dependencies | Prior additive evidence proves unresolved missing role | Missing role documented/requested cleanly, or proven unnecessary |
| **I9** | Final cleanup | Remove exact approved conflicting layer(s) after cutover approval on exact target screen | Speculative cleanup, sibling-screen cleanup, removal of preserved scenic ownership without explicit proof | A.6 cutover approval exists for exact target screen | Approved conflicting layer removed on exact target screen only |

## Legal and illegal transitions

### Legal transitions

- **R1 -> I3** for restored Path/Life Start ritual-selection surface.
- **I2 -> I4** for Hero screens in additive-only mode.
- **I6 -> I8** only when additive screenshots prove a missing support role.
- **I4/I5/I6/I7 -> I9** only after A.6 approval on the exact target screen.

### Illegal transitions

- **I2 -> I9** (shared chrome is never cleanup authority).
- **I1 -> cleanup** (infra phase cannot cut over).
- **I4 on Cultivation while Cultivation is still R1-broken**.
- **I8 before additive screenshots exist**.
- **Any phase that depends on future art to justify current broken state**.

## Stop conditions

The following five stop conditions are explicit A.7 blockers:

| Stop condition | What it means | Immediate required response | Resulting phase state |
| --- | --- | --- | --- |
| Scenic owner lost before screenshot approval | Required scenic/base owner was stripped prematurely | Halt forward work; restore or retain owner | Affected surface becomes R1-unresolved |
| Duplicate old/new conflict visible | Old/new systems (ribbons/frames/headers/rails) conflict in same composition | Halt; remove conflict by additive repair (not cleanup) | Affected surface becomes R1-unresolved |
| Missing icon/button/label regression | Control/label parity regressed vs live truth | Halt; restore missing affordance | Affected surface becomes R1-unresolved |
| Layout shift in interactive states | Hover/selected/recommended/warning changes shift dimensions | Halt; fix stability before forward wave work | Affected surface becomes R1-unresolved |
| Dependency on nonexistent art | Screen coherence depends on art not yet made | Halt; restore readable additive fallback without that dependency | Affected surface becomes R1-unresolved |

Derived recovery-enforcement conditions (added for enforceability and explicitly derived):

| Derived condition | What it means | Immediate required response | Resulting phase state |
| --- | --- | --- | --- |
| Gameplay truth less clear than before | Surface now miscommunicates readiness/role/mechanic truth | Halt; restore clarity via additive correction | Affected surface becomes R1-unresolved |
| Fallback state cannot be described concretely | Packet cannot state exact current additive fallback without hand-waving | Halt; document and restore explicit fallback state | Affected surface becomes R1-unresolved |

## Fallback behavior (severity-order fallback plan)

When any stop condition fires on a surface:

1. Halt forward work on that affected surface.
2. Mark that surface as `R1-unresolved`.
3. Keep or restore old scenic/base owner as required.
4. Do not advance cleanup for that surface.
5. Record blocker(s) explicitly in packet output.
6. Narrow active work to additive repair if needed.
7. Resume later-phase work for that surface only after stable additive baseline is restored.

Fallback is surface-scoped, not automatic branch-wide rollback.

## Standing R0 vs active R1 clarification

- R0 remains active for the entire branch lifecycle.
- R1 is activated per affected surface when breakage exists.
- The branch may globally operate in a later I-phase while one specific surface remains R1-unresolved.
- Later-phase work on unrelated stable surfaces may continue only when it does not depend on the broken surface.

## Relationship to A.6 cutover

- A.6 defines legal cleanup approval on exact target screens.
- A.7 defines when branch sequencing may approach that approval.
- No screenshot approval means no I9 cleanup.

## Future packet usage rule

Every later UI packet must explicitly declare:

1. current phase;
2. target visible surface(s);
3. whether any affected surface is still R1-unresolved;
4. additive-only vs cleanup-eligible posture;
5. fallback response if stop condition is triggered.

Packets that omit these declarations are non-compliant.

## Non-goals

- no implementation guidance;
- no screenshot workflow details;
- no art-request schema;
- no packet-template schema;
- no release go/no-go logic.
