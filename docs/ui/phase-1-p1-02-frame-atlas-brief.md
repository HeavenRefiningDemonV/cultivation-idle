# P1-02 — Shared Frame Atlas Brief

## A) Packet purpose and scope

This packet defines the shared frame atlas family for Phase 1 support chrome.

It is support chrome, not scenic replacement. It exists to widen the current paper/ink shell so more screen contexts can reuse coherent frame weights without replacing scenic owners.

## B) Doctrine inheritance

P1-02 inherits and enforces these laws:

- preserve-first
- enhance-first
- no infrastructure-caused regression
- no future-art excuse
- no cutover without exact-screen approval
- Wave 1 support chrome follows Wave 0 proof
- current scenic owners remain the base plane

## C) Why the family exists

- Current shell primitives (`InkPanel`, `PaperCard`, `PaperChip`, `InkModalFrame`) are useful but narrow for the full range of hero/module/dense contexts.
- One generic card shell is currently overloaded across states that need clearer hierarchy.
- The atlas provides reusable material range (light/standard/heavy and structural companions) while preserving existing scenic ownership.
- This is not a scenic-picture-frame family and must never become scenic replacement art.

## D) Family scope

P1-02 frame atlas includes only:

- `light frame`
- `standard frame`
- `heavy frame`
- `button plate`
- `drawer edge`
- `inspector shell / inspector edge`
- `modal-compatible frame`

Out of scope for this packet:

- plaque/ribbon/title-plate variants (P1-02A)
- world/building labels
- state stamps
- overlays/masks
- FX
- hero overlays

## E) Role-by-role specification

### 1) Light frame

1. **Role statement:** Minimal structural boundary for dense, low-intensity surfaces where content density is primary.
2. **Intended screen classes:** Dense management + low-intensity support blocks inside hero/module screens.
3. **Intended usage examples:** Status dense rows, quiet compare/detail rows, compact inspector sub-blocks.
4. **Prohibited usages:** Hero focal cards, ritual consequence cards, scenic-owner wraps.
5. **Visual weight:** Thin edge/readability-first, lowest contrast of family.
6. **Ornament budget:** Near-zero ornament; subtle corner punctuation only.
7. **Center/edge/corner behavior:** Calm center; edges may carry soft grain; corners must remain stable under stretch.
8. **Tintability expectation:** Fully tint-compatible (grayscale/sepia-friendly base).
9. **Nine-slice expectation:** Default enabled.
10. **Minimum source-size recommendation:** 128x64.
11. **Minimum safe interior content area:** >= 82% of source area.
12. **Relation to current ink primitives:** Should sit adjacent to `PaperCard` dense/surface variants without overpowering chip truth.

### 2) Standard frame

1. **Role statement:** Default shared frame for ordinary support cards/panels.
2. **Intended screen classes:** Module activity + world support + general-purpose support panels.
3. **Intended usage examples:** Module support cards, world inspector support blocks, bounty/expedition note shells.
4. **Prohibited usages:** Full scenic-owner replacement, ritual centerpiece emulation.
5. **Visual weight:** Medium boundary with clearer edge hierarchy than light frame.
6. **Ornament budget:** Low ornament; restrained corner motifs.
7. **Center/edge/corner behavior:** Center remains clean for text-dominant content; edges carry material cues.
8. **Tintability expectation:** Tint-compatible by default.
9. **Nine-slice expectation:** Default enabled.
10. **Minimum source-size recommendation:** 160x96.
11. **Minimum safe interior content area:** >= 78% of source area.
12. **Relation to current ink primitives:** Complements `InkPanel` and `PaperCard` as a widened shared material tier.

### 3) Heavy frame

1. **Role statement:** Highest-weight support frame for consequence-rich support surfaces.
2. **Intended screen classes:** Ritual support and hero-adjacent support (not scenic base plane).
3. **Intended usage examples:** Prestige/chapter-end summary blocks, ritual support cards, key support panels near hero zones.
4. **Prohibited usages:** Scenic-owner takeover, portrait/map/forgewide/cultivator replacement, decorative dominance in dense rows.
5. **Visual weight:** Deepest edge value in family while preserving content-first center.
6. **Ornament budget:** Moderate but constrained ornament; never center medallion invasion.
7. **Center/edge/corner behavior:** Strong edge read; corners may be richer but stretch-safe; center must remain calm.
8. **Tintability expectation:** Tint-compatible where practical; may use deeper baseline values.
9. **Nine-slice expectation:** Enabled; requires strict corner stability tests.
10. **Minimum source-size recommendation:** 192x120.
11. **Minimum safe interior content area:** >= 74% of source area.
12. **Relation to current ink primitives:** Should complement `InkModalFrame`/ritual surfaces without replacing modal shell ownership.

