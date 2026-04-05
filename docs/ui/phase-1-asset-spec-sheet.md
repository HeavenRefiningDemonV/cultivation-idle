# P1-01B — Phase 1 Asset Spec Sheet (Support-Art Scaffold Contract)

## 1) Purpose and scope

This file is the canonical production spec for Phase 1 support-art landing zones and naming/format contracts.

This file is **not** permission to repaint live screens. It only defines how future support assets must be named, placed, and constrained.

## 2) Doctrine inheritance

This spec inherits Section A doctrine and keeps the existing posture locked:

- current assets first;
- preserve / enhance / create-later classification remains mandatory;
- no destructive cleanup;
- no scenic replacement in Wave 1 or Wave 2.

Preserve-core scenic owners (for example path portraits, book spines, world map/city overlays, forgewide room family, and current cultivator center stack) remain authoritative.

## 3) Support-art root map

| Root | What belongs here | What does not belong here |
| --- | --- | --- |
| `src/assets/ui/chrome/` | Shared frames, plaques, ribbons, title plates, breadcrumb plates, button/modal shell edges | Scenic paintings, world map art, book spines, hero center replacements |
| `src/assets/ui/overlays/` | Paper-edge vignettes, hero underlays, scene-to-panel blend masks, inspector darken masks, recommendation swashes, state underlays | Main scene paintings, standalone readable text baked into images |
| `src/assets/ui/fx/` | Mist, dust, glints, embers, halos, seal pulses, brush swashes | Truth-carrying UI labels, neon HUD sweeps, giant full-screen spectacle sheets |
| `src/assets/ui/heroes/` | Later-wave hero support kits (cultivation ring/glow/aura/seal, Heart Law altar/seal/pedestal supports) | Replacement hero paintings, replacement cultivator center, replacement path portraits |

## 4) Role-first naming contract

### Required naming rules

- Use `lower_snake_case` only.
- No spaces.
- Shared roots (`chrome`, `overlays`, `fx`) avoid screen-name prefixes unless genuinely non-shared.
- Shared assets are named by reusable **role**, not mood or screenshot provenance.
- `heroes` may use screen-local prefixes because hero kits are intentionally hero-local.

### Naming pattern

`<role>_<family>_<variant>_<state>.<ext>`

### Required examples

- `card_frame_light_default.png`
- `inspector_frame_standard_default.png`
- `modal_frame_heavy_default.png`
- `world_label_plaque_small_default.png`
- `section_header_ribbon_long_default.png`
- `paper_edge_overlay_soft_a.png`
- `inspector_darken_mask_medium.png`
- `mist_fx_soft_loop_a.png`
- `cultivation_hero_ring_outer_default.png`
- `heartlaw_hero_seal_pedestal_default.png`

### Forbidden naming patterns

Do not use vague names like:

- `pretty_frame`
- `new_plaque`
- `final_fx`
- `v2_final_final`

## 5) Allowed family map by root

- `chrome`: frame families, plaque families, ribbons, title plates, breadcrumb plates, button plates, modal shell edges.
- `overlays`: paper-edge vignettes, hero underlays, scene-to-panel blend masks, inspector darken masks, recommendation swashes, state underlays.
- `fx`: mist, dust, glints, embers, halos, seal pulses, brush swashes.
- `heroes`: later-wave hero-support layers only (cultivation altar/ring/glow support and Heart Law altar/seal/pedestal support).

## 6) Format/export contract

- Default export is transparent PNG for shared chrome/overlay/fx/hero-support assets.
- SVG is allowed when a flat plaque/medallion geometry is clearly better as vector.
- JPG is not allowed for active support-art assets.
- No baked text.
- No screen-specific copy painted into assets.
- No watermark, border mockup, or composited presentation framing.
- No format ambiguity or color-profile mismatches.

## 7) Tinting contract

- Shared chrome/plaque parts should prefer grayscale or sepia-friendly base art to preserve code tint flexibility.
- Shared chrome must not bake path-specific or city-specific color identity into base exports.
- If an asset is non-tintable by design, mark it explicitly in manifest metadata.
- Distinction:
  - tintable shared parts: neutral bases intended for code-driven tone adaptation;
  - authored-color FX parts: color-authored effects that remain optional/supportive and never carry readability truth.

## 8) Nine-slice contract

- Only compatible frame/plaque/button/modal families may be marked as nine-slice candidates.
- Every nine-slice candidate must declare explicit slice margins.
- Corner/ornament geometry must remain stable under stretch.
- Text must never exist inside stretchable source art.
- Minimum source size is mandatory per family in the manifest.

Example declaration (frame family):

- `enabled: true`
- `marginsPx: { top: 12, right: 12, bottom: 12, left: 12 }`
- `minSourceSizePx: { width: 128, height: 64 }`

## 9) FX atlas contract

- FX assets must be soft, alpha-based, and atlas-friendly.
- FX is support atmosphere, not readability truth.
- Disallowed: sci-fi HUD sweeps, constant sparkle noise, generic neon idle-game glow.
- Low FX and Reduced Motion must remain coherent without continuous particles.

## 10) Hero-support layer contract

Assets in `src/assets/ui/heroes/` are later-wave support kits only.

