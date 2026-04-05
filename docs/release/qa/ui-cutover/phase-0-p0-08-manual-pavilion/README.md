# P0-08 Manual Pavilion recovery — review evidence

This folder tracks after-state QA evidence for P0-08 (Manual Pavilion recovery).

## Runtime screenshot status
Automated screenshot capture is unavailable in this execution environment.
Status: **MANUAL-PENDING**.

## Manual capture checklist
1. `after-default-shelf` — shelf/backdrop/spine owner remains dominant.
2. `after-selected-manual` — selected spine + no shelf layout shift.
3. `after-hover-or-recommendation-state` — hover/recommendation state without geometry drift.
4. `after-detail-modal-open` — detail modal open with stable room context.
5. `after-low-fx` (if available) — premium static emphasis preserved.
6. `after-reduced-motion` (if available) — stability preserved without motion dependency.
7. `after-tag-stability` — chips/tags stay in reserved space and do not deform shelf rows.
8. `after-owner-read` — manualpavilion room identity still reads as owner.

## Manual QA path references
- `docs/manual-detail-modal-qa.md`
- `docs/ui/phase-0-p0-08-manual-pavilion-recovery.md`
