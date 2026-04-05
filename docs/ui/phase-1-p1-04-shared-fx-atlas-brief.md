# P1-04 — Shared FX Sprite Atlas Brief

## 1) Packet purpose and scope

P1-04 defines the shared FX sprite atlas family for Phase 1 support-art rollout.

This packet defines support atmosphere only (mist, motes, glints, pulses, wisps) and does not grant screen ownership, shell ownership, or scenic repaint authority.

P1-04 is a sibling family to shared chrome (P1-02 families), overlay/mask support (P1-03), and later hero enhancement kits (Wave 3).

## 2) Why now

This packet is sequenced after shared chrome and overlay/mask groundwork so atmospheric layers can follow stable composition rules instead of bypassing them.

This packet is sequenced before hero enhancement kits so Cultivation/World/Forge/Gate Trial/Path Selection/Heart Law use one shared FX vocabulary instead of unrelated local effects.

This packet is not screen integration. It is docs/spec/scaffold definition for reusable atlas roles and governance constraints.

## 3) Doctrine inheritance

- preserve-first
- enhance-first
- additive only
- no future-art excuse
- no cutover without approval
- readable truth stays in the DOM

## 4) Family boundary and exclusions

### In scope

- Shared painterly FX sprite roles (mist, dust, glints, embers, halo breath, seal pulse, aura wisp, firefly motes, brush shimmer accent).
- Role-first naming, atlas grouping, alpha/tint/export rules.
- Quality-tier and Reduced Motion behavior expectations.
- Screen budget guidance by screen family.
- Manifest example and review criteria for art-generation readiness.

### Out of scope

- Overlay/mask implementation (owned by P1-03 family).
- State underlays, recommendation swashes, tracked/claim-ready/completion stamps.
- Cultivation and Heart Law hero enhancement kits (later packet family).
- Live Pixi wiring, runtime animation scripting, or shader delivery.
- Screen ownership changes, scenic repaint, readable-truth migration, or destructive cleanup.

## 5) Continuity with current scenic owners and shell

FX must support existing scenic owners and paper/ink shell hierarchy rather than replacing those owners.

All FX assets must fit the parchment/ink material world: painterly, spiritual, low-saturation, and alpha-led.

FX must never:

- behave like a frame/plaque/chrome owner;
- become a screen owner;
- carry critical text or readable truth;
- read as neon spectacle, sci-fi HUD sweep, or reward-burst confetti.

## 6) Canonical role inventory

### A) Mist wisp

- **Role statement:** Soft atmosphere veil for depth cohesion and stillness.
- **Intended screen examples:** Path / Life Start, Cultivation, World, Prestige ritual modal.
- **Intended hierarchy level:** Low.
- **Intended emotional weight:** Calm, contemplative.
- **Prohibited usage:** Dense management screens as constant fog layer; text lane washout.
- **Alpha profile expectations:** Feathered edge, sparse center, low-opacity overlaps.
- **Tintability expectations:** Yes (grayscale/sepia/jade-leaning tints).
- **Likely motion usage later:** Slow drift/parallax only.
- **Placement family fit:** Scenic + hero-adjacent screens; avoid dense screen dominance.
- **Reuse breadth:** High, cross-screen atmospheric base role.
- **Atlas friendliness:** High; can share atlas cell family with haze variants.

### B) Dust mote cluster

- **Role statement:** Fine particulate depth cues for old paper/air ambience.
- **Intended screen examples:** Cultivation, World, Manual Pavilion, Techniques (very sparse).
- **Intended hierarchy level:** Low.
- **Intended emotional weight:** Subtle age/quiet motion.
- **Prohibited usage:** Heavy continuous snow/noise fields in dense list-heavy screens.
- **Alpha profile expectations:** Tiny soft particles, low-opacity tails, sparse density.
- **Tintability expectations:** Yes.
- **Likely motion usage later:** Slow floating or sparse twinkle cadence.
- **Placement family fit:** Scenic/module screens primarily; dense screens static or near-off.
- **Reuse breadth:** High.
- **Atlas friendliness:** High; packed as micro-particle strips/tiles.

### C) Sacred glint

