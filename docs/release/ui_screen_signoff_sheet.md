# UI Screen Signoff Sheet

This file is the per-screen cutover approval template used before destructive UI cleanup.

## Companion docs

- Operational cutover publication: `docs/ui/phase-0-p0-14-universal-cutover-gate.md`
- Legal doctrine source: `docs/ui/section-a-cutover-gate.md`
- Screenshot workflow: `docs/ui/section-a-screenshot-approval-workflow.md`
- Merge evidence checklist: `docs/release/ui_cutover_merge_checklist.md`

## Usage note

- Use one block per target screen.
- This template records screenshot evidence and hard-gate outcomes.
- This is smaller than `docs/release/signoff_sheet.md` and does not replace release-level signoff.

---

## Screen Cutover Signoff Block (Template)

### Metadata

- target screen id:
- human label:
- dominant family:
- packet id:
- touched layers:
- retained old layer(s):
- screenshot evidence folder:
- implementer:
- reviewer:
- review date:

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. |  |  |
| G2 | The old scenic/base layer is still present until approval. |  |  |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. |  |  |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. |  |  |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. |  |  |
| G6 | Hover, selected, recommended, and warning states do not shift layout. |  |  |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. |  |  |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. |  |  |

`* N/A` is permitted only when the criterion is truly not applicable to the exact target screen and the reason is written in notes.

### Screenshot evidence table

