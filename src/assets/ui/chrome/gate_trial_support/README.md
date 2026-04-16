# Gate Trial support-art intake (P6.3D)

This registry maps bounded Gate Trial support roles to:
- authored local SVG cutouts in `pack/` (default baseline support family), and
- optional generated PNG overrides from `src/assets/Generated assets/` when present.

## Supported roles
- checklist minimum / recommended plates (SVG authored defaults)
- readiness band companions (SVG authored defaults)
- fail-safe frame (SVG authored default)
- seal accents (SVG authored defaults)
- attempt lane plates (SVG authored defaults)
- gate halo / underglow base (PNG override slots reserved)

## Pack sheet
- `pack/ui_gate_trial_support_pack_sheet.svg` arranges all authored cutouts for quick visual QA/export.

## Fallback behavior
- Assets are resolved from `src/assets/Generated assets/` by expected filename.
- Missing generated files gracefully fall back to authored SVGs where available.
- Roles without a local fallback (halo/underglow PNG slots) resolve to `assetUrl: null`.
- Integration code must remain coherent and readable when all files are missing.

## Constraints
- Support art is additive only.
- DOM readiness/checklist/fail-safe/diagnosis/attempt truth remains authoritative.
- No repaint, no scenic owner replacement, no layout-shift dependency.
