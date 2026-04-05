# Phase 0 P0-14 — Universal cutover-gate publication

## Purpose
This file is the Phase 0 operational publication of the legal cutover gate. It exists so later packets can cite one short, stable checklist instead of re-deriving cleanup legality from memory. The legal doctrine still lives in Section A source files; this doc is the thin operational entrypoint.

## Dependency state
- `docs/ui/phase-0-source-lock.md`: present.
- `docs/ui/phase-0-packet-register.md`: present.
- `docs/ui/phase-0-p0-04-*` through `docs/ui/phase-0-p0-13-*`: present and reviewed.
- `docs/release/qa/ui-cutover/phase-0-p0-*`: present and reviewed.
- Latest redesign/implementation `.docx` files and explicit design-state record were not present in this snapshot; this publication is anchored to in-repo Section A + release doctrine.

## Deep doctrine sources consumed
- `docs/ui/section-a-cutover-gate.md`
- `docs/ui/section-a-screenshot-approval-workflow.md`
- `docs/release/ui_screen_signoff_sheet.md`
- `docs/release/ui_cutover_red_flags.md`
- `docs/ui/section-a-layout-stability-rules.md`
- `docs/ui/section-a-truth-surfacing-rules.md`

## Universal legal cutover gate
A target screen is cleanup-eligible only when **all** criteria pass:

1. A complete screenshot set exists for the exact target screen.
2. The old scenic/base layer is still present until approval.
3. No duplicate old/new ribbons, frames, headers, or comparable conflicting systems remain.
4. No icons, buttons, or labels are missing compared with old live truth.
5. High FX, Low FX, and Reduced Motion all remain coherent and readable.
6. Hover, selected, recommended, and warning states do not shift layout.
7. The reviewed screen tells the same gameplay truth as before, only more clearly and more beautifully.
8. Only after all prior criteria pass may old conflicting layer be removed.

## Automatic blockers
Any of the following forces `REJECTED — REMAIN ADDITIVE` or `DEFERRED`:

- missing controls/icons/labels;
- duplicate framing (old/new conflict still visible);
- floating cutout or detached fragment;
- scenic owner stripped before approval;
- layout shift in interaction/state transitions;
- gameplay truth less clear than baseline;
- incomplete screenshot set;
- abstract host-shell approval attempt instead of exact-screen approval.

## Required screenshot set
Core evidence slots and filenames:

1. `01-base.png`
2. `02-interaction.png`
3. `03-truth-states.png`
4. `04-high-fx.png`
5. `05-low-fx.png`
6. `06-reduced-motion.png`

True `N/A` is allowed only with explicit reason. Evidence path convention:
`docs/release/qa/ui-cutover/<screen-id>/`.

## Fixed reviewer questions
1. Does the screen still tell the same gameplay truth as before?
2. Has the scenic or room owner remained intact?
3. Are old/new duplicate headers/frames/ribbons gone?
4. Are buttons and labels fully present?
5. Is the archetype still correct for this family?
6. Is atmosphere supportive rather than noisy?
7. Is layout stable across interaction and truth states?
8. Do High FX / Low FX / Reduced Motion remain coherent?

## Merge-request evidence requirements
Cleanup-capable packets must provide:
- one packet-goal paragraph;
- one preserve/enhance/defer summary;
- one “what old layer still remains and why” note;
- one screenshot pack;
- one QA result note;
- one explicit statement of whether destructive cleanup occurred;
- if destructive cleanup occurred, cite this gate and list which criteria were satisfied first.

## Cleanup unlock scope
Approval unlocks only narrow removal of listed conflicting layers on the exact approved target screen.

Approval does **not** unlock:
- broad refactors;
- sibling-screen cleanup;
- asset-family replacement;
- scenic/base replacement beyond reviewed scope.

## How later packets must cite this
Later packets that mention cleanup/cutover must cite:
- this file for operational gate summary;
- Section A doctrine for deeper legal law (`section-a-cutover-gate`, screenshot workflow, stability/truth doctrine);
- `docs/release/ui_screen_signoff_sheet.md` for actual recorded approval.

Docs-only and infra-only packets do not gain cleanup permission by implication.

## Recurring blocker patterns from Phase 0 recoveries
Observed recurring patterns across P0-04..P0-13 reports/evidence:
- duplicate old/new ownership channels (header/ribbon/shell conflicts);
- generic shell takeover that weakens local screen owner identity;
- no-layout-shift risk around state badges/selected/claim-ready controls;
- missing complete mode-evidence (High FX / Low FX / Reduced Motion) due manual capture constraints;
- manual-pending screenshot gaps that block cleanup approval even when runtime hardening is otherwise landed.

## Scope confirmation
This packet is publication/normalization only. It does not approve cleanup by itself, and it does not execute cleanup.