| evidence slot | required? | file/path | status | notes |
| --- | --- | --- | --- | --- |
| base/default (`01-base.png`) | Yes |  |  | Must show additive version with required old scenic/base ownership still present pre-approval. |
| interaction (`02-interaction.png`) | Yes if interaction exists |  |  | Capture hover and/or selected states where relevant. |
| truth states (`03-truth-states.png`) | Yes if truth states exist |  |  | Capture ready/warning/recommended where relevant. |
| High FX (`04-high-fx.png`) | Yes |  |  |  |
| Low FX (`05-low-fx.png`) | Yes |  |  |  |
| Reduced Motion (`06-reduced-motion.png`) | Yes |  |  |  |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`:

(Exactly one final decision state must be selected for each completed review block.)

### Blockers / follow-up

- blockers:
- required follow-up packet:
- cleanup scope unlocked if approved (exact conflicting layer(s) only):
- reviewer rationale summary:
- unresolved risks after decision:

---

## Decision discipline note

Approval recorded here does not authorize cleanup outside the exact target screen.

## Record completeness note

Incomplete fields invalidate the review block. Do not mark cleanup approved until metadata, gate statuses, evidence paths, and final decision fields are fully populated.

---

## D.10R Hero-screen signoff review (2026-04-09)

### Metadata

- target screen id: `cultivation`
- human label: Cultivation Hero Surface
- dominant family: hero ritual screen
- packet id: `D10R-Followup`
- touched layers: docs-only evidence/signoff verification
- retained old layer(s): cultivator/dantian center, Qi bar, breakthrough truth surfaces
- screenshot evidence folder: `docs/release/qa/ui-cutover/cultivation/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-09

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | Required `01-06` PNG files are missing at folder root; only README scaffolding exists in documented subfolders. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No cleanup was executed in D.10R. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Not certifiable without screenshot evidence. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Not certifiable without interaction/truth-state screenshots. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` screenshots missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Interaction/truth-state screenshots missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Evidence matrix absent. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup remains locked. |

### Screenshot evidence table

| evidence slot | required? | file/path | status | notes |
| --- | --- | --- | --- | --- |
| base/default (`01-base.png`) | Yes | `docs/release/qa/ui-cutover/cultivation/01-base.png` | MISSING | root missing; subfolders contain README scaffolding only |
| interaction (`02-interaction.png`) | Yes if interaction exists | `docs/release/qa/ui-cutover/cultivation/02-interaction.png` | MISSING | root missing; subfolders contain README scaffolding only |
| truth states (`03-truth-states.png`) | Yes if truth states exist | `docs/release/qa/ui-cutover/cultivation/03-truth-states.png` | MISSING | root missing; subfolders contain README scaffolding only |
| High FX (`04-high-fx.png`) | Yes | `docs/release/qa/ui-cutover/cultivation/04-high-fx.png` | MISSING | root missing; subfolders contain README scaffolding only |
| Low FX (`05-low-fx.png`) | Yes | `docs/release/qa/ui-cutover/cultivation/05-low-fx.png` | MISSING | root missing; subfolders contain README scaffolding only |
| Reduced Motion (`06-reduced-motion.png`) | Yes | `docs/release/qa/ui-cutover/cultivation/06-reduced-motion.png` | MISSING | root missing; subfolders contain README scaffolding only |

### Final decision block

- `REVIEW READY`: 
- `APPROVED FOR CLEANUP`: 
- `REJECTED — REMAIN ADDITIVE`: 
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Required screenshot set missing (`01-06`).
- required follow-up packet: D10R-Followup (manual captures + reviewer decision)
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: Evidence gate not satisfied; remain additive.
- unresolved risks after decision: duplicate/routing/truth-readability claims remain unverified visually.

---

### Metadata

- target screen id: `status`
- human label: Status Hero Surface
- dominant family: hero ritual screen
- packet id: `D10R-Followup`
- touched layers: docs-only evidence/signoff verification
- retained old layer(s): RunCompass + six-card diagnostic chamber + summary header truth
- screenshot evidence folder: `docs/release/qa/ui-cutover/status/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-09

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | Required `01-06` PNG files are missing at folder root; only README scaffolding exists in documented subfolders. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No cleanup was executed in D.10R. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Not certifiable without screenshot evidence. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Not certifiable without interaction/truth-state screenshots. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` screenshots missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Interaction/truth-state screenshots missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Evidence matrix absent. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup remains locked. |

### Screenshot evidence table

| evidence slot | required? | file/path | status | notes |
| --- | --- | --- | --- | --- |
| base/default (`01-base.png`) | Yes | `docs/release/qa/ui-cutover/status/01-base.png` | MISSING | root missing; subfolders contain README scaffolding only |
| interaction (`02-interaction.png`) | Yes if interaction exists | `docs/release/qa/ui-cutover/status/02-interaction.png` | MISSING | root missing; subfolders contain README scaffolding only |
| truth states (`03-truth-states.png`) | Yes if truth states exist | `docs/release/qa/ui-cutover/status/03-truth-states.png` | MISSING | root missing; subfolders contain README scaffolding only |
| High FX (`04-high-fx.png`) | Yes | `docs/release/qa/ui-cutover/status/04-high-fx.png` | MISSING | root missing; subfolders contain README scaffolding only |
| Low FX (`05-low-fx.png`) | Yes | `docs/release/qa/ui-cutover/status/05-low-fx.png` | MISSING | root missing; subfolders contain README scaffolding only |
| Reduced Motion (`06-reduced-motion.png`) | Yes | `docs/release/qa/ui-cutover/status/06-reduced-motion.png` | MISSING | root missing; subfolders contain README scaffolding only |

### Final decision block

- `REVIEW READY`: 
- `APPROVED FOR CLEANUP`: 
- `REJECTED — REMAIN ADDITIVE`: 
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Required screenshot set missing (`01-06`).
- required follow-up packet: D10R-Followup (manual captures + reviewer decision)
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: Evidence gate not satisfied; remain additive.
- unresolved risks after decision: diagnostic readability/motion-mode coherence remain unverified visually.

---

## Phase 0 overall branch-safety summary (P0-15)

- final verdict: `NOT SAFE FOR PHASE 1`
- report path: `docs/ui/phase-0-p0-15-exit-audit-and-handoff.md`
- blocker count: 10 blocked target screens (cross-screen evidence-completeness blocker)
- watchpoint count: 3 grouped handoff categories (`phase1-support-art`, `phase2-shell`, `later-polish`)

---

## C.12 Section C closeout reviews (2026-03-31)

Audit note (C.12R-A): run `npm run release:section-c-evidence-audit` for machine validation of required Section C evidence slots before human review.

### Metadata

- target screen id: `life-start-path`
- human label: Life Start — Path Step
- dominant family: hero ritual
- packet id: `C.12`
- touched layers: L2/L3 review only (no destructive edits)
- retained old layer(s): scenic/base portrait ownership retained in additive composition
- screenshot evidence folder: `docs/release/qa/ui-cutover/life-start-path/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-03-31

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | No `01-06` PNG evidence artifacts are present in-repo. |
| G2 | The old scenic/base layer is still present until approval. | PASS | Additive doctrine retained; no cleanup patch performed. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Requires visual evidence review; unresolved without screenshot set. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Requires interaction/truth-state screenshots for verification. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | FX-mode screenshots missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Interaction/truth captures missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Could not be approved without evidence captures. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`: 
- `APPROVED FOR CLEANUP`: 
- `REJECTED — REMAIN ADDITIVE`: 
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Missing required screenshot set for cutover gate.
- required follow-up packet: C.12R (evidence recapture + reviewer signoff)
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: Deferred for proof gap, not redesign scope.
- unresolved risks after decision: duplicate-vs-conflict state not conclusively proven visually.

### Metadata

- target screen id: `life-start-heart-law`
- human label: Life Start — Heart Law Step
- dominant family: hero ritual
- packet id: `C.12`
- touched layers: L2/L3 review only (no destructive edits)
- retained old layer(s): additive shell and inherited scenic ownership retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/life-start-heart-law/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-03-31

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | Required image set is missing. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup executed. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Not approvable without visual proof. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Truth-state screenshots missing. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | FX evidence unavailable. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Interaction evidence unavailable. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Cannot certify without captures. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup remains locked. |

### Final decision block

- `REVIEW READY`: 
- `APPROVED FOR CLEANUP`: 
- `REJECTED — REMAIN ADDITIVE`: 
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Screenshot gate incomplete.
- required follow-up packet: C.12R (manual captures + reviewer decision)
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: Evidence-first rule blocks cleanup.
- unresolved risks after decision: mixed old/new composition still unproven per gate.

### Metadata

- target screen id: `life-start-breath-focus`
- human label: Life Start — Breath Focus Step
- dominant family: hero ritual / ritual selection
- packet id: `C.12`
- touched layers: L2/L3 review only (no destructive edits)
- retained old layer(s): additive modal shell retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/life-start-breath-focus/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-03-31

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | No image artifacts present. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No cleanup execution in C.12 doc pass. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Visual conflict check pending evidence. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Missing truth-state evidence. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | Missing 04/05/06 captures. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Missing 02/03 captures. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Not certifiable without evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Not unlocked. |

### Final decision block

- `REVIEW READY`: 
- `APPROVED FOR CLEANUP`: 
- `REJECTED — REMAIN ADDITIVE`: 
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Required screenshot set missing.
- required follow-up packet: C.12R
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: Deferred due evidence deficiency only.
- unresolved risks after decision: layout-shift and mode coherence remain unproven.

### Metadata

- target screen id: `dao-heart-law`
- human label: Dao Heart Modal — Heart Law Tab
- dominant family: hero ritual modal
- packet id: `C.12`
- touched layers: L2/L3 review only (no destructive edits)
- retained old layer(s): additive modal/base ownership retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/dao-heart-law/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-03-31

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | Missing `01-06` PNG captures. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No cleanup was performed. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Requires reviewer screenshot evidence. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Missing interaction/truth-state captures. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | FX captures unavailable. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | No artifact proof for this criterion. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Cannot be accepted without evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Locked. |

### Final decision block

- `REVIEW READY`: 
- `APPROVED FOR CLEANUP`: 
- `REJECTED — REMAIN ADDITIVE`: 
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Missing screenshot evidence set.
- required follow-up packet: C.12R
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: Deferred until evidence pack exists.
- unresolved risks after decision: unresolved visual conflict proof.

### Metadata

- target screen id: `dao-heart-study`
- human label: Dao Heart Modal — Study Tab
- dominant family: ritual modal / support
- packet id: `C.12`
- touched layers: L2/L3 review only (no destructive edits)
- retained old layer(s): additive modal/base ownership retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/dao-heart-study/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-03-31

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | Missing required screenshot slots. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup in C.12 changes. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Needs screenshot proof. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Needs screenshot proof. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | Missing FX captures. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Missing interaction captures. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Not provable from docs-only pass. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Locked. |

### Final decision block

- `REVIEW READY`: 
- `APPROVED FOR CLEANUP`: 
- `REJECTED — REMAIN ADDITIVE`: 
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Screenshot set missing.
- required follow-up packet: C.12R
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: Deferred under evidence-first cutover gate.
- unresolved risks after decision: duplicate/conflict criteria unverified.

### Metadata

- target screen id: `change-heart-law`
- human label: Change Heart Law Modal
- dominant family: ritual modal
- packet id: `C.12`
- touched layers: L2/L3 review only (no destructive edits)
- retained old layer(s): additive ownership retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/change-heart-law/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-03-31

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | Capture artifacts not present. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No cleanup changes were applied. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Cannot verify absent screenshots. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Cannot verify absent screenshots. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | Cannot verify absent screenshots. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Cannot verify absent screenshots. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Cannot verify absent screenshots. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Locked. |

### Final decision block

- `REVIEW READY`: 
- `APPROVED FOR CLEANUP`: 
- `REJECTED — REMAIN ADDITIVE`: 
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: required `01-06` screenshots missing.
- required follow-up packet: C.12R
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: deferred pending visual proof.
- unresolved risks after decision: quality/motion truth unverified.

### Metadata

- target screen id: `prestige-ritual`
- human label: Prestige Ritual Modal
- dominant family: ritual modal
- packet id: `C.12`
- touched layers: L2/L3 review only (no destructive edits)
- retained old layer(s): additive ownership retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/prestige-ritual/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-03-31

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | Missing required evidence images. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup applied in this packet. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Visual proof unavailable. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Visual proof unavailable. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | Visual proof unavailable. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Visual proof unavailable. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Visual proof unavailable. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Locked. |

### Final decision block

- `REVIEW READY`: 
- `APPROVED FOR CLEANUP`: 
- `REJECTED — REMAIN ADDITIVE`: 
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Missing screenshot evidence pack.
- required follow-up packet: C.12R
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: Deferred pending evidence capture.
- unresolved risks after decision: state coherence pending manual visual check.

### Metadata

- target screen id: `current-chapter-exhausted`
- human label: Current Chapter Exhausted Modal
- dominant family: ritual modal
- packet id: `C.12`
- touched layers: L2/L3 review only (no destructive edits)
- retained old layer(s): additive ownership retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/current-chapter-exhausted/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-03-31

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | No evidence PNG files found. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup performed. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Requires visual proof. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Requires visual proof. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | Requires visual proof. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Requires visual proof. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Requires visual proof. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`: 
- `APPROVED FOR CLEANUP`: 
- `REJECTED — REMAIN ADDITIVE`: 
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: screenshot evidence set absent.
- required follow-up packet: C.12R
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: Deferred because gate criteria cannot be proven.
- unresolved risks after decision: duplicate/floating-frame checks pending.

