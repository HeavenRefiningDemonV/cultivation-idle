# Gate Trial support-art intake (P6.3D)

This registry maps optional generated support assets (if present) to bounded Gate Trial support roles.

## Supported roles
- checklist minimum / recommended plates
- readiness band companions
- fail-safe frame
- seal accents
- attempt lane plates
- gate halo / underglow base

## Fallback behavior
- Assets are resolved from `src/assets/Generated assets/` by expected filename.
- Missing files resolve as `assetUrl: null`.
- Integration code must remain coherent and readable when all files are missing.

## Constraints
- Support art is additive only.
- DOM readiness/checklist/fail-safe/diagnosis/attempt truth remains authoritative.
- No repaint, no scenic owner replacement, no layout-shift dependency.
