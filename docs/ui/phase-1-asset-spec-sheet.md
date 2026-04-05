# Phase 1 asset spec sheet (Wave 0 handoff)

## Purpose
Define non-negotiable asset delivery constraints for Phase 1 support-art packets so generated assets remain reusable, tintable, additive, and preserve-first.

## Folder plan
Planned destination roots for support-art outputs:
- `src/assets/ui/chrome/` — shared frames, plaques, ribbons, title strips, state underlays
- `src/assets/ui/overlays/` — alpha overlays and mask packs
- `src/assets/ui/fx/` — restrained shared FX atlas and supporting slices
- `src/assets/ui/heroes/` — later-wave additive hero support overlays only

Current owner roots remain authoritative and must not be replaced in early waves:
- `src/assets/background/`
- `src/assets/menus/`
- `src/assets/onscreen/`
- `src/assets/ui/book_spines/`

## Wave sequence
- **Wave 0**: classification + evidence gating only (no art generation).
- **Wave 1**: shared support chrome (frame atlas + plaque/ribbon/title-plate family).
- **Wave 2**: overlays/masks and shared restrained FX vocabulary.
- **Wave 3**: additive hero overlays only after proof-complete support layers.
- **Wave 4**: optional polish families (non-blocking).

## Nine-slice expectations
- Frame/plaque/ribbon assets must ship with nine-slice-ready geometry where applicable.
- Deliverable notes must include recommended slice margins (`top/right/bottom/left`) and minimum target size.
- Corners and edge strips must preserve readability under scale and avoid texture stretching artifacts.
- If nine-slice is not applicable, request must explicitly state why.

## Tinting expectations
- Shared support families should be grayscale/sepia-friendly whenever practical.
- Support assets should support tint-in-code (CSS filter/overlay/mix approach) rather than one-off color baked variants.
- Avoid shipping large per-element color permutations unless a state role is impossible to express by tint.
- Preserve semantic contrast for warning/recommended/selected states.

## Alpha / overlay / mask expectations
- Overlays/masks must preserve underlying scenic owner readability.
- Prefer soft alpha PNGs for atmospheric overlays and crisp alpha masks for edge/spotlight roles.
- No baked-in full-screen opaque sheets that suppress gameplay truth text.
- Reduced-motion fallback must remain coherent without continuous FX dependence.

## Naming rules
Use role-first naming with wave/family suffixes:
- `ui_<family>_<role>_<variant>_<size>.png`
- `ui_<family>_<role>_<variant>.svg` (for vector support parts)

Examples:
- `ui_plaque_header_ink_m.png`
- `ui_frame_card_trim_a_9slice.png`
- `ui_overlay_focus_ring_soft_l.png`

Avoid generic names like `new_frame_final_v2.png`.

## Export format rules
- Use **PNG (transparent)** for textured raster support parts, overlays, and FX sprite atlas entries.
- Use **SVG** for simple vector-compatible plaques/icons when runtime consumption is compatible.
- Do not bake giant scenic text into support assets.
- Keep source exports atlas-friendly where reuse is expected.

## Shared-family deliverable rules
- Deliverables must be reusable across at least two screens unless explicitly scoped as one-screen exception with justification.
- Each family request must include:
  - missing-role statement,
  - screenshot proof references,
  - preserve-owner statement,
  - non-goals that forbid scenic replacement.
- Support families must never transfer scenic ownership from Layer 1 to Layer 2/3 by default.

## What is explicitly forbidden in Wave 1
- replacing path portraits,
- replacing bookshelf/spine art,
- repainting world/city map scenic ownership,
- replacing forgewide backgrounds,
- replacing cultivator/dantian center,
- using FX/overlays to mask unresolved layout-shift or truth-surfacing defects,
- generating whole-screen repaint art under a support-art label.

## Art request proof checklist
Before any new support-art generation request is approved, all items must be present:
1. Exact-screen additive screenshot proof for target surface.
2. Interaction/truth-state capture proving the role gap exists.
3. High FX / Low FX / Reduced Motion captures where relevant.
4. Explicit missing-role sentence (reusable role, not taste language).
5. Confirmation that preserve-core families remain visible owners.
6. Evidence that reuse/tint/nine-slice/layering with current assets is insufficient.
7. Explicit non-goal statement forbidding scenic repaint/replacement.
