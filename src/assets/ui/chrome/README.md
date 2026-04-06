# chrome support-art scaffold root (P1-01B)

## Folder purpose
This root is the scaffold landing zone for shared chrome support parts.

## What belongs here
- frame atlas parts
- plaques
- ribbons
- title plates
- breadcrumb plates
- button shell pieces
- modal shell edge pieces

## What does not belong here
- scenic paintings
- `src/assets/ui/book_spines/` assets
- world map art
- hero center replacements
- state ornament stamps/swashes/underlays (owned by `src/assets/ui/overlays/state_ornaments/`)

## Naming examples
- `card_frame_light_default.png`
- `inspector_frame_standard_default.png`
- `modal_frame_heavy_default.png`
- `world_label_plaque_small_default.png`
- `section_header_ribbon_long_default.png`

## Ownership boundary note
Chrome owns structural carriers (frame/plaque/ribbon/titleplate geometry).

P1-03A state ornaments are semantic support accents and must not become mini-plaques or header ownership surfaces.

## Allowed formats
- Transparent PNG by default
- SVG only when flat plaque/medallion geometry is clearly better as vector
- No JPG

## Packet scope note
This is a scaffold root only in P1-01B. Do not add placeholder art files.

## Import gate note
No live screen should import from this root yet.

## Preserve-core reminder
Preserve-core assets (including `src/assets/ui/book_spines/`) remain untouched.
