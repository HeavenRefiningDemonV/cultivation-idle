# UI Cutover Red Flags

This file is the quick stop-ship / stop-cleanup checklist for additive UI migration reviews.

## Red flags checklist

Mark any checked item as a merge block for cleanup.

- [ ] Old scenic/base ownership was removed or visually demoted before screenshot approval existed for that exact screen.
- [ ] Duplicate old/new framing is still visible (ribbons, frames, headers, inspector rails, plaque systems).
- [ ] Any required icon, button, or label is missing in the proposed target composition.
- [ ] A detached or floating cutout state exists (portrait/plaque/hero element no longer integrated with composition).
- [ ] Gameplay truth is less clear than the prior baseline (role, readiness, prestige, or mechanic state is harder to read).
- [ ] Hover/selected/recommended/warning interactions introduce layout shift.
- [ ] The change depends on “future art” or “future FX” to justify current broken or ugly intermediate state.
- [ ] An infrastructure packet introduced destructive visual change (removal/demotion of working scenic/base/framing layers).
- [ ] Cleanup was bundled into unrelated work without explicit approved-cleanup packet scope.
- [ ] Half-old / half-new composition remains visible on the same final screen.

## Immediate reviewer action

If any red flag is present:

1. Do **not** approve destructive cleanup.
2. Restore or retain old scenic/base/framing layers.
3. File follow-up work under additive screen completion, not hidden cleanup.
4. Revisit cleanup only after screenshot approval and cutover gate checks pass.

## Compact triage order (when restoration is required)

Use this severity order:

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

## Cleanup gate (quick pass/fail)

Cleanup is eligible only when all checks pass on the exact target screen:

- A complete additive screenshot exists for reviewer comparison.
- Old scenic/base ownership remains intact until approval is granted.
- No duplicate old/new framing systems remain in the approved composition.
- No icon/button/label gaps remain.
- Hover/selected/recommended/warning states stay layout-stable.
- FX high, FX low, and Reduced Motion remain coherent.
- Gameplay-truth readability is at least equal to the prior baseline.

## Reviewer note

This checklist is a companion to `docs/ui/section-a-destructive-freeze.md` and the Section A doctrine charter. It is intentionally strict: additive baseline first, cleanup last, no silent destructive migration.

For operational cutover criteria and merge-proof requirements, see:
- `docs/ui/phase-0-p0-14-universal-cutover-gate.md`
- `docs/release/ui_cutover_merge_checklist.md`
