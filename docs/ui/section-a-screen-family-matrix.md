# Section A.5 — Screen-Family Matrix

## Purpose

This file classifies live UI surfaces into one dominant family each. It exists so later packets stop vague “screen restyle” language and instead declare exact family, intensity, and layer ownership intent. This matrix pairs family identity with dominant layers and anti-drift rules using current repo truth from `docs/ui/section-a-touchpoint-registry.md`.

## Classification principles

1. **Experience over mount type** — Family is determined by visible user experience, not by whether it mounts in a screen file or modal file.
2. **Compound host rule** — If one host contains multiple distinct user-visible experiences, classify each experience row separately.
3. **Routing-shell rule** — Routing hosts (for example `WorldBuildingModal`) inherit active child family; they do not create a sixth family.
4. **Shared-inspector rule** — Drawers/inspectors/details inherit owning screen family unless they behave as dense-management operational sub-surfaces.
5. **Dominant-family rule** — Every visible surface must resolve to exactly one dominant family.
6. **No ambiguity rule** — “Half hero / half dense” planning language is invalid.

## Family definitions summary

| Family | Intensity | Implementation rule | Dominant layer | Common risk |
| --- | --- | --- | --- | --- |
| Hero ritual screens | High | Centerpiece and scenic ownership must stay primary; fewer stronger cards | Layer 1 + Layer 3 | Flattening into generic dashboard cards |
| Scenic world screen | High | Painted map/world ownership leads; overlays explain | Layer 1 + Layer 3 | Treating world like a module card stack |
| Module activity screens | Medium | Role clarity and task readability first; scenic treatment second | Layer 3 | Over-theatricalizing medium-intensity modules |
| Dense management screens | Low to medium | Sober, paper-led, motion-stable management flow | Layer 3 | Fake scenic takeover that slows management |
| Ritual modals | Medium to high | Centered ritual framing with controlled effects and explicit DOM truth | Layer 3 + Layer 2 | Assuming all modal content is one family |

## Surface-by-surface matrix (current live surfaces)

| Visible surface | Canonical owner file(s) | Dominant family | Intensity | Dominant layer(s) | Anti-drift note |
| --- | --- | --- | --- | --- | --- |
| Cultivation main surface | `src/components/screens/CultivateScreen.tsx` | Hero ritual screens | High | Layer 1 + Layer 3 | Preserve centerpiece/scenic ownership; do not over-card. |
| Status / run compass experience | `src/ui/status/RunCompass.tsx`, `src/ui/status/PostFailureDiagnosisPanel.tsx` | Hero ritual screens | High | Layer 3 (with Layer 1 context) | Truth clarity must stay explicit; no hover-only critical states. |
| Path Selection step (hosted in life-start flow) | `src/components/modals/LifeStartWizardModal.tsx` | Hero ritual screens | High | Layer 1 + Layer 3 | Modal mount does not change family; hero ritual rules apply. |
| Heart Law Selection | `src/ui/cultivation/heartLaw/HeartLawMindView.tsx`, `src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx` | Hero ritual screens | High | Layer 1 + Layer 3 | Preserve sacred focal semantics; do not flatten into dense table layout. |
| Prestige main screen | `src/components/screens/PrestigeScreen.tsx` | Hero ritual screens | High | Layer 3 + Layer 1 | Keep prestige meaning explicit; avoid generic management-only treatment. |
| World hub | `src/components/screens/WorldScreen.tsx`, `src/components/screens/CityMapHub.tsx` | Scenic world screen | High | Layer 1 + Layer 3 | Painted world ownership leads; overlays explain. |
| City arrival surface | `src/components/screens/CityMapHub.tsx` | Scenic world screen | High | Layer 1 + Layer 3 | Keep diegetic scene readability; do not convert to module list cards. |
| Outskirts | `src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx` | Module activity screens | Medium | Layer 3 | Role/task clarity first; scenic support is secondary. |
| Ruins | `src/components/screens/world/buildings/RuinsBuildingPanel.tsx` | Module activity screens | Medium | Layer 3 | Avoid dense spreadsheet mode and avoid hero spectacle takeover. |
| Gate Trial | `src/components/screens/world/buildings/GateTrialBuildingPanel.tsx` | Module activity screens | Medium | Layer 3 | Must not be treated as dense management grid. |
| Manual Pavilion | `src/components/screens/ManualPavilionPanel.tsx` | Module activity screens | Medium | Layer 3 + Layer 1 | Preserve module identity; do not reclassify as dense library admin. |
| Apothecary | `src/components/screens/ApothecaryPanel.tsx` | Module activity screens | Medium | Layer 3 + Layer 1 | Task flow clarity first with local room identity support. |
| Forge | `src/components/screens/ForgePanel.tsx` | Module activity screens | Medium | Layer 3 + Layer 1 | Preserve forge ownership; avoid hero-only spectacle escalation. |
| Bounties | `src/components/screens/BountyBoardPanel.tsx` | Module activity screens | Medium | Layer 3 | Keep board role clarity; do not push to high-spectacle hero pattern. |
| Expeditions | `src/components/screens/ExpeditionBoardPanel.tsx` | Module activity screens | Medium | Layer 3 | Maintain operational flow; avoid scenic takeover. |
| Inventory | `src/components/screens/InventoryScreen.tsx` | Dense management screens | Low to medium | Layer 3 | Must stay paper-led and dense; no scenic painting behavior. |
| Techniques | `src/components/screens/TechniqueLibraryScreen.tsx` | Dense management screens | Low to medium | Layer 3 | Must stay operationally scannable; no hero ritual framing takeover. |
| Prestige ritual experience | `src/components/modals/PrestigeRitualModal.tsx` | Ritual modals | Medium to high | Layer 3 + Layer 2 | Ritual modal framing with limited controlled FX. |
| Current chapter exhausted | `src/components/modals/CurrentChapterExhaustedModal.tsx` | Ritual modals | Medium to high | Layer 3 + Layer 2 | Keep actionable truth in DOM; no hover-only critical guidance. |
| Life summary | `src/components/modals/LifeSummaryModal.tsx` | Ritual modals | Medium to high | Layer 3 + Layer 2 | Ritual wrap, readable summary truth, restrained motion. |
| World-building routing host | `src/components/modals/WorldBuildingModal.tsx` | Inherits active child family (routing shell) | Inherits child | Inherits child | Host shell is not its own family; classify active child surface instead. |

