# overlays support-art scaffold root (P1-01B)

## Folder purpose
This root is the scaffold landing zone for shared overlay, mask, and state-ornament support parts.

## What belongs here
- paper-edge vignettes
- hero underlays
- inspector darken masks
- scene-to-panel blend masks
- state ornament family members (tracked / claim-ready / recommended-now / caution / completion / selected-current / header chip companion)

## Suggested substructure
- `src/assets/ui/overlays/state_ornaments/` for P1-03A state family members

## What does not belong here
- main scene paintings
- standalone readable UI text baked into images
- full plaque/title/header ownership assets (owned by `src/assets/ui/chrome/`)

## Naming examples
- `paper_edge_overlay_soft_a.png`
- `inspector_darken_mask_medium.png`
- `ui_state_stamp_tracked_calm_default.png`
- `ui_state_swash_recommended_now_compact_default.png`

## Allowed formats
- Transparent PNG by default
- SVG only when geometry-only masks/plates are explicitly justified
- No JPG

## Packet scope note
This is a scaffold root only in Phase 1 docs/spec packets. Do not add placeholder art files.

## Import gate note
No live screen should import from this root yet.

## Preserve-core reminder
Preserve-core assets (including `src/assets/ui/book_spines/`) remain untouched.

## P1-06 closeout note
Current Phase 1 closeout audit marks this root as scaffold-only until real support-art binaries are packaged.
