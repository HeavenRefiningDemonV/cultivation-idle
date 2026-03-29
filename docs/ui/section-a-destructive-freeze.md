# Section A.2 — Destructive Migration Freeze and Prohibited Actions

## Purpose

This file turns the v3 recovery doctrine into branch operating policy for UI work. It exists to stop destructive rollout behavior from reappearing after prior failures where shared chrome moved first, old scenic ownership was weakened too early, and screens landed in half-old / half-new compositions. This policy inherits `docs/ui/section-a-global-doctrine.md` and its companion prelude in `docs/codex/SECTION_A_PROMPT_PRELUDE.md`; this file narrows that doctrine into explicit destructive-freeze law. The policy applies to all future UI packets until an explicit superseding doctrine is approved.

## Scope note

This file governs:

- destructive migration constraints;
- prohibited UI cleanup behavior;
- allowed work while the freeze is active;
- cutover preconditions for destructive cleanup;
- prompt-writer guardrails that prevent silent cleanup;
- reviewer stop-ship checks and release-facing red flags.

This file does **not** govern:

- renderer or package selection;
- shared shell implementation details;
- screen-by-screen redesign plans;
- art generation workflows;
- numeric tuning;
- gameplay logic changes.

## Definitions

- **Destructive migration** — Any change that removes, visually demotes, disconnects, or destabilizes an existing working visual/system layer before a complete approved additive replacement exists on that same screen.
- **Silent cleanup** — Bundling destructive removal, demotion, or replacement into a packet whose declared objective is something else.
- **Additive baseline** — The state where old scenic/base ownership remains intact while the new layer wraps, organizes, or enhances it.
- **Conflicting layer** — Any old/new duplicate ribbon, frame, header, inspector rail, plaque system, or detached visual fragment that fights final composition.
- **Screenshot approval** — A concrete exact-screen additive screenshot proving the new integrated version is complete enough for destructive cleanup to be considered.

## Recovery-first operating model (R0/R1)

The prior failure mode was destructive rollout interpretation, not doctrine absence. Recovery-first rollout is therefore mandatory:

- **R0 = freeze destructive migration by default.**
- **R1 = restore visual fallback on broken screens in severity order** before destructive cleanup is discussed.
- Infrastructure packets are zero-destructive by default and must never create destructive visual consequences.
- Visible cleanup is allowed only after a screen has a stable additive version and passes cutover gates.

The freeze protects four continuity surfaces that must not be sacrificed for speed:

1. scenic/base art continuity,
2. gameplay-truth continuity,
3. packet-scope integrity,
4. reviewer clarity.

## Global freeze statement

Destructive migration is frozen by default across UI packets. No packet may remove or demote working scenic/base art, old framing systems, or stable affordances before cutover conditions are satisfied. Default UI packet mode is additive-only.

During freeze, the branch may move forward only through additive baseline work, restoration work, documentation, and zero-destructive infrastructure work. Any packet that includes destructive consequences without explicit cutover eligibility is non-compliant and must be rejected.

## Prohibited actions (hard block)

| Prohibited action | Why it is prohibited | What to do instead |
| --- | --- | --- |
| Removing scenic backgrounds before additive screenshots exist | Breaks scenic continuity and hides regressions under “in-progress” claims. | Keep scenic/base ownership in place and produce screenshot approval of additive integration first. |
| Deleting old header/ribbon systems before replacement is fully integrated | Produces half-old/half-new framing and unstable navigation semantics. | Keep old header/ribbon until the new integrated composition is complete, stable, and approved. |
| Stripping icons/buttons before replacements are visible and stable | Removes affordance clarity and creates immediate usability regressions. | Retain old controls until replacement controls are visible, labeled, wired, and stable. |
| Replacing a whole screen because a shared component now exists | Confuses infra reuse with visual cutover authority; causes destructive flattening of owned identity. | Integrate shared components additively and preserve owned screen identity until cutover gates pass. |
| Relying on future art or future FX to justify an ugly intermediate state | Normalizes broken states and delays accountability for present quality. | Keep current layer intact and defer cleanup until current packet can meet complete additive quality now. |
| Mixing infrastructure packets with destructive visual cleanup | Hides destructive intent inside technical scope and bypasses review. | Keep infrastructure packets zero-destructive; schedule cleanup in explicit approved-cleanup packets only. |
| Shipping a screen with duplicate old/new framing systems still visible | Leaves unresolved conflicting layer state and ambiguous UI ownership. | Resolve to one approved integrated composition before merge; do not ship duplicates. |
| Bundling cleanup into unrelated work without naming it in packet scope | Creates silent cleanup and invalidates reviewer intent checking. | Declare cleanup explicitly in packet type and scope; if not declared, cleanup must not occur. |
| Visually weakening gameplay-truth surfaces in the name of atmosphere | Violates Section A override law and miscommunicates mechanics/readiness. | Preserve gameplay-truth clarity first; atmosphere may only layer on top without semantic loss. |