### Compound host and inherited-family clarifications

- `LifeStartWizardModal.tsx` is a **compound host**: it can carry ritual-modal shell framing and hero Path Selection experience. Classify by visible sub-surface row, not by file suffix.
- `WorldBuildingModal.tsx` is a **routing shell**: it inherits the family of active child content and must not be treated as a standalone sixth family.
- Right-side inspectors, drawers, and detail panes inherit owner family unless they are explicitly dense-management operational sub-surfaces.

## Family rules by category

### Hero ritual screens

**Optimize for:** centerpiece ownership, scenic negative space, fewer stronger cards, readable truth, restrained ambient FX.

**Must remain subordinate:** Layer 2 chrome wrappers and decorative Layer 4 effects.

**Drift to reject:** dashboard flattening, over-carded utility layout, replacing scenic focal ownership with uniform shell blocks.

**Current examples:** Cultivation, Status surface, Heart Law Selection, Prestige main screen, Path Selection step.

### Scenic world screen

**Optimize for:** painted map/world ownership with explanatory overlays.

**Must remain subordinate:** module-style card stacking and shell-heavy takeover.

**Drift to reject:** treating world shell as module management board; collapsing city arrival into generic dashboard blocks.

**Current examples:** World hub (`WorldScreen` + `CityMapHub`), city arrival experience.

### Module activity screens

**Optimize for:** role clarity, localized grouping, actionable sequence, medium-intensity scenic support.

**Must remain subordinate:** high-spectacle hero treatment and dense spreadsheet behavior.

**Drift to reject:** module-to-hero escalation, module-to-dense flattening, replacing local scene support with generic shell dominance.

**Current examples:** Outskirts, Ruins, Gate Trial, Manual Pavilion, Apothecary, Forge, Bounties, Expeditions.

### Dense management screens

**Optimize for:** paper-led hierarchy, operational speed, stable row/card behavior, low-motion semantics.

**Must remain subordinate:** scenic spectacle and decorative negative-space excess.

**Drift to reject:** scenic takeover, large centerpiece insertion, layout instability from recommendation/warning/selected states.

**Current examples:** Inventory, Technique Library, dense drawer/filter/detail inspector sub-surfaces.

### Ritual modals

**Optimize for:** centered ritual framing, explicit readable decision truth, controlled medium-to-high intensity.

**Must remain subordinate:** full-screen scenic sprawl and heavy FX.

**Drift to reject:** modal = family shortcut, where modal-hosted hero steps are misclassified as ritual modal by mount type alone.

**Current examples:** Prestige ritual modal, Current Chapter Exhausted modal, Life Summary modal, ritual information/detail scrolls if present in live flow.

## Cross-family confusion warnings

- Do not treat World as a module panel stack.
- Do not treat Techniques as a hero ritual scenic centerpiece.
- Do not treat Gate Trial as dense spreadsheet management.
- Do not treat Bounties/Expeditions as high-spectacle hero ritual surfaces.
- Do not treat modal hosts as family-defining by default; classify the visible experience.

## Future packet usage rule

Later packets must identify, at minimum:

1. family;
2. intensity;
3. dominant layer;
4. unchanged Layer 1 ownership (when relevant).

If a packet cannot state these four values, family/layer planning is incomplete.

## Non-goals

- Not a touchpoint registry replacement.
- Not a screen redesign document.
- Not a cutover workflow.
- Not a packet-template schema.
- Not implementation code.
