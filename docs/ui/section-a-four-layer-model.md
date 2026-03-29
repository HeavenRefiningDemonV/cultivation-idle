# Section A.5 — Four-Layer Screen Ownership Model

## Purpose

This file turns the v3 four-layer model into an operational planning tool. It exists so later packets can state exactly which layer they touch and which layer they must leave intact. This file inherits Section A doctrine from `docs/ui/section-a-global-doctrine.md`, destructive constraints from `docs/ui/section-a-destructive-freeze.md`, and current-surface naming from `docs/ui/section-a-touchpoint-registry.md`. It governs planning and classification, not implementation.

## Scope note

This file governs:

- Layer 1/2/3/4 definitions;
- layer responsibilities and dominance;
- layer anti-patterns;
- family-level layer emphasis;
- required later-packet layer declaration language.

This file does **not** govern:

- shell/component implementation;
- renderer stack choices;
- screenshot signoff workflow;
- cutover approval mechanics;
- screen redesign specifications;
- component coding;
- asset generation;
- numeric tuning.

## Layer definitions

### Layer 1 — Existing scenic/base art

**Operational definition:** Existing scenic or base visual ownership already present in the build (backgrounds, core scenic anchors, established emotional centerpieces).

**What it is for:**

- emotional ownership and world identity;
- continuity of recognized visual anchors;
- stable scenic substrate for other layers.

**What it is not for:**

- replacing gameplay truth with decoration;
- being overwritten by chrome by default;
- carrying critical state text alone.

**Allowed changes in later packets:**

- preserve in place;
- additive wrapping around current owner;
- restoration when previously weakened;
- bounded enhancement only when doctrine allows.

**Not-allowed drift:**

- silent ownership transfer to Layer 2;
- flattening hero/scenic screens into generic cards;
- removing scenic owner before cutover doctrine permits.

**Project examples:**

- Cultivation scenic base (`CultivateScreen` with dantian/lotus context);
- World/city scenic base (`WorldScreen`, `CityMapHub`);
- Manual/Tech/Forge/Bounty background ownership families referenced in asset doctrine;
- hero focal ownership in ritual-heavy flows.

### Layer 2 — New chrome/material

**Operational definition:** Added material wrappers that structure content presentation (frames, cards, plaques, shells, chips, borders, modal framing).

**What it is for:**

- formalizing visual system consistency;
- grouping regions and interaction zones;
- supporting hierarchy without stealing authorship.

**What it is not for:**

- becoming the screen’s owner by default;
- replacing scenic identity when Layer 1 exists;
- masking unresolved layout problems.

**Allowed changes in later packets:**

- additive shell/chrome reinforcement;
- reusable card/frame/plaque wrappers;
- constrained component-surface framing.

**Not-allowed drift:**

- chrome takeover of hero/scenic ownership;
- using frame systems as destructive replacement;
- equating “shared shell exists” with “replace whole screen.”

**Project examples:**

- `src/ui/ink/InkPanel.tsx`, `PaperCard.tsx`, `PaperChip.tsx`, `InkModalFrame.tsx`;
- module panel framing around Outskirts/Ruins/Gate Trial;
- modal plaque/scroll framing in ritual modal surfaces.

### Layer 3 — Readability/layout

**Operational definition:** Information architecture and interaction clarity layer: hierarchy, grouping, checklisting, state labels, disclosure, alignment, and stability.

**What it is for:**

- truthful, scannable understanding of actions and outcomes;
- stable layout under interaction/state changes;
- explicit ready/warning/recommended/selected signaling in DOM-visible surfaces.

**What it is not for:**

- delegated to hover-only cues for critical states;
- outsourced to FX or scenic art;
- optional when dense management speed is required.

**Allowed changes in later packets:**

- hierarchy adjustments;
- layout regrouping for clarity;
- reserved badge/state slots with no resize jitter;
- stable inspector/drawer/detail behavior.

**Not-allowed drift:**

- row/chip/card resizing across state toggles;
- readability loss in exchange for ornament;
- replacing text/state truth with pure iconography/FX.

**Project examples:**

- `RunCompass` and `PostFailureDiagnosisPanel` truth surfaces;
- Inventory and Technique Library dense operational surfaces;
- World command/module route explanatory overlays;
- modal state actions in Life Start / Chapter Exhausted / Life Summary.

