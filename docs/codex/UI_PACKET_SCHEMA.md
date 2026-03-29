# UI Packet Schema — Section A Contract for Future UI Codex Work

## Purpose

This file defines the required contract for future UI packets. It exists so Section B–I prompts stop being improvised and stop reintroducing silent replacement drift. This schema inherits Section A doctrine and converts it into authoring requirements that are enforceable before implementation starts.

This file governs packet authoring and packet validity. It does not implement UI changes.

## Scope note

This file governs:

- allowed packet classes;
- mandatory packet fields;
- strict field values and enums;
- canonical packet section order;
- inheritance expectations from A.1–A.7;
- quick reviewer validity checks.

This file does **not** govern:

- screen redesign content;
- renderer implementation;
- gameplay logic;
- art generation;
- release signoff workflow;
- direct coding work.

## Relationship to Section A docs

| Section A source | Role in this schema | Required packet field impact |
| --- | --- | --- |
| A.1 `section-a-global-doctrine.md` | Global doctrine and merge rules | Governs objective boundaries, non-destructive posture, and source hierarchy assumptions |
| A.3 `section-a-asset-constitution.md` + `section-a-asset-request-rules.md` | Asset request legality | Governs `Art request status`, missing-role proof, and deferred-vs-justified handling |
| A.4 `section-a-touchpoint-registry.md` | Exact path source | Governs `Exact file touchpoints` with primary/support/asset-root distinctions |
| A.5 `section-a-four-layer-model.md` + `section-a-screen-family-matrix.md` | Family/layer naming | Governs `Dominant screen family`, `Touched layers`, and scenic-owner declarations |
| A.6 `section-a-cutover-gate.md` + `section-a-screenshot-approval-workflow.md` | Cleanup legality | Governs `Cutover statement` and cleanup packet restrictions |
| A.7 `section-a-recovery-sequencing.md` + `section-a-recovery-order.md` | Phase/fallback posture | Governs `Current phase`, stop-condition posture, and fallback behavior |

If one or more source docs are missing, packet authors must keep these doctrinal roles intact and fall back to v3 constitution language for equivalent constraints.

## Packet classes (strict)

Allowed packet classes are exactly:

1. `docs-only`
2. `infra-only`
3. `additive screen enhancement`
4. `cleanup request after cutover review`

No other packet class is valid.

| Packet class | Typical use | Mandatory posture | Forbidden drift | Default screen-field behavior |
| --- | --- | --- | --- | --- |
| `docs-only` | Doctrine/spec/reference updates | No implementation claims; no cleanup | Silent implementation scope growth | Use `N/A — non-screen packet` for screen-specific fields |
| `infra-only` | Support scaffolds and non-visual infra setup | Zero-destructive visual consequence | Cleanup, scenic-owner stripping, hidden visual migration | Use `N/A — non-screen packet` unless exact visible surface is directly declared |
| `additive screen enhancement` | Visible surface additive improvements | Must declare retained old layer(s), fallback behavior, and additive-only cutover posture | Silent cleanup, guessed touchpoints, undeclared retained old art | Screen fields are mandatory |
| `cleanup request after cutover review` | Exact-screen, approved conflicting-layer removal | Must cite signoff reference, evidence path, exact cleanup scope unlock | Broad cleanup license, sibling-screen cleanup, approval-free removal | Screen fields are mandatory with cleanup extras |

## Mandatory field registry

All UI packets must include these fields in explicit form.

| Field | Required scope | Allowed value shape | Failure mode prevented |
| --- | --- | --- | --- |
| Packet ID | Always | Stable short id (`A.8`, `D.1`, etc.) | Untraceable packet lineage |
| Packet title | Always | Single bounded objective title | Multi-objective ambiguity |
| Packet class | Always | One of 4 strict classes | Hidden cleanup/scope drift |
| Current phase | Always | Strict enum from phase list | Phase jump ambiguity |
| Why now | Always | Short causal rationale | Arbitrary sequencing drift |
| Objective | Always | One bounded objective statement | Multi-goal packet sprawl |
| Target visible surface(s) | Screen packets; `N/A` for non-screen packets | Exact visible experience label(s) | Host-file-only ambiguity |
| Dominant screen family | Screen packets; `N/A` for non-screen packets | Strict family enum | Family misclassification drift |
| Touched layers | Screen packets; `N/A` for non-screen packets | Subset of `{1,2,3,4}` | Layer-scope ambiguity |
| Existing scenic owner | Screen packets; `N/A` for non-screen packets | Concrete owner statement | Silent scenic ownership transfer |
| Retained old layer(s) | Screen packets; `N/A` for non-screen packets | Explicit retained legacy layer list | Silent cleanup |
| Exact file touchpoints | Always | Exact paths, grouped by primary/support/asset roots | Guessed/stale touchpoints |
| Dependency handling | Always | Present/missing + fallback plan | Brittle prompt behavior |
| Continuity risk | Screen packets; `N/A` for non-screen packets | `low`/`medium`/`high` | Understated migration risk |
| Art request status | Always | `none`/`deferred`/`justified` | Implicit art escalation |
| Cutover statement | Always | One strict approved sentence | Implied cleanup posture |
| Non-goals | Always | Explicit out-of-scope list | Hidden side-work |
| Intentionally unfinished | Always | Explicit known unfinished scope | Misread partial completion |
| Intentionally deferred | Always | Explicit deferred scope | Deferred debt invisibility |
| Stop conditions | Screen packets; `N/A` for non-screen packets | Explicit list from A.7 posture | Missing halt triggers |
| Fallback behavior | Screen packets; `N/A` for non-screen packets | Explicit fallback steps | No recovery plan when breakage occurs |
| Verification commands | Always | Concrete commands list | Non-auditable execution |
| Manual QA path | Always | Exact QA route or `N/A` with reason | Missing manual validation expectation |
| Acceptance criteria | Always | Pass/fail criteria | Done-definition drift |
| Final response format | Always | Explicit required output sections | Inconsistent closeout artifacts |
| Migration notes (optional) | Optional when state/save/cross-surface truth affected | Short migration posture block | Hidden migration side effects |

