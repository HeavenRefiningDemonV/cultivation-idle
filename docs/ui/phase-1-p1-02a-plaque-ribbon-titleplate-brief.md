# P1-02A — Shared Plaque / Ribbon / Title-Plate / Breadcrumb Brief

## 1) Packet purpose and scope

P1-02A defines the shared plaque/ribbon/title-plate/breadcrumb support-chrome family.

This family is support chrome, not scenic replacement. It is a sibling family to P1-02 frame-atlas assets and must not replace or redefine frame behavior.

## 2) Why now

Phase 1.2 support chrome depends on both frame atlas and plaque/ribbon/title systems. The frame family alone cannot carry all reusable header/label hierarchy roles for:

- major screen headers
- section headers
- card-level headers
- inspector titles
- city-arrival banners
- ritual modal titles
- current-city/current-module breadcrumb strips

This packet precedes dedicated world/building label plaques (P1-02B) and dedicated state stamps/swashes because it establishes shared header/title hierarchy first.

## 3) Doctrine inheritance

This packet inherits and enforces:

- preserve-first
- enhance-first
- no future-art excuse
- screenshot-proof first
- no cutover without approval
- no destructive cleanup in this packet

## 4) Family boundary and exclusions

### In scope

- shared plaque family
- shared ribbon family
- title-plate logic
- breadcrumb-strip logic
- city-arrival banner logic
- inspector title logic
- card/header hierarchy logic

### Out of scope

- dedicated world/building map labels (P1-02B)
- tracked/claim-ready/recommended stamps and swashes (later state-family packet)
- frame-atlas role definitions (P1-02)
- overlay/mask/FX/hero support families
- live integration

## 5) Continuity with P1-02 frame family

Plaques/ribbons/title-plates must visibly belong to the P1-02 frame language via:

- shared paper-grain behavior
- compatible ink contour logic
- restrained seal geometry
- restrained bronze accents
- coherent value hierarchy

They must not duplicate:

- full frame ownership
- card border behavior
- inspector shell behavior
- modal body-frame behavior

## 6) Canonical role inventory

### A) Major screen header plaque

- **Role statement:** Primary per-screen title carrier for major mode context.
- **Intended screen examples:** World, Gate Trial, Forge, Bounties, Expeditions.
- **Hierarchy level:** High.
- **Intended emotional weight:** Confident, ceremonial-light, operational.
- **Prohibited usage:** Map placard labels, state stamps, scenic banner replacement.
- **Text-safe zone:** 12/28/12/28 px inset baseline.
- **Likely aspect ratio:** 4.0:1 to 5.0:1.
- **Stretch mode:** Semi-stretch with protected endcaps.
- **Code tint:** Yes.
- **Frame pairing:** `frame_standard_default`, `frame_heavy_default`.
- **Ornament budget:** Moderate at endcaps only.
- **Center vs endcap behavior:** Center must remain calm and text-led; ornament pushed to ends.
- **Semantic state carry:** Low; state semantics belong to chips/labels, not plaque body.

### B) Long section ribbon

- **Role statement:** Section-level heading ribbon for multi-block layouts.
- **Intended screen examples:** Status sections, Cultivation support groups, Forge subsections.
- **Hierarchy level:** Medium-high.
- **Intended emotional weight:** Structured and directional.
- **Prohibited usage:** City/building placards, high-consequence modal title replacement.
- **Text-safe zone:** 10/24/10/24 px.
- **Likely aspect ratio:** 5.0:1 to 7.0:1.
- **Stretch mode:** Nine-slice horizontal.
- **Code tint:** Yes.
- **Frame pairing:** `frame_light_default`, `frame_standard_default`.
- **Ornament budget:** Low-to-moderate.
- **Center vs endcap behavior:** Endcaps can carry ornament; center remains quiet text band.
- **Semantic state carry:** Very low.

### C) Short section ribbon

