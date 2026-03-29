# UI Screen Signoff Sheet

This file is the per-screen cutover approval template used before destructive UI cleanup.

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
