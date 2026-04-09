# P3-11A Path Life Start Support-Art Kit

This packet adds additive support-art parts for the Life Start Path Selection triptych without replacing existing portrait owners.

## Families and locations

### Structural vertical banner frame family
- `src/assets/ui/chrome/frame_atlas/path_banner_frame_vertical_neutral.svg`
- `src/assets/ui/chrome/frame_atlas/path_banner_frame_vertical_selected.svg`
- `src/assets/ui/chrome/frame_atlas/path_banner_frame_edge_left_neutral.svg`
- `src/assets/ui/chrome/frame_atlas/path_banner_frame_edge_right_neutral.svg`
- `src/assets/ui/chrome/frame_atlas/path_banner_frame_topcap_neutral.svg`
- `src/assets/ui/chrome/frame_atlas/path_banner_frame_bottom_finish_neutral.svg`

### Path-top ornament family
- `src/assets/ui/overlays/path_banner_top_ornament_heaven.svg`
- `src/assets/ui/overlays/path_banner_top_ornament_earth.svg`
- `src/assets/ui/overlays/path_banner_top_ornament_martial.svg`

### Selection halo / underglow family
- `src/assets/ui/overlays/path_selection_halo_heaven.svg`
- `src/assets/ui/overlays/path_selection_halo_earth.svg`
- `src/assets/ui/overlays/path_selection_halo_martial.svg`
- `src/assets/ui/overlays/path_selection_halo_neutral.svg`

### Low-opacity mist underlays
- `src/assets/ui/overlays/path_mist_underlay_soft_a.svg`
- `src/assets/ui/overlays/path_mist_underlay_soft_b.svg`
- `src/assets/ui/overlays/path_mist_underlay_brush_soft.svg`

### Selected-path summary plaque family
- `src/assets/ui/chrome/plaques/path_summary_plaque_long.svg`
- `src/assets/ui/chrome/plaques/path_summary_plaque_compact.svg`
- `src/assets/ui/chrome/plaques/path_confirm_strip_companion.svg`
- `src/assets/ui/chrome/plaques/path_summary_plaque_side_tab.svg`

### Optional brush-swash selected support
- `src/assets/ui/fx/path_selected_brushwash_soft_a.svg`
- `src/assets/ui/fx/path_selected_brushwash_soft_b.svg`

## Authoring notes
- All assets are transparent-background vector carriers intended for tinting and composition in code.
- Interiors are intentionally left clear where summary/confirm DOM copy needs to remain legible.
- Ornament density is top-and-bottom weighted for banner pieces to keep portrait center readability intact.
