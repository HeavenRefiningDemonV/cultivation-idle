# P1-03 — Shared Overlay / Mask / Paper-Depth Pack Brief

## 1) Packet purpose and scope

P1-03 defines the shared overlay/mask/paper-depth family.

This is support art, not screen ownership. Its role is to integrate scenic owners and shared chrome without repainting scenic owners.

## 2) Why now

Phase 1 requires reusable overlays/masks before later screen packets so teams do not improvise blend logic inside feature packets.

Overlays are high-value and low-risk because they improve cohesion while preserving existing scenic ownership.

This packet precedes FX atlas and hero-overlay kits because those families depend on clean base compositing and layering rules.

## 3) Doctrine inheritance

- preserve-first
- enhance-first
- additive only
- no future-art excuse
- no cutover without approval
- readable truth remains in DOM

## 4) Family boundary and exclusions

### In scope

- paper-edge vignette overlays
- scene-to-panel blend masks (horizontal/vertical)
- inspector darkening masks
- hero underlays (low-profile)
- soft brush-emphasis underlays
- calm ornamental underplates

### Out of scope

- tracked/claim-ready/completion stamp families
- recommendation swash/state ornament packet (owned by P1-03A sibling packet)
- FX atlas packet
- Cultivation hero overlay kit
- Heart Law altar/seal kit
- world label packet
- live imports/integration

## 5) Continuity with current scenic owners and shared chrome

Overlays must support current scenic owners by smoothing transitions and depth contrast.

They must visually align with frame/plaque families via material tone and restraint.

They must never:

- behave like a frame
- behave like a plaque
- replace room/scenic art
- carry readable truth content

## 6) Canonical role inventory

### A) Paper-edge vignette overlay

- **Role statement:** Soft edge weathering to connect paper/chrome to scenic base.
- **Intended screen examples:** Cultivation, Status, World, Forge.
- **Hierarchy level:** Low.
- **Intended visual weight:** Very light.
- **Prohibited usage:** Hard border/frame silhouette.
- **Alpha/opacity expectation:** Low center impact; soft edge fade.
- **Center obstruction rule:** Center remains mostly transparent.
- **Tintability:** Yes (sepia/grayscale-friendly).
- **Coverage mode:** Full-screen-safe.
- **Repeat-use notes:** Reusable across many screens with small tint/value shifts.
- **Layer note:** Above scenic, below UI/chrome.

### B) Horizontal scene-to-panel blend mask

- **Role statement:** Horizontal gradient bridge between scenic field and panel/chrome band.
- **Intended screen examples:** World top/bottom transitions, Gate Trial, Forge.
- **Hierarchy level:** Low-medium.
- **Intended visual weight:** Low.
- **Prohibited usage:** Replacing panel backgrounds.
- **Alpha/opacity expectation:** Feathered gradient with transparent mid-core.
- **Center obstruction rule:** Text zones above must remain clear.
- **Tintability:** Yes.
- **Coverage mode:** Panel-local to broad strip.
- **Repeat-use notes:** Shared variant with width scaling.
- **Layer note:** Usually above scenic, below chrome band.

### C) Vertical scene-to-panel blend mask

- **Role statement:** Vertical blend bridge for side inspectors and rail transitions.
- **Intended screen examples:** World inspector, Forge side rail, Status side contexts.
- **Hierarchy level:** Low-medium.
- **Intended visual weight:** Low.
- **Prohibited usage:** Hard divider replacement.
- **Alpha/opacity expectation:** Soft side feather, transparent content core.
- **Center obstruction rule:** Never wash out body text lanes.
- **Tintability:** Yes.
- **Coverage mode:** Panel-local / side-rail local.
- **Repeat-use notes:** Reusable left/right variants.
- **Layer note:** Between scenic plane and inspector chrome.

### D) Inspector darkening mask