### 4) Button plate

1. **Role statement:** Shared material plate for primary/secondary action surfaces in same atlas vocabulary.
2. **Intended screen classes:** Cross-family actionable controls.
3. **Intended usage examples:** Ritual confirm/cancel supports, module action strips, inspector action rows.
4. **Prohibited usages:** Replacing semantic iconography, carrying long-form body text, scenic decoration.
5. **Visual weight:** Standard-to-heavy subrange depending on action importance.
6. **Ornament budget:** Low; focus on press/hover legibility, not decorative flourish.
7. **Center/edge/corner behavior:** Center must reserve text/icon safe zone; edge behavior supports interaction states.
8. **Tintability expectation:** High (state tint use expected).
9. **Nine-slice expectation:** Enabled for width-flex action labels.
10. **Minimum source-size recommendation:** 144x56.
11. **Minimum safe interior content area:** >= 70% of source area.
12. **Relation to current ink primitives:** Extends existing button-like shell language from menu primitives without replacing truth labels.

### 5) Drawer edge

1. **Role statement:** Structural edge treatment for expandable/detail drawers.
2. **Intended screen classes:** Module/dense contexts with collapsible detail rails.
3. **Intended usage examples:** Requirement drawers, expandable rows, contextual detail drawers.
4. **Prohibited usages:** Standalone hero card framing, scenic-owner borders.
5. **Visual weight:** Light-to-standard edge presence.
6. **Ornament budget:** Minimal; repeated edge behavior must remain quiet.
7. **Center/edge/corner behavior:** Primarily edge-first asset; center treatment secondary and calm.
8. **Tintability expectation:** Tint-compatible.
9. **Nine-slice expectation:** Enabled with repeat-safe edges.
10. **Minimum source-size recommendation:** 128x48.
11. **Minimum safe interior content area:** >= 84% of source area.
12. **Relation to current ink primitives:** Should integrate cleanly with `InkPanel` and dense card containers.

### 6) Inspector shell / inspector edge

1. **Role statement:** Framing for larger contextual read panes and side inspectors.
2. **Intended screen classes:** World inspector / forge side rail / contextual read panes.
3. **Intended usage examples:** Right-side world inspector, forge material side panel, contextual advisory panes.
4. **Prohibited usages:** Full-screen scenic wrapper, modal centerpiece replacement.
5. **Visual weight:** Standard with inspector-specific edge hierarchy.
6. **Ornament budget:** Low-to-moderate; clarity and scan order prioritized.
7. **Center/edge/corner behavior:** Center must support long text blocks; edge rhythm supports pane segmentation.
8. **Tintability expectation:** Tint-compatible.
9. **Nine-slice expectation:** Enabled, including tall-rail test cases.
10. **Minimum source-size recommendation:** 224x320.
11. **Minimum safe interior content area:** >= 80% of source area.
12. **Relation to current ink primitives:** Supplements inspector usage of existing panel/card primitives, does not replace world/forge scenic owners.

### 7) Modal-compatible frame

1. **Role statement:** Support frame variant for centered consequence panels inside modal workflows.
2. **Intended screen classes:** Ritual modals and centered consequence panes.
3. **Intended usage examples:** Ritual support surfaces, chapter-end support panes, consequence detail blocks.
4. **Prohibited usages:** Full modal scenic owner replacement, background art substitution.
5. **Visual weight:** Standard-to-heavy depending on consequence level.
6. **Ornament budget:** Moderate at corners/edges only; no center emblem clutter.
7. **Center/edge/corner behavior:** Center reserved for truth content; corners stretch-safe and deterministic.
8. **Tintability expectation:** Tint-compatible where practical.
9. **Nine-slice expectation:** Enabled; tested at multiple modal widths/heights.
10. **Minimum source-size recommendation:** 240x144.
11. **Minimum safe interior content area:** >= 76% of source area.
12. **Relation to current ink primitives:** Must harmonize with `InkModalFrame` tone and not displace current ritual shell semantics.

## F) Naming contract

Use role-first `lower_snake_case` naming.

Pattern:

- `<role>_<weight>_<variant>_<state>`

Examples:

- `frame_light_default`
- `frame_standard_default`
- `frame_heavy_default`
- `button_plate_standard_default`
- `button_plate_ritual_default`
- `drawer_edge_standard_default`
- `inspector_shell_standard_default`
- `modal_frame_heavy_default`

Disallowed naming:

