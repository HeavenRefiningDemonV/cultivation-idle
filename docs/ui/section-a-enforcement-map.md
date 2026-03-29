# Section A.11 — Enforcement Map: Human Review vs Repo-Backed Hooks

## Purpose

This file defines which Section A rules remain human-review doctrine and which rules are objective enough for repo-backed enforcement hooks. It exists so later packets stop improvising enforcement strategy and stop mixing subjective design judgment with brittle automation.

This file inherits Section A doctrine and current repo truth from:

- `docs/ui/section-a-global-doctrine.md` (A.1);
- `docs/ui/section-a-cutover-gate.md` (A.6);
- `docs/codex/UI_PACKET_SCHEMA.md` (A.8);
- `docs/ui/section-a-layout-stability-rules.md` and `docs/ui/section-a-truth-surfacing-rules.md` (A.9).

This file governs enforcement posture only. It does not implement hooks.

## Scope note

This file governs:

- enforcement classification for Section A rules;
- reuse-first policy for existing repo-backed hooks;
- criteria for future lightweight tooling proposals;
- how packet authors and reviewers interpret machine checks versus human signoff.

This file does **not** govern:

- implementation of new hooks;
- screenshot approval workflow;
- release-wide signoff process;
- renderer/package choices;
- screen redesign;
- gameplay tuning.

## Definitions

- **Documentation-only rule** — A rule enforced primarily through human review and signoff.
- **Repo-backed enforcement hook** — An existing or future lightweight code/test/doc check that can objectively detect a narrow Section A violation.
- **Lightweight tooling candidate** — A rule objective enough for narrow automation later but not justified for implementation in this packet.
- **Hard objective signal** — A stable pass/fail condition auditable from tracked source or artifact data.
- **Subjective judgment** — A design evaluation that requires human interpretation even when tooling supports context.
- **Tracked surface** — A scoped live UI surface or file set already in diagnostics scope or specific enough to join that scope.

## Enforcement philosophy

1. **Doctrine comes first.** Section A docs define the rules; tooling only checks selected objective signals.
2. **Human review remains primary for subjective doctrine.** Scenic quality, mood fit, and ceremonial identity must stay reviewer-owned.
3. **Automation is valid only for narrow objective signals.** A hook must target specific tracked surfaces and deterministic failures.
4. **Reuse existing hook first.** Later packets must extend current diagnostics before proposing parallel frameworks.
5. **Machine checks complement signoff.** Passing audits never replace screenshot approval, cutover review, or identity judgment.
6. **New enforcement work requires explicit justification.** “Important” is not sufficient; objective signal quality and maintenance cost must be stated.

## Verified existing hooks to reuse first

Only canonical `docs/`, `src/`, and `tests/` roots are valid references. `tmp-tests/` or generated mirrors are non-canonical and must be ignored.

- `docs/release/live_surface_visual_audit.md` — documents tracked visual constraints (blue remnants, layout-shift risk, icon consistency) and manual smoke context; anchors A.9 stability/truth enforcement posture.
- `src/services/diagnostics/release/liveSurfaceVisualAudit.ts` — source-level audit for banned blue remnants, risky state-block geometry mutations, missing `uiNoShift` hooks, and icon consistency on tracked files.
- `src/services/diagnostics/release/liveSurfaceVisualManifest.ts` — tracked-surface scope, banned-pattern inventory, no-shift targets, and narrow exceptions used by visual audit.
- `tests/integration/release/liveSurfaceVisualAudit.test.ts` — integration gate asserting the visual audit schema and no-findings baseline for tracked live surfaces.
- `tests/contracts/cultivateScreenSnapshotSafety.test.ts` — contract-level source guard against specific CultivateScreen regressions; demonstrates narrow component-source safety checks.
- `tests/integration/release/layoutInteractionStabilityMatrix.test.ts` — interaction sanity/idempotence matrix for high-risk shell/state transitions; partial support for stability concerns.
- `src/services/diagnostics/release/surfaceTruthAudit.ts` — player-facing surface truth audit for raw-id leaks, stale/debug copy, and fake/future content leakage.
- `tests/integration/release/surfaceTruthAudit.test.ts` — scenario-based integration coverage proving surface truth audit behavior across lifecycle scenarios.
- `src/services/diagnostics/release/vocabularyAudit.ts` — tracked-file vocabulary/placeholder/stale-copy checks that reinforce truthful player-facing language discipline.
- `docs/release/qa/issue_severity_rubric.md` — severity framing for findings and escalation discipline in release QA handling.
- `docs/release/waiver_policy.md` — waiver constraints so machine-check failures and exceptions remain accountable.

## Enforcement classification matrix