- **Role statement:** Gentle sacred highlights for ritual emphasis.
- **Intended screen examples:** Heart Law, Prestige ritual modal, Cultivation key moments.
- **Intended hierarchy level:** Low-medium.
- **Intended emotional weight:** Sacred focus without spectacle.
- **Prohibited usage:** Confetti-like reward spray, rapid lens-flare spam.
- **Alpha profile expectations:** Small luminous center with soft falloff; low count.
- **Tintability expectations:** Yes; restrained warm/jade accents allowed.
- **Likely motion usage later:** Short pulse or intermittent sparkle.
- **Placement family fit:** Hero/ritual/scenic focal zones only.
- **Reuse breadth:** Medium-high.
- **Atlas friendliness:** High; glint shards and micro-star soft variants share group.

### D) Ember drift

- **Role statement:** Low-frequency ember-style warmth for forge/ritual heat memory.
- **Intended screen examples:** Forge, Gate Trial, selective ritual contexts.
- **Intended hierarchy level:** Low-medium.
- **Intended emotional weight:** Warm intensity, controlled energy.
- **Prohibited usage:** Full-screen fire storm or action-combat spectacle overlay.
- **Alpha profile expectations:** Soft ember core, faint smoke fringe, sparse occupancy.
- **Tintability expectations:** Partial (warm authored base with controlled tint window).
- **Likely motion usage later:** Upward drift loops, low velocity.
- **Placement family fit:** Scenic/module hero-adjacent areas; avoid dense-management clutter.
- **Reuse breadth:** Medium.
- **Atlas friendliness:** Medium-high; ember chunks and faint trails grouped.

### E) Halo breath

- **Role statement:** Breathing halo aura under/around sacred focal zones.
- **Intended screen examples:** Cultivation center support, Heart Law ritual focus, Prestige modal.
- **Intended hierarchy level:** Medium support (never primary owner).
- **Intended emotional weight:** Spiritual resonance.
- **Prohibited usage:** Hard-edged spotlight or strong bloom ring dominating UI.
- **Alpha profile expectations:** Broad soft radial fade, transparent center bias.
- **Tintability expectations:** Yes.
- **Likely motion usage later:** Very slow pulse amplitude changes.
- **Placement family fit:** Hero/ritual contexts; dense screens generally no.
- **Reuse breadth:** Medium-high.
- **Atlas friendliness:** High via radial families in atlas group.

### F) Seal pulse

- **Role statement:** Controlled symbolic pulse layer for seal/altar support cues.
- **Intended screen examples:** Heart Law, Prestige ritual modal, occasional Cultivation ritual supports.
- **Intended hierarchy level:** Medium support.
- **Intended emotional weight:** Ceremonial activation cue.
- **Prohibited usage:** Frequent strobing, combat-like impact flash, textual badge replacement.
- **Alpha profile expectations:** Ring/crest-like soft pulse with bounded intensity.
- **Tintability expectations:** Yes with restrained palette.
- **Likely motion usage later:** Timed pulse cycle with long rests.
- **Placement family fit:** Hero/ritual only.
- **Reuse breadth:** Medium.
- **Atlas friendliness:** Medium; grouped pulse rings and companion accents.

### G) Aura wisp

- **Role statement:** Gentle living-energy wisps around focal support elements.
- **Intended screen examples:** Cultivation, Heart Law, selected Prestige contexts.
- **Intended hierarchy level:** Low-medium.
- **Intended emotional weight:** Spiritual vitality.
- **Prohibited usage:** Aggressive lightning trails, neon plasma effects.
- **Alpha profile expectations:** Soft elongated wisps with very light cores.
- **Tintability expectations:** Yes.
- **Likely motion usage later:** Curved drift loops and low-frequency swirl.
- **Placement family fit:** Hero/scenic support zones; dense screens almost always static/off.
- **Reuse breadth:** Medium-high.
- **Atlas friendliness:** High; multiple wisp silhouettes share one group.

### H) Firefly / world mote

- **Role statement:** Sparse ambient motes for world-scale living atmosphere.
- **Intended screen examples:** World, Outskirts, Ruins, Path / Life Start.
- **Intended hierarchy level:** Low.
- **Intended emotional weight:** Lively but quiet ambience.
- **Prohibited usage:** Constant swarm density or navigation-obscuring particle blankets.
- **Alpha profile expectations:** Tiny soft points with restrained glow radius.
- **Tintability expectations:** Yes.
- **Likely motion usage later:** Sparse wander paths with low cadence.
- **Placement family fit:** Scenic/world contexts primarily.
- **Reuse breadth:** High.
- **Atlas friendliness:** High; packed dot clusters and singles.