- **Role statement:** Compact section marker for smaller blocks and sub-panels.
- **Intended screen examples:** Manual Pavilion subgroups, Bounty card clusters, Expedition subheaders.
- **Hierarchy level:** Medium.
- **Intended emotional weight:** Quiet structure.
- **Prohibited usage:** Primary page title, state badge replacement.
- **Text-safe zone:** 10/20/10/20 px.
- **Likely aspect ratio:** 2.5:1 to 4.0:1.
- **Stretch mode:** Fixed-width variants (S/M/L) or limited semi-stretch.
- **Code tint:** Yes.
- **Frame pairing:** `frame_light_default`, `frame_standard_default`.
- **Ornament budget:** Low.
- **Center vs endcap behavior:** Minimal endcap motifs; center must remain clean.
- **Semantic state carry:** None beyond neutral hierarchy.

### D) Card-level header plaque

- **Role statement:** Title strip for card-level support blocks.
- **Intended screen examples:** Gate Trial checklist cards, Forge requirement blocks, Status diagnostic cards.
- **Hierarchy level:** Medium.
- **Intended emotional weight:** Functional and clear.
- **Prohibited usage:** Full card frame substitution or scenic ownership.
- **Text-safe zone:** 8/18/8/18 px.
- **Likely aspect ratio:** 3.0:1 to 4.5:1.
- **Stretch mode:** Nine-slice horizontal.
- **Code tint:** Yes.
- **Frame pairing:** all frame weights, bias toward light/standard.
- **Ornament budget:** Low.
- **Center vs endcap behavior:** Center quietness prioritized over endcap flourish.
- **Semantic state carry:** Minimal.

### E) Inspector title plate

- **Role statement:** Header plate for inspector/read panes.
- **Intended screen examples:** World inspector, Forge side rail, contextual read panes.
- **Hierarchy level:** Medium-high within pane context.
- **Intended emotional weight:** Anchoring but calm.
- **Prohibited usage:** Pane body framing, map placard role.
- **Text-safe zone:** 10/22/10/22 px.
- **Likely aspect ratio:** 3.5:1 to 5.0:1.
- **Stretch mode:** Semi-stretch with protected left/right caps.
- **Code tint:** Yes.
- **Frame pairing:** `inspector_shell_standard_default`, `frame_standard_default`.
- **Ornament budget:** Low.
- **Center vs endcap behavior:** Endcaps modest; center remains text-forward.
- **Semantic state carry:** Low.

### F) Breadcrumb strip — current city

- **Role statement:** Quiet context strip for current-city navigation identity.
- **Intended screen examples:** World main, city-arrival context, module entry headers.
- **Hierarchy level:** Low-medium.
- **Intended emotional weight:** Quiet navigational context.
- **Prohibited usage:** Building placard, state stamp, primary title.
- **Text-safe zone:** 8/16/8/16 px.
- **Likely aspect ratio:** 4.0:1 to 6.0:1.
- **Stretch mode:** Nine-slice horizontal.
- **Code tint:** Yes.
- **Frame pairing:** `frame_light_default`, `inspector_shell_standard_default`.
- **Ornament budget:** Very low.
- **Center vs endcap behavior:** Center plain; endcaps simple markers only.
- **Semantic state carry:** None beyond location context.

### G) Breadcrumb strip — current module

- **Role statement:** Quiet module-context strip paired with city breadcrumb.
- **Intended screen examples:** Gate Trial, Forge, Bounties, Expeditions.
- **Hierarchy level:** Low-medium.
- **Intended emotional weight:** Quiet operational context.
- **Prohibited usage:** State badge lane, world placard.
- **Text-safe zone:** 8/16/8/16 px.
- **Likely aspect ratio:** 4.0:1 to 6.0:1.
- **Stretch mode:** Nine-slice horizontal.
- **Code tint:** Yes.
- **Frame pairing:** `frame_light_default`, `frame_standard_default`.
- **Ornament budget:** Very low.
- **Center vs endcap behavior:** Same as city breadcrumb; strictly calm center.
- **Semantic state carry:** None.

### H) City-arrival banner