### Metadata

- target screen id: `life-summary`
- human label: Life Summary Modal
- dominant family: ritual modal
- packet id: `C.12`
- touched layers: L2/L3 review only (no destructive edits)
- retained old layer(s): additive ownership retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/life-summary/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-03-31

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | Required screenshot artifacts not present in folder. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No cleanup executed. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Needs visual proof. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Needs visual proof. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | Needs visual proof. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Needs visual proof. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Needs visual proof. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`: 
- `APPROVED FOR CLEANUP`: 
- `REJECTED — REMAIN ADDITIVE`: 
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: full screenshot set missing.
- required follow-up packet: C.12R
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: Deferred under strict evidence-first gate.
- unresolved risks after decision: unresolved visual conflict/layout checks.

---

## C.12R-B engineering evidence ingest (2026-03-31)

Reviewer remains pending human review. This section records engineering evidence ingestion only.

| target screen id | evidence folder | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | decision | blocker summary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `life-start-path` | `docs/release/qa/ui-cutover/life-start-path/` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | `DEFERRED` | Missing `01,02,04,05,06` PNG files. |
| `life-start-heart-law` | `docs/release/qa/ui-cutover/life-start-heart-law/` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | `DEFERRED` | Missing `01,02,03,04,05,06` PNG files. |
| `life-start-breath-focus` | `docs/release/qa/ui-cutover/life-start-breath-focus/` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | `DEFERRED` | Missing `01,02,04,05,06` PNG files. |
| `dao-heart-law` | `docs/release/qa/ui-cutover/dao-heart-law/` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | `DEFERRED` | Missing `01,02,03,04,05,06` PNG files. |
| `dao-heart-study` | `docs/release/qa/ui-cutover/dao-heart-study/` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | `DEFERRED` | Missing `01,02,04,05,06` PNG files. |
| `change-heart-law` | `docs/release/qa/ui-cutover/change-heart-law/` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | `DEFERRED` | Missing `01,02,03,04,05,06` PNG files. |
| `prestige-ritual` | `docs/release/qa/ui-cutover/prestige-ritual/` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | `DEFERRED` | Missing `01,02,03,04,05,06` PNG files. |
| `current-chapter-exhausted` | `docs/release/qa/ui-cutover/current-chapter-exhausted/` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | `DEFERRED` | Missing `01,02,04,05,06` PNG files. |
| `life-summary` | `docs/release/qa/ui-cutover/life-summary/` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | `DEFERRED` | Missing `01,02,03,04,05,06` PNG files. |

Source of truth for missing evidence: `npm run release:section-c-evidence-audit -- --json` executed on 2026-03-31.

---

## D.10 Section D hero-screen reviews (2026-04-01)

### Metadata

- target screen id: `cultivation`
- human label: Cultivation Hero Surface
- dominant family: hero ritual
- packet id: `D.10`
- touched layers: docs-only gate review (no runtime layer change)
- retained old layer(s): cultivator/dantian scenic center + existing cultivation truth shells
- screenshot evidence folder: `docs/release/qa/ui-cutover/cultivation/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-01

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | `01-06` screenshots are missing. |
| G2 | The old scenic/base layer is still present until approval. | PASS | D.10 is docs-only and performed no cleanup. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Cannot validate without screenshot evidence review. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Truth-state screenshots missing. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` screenshots missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Interaction screenshots missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | No screenshot evidence for final review. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Missing required screenshot evidence pack.
- required follow-up packet: D.10R (capture evidence + reviewer signoff)
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: Deferred for evidence gap only.
- unresolved risks after decision: duplicate-chrome and layout-shift criteria remain unproven.

### Metadata

- target screen id: `status`
- human label: Status Hero Surface
- dominant family: hero ritual
- packet id: `D.10`
- touched layers: docs-only gate review (no runtime layer change)
- retained old layer(s): Run Compass + six-card diagnostic ownership + summary truth shell
- screenshot evidence folder: `docs/release/qa/ui-cutover/status/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-01

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | `01-06` screenshots are missing. |
| G2 | The old scenic/base layer is still present until approval. | PASS | D.10 is docs-only and performed no cleanup. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Cannot validate without screenshot evidence review. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Truth-state screenshots missing. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` screenshots missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Interaction screenshots missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | No screenshot evidence for final review. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Missing required screenshot evidence pack.
- required follow-up packet: D.10R (capture evidence + reviewer signoff)
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: Deferred for evidence gap only.
- unresolved risks after decision: duplicate-chrome and layout-shift criteria remain unproven.

---

## D.10R Section D hero-screen evidence completion review (2026-04-01)

### Metadata

- target screen id: `cultivation`
- human label: Cultivation Hero Surface
- dominant family: hero ritual
- packet id: `D.10R`
- screenshot evidence folder: `docs/release/qa/ui-cutover/cultivation/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-01

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | Required `01-06` PNG files are still missing. |
| G2 | The old scenic/base layer is still present until approval. | PASS | D.10R is docs-only and does not perform cleanup. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Cannot validate without screenshot evidence. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Cannot validate without screenshot evidence. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` screenshot evidence missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Interaction/truth-state screenshot evidence missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Cannot validate without screenshot evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup remains locked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Missing Cultivation evidence matrix (`01-06`).
- required follow-up packet: D.10R-Followup (manual capture in browser-capable environment + reviewer signoff)
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none

### Metadata

- target screen id: `status`
- human label: Status Hero Surface
- dominant family: hero ritual
- packet id: `D.10R`
- screenshot evidence folder: `docs/release/qa/ui-cutover/status/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-01

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | Required `01-06` PNG files are still missing. |
| G2 | The old scenic/base layer is still present until approval. | PASS | D.10R is docs-only and does not perform cleanup. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Cannot validate without screenshot evidence. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Cannot validate without screenshot evidence. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` screenshot evidence missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Interaction/truth-state screenshot evidence missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Cannot validate without screenshot evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup remains locked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Missing Status evidence matrix (`01-06`).
- required follow-up packet: D.10R-Followup (manual capture in browser-capable environment + reviewer signoff)
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none

---

## Phase 0 core-screen evidence sweep (completion pass 02, 2026-04-05)

### Metadata

- target screen id: `path-life-start`
- human label: Path / Life Start
- dominant family: hero ritual
- packet id: `P0-COMP-02`
- touched layers: evidence/signoff only (no runtime edits)
- retained old layer(s): all existing scenic/base owners retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/phase-0-core-screens/01-path-life-start/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-05

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | `01-06` evidence artifacts are missing in-repo. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup performed in this packet. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Visual proof absent. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Interaction/truth-state screenshots missing. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` captures missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | `02/03` captures missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | No complete screenshot evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Metadata

