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
This root started as scaffold-only, but now includes additive support-art carriers in subfolders:
- frame atlas kit parts (P3-11A)
- selected-path plaques (P3-11A)
- Heart Law medallion family (`src/assets/ui/chrome/medallions/`, P3-11B)
- ritual modal seal accents (`src/assets/ui/chrome/seals/`, P3-11C)

## Import gate note
No live screen should import from this root yet.

## Preserve-core reminder
Preserve-core assets (including `src/assets/ui/book_spines/`) remain untouched.

## P1-06 closeout note
Current Phase 1 closeout audit marks this root as scaffold-only until real support-art binaries are packaged.
