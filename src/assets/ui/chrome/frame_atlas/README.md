# frame_atlas scaffold root (P1-02)

## Family purpose
This folder is the landing scaffold for the shared frame atlas family (`light`, `standard`, `heavy`, `button_plate`, `drawer_edge`, `inspector_shell`, `modal_frame`).

## Packet scope
Legacy P1-02 scaffold guidance remains valid for the general atlas family, but this root now also contains real additive support-art parts for the P3-11A Life Start Path triptych kit.

### P3-11A support-art files
- `path_banner_frame_vertical_neutral.svg`
- `path_banner_frame_vertical_selected.svg`
- `path_banner_frame_edge_left_neutral.svg`
- `path_banner_frame_edge_right_neutral.svg`
- `path_banner_frame_topcap_neutral.svg`
- `path_banner_frame_bottom_finish_neutral.svg`

## Naming expectations
Use role-first `lower_snake_case` names such as:
- `frame_light_default`
- `frame_standard_default`
- `frame_heavy_default`
- `button_plate_standard_default`
- `drawer_edge_standard_default`
- `inspector_shell_standard_default`
- `modal_frame_heavy_default`

## Import gate
Live screens must not import from this family root yet.

## Brief reference
Canonical P1-02 family rules live in:
- `docs/ui/phase-1-p1-02-frame-atlas-brief.md`