- target screen id: `cultivation`
- human label: Cultivation
- dominant family: hero ritual
- packet id: `P0-COMP-02`
- touched layers: evidence/signoff only (no runtime edits)
- retained old layer(s): all existing scenic/base owners retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/phase-0-core-screens/02-cultivation/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-05

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | `01-06` evidence artifacts are missing in-repo. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup performed in this packet. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Visual proof absent. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Interaction/truth-state screenshots missing. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` captures missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | `02/03` captures missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | No complete screenshot evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Metadata

- target screen id: `status`
- human label: Status
- dominant family: dense management
- packet id: `P0-COMP-02`
- touched layers: evidence/signoff only (no runtime edits)
- retained old layer(s): all existing scenic/base owners retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/phase-0-core-screens/03-status/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-05

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | `01-06` evidence artifacts are missing in-repo. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup performed in this packet. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Visual proof absent. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Interaction/truth-state screenshots missing. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` captures missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | `02/03` captures missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | No complete screenshot evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Metadata

- target screen id: `world`
- human label: World
- dominant family: scenic world
- packet id: `P5-11`
- touched layers: world acceptance docs/tooling + stale-copy blocker fix
- retained old layer(s): all existing scenic/base owners retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/phase-0-core-screens/04-world/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-10

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | `01-06` evidence artifacts are still missing in-repo for the canonical world root. |
| G2 | The old scenic/base layer is still present until approval. | PASS | Preserve-first/additive world ownership remains intact; no destructive cleanup was done. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Could not be certified without the required screenshot set. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Could not be certified without the required screenshot set. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | Could not be certified without `04/05/06` captures. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | Could not be certified without interaction/truth-state captures. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | Could not be certified without complete visual evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup remains locked in this packet. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Blockers / follow-up

