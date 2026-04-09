# plaques scaffold root (P1-02A)

## Folder purpose
This root is the shared plaque/ribbon/title-plate/breadcrumb support-chrome family scaffold.

## What belongs here
- major screen header plaques
- long and short section ribbons
- card-level header plaques
- inspector title plates
- breadcrumb strips (current city/current module)
- city-arrival banners
- ritual modal title plates

## What does not belong here
- full frame-atlas assets (see `src/assets/ui/chrome/frame_atlas/`)
- world/building map placards (deferred to P1-02B)
- state stamps/recommendation swashes/tracked badges (deferred state family)
- scenic paintings or scenic-owner replacements

## Naming examples
- `ui_plaque_screen_header_long_default_l.png`
- `ui_ribbon_section_header_long_default_m.png`
- `ui_titleplate_inspector_standard_default_m.png`
- `ui_breadcrumb_city_current_default_m.png`

## Relation to frame family
This family is a sibling to P1-02 frame-atlas roles and should pair with frame variants without replacing frame ownership.

## Relation to P1-02B world/building labels
Dedicated map/building label plaques are excluded from this root’s role scope in P1-02A and are deferred to P1-02B.

## Import gate
No live screen imports should target this folder yet.

## Packet scope note
P1-02A began as scaffold-only, but this root now includes P3-11A additive Life Start selected-path plaque carriers:
- `path_summary_plaque_long.svg`
- `path_summary_plaque_compact.svg`
- `path_confirm_strip_companion.svg`
- `path_summary_plaque_side_tab.svg`