- **Role statement:** Transitional title banner for city-arrival context and immediate orientation.
- **Intended screen examples:** World city-arrival, major module arrival transitions.
- **Hierarchy level:** Highest among shared plaque/ribbon roles.
- **Intended emotional weight:** Ceremonial and anchoring.
- **Prohibited usage:** Persistent map placard labels or fixed page header replacement.
- **Text-safe zone:** 14/32/14/32 px.
- **Likely aspect ratio:** 5.0:1 to 8.0:1.
- **Stretch mode:** Semi-stretch with protected ornate endcaps.
- **Code tint:** Yes, but restrained.
- **Frame pairing:** `frame_heavy_default`, `modal_frame_heavy_default`.
- **Ornament budget:** Moderate-high at ends; no center medallion clutter.
- **Center vs endcap behavior:** Endcaps carry most ornament; center remains readable text field.
- **Semantic state carry:** None.

### I) Ritual modal title plate

- **Role statement:** High-consequence modal title surface for ritual contexts.
- **Intended screen examples:** Prestige ritual, chapter exhausted, life summary ritual context.
- **Hierarchy level:** Highest with city-arrival banner.
- **Intended emotional weight:** Ritual-consequence emphasis.
- **Prohibited usage:** Modal body-frame replacement, state stamp replacement.
- **Text-safe zone:** 12/30/12/30 px.
- **Likely aspect ratio:** 3.5:1 to 6.0:1.
- **Stretch mode:** Semi-stretch or fixed L/XL variants.
- **Code tint:** Yes where practical.
- **Frame pairing:** `modal_frame_heavy_default`, `frame_heavy_default`.
- **Ornament budget:** Moderate-high, strictly outside center text band.
- **Center vs endcap behavior:** Center calm; endcaps may carry ritual motifs.
- **Semantic state carry:** Low; title identity only.

## 7) Family-wide style laws

- xianxia parchment + ink language is mandatory.
- Sacred ornament must be restrained and reusable.
- No browser-tab look.
- No fantasy metal frame language.
- No giant center emblem.
- No scene painting.
- No state-stamp overload.
- No layout-shift-dependent ornament.
- No loud baked background glow.

## 8) Material / hierarchy rules

Hierarchy order (heaviest to quietest):

1. city-arrival banner / ritual modal title plate
2. major screen header plaque
3. inspector title plate / long section ribbon
4. card-level header plaque / short section ribbon
5. breadcrumb strips (city/module)

Rules:

- city-arrival + ritual modal titles are heaviest.
- inspector/card headers remain calmer.
- breadcrumb strips are quietest.
- no role may become scenic owner.

## 9) Text-safe zone and padding rules

Baseline role-class insets (top/right/bottom/left px):

- major screen header plaque: `12/28/12/28`
- long section ribbon: `10/24/10/24`
- short section ribbon: `10/20/10/20`
- card-level header plaque: `8/18/8/18`
- inspector title plate: `10/22/10/22`
- breadcrumbs: `8/16/8/16`
- city-arrival banner: `14/32/14/32`
- ritual modal title plate: `12/30/12/30`

Additional rules:

- Ornament zones are protected and must not host text.
- Center fields remain quiet and text-first.
- Line count default: 1 line; optional 2 lines only for long localization in high-width roles.
- If text is long, width grows via stretch/variant; font-size collapse is secondary.

## 10) Stretch / nine-slice rules

- **Fully nine-slice-safe horizontal roles:** long ribbon, card header plaque, breadcrumbs, selected inspector plates.
- **Semi-stretch with protected endcaps:** major screen header plaque, city-arrival banner, ritual modal title plate.
- **Fixed-width S/M/L variants:** short section ribbon (primary), ritual modal title plate fallback when needed.

Hard prevents:

- no stretch-zone ornament clutter
- no center medallions in text band
- no text baked into decorative caps

## 11) Naming contract

Canonical examples:

- `ui_plaque_screen_header_long_default_l.png`
- `ui_ribbon_section_header_long_default_m.png`
- `ui_ribbon_section_header_short_default_s.png`
- `ui_plaque_card_header_standard_default_s.png`
- `ui_titleplate_inspector_standard_default_m.png`
- `ui_breadcrumb_city_current_default_m.png`
- `ui_breadcrumb_module_current_default_m.png`
- `ui_banner_city_arrival_standard_default_l.png`
- `ui_titleplate_ritual_modal_heavy_default_l.png`

Forbidden patterns:

- mood names (`ui_plaque_mystic_vibe`)
- version spam (`final_v2`, `final_final`)
- screen-local shared names without justification (`world_only_header`)
- world/building placard names in this packet (`ui_world_building_label_*`)