- blockers: Canonical world screenshot set (`01-06`) is missing; `npm run release:phase0-core-capture:world` is currently blocked here by missing Playwright runtime.
- required follow-up packet: P5-11R (capture-enabled environment run + reviewer visual signoff)
- cleanup scope unlocked if approved (exact conflicting layer(s) only): none
- reviewer rationale summary: world truth/copy checks pass, but visual-cutover criteria cannot be legally certified without image evidence.
- unresolved risks after decision: duplicate-state/layout-shift/fx coherence remain unproven visually until captures land.

### Metadata

- target screen id: `manual-pavilion`
- human label: Manual Pavilion
- dominant family: module activity
- packet id: `P0-COMP-02`
- touched layers: evidence/signoff only (no runtime edits)
- retained old layer(s): all existing scenic/base owners retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/phase-0-core-screens/05-manual-pavilion/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-05

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | `01-06` evidence artifacts are missing in-repo. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup performed in this packet. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Visual proof absent. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Interaction/truth-state screenshots missing. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` captures missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | `02/03` captures missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | No complete screenshot evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Metadata

- target screen id: `techniques`
- human label: Techniques
- dominant family: dense management
- packet id: `P0-COMP-02`
- touched layers: evidence/signoff only (no runtime edits)
- retained old layer(s): all existing scenic/base owners retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/phase-0-core-screens/06-techniques/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-05

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | `01-06` evidence artifacts are missing in-repo. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup performed in this packet. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Visual proof absent. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Interaction/truth-state screenshots missing. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` captures missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | `02/03` captures missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | No complete screenshot evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Metadata