- **Role statement:** Controlled local darkening behind inspector content.
- **Intended screen examples:** World inspector, Forge rail, contextual read panes.
- **Hierarchy level:** Medium (supportive, not dominant).
- **Intended visual weight:** Low-to-medium.
- **Prohibited usage:** Full-room blackout.
- **Alpha/opacity expectation:** Localized, feathered, bounded range.
- **Center obstruction rule:** Inspector text contrast improves; surrounding room remains visible.
- **Tintability:** Yes.
- **Coverage mode:** Panel-local.
- **Repeat-use notes:** Single family with strength variants.
- **Layer note:** Above scenic, below inspector shell/text.

### E) Hero underlay

- **Role statement:** Soft grounding underlay beneath hero-adjacent support UI.
- **Intended screen examples:** Cultivation support surfaces, ritual support blocks.
- **Hierarchy level:** Low.
- **Intended visual weight:** Low.
- **Prohibited usage:** Hero replacement art or focal glow FX.
- **Alpha/opacity expectation:** Soft, broad falloff.
- **Center obstruction rule:** Hero and truth surfaces remain unobscured.
- **Tintability:** Yes.
- **Coverage mode:** Object-local to region-local.
- **Repeat-use notes:** Reusable underlay families with minimal variants.
- **Layer note:** Above scenic but below support chrome and all readable text.

### F) Soft brush-emphasis underlay

- **Role statement:** Subtle brush-style emphasis patch for local hierarchy support.
- **Intended screen examples:** Section transitions in Status/Manual/Forge.
- **Hierarchy level:** Low.
- **Intended visual weight:** Very low.
- **Prohibited usage:** State stamp substitute.
- **Alpha/opacity expectation:** Soft brush edges, low opacity center.
- **Center obstruction rule:** Never reduce text legibility.
- **Tintability:** Yes.
- **Coverage mode:** Object-local / panel-local.
- **Repeat-use notes:** Reusable swash silhouettes without semantic state ownership.
- **Layer note:** Typically beneath card/plaque content, above scenic.

### G) Calm ornamental underplate

- **Role statement:** Quiet ornamental support pad beneath headers/cards where needed.
- **Intended screen examples:** Ritual support cards, inspector title context, module support blocks.
- **Hierarchy level:** Low-to-medium.
- **Intended visual weight:** Low.
- **Prohibited usage:** Title plate replacement or frame replacement.
- **Alpha/opacity expectation:** Calm low-mid opacity edges, transparent center bias.
- **Center obstruction rule:** Content center stays open.
- **Tintability:** Yes.
- **Coverage mode:** Object-local.
- **Repeat-use notes:** Reusable low-profile variants.
- **Layer note:** Below chrome/title carriers, above scenic.

## 7) Family-wide style laws

- xianxia parchment haze and ink-soft weathering
- low contrast support behavior
- grayscale/sepia-friendly base values
- tintability in code
- no hard border logic
- no frame silhouette behavior
- no medallions/crests
- no scenic illustration painted into overlays
- no modern gradient-app language
- no neon/gloss polish

## 8) Alpha / opacity laws

- broad transparent centers are required
- feathered edges are required
- edge weighting must remain controlled and soft
- value depth must stay below visible-panel threshold
- overlays must preserve readability for text layered above

## 9) Placement laws

- use overlays beneath chrome when supporting hierarchy transitions
- use overlays above scenic and below UI content
- avoid stacking multiple strong overlays in one zone
- inspector darkening must separate content without swallowing room identity
- hero underlays ground focal areas; scene-blend masks bridge scenic-to-panel transitions

## 10) Stretch / reuse rules

- stretch-safe: vignette edges and broad blend masks with feather tolerance
- fixed-ratio preferred: some brush underlays and ornamental underplates
- nine-slice inappropriate for most overlays (they are soft alpha fields, not frame geometry)
- feathered edges must remain smooth after scaling

## 11) Naming contract

Canonical examples:

- `ui_overlay_paper_edge_vignette_soft_default`
- `ui_mask_scene_panel_blend_horizontal_default`
- `ui_mask_scene_panel_blend_vertical_default`
- `ui_mask_inspector_darken_soft_default`
- `ui_underlay_hero_focus_soft_default`
- `ui_swash_brush_emphasis_soft_default`
- `ui_underplate_ornamental_calm_default`