### I) Brush shimmer accent

- **Role statement:** Painterly shimmer stroke for local emphasis transitions.
- **Intended screen examples:** Cultivation module transitions, Gate Trial support cards, ritual modal accents.
- **Intended hierarchy level:** Low-medium.
- **Intended emotional weight:** Poetic focus cue.
- **Prohibited usage:** Replacing state stamps/swashes or becoming persistent motion ribbon.
- **Alpha profile expectations:** Soft brush texture with controlled highlight ridge.
- **Tintability expectations:** Yes.
- **Likely motion usage later:** Brief one-pass shimmer or static placement.
- **Placement family fit:** Module/hero support; dense screens minimal.
- **Reuse breadth:** Medium.
- **Atlas friendliness:** Medium-high; grouped brush arcs with mild variants.

## 7) Family-wide style laws

- Painterly xianxia atmosphere is mandatory.
- Low saturation is the default.
- Soft alpha edges are mandatory; hard cut edges are disallowed.
- Grayscale / sepia compatibility is preferred where possible.
- Warm or jade accents are allowed only where role-justified.
- No hard bloom on ordinary UI support contexts.
- No chromatic flicker.
- No confetti language.
- No sci-fi sweep lines.
- No giant radial burst behavior.

## 8) Quality-tier and Reduced Motion laws

- **High FX:** Full shared role availability with restrained density and slow motion.
- **Medium FX:** Same role set with reduced density, lower cadence, and fewer simultaneous emitters.
- **Low FX:** Static or near-static role usage only; sparse occupancy.
- **Reduced Motion:** Static-only or one-shot non-loop accents; no continuous drift/pulse requirements.
- **Coherence rule:** UI must remain fully coherent when continuous FX is disabled.

## 9) Screen budget map

| Screen family | FX allowed | Primary role set | Intensity budget | Continuous motion allowed |
| --- | --- | --- | --- | --- |
| Path / Life Start | Yes | mist wisp, firefly/world mote, sacred glint (sparse) | Low-medium | Limited slow drift only |
| Heart Law | Yes | halo breath, seal pulse, aura wisp, sacred glint | Medium | Yes, restrained/slow |
| Cultivation | Yes | mist wisp, aura wisp, halo breath, sacred glint | Medium | Yes, restrained/slow |
| Status | Limited | mist wisp or dust mote only (very sparse) | Low | Usually no; static preferred |
| World | Yes | firefly/world mote, mist wisp, dust mote | Low-medium | Yes, sparse/slow |
| Outskirts | Yes | firefly/world mote, dust mote, ember drift (very sparse) | Low-medium | Yes, sparse/slow |
| Ruins | Yes | dust mote, mist wisp, firefly/world mote | Low-medium | Yes, sparse/slow |
| Gate Trial | Yes | ember drift, brush shimmer accent, dust mote | Medium | Limited and controlled |
| Manual Pavilion | Limited | dust mote cluster only | Low | No continuous motion by default |
| Techniques | Limited | dust mote cluster or brush shimmer accent (rare) | Low | No continuous motion by default |
| Inventory | Minimal | normally none; fallback static mist at most | Very low | No |
| Apothecary | Limited | dust mote, mist wisp (very sparse) | Low | Limited slow only |
| Forge | Yes | ember drift, dust mote, sacred glint (rare) | Medium | Limited, slow drift |
| Bounties | Minimal | generally none; optional static dust | Very low | No |
| Expeditions | Minimal | generally none; optional static dust | Very low | No |
| Prestige / ritual modals | Yes | halo breath, seal pulse, sacred glint, aura wisp | Medium | Yes, restrained and optional |

## 10) Naming contract

Role-first canonical examples:

- `ui_fx_mist_wisp_soft_default.png`
- `ui_fx_dust_mote_soft_default.png`
- `ui_fx_glint_sacred_soft_default.png`
- `ui_fx_ember_drift_soft_default.png`
- `ui_fx_halo_breath_soft_default.png`
- `ui_fx_seal_pulse_soft_default.png`
- `ui_fx_aura_wisp_soft_default.png`
- `ui_fx_firefly_mote_world_default.png`
- `ui_fx_brush_shimmer_soft_default.png`