- target screen id: `apothecary`
- human label: Apothecary
- dominant family: module activity
- packet id: `P0-COMP-02`
- touched layers: evidence/signoff only (no runtime edits)
- retained old layer(s): all existing scenic/base owners retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/phase-0-core-screens/07-apothecary/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-05

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | `01-06` evidence artifacts are missing in-repo. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup performed in this packet. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Visual proof absent. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Interaction/truth-state screenshots missing. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` captures missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | `02/03` captures missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | No complete screenshot evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Metadata

- target screen id: `forge`
- human label: Forge
- dominant family: module activity
- packet id: `P0-COMP-02`
- touched layers: evidence/signoff only (no runtime edits)
- retained old layer(s): all existing scenic/base owners retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/phase-0-core-screens/08-forge/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-05

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | `01-06` evidence artifacts are missing in-repo. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup performed in this packet. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Visual proof absent. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Interaction/truth-state screenshots missing. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` captures missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | `02/03` captures missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | No complete screenshot evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Metadata

- target screen id: `bounties-expeditions`
- human label: Bounties / Expeditions
- dominant family: module activity
- packet id: `P0-COMP-02`
- touched layers: evidence/signoff only (no runtime edits)
- retained old layer(s): all existing scenic/base owners retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/phase-0-core-screens/09-bounties-expeditions/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-05

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | `01-06` evidence artifacts are missing in-repo. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup performed in this packet. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Visual proof absent. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Interaction/truth-state screenshots missing. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` captures missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | `02/03` captures missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | No complete screenshot evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

### Metadata

- target screen id: `prestige`
- human label: Prestige
- dominant family: dense management / ritual-linked
- packet id: `P0-COMP-02`
- touched layers: evidence/signoff only (no runtime edits)
- retained old layer(s): all existing scenic/base owners retained
- screenshot evidence folder: `docs/release/qa/ui-cutover/phase-0-core-screens/10-prestige/`
- implementer: Codex (GPT-5.3-Codex)
- reviewer: Pending human reviewer
- review date: 2026-04-05

### Legal cutover gate checklist

| criterion id | question | status (`PASS`/`FAIL`/`N/A*`) | notes |
| --- | --- | --- | --- |
| G1 | A complete screenshot set exists for the exact target screen. | FAIL | `01-06` evidence artifacts are missing in-repo. |
| G2 | The old scenic/base layer is still present until approval. | PASS | No destructive cleanup performed in this packet. |
| G3 | No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain in the reviewed target composition. | FAIL | Visual proof absent. |
| G4 | No icons, buttons, or labels are missing compared with the old screen’s live truth. | FAIL | Interaction/truth-state screenshots missing. |
| G5 | High FX, Low FX, and Reduced Motion all remain coherent and readable. | FAIL | `04/05/06` captures missing. |
| G6 | Hover, selected, recommended, and warning states do not shift layout. | FAIL | `02/03` captures missing. |
| G7 | The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully. | FAIL | No complete screenshot evidence. |
| G8 | Only after all prior criteria pass may the old conflicting layer be removed. | FAIL | Cleanup not unlocked. |

### Final decision block

- `REVIEW READY`:
- `APPROVED FOR CLEANUP`:
- `REJECTED — REMAIN ADDITIVE`:
- `DEFERRED`: **SELECTED**

---

## P3-12A Section C refresh (2026-04-09)

Evidence audit source: `npm run release:section-c-evidence-audit:json` (failed: required PNG slots missing for all nine surfaces).

Capture automation attempt source: `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --experimental-strip-types scripts/release/captureSectionCEvidence.ts --json` (failed: Playwright/Chromium unavailable in this environment).

### P3-12A gate status matrix (all Section C targets)

| surface id | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | final decision | rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `life-start-path` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | DEFERRED | No required evidence set; additive state retained. |
| `life-start-heart-law` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | DEFERRED | No required evidence set; additive state retained. |
| `life-start-breath-focus` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | DEFERRED | Forced-only harness capture still needed; no evidence set. |
| `dao-heart-law` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | DEFERRED | No required evidence set; additive state retained. |
| `dao-heart-study` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | DEFERRED | No required evidence set; additive state retained. |
| `change-heart-law` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | DEFERRED | State-gated truth-state captures absent. |
| `prestige-ritual` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | DEFERRED | No required evidence set; additive state retained. |
| `current-chapter-exhausted` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | DEFERRED | State-gated evidence absent; truth-state slot N/A does not remove other required slots. |
| `life-summary` | FAIL | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | DEFERRED | Current-mode evidence set absent. |

### P3-12A cleanup verdict
- `APPROVED FOR CLEANUP`: **none**
- `REJECTED — REMAIN ADDITIVE`: none selected in this pass
- `DEFERRED`: **all nine Section C surfaces**

---

## P3-12B final ingest refresh (2026-04-09)

Evidence ingest command source: `npm run release:section-c-evidence-audit:json` → failed (`overallPass: false`, required PNG slots missing).

| surface id | final state | approved for cleanup | rationale |
| --- | --- | --- | --- |
| `life-start-path` | DEFERRED | no | G1 fails (required evidence missing). |
| `life-start-heart-law` | DEFERRED | no | G1 fails (required evidence missing). |
| `life-start-breath-focus` | DEFERRED | no | G1 fails; forced-only harness capture still required. |
| `dao-heart-law` | DEFERRED | no | G1 fails (required evidence missing). |
| `dao-heart-study` | DEFERRED | no | G1 fails (required evidence missing); truth-slot remains explicit N/A unless distinct family appears. |
| `change-heart-law` | DEFERRED | no | G1 fails (required evidence missing). |
| `prestige-ritual` | DEFERRED | no | G1 fails (required evidence missing). |
| `current-chapter-exhausted` | DEFERRED | no | G1 fails (required evidence missing); truth-slot remains N/A. |
| `life-summary` | DEFERRED | no | G1 fails (required evidence missing, current-mode scope only). |

### P3-12B cleanup verdict
- `APPROVED FOR CLEANUP`: **none**
- `DEFERRED`: **all nine Section C surfaces**
