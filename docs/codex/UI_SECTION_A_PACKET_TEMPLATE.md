# UI Section A Packet Template

## Purpose

This file is the reusable prompt skeleton for future UI packets. It implements `docs/codex/UI_PACKET_SCHEMA.md` in copy-paste form so Section B–I prompts can be authored without improvising core contract fields.

## How to use

1. Choose packet class first.
2. Copy the matching template block.
3. Keep section order intact.
4. Replace every placeholder token exactly.
5. Remove only sections marked optional.
6. Never delete mandatory declarations because the packet feels obvious.
7. Keep one bounded objective; split the packet if objective scope grows.

---

## Template A — docs-only / infra-only packet

```md
# <PACKET_ID> — <PACKET_TITLE>

## Packet identity
- Packet class: <docs-only | infra-only>
- Current phase: <N/A — doctrine packet | I1 | I2>
- Why now: <WHY_NOW>
- Objective: <ONE_BOUNDED_OBJECTIVE>

## Dependency handling
- Required doctrine/docs checked: <LIST>
- Missing dependency handling: <NONE | WHAT_IS_MISSING_AND_SCOPE_NARROWING>

## Target visible surface(s)
- Target visible surface(s): N/A — non-screen packet
- Dominant screen family: N/A — non-screen packet
- Touched layers: N/A — non-screen packet
- Existing scenic owner: N/A — non-screen packet
- Retained old layer(s): N/A — non-screen packet

## Exact file touchpoints
- Primary touchpoints:
  - <EXACT_PATH_1>
- Support touchpoints:
  - <EXACT_PATH_2>
- Asset anchor roots (if relevant):
  - <N/A | ROOT_PATHS>

## Continuity and posture
- Continuity risk: N/A — non-screen packet
- Art request status: <none | deferred | justified>
- Cutover statement: <STRICT_CUTOVER_STATEMENT_FROM_SCHEMA>

## Required deliverables / change surface
- <DELIVERABLE_1>
- <DELIVERABLE_2>

## Non-goals
- <NON_GOAL_1>
- <NON_GOAL_2>

## Intentionally unfinished
- <UNFINISHED_SCOPE>

## Intentionally deferred
- <DEFERRED_SCOPE>

## Stop conditions and fallback behavior
- Stop conditions: N/A — non-screen packet
- Fallback behavior: N/A — non-screen packet

## Workflow
1. <STEP_1>
2. <STEP_2>
3. <STEP_3>

## Verification commands
- <COMMAND_1>
- <COMMAND_2>

## Manual QA path
- <N/A_OR_MANUAL_QA_DOC_PATH>

## Acceptance criteria
- <CRITERION_1>
- <CRITERION_2>

## Final response format
1. Changed files
2. Dependency handling outcome
3. Summary
4. Diff scope confirmation
```

---

## Template B — additive screen enhancement packet

```md
# <PACKET_ID> — <PACKET_TITLE>

## Packet identity
- Packet class: additive screen enhancement
- Current phase: <R1 | I3 | I4 | I5 | I6 | I7 | I8>
- Why now: <WHY_NOW>
- Objective: <ONE_BOUNDED_OBJECTIVE>

## Dependency handling
- Doctrine inheritance used: <A1/A3/A4/A5/A6/A7 AS APPLICABLE>
- Missing dependency handling: <NONE | WHAT_IS_MISSING_AND_SCOPE_NARROWING>

## Target visible surface(s)
- Target visible surface(s): <EXACT_VISIBLE_SURFACE_LABELS>
- Dominant screen family: <Hero ritual | Scenic world | Module activity | Dense management | Ritual modal>
- Touched layers: <SUBSET_OF_{1,2,3,4}>
- Existing scenic owner: <EXACT_CURRENT_OWNER>
- Retained old layer(s): <EXACT_OLD_LAYERS_RETAINED_DURING_PACKET>

## Exact file touchpoints
- Primary touchpoints:
  - <EXACT_PATH_PRIMARY_1>
- Support touchpoints:
  - <EXACT_PATH_SUPPORT_1>
- Asset anchor roots (if relevant):
  - <N/A | ROOT_PATHS>

## Continuity and posture
- Continuity risk: <low | medium | high>
- Art request status: <none | deferred | justified>
- Art status basis: <IF_JUSTIFIED_OR_DEFERRED_STATE_MISSING_ROLE_PROOF_POSTURE>
- Cutover statement: <No destructive cleanup permitted in this packet. | Additive-only. Old layer(s) remain until later approval.>

## Required deliverables / change surface
- <DELIVERABLE_1>
- <DELIVERABLE_2>

## Non-goals
- <NO_CLEANUP>
- <NO_UNDECLARED_SURFACE_EXPANSION>
- <NO_SPECULATIVE_ART_DEPENDENCY>

## Intentionally unfinished
- <WHAT_REMAINS_UNFINISHED_BUT_VISIBLE>

## Intentionally deferred
- <WHAT_IS_EXPLICITLY_DEFERRED_AND_WHY>

## Stop conditions
- <STOP_CONDITION_1_FROM_A7>
- <STOP_CONDITION_2_FROM_A7>
- <STOP_CONDITION_3_FROM_A7>

## Fallback behavior
1. Halt forward work on affected surface.
2. Return affected surface to R1-unresolved posture.
3. Preserve/restore retained old layer(s).
4. Defer cleanup and continue additive repair only.

## Workflow
1. Verify exact touchpoints from A.4 registry.
2. Apply bounded additive scope.
3. Re-check stop conditions and fallback posture.

## Verification commands
- <COMMAND_1>
- <COMMAND_2>
- <COMMAND_3>

## Manual QA path
- <EXACT_QA_ROUTE_OR_CHECKLIST_PATH>

## Acceptance criteria
- <PHASE_POSTURE_CRITERION>
- <RETAINED_OLD_LAYER_CRITERION>
- <NO_GUESSED_TOUCHPOINTS_CRITERION>
- <FALLBACK_DECLARATION_CRITERION>

## Final response format
1. Changed files
2. Dependency handling
3. Family/layer declaration confirmation
4. Continuity and fallback confirmation
5. Diff scope confirmation
```

