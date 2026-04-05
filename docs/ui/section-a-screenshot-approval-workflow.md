# Section A.6 — Screenshot Approval Workflow

## Purpose

This file defines how screenshot evidence is captured, stored, reviewed, and recorded before any cutover cleanup request. It operationalizes `docs/ui/section-a-cutover-gate.md` into repeatable reviewer workflow. This is a per-screen workflow, not a full release signoff process.

## Relationship to existing release docs

This workflow complements, and does not replace:

- `docs/release/signoff_sheet.md`
- `docs/release/go_no_go_checklist.md`
- `docs/release/live_surface_visual_audit.md`
- `docs/release/ui_cutover_merge_checklist.md` (merge evidence companion)
- `docs/ui/phase-0-p0-14-universal-cutover-gate.md` (operational publication)

Those files remain release-level governance. This file governs one screen, one cutover decision, one artifact trail.

## Roles and responsibilities

### Implementer

The implementer must:

1. identify exact target screen id and family;
2. capture required screenshot set;
3. populate `docs/release/ui_screen_signoff_sheet.md` block for that screen;
4. mark criterion status honestly as pass/fail/N/A;
5. propose `REVIEW READY` only when evidence set is complete.

### Reviewer

The reviewer must:

1. verify each screenshot slot and gate criterion;
2. check family/layer declaration alignment with Section A.5 docs;
3. decide `APPROVED FOR CLEANUP`, `REJECTED — REMAIN ADDITIVE`, or `DEFERRED`;
4. document blockers by criterion.

### Solo mode

If one person is both implementer and reviewer, they may proceed, but must still complete the entire evidence set and signoff sheet. Solo mode never waives evidence requirements.

## Trigger conditions

Screenshot approval workflow is mandatory when a packet:

- requests removal of old conflicting layers;
- claims cleanup readiness for a target screen;
- proposes deleting duplicate old/new framing;
- proposes deleting fallback visuals on an exact screen.

Workflow is not mandatory when a packet is:

- `docs-only`;
- `infra-only`;
- additive-only with all old conflicting layers retained;
- early exploratory work that does not request cleanup permission.

## Evidence storage convention

Screenshot evidence must be stored under:

- `docs/release/qa/ui-cutover/<screen-id>/`

Core naming convention:

- `01-base.png`
- `02-interaction.png`
- `03-truth-states.png`
- `04-high-fx.png`
- `05-low-fx.png`
- `06-reduced-motion.png`

Additional files may be added if needed (`07-*`, `08-*`), but the six core slots remain required for review completeness.

This packet is documentation-only and does not create screenshot artifacts.

## Required screenshot set (mandatory capture matrix)

| Evidence slot | Required | Required content | Pass condition | Failure condition |
| --- | --- | --- | --- | --- |
| Base/default | Yes | Additive version of exact target screen with required old scenic/base ownership still present pre-approval | Shows intended additive composition and retained old owner | Missing, wrong screen, or old owner already removed |
| Interaction | Yes (if interaction exists) | Hover and/or selected state capture | Interaction states visible and layout-stable | Missing relevant interaction state or layout shift |
| Truth states | Yes (if states exist) | Ready/warning/recommended state capture | States remain clear, reserved, and non-resizing | Missing truth state evidence or state ambiguity |
| High FX | Yes | FX-high render | Coherent and readable | Illegible/noisy or missing capture |
| Low FX | Yes | FX-low render | Coherent and readable | Incoherent downgrade or missing capture |
| Reduced Motion | Yes | Reduced-motion render | Coherent and readable with motion constraints | Missing capture or reduced-motion breakage |

Mandatory rule: if a slot is not applicable on that exact target screen, mark `N/A` with reason in the signoff sheet. Omission is invalid.

## Workflow steps

1. **Declare target screen.**
   - Use exact screen id and owner files from `docs/ui/section-a-touchpoint-registry.md`.
   - Declare family/intensity/layers using Section A.5 docs.

2. **Capture evidence.**
   - Produce six core evidence slots using naming convention.
   - Ensure base screenshot still includes required old scenic/base ownership before approval.

3. **Prepare signoff block.**
   - Fill metadata and evidence tables in `docs/release/ui_screen_signoff_sheet.md`.
   - Enter pass/fail/N/A for each gate criterion.

4. **Reviewer audit.**
   - Validate all criterion claims against screenshots.
   - Confirm no duplicate framing, no missing controls, no layout shifts, and unchanged gameplay truth semantics.