| Rule / concern | Doctrine anchor | Enforcement class | Existing hook to reuse | Recommended next step | Why |
| --- | --- | --- | --- | --- | --- |
| Scenic ownership quality | A.1 preserve-first; A.5 layer ownership | Documentation-only rule (human-review-first) | Screenshot/signoff artifacts; reviewer comparison | Keep human review primary | No hard objective signal can evaluate scenic authorship quality without high false positives. |
| Mockup mood fit | A.1 atmosphere authority | Documentation-only rule (human-review-first) | Screenshot review workflow and reviewer notes | Keep human review primary | Mood fit is subjective judgment and must not be flattened into style linting. |
| Hero vs dense emotional treatment | A.1 hero-vs-dense split; A.5 family matrix | Documentation-only rule (human-review-first) | Family-aware screenshot review | Keep human review primary | Family emotional treatment is semantic/experiential, not a deterministic source property. |
| “Feels ceremonial” judgments | A.1/A.5 ritual identity expectations | Documentation-only rule (human-review-first) | Ritual-surface screenshots and signoff | Keep human review primary | Ceremony quality is a subjective judgment requiring context and comparative interpretation. |
| Banned blue remnants on tracked surfaces | A.9 stability/visual truth guardrails | Repo-backed enforcement hook (reuse existing) | `liveSurfaceVisualAudit.ts` + manifest + integration test | Reuse existing hook first | Pattern-matched color remnants on tracked files are hard objective signals. |
| Disallowed size-changing hover/selected states | A.9 no layout shift | Repo-backed enforcement hook (reuse existing, plus human verification) | `liveSurfaceVisualAudit.ts` state-block property scan; layout interaction stability matrix test | Reuse existing hook first; extend only if scoped gaps proven | Risky properties in state blocks are objective; final UX behavior still needs screenshot/human confirmation. |
| Direct emoji / non-registry icon use on tracked surfaces | A.9 truth/readability consistency | Repo-backed enforcement hook (reuse existing) | `liveSurfaceVisualAudit.ts` icon checks; `check:icons` ecosystem | Reuse existing hook first | Direct import/glyph patterns are deterministic and low false-positive when scoped to tracked files. |
| Missing `uiNoShift` hooks on tracked controls | A.9 no layout shift operationalization | Lightweight tooling candidate with partial existing support | `liveSurfaceVisualAudit.ts` `noShiftControlTargets` coverage | Extend existing manifest targets only when tracked-surface expansion is declared | Current hook supports known controls; broader coverage should stay scoped to tracked surfaces. |
| Critical truth visibility on tracked surfaces | A.9 no hover-only critical truth | Candidate later with partial existing support + human review required | `surfaceTruthAudit.ts` + integration test + screenshot review | Extend existing truth audit cautiously for explicit signals; keep reviewer-owned meaning checks | Some truth failures are detectable (leaks/stale copy), but full critical-truth comprehension still needs human judgment. |
| Unsupported mechanic implication on tracked surfaces | A.1 current gameplay truth; A.9 mechanic implication guardrail | Candidate later with partial existing support + human review required | `surfaceTruthAudit.ts`, `vocabularyAudit.ts`, release QA review | Prefer manual review with targeted extensions for explicit anti-pattern strings | Mechanic implication is partly lexical and partly contextual; full automation would over/under-catch. |
| Missing screenshot-approval artifact references in cleanup packets | A.6 screenshot approval and cutover evidence | Lightweight tooling candidate (packet-doc level) | No canonical packet artifact parser today; rely on review docs/signoff sheet | Human review now; only propose linting if packet artifacts become repo-standardized | This is packet-document structure validation, not runtime/source diagnostics. |
| Prompt/template packet missing preserved-art declaration | A.1/A.8 additive-only + retained old layer declarations | Lightweight tooling candidate (packet-doc level) | `UI_PACKET_SCHEMA.md` doctrine + reviewer checklists | Human review now; consider schema-lint only if packet docs are standardized in-repo | Checkability depends on standardized packet artifact storage and strict field format. |

### Enforcement class interpretation

- **Documentation-only rule**: human review and signoff are primary and non-transferable.
- **Repo-backed enforcement hook**: objective failures should fail checks on scoped tracked surfaces/files.
- **Lightweight tooling candidate**: later extension may be justified only with explicit criteria and reuse-first proof.

## Criteria for promoting a rule into repo-backed enforcement

A later packet may propose a new or extended hook only when **all** are true:

1. pass/fail is objective and deterministic;
2. scope is narrow and tied to tracked surfaces/files;
3. false-positive risk is low enough for routine CI/release usage;
4. existing hooks are proven insufficient or inapplicable;
5. failure is meaningful enough to justify maintenance overhead;
6. proposal states that hook complements, not replaces, screenshot/signoff review.

If any condition fails, do not automate in that packet.

## Criteria for keeping a rule human-only

A rule must remain documentation-only when any of the following is true:

1. success depends on taste, mood, emotional fit, or ceremonial quality;
2. source-level checks would overfit and become brittle;
3. required evidence is primarily screenshot comparison and reviewer interpretation;
4. automation would likely produce false confidence;
5. the real question is experiential (“does this feel right?”), not deterministic (“did this property change?”).

## Packet-author guidance

Later packets must explicitly choose one enforcement move:

- `Human review only`
- `Reuse existing repo-backed hook`
- `Extend existing repo-backed hook`
- `No new hook justified`

Mandatory packet behavior:

1. A packet must not add enforcement code merely because a rule is important.
2. If a packet touches a tracked surface and introduces a new objective failure mode, it must state whether an existing hook already covers it.
3. If no existing hook covers it, the packet must state why manual review remains correct now or why a later lightweight extension is justified.
4. Packets proposing extension must reference concrete existing hooks and explain why extension beats parallel tooling.

## Reviewer guidance

Reviewers must:

1. reject attempts to automate subjective doctrine without hard objective signal definition;
2. reject bespoke hook frameworks when an existing hook can be extended;
3. reject claims that machine-pass alone proves cleanup readiness, identity success, or mood success;
4. classify failures using this map as one of:
   - tooling-appropriate now,
   - tooling-candidate later,
   - human-review only.

## Relationship to A.6 and A.9

- A.6 governs screenshot approval and cleanup legality.
- A.9 governs no-layout-shift and no-hover-only-truth doctrine.
- A.11 decides where repo-backed enforcement is appropriate for A.6/A.9-adjacent concerns.
- A.11 does not replace signoff or doctrine authority.

## Future packet usage rule

Later packets must cite this map before proposing enforcement work. If a packet introduces a new guard-rail idea, it must classify the idea using this map instead of improvising classes or scope.

This file is the project sanity check against both overengineering and under-enforcement.

## Non-goals

- no new enforcement implementation;
- no new manifests;
- no new tests;
- no release-doc rewrites;
- no packet-template changes;
- no cleanup authority.
