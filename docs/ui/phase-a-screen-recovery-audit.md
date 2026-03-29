# Phase A.2 — Screen Recovery Audit

## 1) Purpose of the Recovery Audit
This audit provides deeper per-screen recovery notes that later A.4–A.7 packets can execute directly, without re-discovering continuity failures.

## 2) Global Findings
- The current breakage pattern is primarily a **sequencing / half-migration** problem.
- In multiple surfaces, scenic/base identity appears at risk of being weakened before enhanced replacements are fully coherent.
- This is mostly an additive-layer execution gap, not evidence that the original direction (reuse + enhance + sober structure) was incorrect.

---

## 3) Per-Screen Detailed Sections (primary locked order)

### 3.1 `path_life_start` (owner: A.4)
**Screen purpose:** ritual onboarding and life-path commitment.

**Main live files:**
- `src/components/modals/LifeStartWizardModal.tsx`
- `src/components/modals/LifeStartWizardModal.scss`

**Screenshot evidence:** `needs-visual-verify` (no required screenshot file available).

**Layer 1 audit (existing scenic/base art):**
- Still works: path portrait assets (`path_heaven`, `path_earth`, `path_martial`) are directly imported.
- To restore later: stronger portrait framing if currently reading as naked cutouts.

**Layer 2 audit (chrome/material):**
- Keep: `InkModalFrame`, compatibility paper cards/chips, halo/swash overlays.
- Conflict risk: ritual composition may feel under-supported if chrome dominates without scenic anchors.

**Layer 3 audit (readability/layout):**
- New logic flow appears complete.
- Potential split between legacy life-path mode shell and newer wizard/chrome framing.

**Layer 4 audit (atmosphere/FX):**
- Minimal FX currently acceptable.
- Should stay mostly static until composition recovery is complete.

**Current broken states:**
- Probable portrait cutout risk.
- Possible old/new ritual header treatment overlap.

**No-go destructive moves:**
- Do not remove path portraits.
- Do not remove any old ritual framing until screenshot-approved replacement exists.

**Recommended later direction:**
- Rebuild ritual framing around preserved portraits first; then add new title-plate/seal accents.

**Cutover:** blocked (no screenshot approval; composition risk unresolved).

---

### 3.2 `cultivation` (owner: A.5)
**Screen purpose:** hero cultivation center with readiness/progression control.

**Main live files:**
- `src/components/screens/CultivateScreen.tsx`
- `src/components/screens/CultivateScreen.scss`
- `src/ui/cultivation/CultivationHeaderRibbon.tsx/.scss`
- `src/ui/cultivation/DantianOrb.tsx`
- `src/ui/cultivation/QiLotusIcon.tsx`

**Screenshot evidence:** `needs-visual-verify`.

**Layer 1 audit:**
- Still works: `cbg_full.png`, lotus family, `bar_long`, `bar_short`, `scroll` remain wired.
- To restore: altar/backdrop scenic weight where command-card layers flatten hero presence.

**Layer 2 audit:**
- Keep: cultivation ribbon/chrome primitives and no-shift behavior.
- Conflict risk: generic command cards can overtake hero scenic identity.

**Layer 3 audit:**
- Potential hierarchy tension between header rail and command deck regions.
- Verse/lotus/readiness grouping likely needs placement cleanup.

**Layer 4 audit:**
- Keep restrained; avoid heavy FX until scenic-chrome composition is coherent.

**Current broken states:**
- Hero-screen flattening risk.
- Possible disorganization in readiness/verse visual grouping.

**No-go destructive moves:**
- Do not remove cultivator backdrop.
- Do not remove legacy altar cues before replacement is verified.

**Recommended later direction:**
- Preserve scenic base, then align chrome cards/ribbon into one hero-focused composition.

**Cutover:** blocked.

---

### 3.3 `status` (owner: A.5)
**Screen purpose:** dense run diagnostics and troubleshooting clarity.

**Main live files:**
- `src/components/screens/StatusScreen.tsx`
- `src/components/screens/StatusScreen.scss`
- `src/ui/status/StatusSummaryHeader.tsx/.scss`

**Screenshot evidence:** `needs-visual-verify`.

**Layer 1 audit:**
- Still works: legacy paper/buttoncorners material cues remain in styles.
- To restore: material depth where uniform card tones flatten priority.

**Layer 2 audit:**
- Keep current summary/mini-card structure.
- Conflict risk: mixed legacy paper semantics and newer chrome/ribbon semantics.

**Layer 3 audit:**
- Structural diagnostic layout remains strong in code.
- Visual hierarchy likely flatter than intended.

**Layer 4 audit:**
- Should remain mostly static; readability has priority.

**Current broken states:**
- Flattened card hierarchy risk.
- Potential mixed summary language across old/new systems.

**No-go destructive moves:**
- Do not replace dense diagnostic scaffolding with generic visual simplification.

**Recommended later direction:**
- Depth and header hierarchy recovery without reducing information clarity.

**Cutover:** blocked.

---

### 3.4 `world` (owner: A.6)
**Screen purpose:** city selection, module routing, and map identity.