Forbidden naming:

- frame/plaque/title semantics in overlay IDs
- state-stamp semantics (`*_recommended_*`, `*_tracked_*`)
- fx semantics (`*_spark_*`, `*_glow_loop_*`)
- version spam (`final_v2`)

## 12) Screen usage matrix

| Role | Path/Life Start | Heart Law | Cultivation | Status | World | Gate Trial | Outskirts | Ruins | Manual Pavilion | Apothecary | Forge | Bounties | Expeditions | Prestige | Why belong / not belong |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| paper-edge vignette | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Broad low-profile cohesion layer. |
| horizontal blend mask | Limited | Limited | Yes | Limited | Yes | Yes | Yes | Yes | Limited | Limited | Yes | Limited | Limited | Limited | Best where scenic-to-panel horizontal seams are visible. |
| vertical blend mask | Limited | Limited | Limited | Yes | Yes | Limited | Limited | Limited | Limited | Limited | Yes | Limited | Limited | Limited | Best for side rails/inspectors. |
| inspector darkening mask | No | No | Limited | Limited | Yes | Limited | Limited | Limited | No | No | Yes | Limited | Limited | Limited | Inspector separation support only. |
| hero underlay | Limited | Limited | Yes | No | No | No | No | No | No | No | No | No | No | Limited | Focal underlay where hero-adjacent support blocks need grounding. |
| brush-emphasis underlay | Yes | Yes | Yes | Yes | Limited | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Soft local emphasis without semantic state ownership. |
| ornamental underplate | Limited | Yes | Yes | Limited | Limited | Limited | Limited | Limited | Limited | Limited | Limited | Limited | Limited | Yes | Calm ceremonial support where modest ornament helps hierarchy. |

## 13) Proof-anchor map

| Role | Target screens | Problem solved | Why current assets alone are insufficient | Why support-art (not scenic replacement) |
| --- | --- | --- | --- | --- |
| paper-edge vignette | Cultivation, Status, World, Forge | Unifies edge transitions between scenic/base and chrome | Current shells can look abruptly layered without soft edge mediation | Adds depth only; does not replace scenic owner. |
| horizontal blend mask | World, Gate Trial, Forge, Outskirts, Ruins | Smooths scenic-to-panel bands | Hard transitions can look detached without blend field | Bridge layer only; preserves map/room ownership. |
| vertical blend mask | World inspector, Forge side rail, Status side contexts | Softens vertical seam contrast | Side panes can feel cut out from scenic context | Separation layer, not panel owner. |
| inspector darkening mask | World inspector, Forge rail | Improves inspector readability without full blackout | Base scenic contrast may compete with inspector text | Controlled local darkening, not scenic replacement. |
| hero underlay | Cultivation support, Prestige support | Grounds support UI near focal hero zones | Current layers may lack subtle depth under focal support cards | Underlay only; hero/scenic ownership unchanged. |
| brush-emphasis underlay | Path, Heart Law, Status sections, module sections | Adds local hierarchy emphasis without hard chrome | Existing primitives alone may not provide low-profile emphasis | Soft support swash; no state-stamp role or repaint intent. |
| ornamental underplate | Ritual support blocks, selected support contexts | Adds calm ornamental cohesion | Without it, some ceremonial blocks may feel materially flat | Underplate support only; no UI ownership transfer. |

## 14) Defer map

Explicitly deferred:

- tracked stamps
- claim-ready stamps
- completion seals
- recommendation swash packet (state-family scope)
- FX atlas
- Cultivation hero kit
- Heart Law altar/seal kit
- world labels
- live screen wiring

## 15) Acceptance criteria

- [ ] Brief keeps overlays low-profile and support-only.
- [ ] Roles are clearly separated from state-family, FX, and hero-overlay packets.
- [ ] Alpha/opacity/tint/stretch laws are explicit.
- [ ] Screen usage matrix maps roles to real screen families.
- [ ] Proof-anchor map explains support-role need without scenic replacement.
- [ ] No live integration, no art generation, and no destructive cleanup implied.