Forbidden naming patterns:

- non-role names like `final_fx_v2` or `pretty_glow`;
- ownership names like `world_screen_owner_fx`;
- state-stamp naming patterns (`*_recommended_*`, `*_tracked_*`, `*_claim_ready_*`);
- neon/sci-fi semantics (`*_laser_*`, `*_hud_sweep_*`, `*_rgb_flicker_*`).

## 11) Atlas grouping and export rules

- Transparent background is mandatory.
- Alpha-driven edges are mandatory.
- Atlas-friendly size discipline is mandatory (small/medium sprite families, no oversized backdrop sheets).
- Recommended atlas groups:
  - `mist_and_haze`
  - `dust_and_motes`
  - `glint_and_spark_soft`
  - `embers_and_heat_hints`
  - `halo_and_seal_support`
  - `aura_and_brush_accents`
- Static vs later procedural guidance:
  - keep painterly reusable silhouettes as static sprites;
  - defer procedural heat shimmer/shader behavior to later implementation packets when screen-justified.
- No checkerboard, no background plates, and no scenic backdrops embedded in exports.

## 12) Proof-anchor map

| Role | Target screens | Visual problem solved | Why scenic ownership stays primary | Why reusable shared FX beats one-off effects |
| --- | --- | --- | --- | --- |
| mist wisp | Path, Cultivation, World, Prestige modal | Adds soft atmospheric cohesion between shell and scenic plane | Scenic room/city/hero bases remain the dominant image plane | Shared wisps avoid custom fog implementations per screen |
| dust mote cluster | Cultivation, World, Pavilion, Techniques | Adds subtle depth and age without structural changes | Existing panels and scenery retain hierarchy and readability | Reusable particle sprites keep density and tone consistent |
| sacred glint | Heart Law, Prestige, Cultivation | Adds sacred emphasis cues to ritual moments | Core scenic and UI owners still carry meaning and layout | Shared glint vocabulary avoids random local sparkle styles |
| ember drift | Forge, Gate Trial, ritual-adjacent contexts | Introduces controlled warmth/energy ambience | Forge/room owners remain visually primary | Shared ember set avoids bespoke per-scene flame effects |
| halo breath | Heart Law, Cultivation, Prestige modal | Grounds sacred focus zones with soft aura support | Hero/scenic owner art remains focal; halo is additive support | Shared halo family ensures one coherent spiritual language |
| seal pulse | Heart Law, Prestige ritual modal | Indicates ceremonial activation with restrained pulse | Ritual shell and truth surfaces stay in DOM and remain readable | Shared pulse family avoids incompatible seal effects |
| aura wisp | Cultivation, Heart Law, Prestige | Adds living-energy movement around focal support zones | Focal owners remain intact and dominant | Shared wisp silhouettes preserve consistency across rituals |
| firefly/world mote | World, Outskirts, Ruins, Path | Adds low-frequency world ambience and scale life | World scenic overlays and map owners remain primary | Shared motes prevent arbitrary one-off world sparkles |
| brush shimmer accent | Cultivation modules, Gate Trial support surfaces, ritual cards | Adds painterly transition emphasis without loud VFX | Existing card/chrome/scenic owners still define structure | Shared accent strokes reduce packet drift into state-swash families |

## 13) Defer map

Explicitly deferred from P1-04:

- overlay/mask family work (P1-03 scope);
- state underlays/stamps/recommendation swashes;
- hero enhancement overlay kits (later wave);
- live integration and screen wiring;
- shader-specific heat shimmer where non-sprite behavior is required;
- icon-family replacement;
- destructive cleanup;
- final packed runtime atlas generation.

## 14) Acceptance criteria

- [ ] Brief clearly defines shared FX sprite atlas scope only.
- [ ] Family is explicitly separated from overlays/masks, state families, and hero kits.
- [ ] All canonical roles include usage, prohibition, alpha, tint, and quality/reduced-motion expectations.
- [ ] Screen budget map covers required screen families with bounded intensity guidance.
- [ ] Naming and atlas/export rules are explicit and enforceable.
- [ ] Proof-anchor map preserves scenic ownership and support-art posture.
- [ ] No live integration, no art generation, and no destructive cleanup are implied.