## Allowed work while freeze is active

The freeze is not a stop-work order. It is a stop-destruction order. The following work is allowed:

- restoring previously removed scenic/base layers on broken screens;
- documentation and doctrine updates that improve review clarity;
- package/folder/scaffold/infrastructure work with zero destructive visual consequence;
- additive chrome layered on top of old art while old ownership remains visible and stable;
- layout/readability improvements that do not remove or demote old ownership;
- QA screenshots and before/after comparison captures for additive verification;
- explicit deferral notes that keep old layers intact until cleanup preconditions are satisfied;
- removal of an old conflicting layer **only after** cutover preconditions in this file are met.

Allowed work must always preserve additive baseline unless the packet is explicitly approved cleanup and all unlock conditions are passed.

## Stop-ship red flags (must-not-merge states)

A packet must not merge, and cleanup must not be approved, if any of the following states is present:

- half-old / half-new composition is visible on the same screen;
- detached portrait, plaque, or hero object appears as a floating cutout;
- duplicate old/new ribbons or headers remain visible;
- required icon, button, or label is missing;
- generic shared chrome visibly flattens owned screen identity;
- layout shifts across hover, selected, recommended, or warning states;
- gameplay truth is less clear than before the packet;
- cleanup is justified only by future art/FX promises.

These are stop-ship red flags, not “nice-to-fix-later” notes.

## Broken-screen triage order (R1 severity sequence)

When restoration is needed, triage in the following exact order:

1. Path / Life Start
2. Cultivation
3. Status
4. World
5. Manual Pavilion
6. Techniques
7. Apothecary
8. Forge
9. Bounties / Expeditions
10. Prestige

This list is triage order only. It is not a redesign sequence and does not authorize destructive cleanup.

## Cleanup unlock conditions (cutover gate)

Cleanup may begin only when **all** conditions below are true for the exact target screen:

1. A complete additive screenshot exists for the exact screen and state set.
2. Old scenic/base layer remains present until approval is recorded.
3. No duplicate ribbons, frames, headers, or inspector systems remain in the approved target composition.
4. No icons, buttons, or labels are missing.
5. Interactive states (hover/selected/recommended/warning) do not shift layout.
6. FX high, FX low, and Reduced Motion presentations remain coherent and non-breaking.
7. Gameplay truth is at least as clear as before.
8. Only after items 1–7 pass may the old conflicting layer be removed.

If any condition fails, cleanup must be deferred and old layers must stay in place.

## Prompt-writer guardrails

To prevent silent cleanup, UI prompt writers must follow these rules:

- Every packet must declare one packet type: docs-only, infra-only, additive screen enhancement, or approved cleanup.
- Any packet not explicitly declared as approved cleanup must be treated as additive-only.
- Infrastructure packets must explicitly state zero-destructive visual consequence.
- Screen packets must name which old scenic/base/framing layers remain until cutover.
- Cleanup intent must be explicit in scope and acceptance criteria; cleanup may never be smuggled into unrelated goals.
- Prompt language must reject future-art/future-FX justifications for present breakage.
- If cleanup preconditions are not met, prompts must require explicit cleanup deferral.

## Packet inheritance rule

All future UI packets inherit this freeze policy. Any packet that violates it is wrong even if the local screen looks nicer. Packet prompts must explicitly state whether the packet is docs-only, infra-only, additive screen enhancement, or approved cleanup.

## Non-goals

This file does not introduce lint automation, code-level enforcement, cleanup execution, visual implementation work, or technical-stack changes. It is a doctrine and merge-policy guardrail document.