- mood names (`mystic_frame`)
- screen-local names for shared parts (`forge_frame_default` without explicit non-shared justification)
- version spam (`final_v2`, `final_final`)
- scenic nouns implying owner art (`temple_frame`)

## G) Nine-slice and sizing recommendations

### Nine-slice suitability

- light frame: yes (default)
- standard frame: yes (default)
- heavy frame: yes (default)
- button plate: yes (default)
- drawer edge: yes (default)
- inspector shell / edge: yes (default)
- modal-compatible frame: yes (default)

### Sample margins (starting recommendations)

- light frame: `10/10/10/10`
- standard frame: `12/12/12/12`
- heavy frame: `14/14/14/14`
- button plate: `10/12/10/12`
- drawer edge: `8/10/8/10`
- inspector shell: `12/14/12/14`
- modal-compatible frame: `14/16/14/16`

(order: top/right/bottom/left in px)

### Stretch and ornament behavior

- Center regions must remain uncluttered and stretch-safe.
- Edge repeat must avoid texture stepping artifacts.
- Corner ornament intrusion should remain <= 18% of width/height envelope.
- Text, emblems, and scene details must never live in the stretch zone.

### Minimum source-size recommendations

- small row shell: `128x48`
- ordinary card: `160x96`
- heavy ritual card: `192x120`
- inspector shell: `224x320`
- centered modal frame: `240x144`

## H) Tint and value rules

- Grayscale/sepia-friendly by default.
- Intended for code tinting where useful.
- Restrained bronze/gold accents are permitted but not required as baked identity.
- Shared frames must not hard-bake path-specific or screen-specific color identity.
- Heavy frame may use deeper values but should remain tint-compatible where practical.

## I) Style constraints / anti-patterns

Explicitly forbidden:

- scenic paintings inside frame centers
- ornate western-fantasy gold metal framing
- MMO bevel chrome
- sci-fi HUD lines
- neon glow as baseline identity
- baked text
- baked screen-specific titles
- noisy center medallions invading content space
- asymmetry that breaks reuse without reason
- decorative weight that makes frame chrome behave like screen owner

## J) Preserve / enhance / create-later statement

P1-02 frame atlas posture:

- preserve current scenic owners;
- enhance the shared parchment/panel layer;
- do not replace path portraits, world map/city owners, forgewide room owners, bookshelf art, or cultivator center.

## K) Screen-usage matrix

| Family member | Screen family | Specific screen examples | Why this weight is appropriate |
| --- | --- | --- | --- |
| light frame | dense / low-intensity support | Status dense rows, Manual Pavilion detail rows | Keeps readability-first structure with minimal ornament. |
| standard frame | module support | Forge support cards, Bounties note shells, Expeditions route notes | Provides clear shared material boundary without heavy ritual weight. |
| heavy frame | ritual / high consequence support | Prestige summary blocks, chapter-end support surfaces | Elevates consequence blocks while preserving scenic/modal owners. |
| button plate | cross-family actions | Gate Trial checklist actions, Forge action rails, ritual confirm/cancel surfaces | Aligns controls to shared chrome language and state tint behavior. |
| drawer edge | expandable detail structures | Gate Trial requirement drawers, Forge requirement drawers, Status detail drawers | Supports collapsible structure without introducing full card weight. |
| inspector shell / edge | inspector panes | World right inspector, Forge material side rail, contextual read panes | Maintains scan hierarchy for larger pane content. |
| modal-compatible frame | ritual support modal surfaces | Prestige modal support cards, consequence/summary panels | Provides centered support framing, never scenic-owner replacement. |
| standard + heavy blend | hero-adjacent support surfaces | Cultivation support panels near center stack | Adds hierarchy without touching cultivator/dantian owner layer. |

## L) Dependency note

- P1-01 artifacts are present in this repo and were treated as upstream context.
- P1-01B scaffold outputs are present and were referenced narrowly (spec-sheet/backlog/template compatibility) without reopening prior packet scope.
- This packet remains self-contained and does not backfill missing packets.

## M) Acceptance criteria

- [ ] Brief defines exactly seven frame-atlas members in scope.
- [ ] Role-by-role specs include all 12 required fields.
- [ ] Naming contract is role-first and lower_snake_case.
- [ ] Nine-slice guidance includes per-member suitability, margins, stretch behavior, and minimum sizes.
- [ ] Tint/value rules keep family reusable and non-screen-specific.
- [ ] Anti-patterns clearly block scenic/ornate/sci-fi misuse.
- [ ] Preserve/enhance posture and scenic-owner safety are explicit.
- [ ] Screen-usage matrix covers required screen examples.
- [ ] No live integration, no placeholder art generation, and no cleanup authority are implied.