## 12) Screen usage matrix

| Role | Screen examples | Why it belongs |
| --- | --- | --- |
| Major screen header plaque | World, Gate Trial, Forge, Bounties, Expeditions | Shared high-level screen context header without scenic replacement. |
| Long section ribbon | Status sections, Cultivation support sections, Forge subsections | Cross-screen section hierarchy with reusable horizontal behavior. |
| Short section ribbon | Manual Pavilion subheaders, Bounty/Expedition subgroup labels | Compact hierarchy marker for local blocks. |
| Card-level header plaque | Gate Trial checklist cards, Forge requirement cards, Status diagnostic cards | Card-level title role not covered by frame boundaries alone. |
| Inspector title plate | World inspector, Forge side rail | Pane title clarity while preserving inspector shell role. |
| Breadcrumb strip — city | World current city context | Quiet location context strip distinct from placards. |
| Breadcrumb strip — module | Gate Trial/Forge/Bounties/Expeditions current module strip | Quiet module context strip for navigation orientation. |
| City-arrival banner | World city-arrival transition | Heavier arrival context role before user enters module detail. |
| Ritual modal title plate | Prestige ritual, chapter exhausted, life summary | High-consequence ritual title role aligned with modal context. |
| Heart Law and Life Start header roles | Heart Law modal and Life Start summary/header lanes | Shared title hierarchy role where existing chips/cards are insufficient for hierarchy alone. |

## 13) Proof-anchor map

Evidence basis is `docs/ui/phase-1-wave0-screenshot-matrix.md`.

| Proof anchor role | Target screens | Screenshot slots | Current primitive gap requiring this family |
| --- | --- | --- | --- |
| Path summary plaque proof | `life-start-path` | `01-base`, `02-interaction` | Generic cards do not provide dedicated selection-summary title hierarchy tied to triptych context. |
| Heart Law right-detail title proof | `dao-heart-law`, `life-start-heart-law` | `01-base`, `03-truth-states` | Existing shell lacks reusable title carrier for doctrine/detail hierarchy without ad hoc per-surface treatment. |
| Status diagnostic section-header proof | `status-main` | `01-base`, `03-truth-states` | Shared frame alone does not provide explicit section-header role across diagnostic clusters. |
| World current-city/current-module breadcrumb proof | `world-main` | `01-base`, `02-interaction`, `03-truth-states` | Current context strips are not unified reusable breadcrumb carriers and risk ad hoc labels. |
| Gate Trial checklist/title hierarchy proof | `gate-trial-main` | `01-base`, `03-truth-states` | Checklist and title levels need separate reusable title carriers beyond frame boundaries. |
| Forge requirement/current-vs-next header proof | `forge-main` | `01-base`, `03-truth-states` | Requirement/current-next hierarchy lacks shared header plates/ribbons with stable text-safe behavior. |
| Bounties/Expeditions support-header proof | `bounty-board-main`, `expedition-board-main` | `01-base`, `03-truth-states` | Board/route support headings need shared hierarchy plates distinct from state stamps. |
| Prestige ritual title proof | `prestige-ritual`, `current-chapter-exhausted`, `life-summary` | `01-base`, `03-truth-states` (or explicit N/A per row) | Ritual title hierarchy needs reusable title-plate role distinct from modal body frame. |

## 14) Defer map

Explicitly deferred:

- world/building label plaques (P1-02B)
- claim-ready / tracked / recommended stamps (later state family)
- bounty-note local variants
- expedition route-slip local variants
- gate-specific local support kit
- forge-specific local support kit
- apothecary-specific local support kit

## 15) Acceptance criteria

- [ ] Brief remains inside shared plaque/ribbon/title/breadcrumb scope.
- [ ] Role inventory includes all nine required roles with required attributes.
- [ ] World/building labels are explicitly deferred to P1-02B.
- [ ] State-stamp/swash family is explicitly deferred.
- [ ] Proof anchors cite real screens and screenshot slots.
- [ ] Frame-family continuity is explicit without redefining frame jobs.
- [ ] No live integration, no art generation, and no cleanup authority are implied.