Allowed layer roles include:

- `base`
- `ring`
- `core`
- `glow_mask`
- `aura_wisps`
- `seal`
- `pedestal`

Forbidden in this packet/wave:

- replacement hero paintings;
- replacement cultivator center;
- replacement path portrait families.

## 11) Manifest-required metadata

Future support-art family manifests must declare at minimum:

- `schemaVersion`
- `packet`
- `familyId`
- `class`
- `root`
- `shared`
- `screenLocal`
- `supportsScreens`
- `role`
- `variants`
- `states`
- `format`
- `alpha`
- `tintable`
- `baseColorMode`
- `nineSlice.enabled`
- `nineSlice.marginsPx` (when enabled)
- `minSourceSizePx`
- `reducedMotionDependency`
- `currentBaseAssetRemains`
- `notes`

## 12) Folder placement matrix

| Root | Intended contents | Shared / screen-local posture |
| --- | --- | --- |
| `src/assets/ui/chrome/` | Shared frame/plaque/ribbon/titleplate/button/modal edge parts | Shared-first; screen-local only when clearly justified |
| `src/assets/ui/overlays/` | Shared overlay and mask support parts | Shared-first; localized variants must state why shared role fails |
| `src/assets/ui/fx/` | Shared restrained FX atlas parts | Shared-first; quality-mode coherent and optional |
| `src/assets/ui/heroes/` | Later-wave hero support kits | Screen-cluster / hero-local by design |

## 13) Import gate for later phases

- P1-01B does not permit live code imports from these roots.
- Later packets may import from these roots only after real assets exist and the packet explicitly authorizes integration.

## 14) Hard bans / anti-patterns

- No path portrait replacement.
- No bookshelf/spine replacement.
- No forgewide room replacement.
- No world map repaint.
- No cultivator-center replacement.
- No fake placeholder art created only to populate folders.
- No using scaffold creation as justification for present visual cleanup.

## 15) Acceptance checklist for future asset families

Future packets/art briefs must satisfy all checks before import:

- [ ] Family classified as create-later support role, not repaint request.
- [ ] Naming follows role-first lower_snake_case contract.
- [ ] Root placement matches this sheet.
- [ ] Manifest includes required metadata and nine-slice/tint declarations.
- [ ] Export format contract followed (transparent PNG or justified SVG; no JPG).
- [ ] Preserve-core owner remains in place.
- [ ] No cleanup authority is implied by asset arrival alone.

## P1-02 supplement note — shared frame atlas

Frame-atlas family specifics (weight roles, sizing bands, and tint guidance) are defined in `docs/ui/phase-1-p1-02-frame-atlas-brief.md`.

For frame-atlas members, apply these defaults unless a later packet explicitly overrides with evidence:

- light/standard/heavy frames remain tint-compatible grayscale/sepia-friendly bases;
- frame and button/drawer/inspector/modal members remain nine-slice candidates with explicit margins;
- center zones stay text-safe and stretch-safe (no emblem/text bake-in).

## P1-02A supplement note — shared plaque/ribbon/title-plate family

Canonical root for this family: `src/assets/ui/chrome/plaques/`.

Role examples:

- `ui_plaque_screen_header_long_default_l.png`
- `ui_ribbon_section_header_long_default_m.png`
- `ui_ribbon_section_header_short_default_s.png`
- `ui_titleplate_inspector_standard_default_m.png`
- `ui_breadcrumb_city_current_default_m.png`

Stretch guidance:

- stretch-safe roles: long section ribbons, card header plaques, breadcrumb strips;
- semi-stretch with protected endcaps: major screen header plaques, city-arrival banners, ritual modal title plates;
- fixed-width variants: short section ribbons where text-length variance is low.

Text-safe guidance:

- preserve center quiet zones;
- keep ornament in endcaps/protected edges;
- default one-line header semantics with controlled overflow handling.

Scope exclusions:

- dedicated world/building map labels are excluded from P1-02A and deferred to P1-02B;
- state-stamp/swash families are excluded and deferred to the later state-family packet.

Continuity rule:

- plaque/ribbon/title assets must pair with frame-family value hierarchy and material language without replacing frame ownership.

## P1-02B supplement note — world labels / building plaques / city-arrival identity

Canonical root for this family: `src/assets/ui/chrome/world_labels/`.

Naming examples:

- `ui_label_building_world_default_m.png`
- `ui_plate_building_selected_world_default_m.png`
- `ui_label_district_world_default_l.png`
- `ui_plate_city_current_world_default_l.png`
- `ui_banner_city_arrival_world_default_l.png`
- `ui_hint_route_world_default_s.png`

Diegetic placement rules:

- world labels attach to buildings, districts, city identity, or route context;
- labels must not default to floating software-tag behavior;
- world map/city overlays remain the base visual plane.

Stretch behavior:

- stretch-safe: building labels, selected-building plates, current-city plates;
- fixed/variant-led: district labels and route-hints where aggressive stretch harms readability;
- semi-stretch with protected ends: city-arrival world banners.

Continuity and scope boundaries:

- this family is distinct from P1-02A generic plaque/ribbon/title roles;
- this family is World-specific and does not authorize live World integration in P1-02B.