---

## Template C — cleanup request after cutover review

```md
# <PACKET_ID> — <PACKET_TITLE>

## Packet identity
- Packet class: cleanup request after cutover review
- Current phase: I9
- Why now: <WHY_NOW_AFTER_APPROVAL>
- Objective: Remove exact approved conflicting old layer(s) on one target screen.

## Dependency handling
- Doctrine inheritance used: <A1/A4/A5/A6/A7>
- Missing dependency handling: <NONE | BLOCK_CLEANUP_IF_APPROVAL_ARTIFACT_MISSING>

## Target visible surface(s)
- Target visible surface(s): <EXACT_TARGET_SCREEN>
- Dominant screen family: <STRICT_FAMILY_ENUM>
- Touched layers: <SUBSET_OF_{1,2,3,4}>
- Existing scenic owner: <OWNER_POSTURE_AFTER_APPROVED_CLEANUP>
- Retained old layer(s): <WHAT_REMAINS_RETAINED_AFTER_THIS_NARROW_CLEANUP>

## Exact file touchpoints
- Primary touchpoints:
  - <EXACT_PRIMARY_PATHS>
- Support touchpoints:
  - <EXACT_SUPPORT_PATHS>
- Asset anchor roots (if relevant):
  - <N/A | ROOT_PATHS>

## Cutover evidence posture (mandatory)
- Signoff reference path: <docs/release/ui_screen_signoff_sheet.md#...>
- Screenshot evidence folder: <docs/release/qa/ui-cutover/<screen-id>/> 
- Exact conflicting old layer(s) to remove: <LIST>
- Cleanup scope unlocked: <EXACT_SCOPE_FROM_APPROVAL>
- Broad cleanup prohibition: No cleanup beyond listed layer(s) is authorized.
- Sibling-screen prohibition: Cleanup remains limited to this approved target screen.

## Continuity and posture
- Continuity risk: <medium | high>
- Art request status: <none | deferred | justified>
- Cutover statement: Cleanup requested only for exact approved conflicting layer(s) on the target screen after A.6 signoff.

## Non-goals
- no broad cleanup;
- no sibling-screen cleanup;
- no asset-family ownership transfer;
- no undeclared redesign.

## Intentionally unfinished
- <UNFINISHED_SCOPE>

## Intentionally deferred
- <DEFERRED_SCOPE>

## Stop conditions
- <ANY_APPROVAL_MISMATCH_OR_NEW_BREAKAGE_CONDITION>

## Fallback behavior
1. Halt cleanup if scope exceeds approval.
2. Revert to additive-only posture for affected surface.
3. Record blocker and defer further cleanup.

## Workflow
1. Verify signoff artifact and evidence path.
2. Apply exact scoped cleanup only.
3. Re-check for new conflicting duplication or regressions.

## Verification commands
- <COMMAND_1>
- <COMMAND_2>

## Manual QA path
- <EXACT_QA_PATH_AND_SIGNOFF_REFERENCE>

## Acceptance criteria
- Cleanup scope matches approval artifact exactly.
- No undeclared screen/surface cleanup occurred.
- Retained old layer posture remains explicit.
- Fallback path is declared if breakage appears.

## Final response format
1. Changed files
2. Approval artifact reference
3. Exact cleanup scope executed
4. Remaining retained layers
5. Diff scope confirmation
```

---

## Placeholder rules

- Every placeholder must be replaced completely.
- `TBD`, `later`, or vague placeholders are invalid in mandatory fields.
- If a field is truly not applicable, use schema-approved `N/A` form.
- Prompt authors must not delete fallback or cutover fields.

## Mini worked example (header-only, compact)

**Packet ID:** `D.1`  
**Packet title:** `Cultivation scenic shell additive pass`  
**Packet class:** `additive screen enhancement`  
**Current phase:** `I4`  
**Target visible surface(s):** `Cultivation main surface`  
**Dominant screen family:** `Hero ritual`  
**Touched layers:** `{2, 3}`  
**Existing scenic owner:** `Cultivation scenic base remains owner`  
**Retained old layer(s):** `Existing cultivation scenic/base and legacy fallback frame remain during packet`  
**Continuity risk:** `high`  
**Art request status:** `deferred`  
**Cutover statement:** `Additive-only. Old layer(s) remain until later approval.`

## Common mistakes

- forgetting retained old art/layer declaration;
- writing “restyle screen” as the objective;
- omitting current phase posture;
- omitting fallback behavior;
- guessing file touchpoints instead of using A.4 registry;
- using cleanup language inside additive packets;
- declaring speculative art need without classifying `deferred` or `justified`;
- omitting exact target visible surface when host file has multiple experiences.

## Future packet usage rule

Future Section B–I UI prompts should be built from this template. If a packet deviates, it must justify why. Deviation is exception handling, not the norm.