**Main live files:**
- `src/components/screens/WorldScreen.tsx`
- `src/components/screens/WorldScreen.scss`
- `src/components/screens/CityMapHub.tsx/.scss`
- `src/ui/world/WorldModuleCard.tsx/.scss`

**Screenshot evidence:** `needs-visual-verify`.

**Layer 1 audit:**
- Still works: citystate background overlays are directly imported and routed for hover previews.
- To restore: scenic map depth if module card layers flatten map identity.

**Layer 2 audit:**
- Keep: InspectorPanel, ScenicLabel, SelectionHalo, WorldModuleCard.
- Conflict risk: too much card/chrome ownership can displace map as the base plane.

**Layer 3 audit:**
- Potential split between hotspot labels, inspector stack, and legacy module presentation.
- Label/readability integrity requires screenshot verification.

**Layer 4 audit:**
- Limited enhancements should wait until map/chrome composition is stable.

**Current broken states:**
- Map flattening risk.
- Old/new ownership split between scenic map and chrome module systems.

**No-go destructive moves:**
- Do not remove city/citystate scenic layers.
- Do not convert world into generic card-only dashboard.

**Recommended later direction:**
- Preserve scenic map first; then add world plaque/label kit and overlay masks.

**Cutover:** blocked.

---

### 3.5 `manual_pavilion` (owner: A.6)
**Screen purpose:** manual discovery/purchase with shelf and spine identity.

**Main live files:**
- `src/components/screens/ManualPavilionPanel.tsx`
- `src/components/screens/ManualPavilionPanel.scss`

**Screenshot evidence:** `needs-visual-verify`.

**Layer 1 audit:**
- Still works: spine atlas is actively used (`spine_heaven/earth/martial/neutral`).
- To restore: shelf/rail scenic framing if generic trays have become dominant.

**Layer 2 audit:**
- Keep: ribbon + inspector additions.
- Conflict risk: generic cards replacing tactile shelf/spine navigation language.

**Layer 3 audit:**
- Selection and icon anchoring issues are plausible but need visuals.
- Potential layout-system overlap between old shelf patterns and new inspector dock.

**Layer 4 audit:**
- Keep calm/static; prioritize shelf identity recovery.

**Current broken states:**
- Bookshelf identity dilution risk.
- Mixed visual ownership between spine rails and generic cards.

**No-go destructive moves:**
- Do not remove spine art.
- Do not collapse rail browsing into generic card list.

**Recommended later direction:**
- Re-center spine/rail as base interaction, then harmonize with new inspector chrome.

**Cutover:** blocked.

---

### 3.6 `techniques` (owner: A.6)
**Screen purpose:** technique inventory + Inner Palace altar and decision support.

**Main live files:**
- `src/components/screens/TechniqueLibraryScreen.tsx`
- `src/components/screens/TechniqueLibraryScreen.scss`
- `src/components/techniques/InnerPalaceEquipAltar.tsx/.scss`

**Screenshot evidence:** `needs-visual-verify`.

**Layer 1 audit:**
- Still works: Inner Palace altar concept remains present in code surface model.
- To restore: scenic/material support if tray/card ownership overreaches.

**Layer 2 audit:**
- Keep: TopRibbon, InspectorPanel, chips, no-shift patterns.
- Conflict risk: old/new top ribbon coexistence; PaperCard residue still heavy in key rails.

**Layer 3 audit:**
- Inspector/detail ownership appears split across old/new patterns.
- Hierarchy may feel half-migrated.

**Layer 4 audit:**
- Delay scenic FX additions until ownership convergence is complete.

**Current broken states:**
- Duplicate or competing top-level presentation systems.
- Generic card dominance risk in areas that should feel altar-led.

**No-go destructive moves:**
- Do not remove altar anchors early.
- Do not delete old header/ribbon cues until single replacement is complete.

**Recommended later direction:**
- Unify header and inspector ownership while preserving altar as Layer 1 anchor.

**Cutover:** blocked.

---

### 3.7 `apothecary` (owner: A.7)
**Screen purpose:** buy/brew/pouch room with immediate readiness signaling.

**Main live files:**
- `src/components/screens/ApothecaryPanel.tsx`
- `src/components/screens/ApothecaryPanel.scss`
- `src/components/consumables/MedicinePouchPanel.tsx/.scss`

**Screenshot evidence:** `needs-visual-verify`.

**Layer 1 audit:**
- Room/counter foundation is still conceptually present.
- To restore: stronger room identity if generic trays overpower locality.

**Layer 2 audit:**
- Keep: current chrome/card integration where additive.
- Conflict risk: excessive PaperCard coverage flattening room identity.

**Layer 3 audit:**
- Readiness and pouch prominence must be verified visually; code alone is insufficient.

**Layer 4 audit:**
- Keep mostly static until room composition is coherent.

**Current broken states:**
- Generic card dominance risk.
- Potential dilution of room/cabinet narrative.

**No-go destructive moves:**
- Do not remove room foundations before coherent replacement.

**Recommended later direction:**
- Restore room identity first, then layer plaques and icon seals for role clarity.

**Cutover:** blocked.

---