5. **Decision.**
   - Record one final status: `APPROVED FOR CLEANUP`, `REJECTED — REMAIN ADDITIVE`, or `DEFERRED`.
   - If approved, list exact cleanup unlock scope.

6. **Post-decision handling.**
   - Approved: cleanup request may remove only listed conflicting layers for that exact target screen.
   - Rejected/Deferred: no cleanup; follow-up remains additive/corrective.


## Phase 1 Wave 0 support-art proof mode (P1-01A)

This workflow remains cutover-first. A second, bounded use is now defined for Phase 1 Wave 0 support-art proof.

### What Wave 0 proof is

- Evidence used to justify whether a later support-art request is a real missing-role request.
- Slot-compatible with this workflow (`01-base` through `06-reduced-motion`, optional `07-narrow`).
- Stored in the same QA folder convention: `docs/release/qa/ui-cutover/<screen-id>/`.

### What Wave 0 proof is not

- Not cleanup authorization.
- Not permission to remove or replace current scenic/thematic owners.
- Not proof that a screen is cut over.

### Citation requirements for later Phase 1 art packets

Every later support-art packet must cite:

1. the relevant row(s) in `docs/ui/phase-1-wave0-screenshot-matrix.md`;
2. the screenshot folder path(s) under `docs/release/qa/ui-cutover/<screen-id>/`;
3. exact evidence slot filename(s) used as proof;
4. the missing-role statement tied to those slots.

If the proof row is incomplete, the support-art request is not reviewable.

### Harness and manual-route coexistence rule

Harness-backed and manual-route surfaces may coexist in one proof system. When no deterministic harness exists, the route must be documented as manual live navigation; missing harness coverage must be reported honestly and not papered over with invented routes.

## Family-specific capture emphasis

- **Hero ritual screens:** verify centerpiece coherence, retained scenic ownership, and that support cards did not flatten hero identity.
- **Scenic world screen:** verify map ownership, label clarity, and right-side explanatory surface coherence.
- **Module activity screens:** verify role clarity and local truth; reject spectacle-first noise.
- **Dense management screens:** verify operational readability, no layout-shift regressions, no scenic takeover.
- **Ritual modals:** verify ceremony framing with explicit decision clarity and controlled effects.

## Approval recording rule

All screen approvals or rejections must be recorded in:

- `docs/release/ui_screen_signoff_sheet.md`

Minimum required metadata fields:

- target screen id;
- screen family;
- packet id;
- touched layers;
- retained old layer(s);
- screenshot folder path;
- implementer;
- reviewer;
- date;
- pass/fail per gate criterion;
- final decision;
- blockers/notes.

## Failure path

If any criterion fails:

1. screen remains additive-only;
2. no destructive cleanup is allowed;
3. old conflicting layer remains;
4. blockers are logged by criterion id or criterion text;
5. follow-up packet must be additive/corrective, not cleanup;
6. screenshot recapture is allowed only after fixes are applied.

## Worked dry-run example (procedural, not real approval)

**Target screen:** `cultivation-main`

**Family/layer declaration:** Hero ritual screens; touching Layer 2 and Layer 3; Layer 1 retained; Layer 4 deferred.

**Dry-run evidence expectation:**

- `01-base.png` must show additive Cultivation layout while old scenic owner remains visible.
- `02-interaction.png` must prove selected/hover controls do not shift panel/chip dimensions.
- `03-truth-states.png` must show ready/warning/recommended without missing icons or labels.
- FX captures must show coherent High/Low/Reduced Motion behavior.

**Dry-run failure catches:**

- duplicate ribbon/frame stack appears in base capture → fail criterion 3;
- old scenic owner absent pre-approval → fail criterion 2;
- floating hero/plaque cutout appears in interaction capture → blocker;
- missing action icon/label in truth-state capture → fail criterion 4;
- selection badge causes row/card resize → fail criterion 6.

**Dry-run result:** `REJECTED — REMAIN ADDITIVE` until all blockers are corrected and evidence is recaptured.

## Packet-author reminder

Screenshot approval is mandatory evidence for cleanup requests. If required evidence is missing, cleanup must be explicitly deferred. Future prompts must not describe cleanup as “finishing touches” without citing this workflow.

## Non-goals

- no screenshot automation;
- no visual implementation;
- no CI integration;
- no release-wide signoff replacement;
- no screen redesign.