## Allowed values and strict enums

### A. `Current phase`

Allowed values exactly:

- `N/A — doctrine packet`
- `R0`
- `R1`
- `I1`
- `I2`
- `I3`
- `I4`
- `I5`
- `I6`
- `I7`
- `I8`
- `I9`

Rules:

- docs-only Section A packets may use `N/A — doctrine packet`;
- infra-only packets normally use `I1` or `I2`;
- visible screen packets must use active implementation phase;
- cleanup requests may use `I9` only with approved cutover posture.

### B. `Dominant screen family`

Allowed values exactly:

- `Hero ritual`
- `Scenic world`
- `Module activity`
- `Dense management`
- `Ritual modal`
- `N/A — non-screen packet`

### C. `Touched layers`

Allowed values:

- subset of `{1, 2, 3, 4}`;
- `N/A — non-screen packet`.

### D. `Continuity risk`

Allowed values exactly:

- `low`
- `medium`
- `high`

Definitions:

- `low` = no scenic-owner risk and no cleanup adjacency.
- `medium` = additive changes on stable owned surface, usually Layer 2/3 heavy.
- `high` = hero/world ownership-adjacent work, duplicate-conflict risk, or cleanup adjacency.

### E. `Art request status`

Allowed values exactly:

- `none`
- `deferred`
- `justified`

Definitions:

- `none` = no new art requested.
- `deferred` = possible need acknowledged, but request not legal yet.
- `justified` = legal only with A.3 missing-role proof basis.

### F. `Cutover statement`

Allowed statements are exactly one of:

1. `No destructive cleanup permitted in this packet.`
2. `Additive-only. Old layer(s) remain until later approval.`
3. `Cleanup requested only for exact approved conflicting layer(s) on the target screen after A.6 signoff.`

No custom casual variant is allowed.

## Canonical packet section order

Future UI packets should follow this order:

1. Packet identity
2. Dependency handling
3. Mission
4. Required deliverables / change surface
5. Strict file surface
6. Required work / required content
7. Non-goals
8. Deferred work / intentionally unfinished
9. Stop conditions and fallback behavior
10. Workflow
11. Self-checks
12. Minimum acceptance criteria
13. Final response format

Rules:

- docs/infra packets may compress screen-specific fields using `N/A — non-screen packet`.
- screen packets must not omit screen-specific fields.

## Invalid packet shapes (reject list)

Reject packets that:

- contain more than one real objective;
- guess touchpoints or use stale shorthand;
- omit retained old art/layer declaration;
- omit phase/family/layer declarations;
- hide cleanup inside unrelated objectives;
- request new art without missing-role proof;
- use “restyle” or “polish” as sole objective language;
- omit fallback behavior for visible-surface work;
- leave unfinished/deferred scope unstated.

## Packet resilience rule

Packets must remain honest under imperfect context:

1. inspect repo and docs first;
2. state missing dependency explicitly when absent;
3. narrow scope instead of inventing claims;
4. never use missing branch refs/screenshots as permission to hallucinate;
5. keep cleanup/art requests blocked if prerequisites are missing.

## Reviewer quick-validity checklist

A packet is valid only when all checks pass:

- [ ] one objective only
- [ ] packet class declared
- [ ] current phase declared
- [ ] dominant screen family declared or `N/A`
- [ ] touched layers declared or `N/A`
- [ ] retained old art/layer declared
- [ ] exact touchpoints listed
- [ ] art status declared
- [ ] cutover statement declared
- [ ] fallback behavior declared
- [ ] verification commands listed
- [ ] manual QA path listed
- [ ] acceptance criteria listed

## Future packet usage rule

All future Section B–I UI packets must use this schema. If a UI packet conflicts with this schema, it is malformed before code is written. This schema is a UI-specific supplement to general prompt style and does not replace non-UI prompt guidance.

## Non-goals

- no implementation;
- no packet-generator automation;
- no release workflow;
- no schema JSON/YAML;
- no redesign content.