### 3.8 `forge` (owner: A.7)
**Screen purpose:** workshop crafting with localized forge atmosphere.

**Main live files:**
- `src/features/professions/forge/ForgeWorkshop.tsx/.scss`
- `src/components/modals/WorldBuildingModal.scss` (forgewide background variants)

**Screenshot evidence:** `needs-visual-verify`.

**Layer 1 audit:**
- Still works: forgewide backgrounds exist and are referenced.
- To restore: room plate prominence where abstract shells dominate.

**Layer 2 audit:**
- Keep: shared chrome where it supports readability.
- Conflict risk: workshop becoming abstract tray matrix.

**Layer 3 audit:**
- Functional structure appears rich; visual localization may lag.

**Layer 4 audit:**
- Later add restrained forge FX only after room identity is secured.

**Current broken states:**
- Flattening risk from shared shell overuse.
- Potential loss of localized forge feel.

**No-go destructive moves:**
- Do not remove forgewide stage backgrounds.
- Do not normalize forge into generic management cards.

**Recommended later direction:**
- Re-anchor forge room first, then apply additive chrome and restrained embers.

**Cutover:** blocked.

---

### 3.9 `bounties_expeditions` (owner: A.7)
**Screen purpose:** board and route-paper tactical loops for tasking and runs.

**Main live files:**
- `src/components/screens/BountyBoardPanel.tsx/.scss`
- `src/components/screens/ExpeditionBoardPanel.tsx/.scss`

**Screenshot evidence:** `needs-visual-verify`.

**Layer 1 audit:**
- Still works: board/route-paper/hourglass identity is still represented in code and copy.
- To restore: tactile board props if flattened under generic shells.

**Layer 2 audit:**
- Keep: chip/stamp systems where additive.
- Conflict risk: chips/stamps + card shells overriding board tactility.

**Layer 3 audit:**
- Queue strips and status markers likely need visual coherence pass.

**Layer 4 audit:**
- No major FX required before base tactility is stable.

**Current broken states:**
- Potential flattening of board/route-paper identity.
- Mixed ownership between legacy paper idiom and new chrome overlays.

**No-go destructive moves:**
- Do not drop board or hourglass identity before replacement is complete.

**Recommended later direction:**
- Recover tactile board baseline, then re-layer chips/stamps and queue chrome.

**Cutover:** blocked.

---

### 3.10 `prestige` (owner: A.7)
**Screen purpose:** ritual reset/decree economy and long-term planning.

**Main live files:**
- `src/components/screens/PrestigeScreen.tsx`
- `src/components/screens/PrestigeScreen.scss`

**Screenshot evidence:** `needs-visual-verify`.

**Layer 1 audit:**
- Ritual/decree shell remains present.
- To restore: old framing depth where tray-heavy sections dilute ritual character.

**Layer 2 audit:**
- Keep: TopRibbon/RibbonStat/InkPanel combination where additive.
- Conflict risk: code shows both local `prestigeTopRibbon` header and shared `TopRibbon` usage.

**Layer 3 audit:**
- Structurally robust, but likely half-migrated visual hierarchy.
- Possible readability-vs-ritual-tone tension.

**Layer 4 audit:**
- Additional ritual FX should wait until header/frame ownership converges.

**Current broken states:**
- Duplicate header ownership risk.
- Half-migrated ritual styling risk.

**No-go destructive moves:**
- Do not remove old ritual framing before complete parchment/plaque replacement is visible and approved.

**Recommended later direction:**
- Converge to one ritual header/frame language, then add seal/icon polish.

**Cutover:** blocked.

---

## 4) Supplementary Surfaces Appendix

### `heart_law_selection` (supplementary)
- Files: `src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx`, `HeartLawPanel.scss`.
- Status: `code-confirmed`, `needs-visual-verify`.
- Note: structure exists; true altar/seal kit is still create-new backlog.

### `gate_trial` (supplementary)
- Files: `src/components/screens/world/buildings/GateTrialBuildingPanel.tsx`, `CombatStyles.scss`.
- Status: `code-confirmed`, `needs-visual-verify`.
- Note: combat/support flows wired; scenic continuity and composition still need visual verification.

## 5) Open Questions / Needs Visual Verify
- Exact severity of portrait cutout and framing gaps in `path_life_start`.
- Cultivation hero-depth integrity after chrome layering.
- Whether status hierarchy flattening is minor or severe.
- World map scenic identity strength under current module card/inspector mix.
- Degree of card-overreach in apothecary/forge/bounties-expeditions.
- Prestige header duplication impact in actual live render.

## 6) Phase A Consumption Notes
- **A.4:** consume `path_life_start` section and matching JSON row.
- **A.5:** consume `cultivation` + `status` rows/notes.
- **A.6:** consume `world`, `manual_pavilion`, `techniques` rows/notes.
- **A.7:** consume `apothecary`, `forge`, `bounties_expeditions`, `prestige` rows/notes.

Execution rule for all later packets:
- Preserve Layer 1 base art first.
- Apply additive Layer 2–4 enhancements.
- Keep cutover blocked until A.1 gate criteria are satisfied and screenshot-approved.