### Layer 4 — Atmosphere/FX

**Operational definition:** Ambient and feedback polish layer applied after Layers 1–3 are coherent.

**What it is for:**

- mood deepening;
- restrained feedback emphasis;
- family-appropriate atmospheric finish.

**What it is not for:**

- carrying readable gameplay text;
- fixing weak hierarchy or unclear states;
- justifying broken intermediate composition.

**Allowed changes in later packets:**

- restrained ambient motion/lighting accents;
- localized support FX in modules;
- limited ritual-modal emphasis.

**Not-allowed drift:**

- FX-first planning before composition truth;
- using atmosphere to hide layout debt;
- dense-management spectacle takeover.

**Project examples:**

- restrained ambient support on hero ritual and world surfaces;
- localized module accents (e.g., forge/apothecary contextual effects);
- minimal dense-screen FX footprint.

## Layer boundaries (hard rules)

- Layer 1 may be minimal/absent on dense management surfaces, but when Layer 1 exists on hero or scenic-world surfaces it remains base owner.
- Layer 2 must organize and formalize; it must not silently become the screen.
- Layer 3 must own clarity, hierarchy, grouping, and actionable truth across all families.
- Layer 4 must never own readable gameplay meaning and must never compensate for weak Layers 2–3 decisions.

## Layer anti-patterns

The following are invalid and must be rejected in planning:

1. Treating a new frame/chrome system as permission to replace scenic ownership.
2. Solving layout debt by requesting new art instead of Layer 3 correction.
3. Using FX cues where text/chips/checklists must carry state meaning.
4. Using atmosphere as a substitute for hierarchy.
5. Forcing dense management surfaces into scenic spectacle.
6. Flattening hero ritual surfaces into generic dashboard card grids.
7. Declaring “restyle” goals without layer scope.

## Family-layer emphasis (summary)

| Screen family | Dominant layer | Secondary layers | Minimal layers | Notes |
| --- | --- | --- | --- | --- |
| Hero ritual screens | Layer 1 + Layer 3 | Layer 2, Layer 4 | None if hero focal ownership exists | Scenic ownership and centerpiece remain primary; readability truth must stay explicit. |
| Scenic world screen | Layer 1 + Layer 3 | Layer 2, Layer 4 | None for map ownership | Painted map/scenic world must lead; overlays explain instead of dominate. |
| Module activity screens | Layer 3 | Layer 1, Layer 2 | Layer 4 | Role clarity first, scenic treatment second, localized effects only when useful. |
| Dense management screens | Layer 3 | Layer 2 | Layer 1, Layer 4 | Operational speed and stable hierarchy dominate; avoid scenic takeover. |
| Ritual modals | Layer 3 + Layer 2 | Layer 1 (symbolic), Layer 4 (controlled) | Large scenic expanses | Ritual framing centered and readable; modal does not erase family logic. |

The full surface-level mapping is defined in `docs/ui/section-a-screen-family-matrix.md`.

## Later packet layer declaration rule

Every later UI packet must declare, in explicit terms:

1. target screen family;
2. target layer(s) being changed;
3. layer(s) intentionally untouched;
4. layer(s) intentionally deferred.

Valid example statement form:

- “Family: Hero ritual screens. Touching Layer 2 and Layer 3 only. Layer 1 scenic ownership remains. Layer 4 deferred.”

Invalid statement form:

- “Restyle this screen.”

## Cross-screen structural rules

- Hero ritual and scenic world surfaces may use scenic negative space.
- Dense management surfaces must not trade operational density for spectacle.
- World and life-start surfaces may use diegetic labels in scene context.
- Inventory and Technique Library must not be treated as scenic paintings.
- Recommendation/ready/warning/selected states must reserve badge space and must not resize rows, chips, cards, spines, or slots.
- Critical states must not rely on hover alone.
- No layer decision may imply mechanics unsupported by current gameplay truth.
- If old art family already owns identity, Layer 2 must organize around it rather than replacing it.

## Non-goals

- No implementation instructions.
- No cutover gate definition.
- No asset request generation.
- No duplication of the full screen-family matrix.
- No shell coding directives.
