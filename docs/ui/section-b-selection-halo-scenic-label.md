# Section B.10 — SelectionHalo and ScenicLabel families

## 1) Purpose of B.10
B.10 converges selection emphasis and scenic/world labels into one shared overlay language. It introduces canonical shared chrome helpers for zero-footprint selection visuals and diegetic label rendering, then adopts them in the current world and ritual selection surfaces.

## 2) Dependency on B.1–B.9
This packet assumes B.1–B.9 foundations are already present, especially:
- `src/ui/chrome/index.ts` as shared export surface.
- Existing shared chrome families (`FrameCard`, ribbon/chip/dock/top-ribbon/inspector/modal).
- Shared motion-safety helpers under `src/ui/fx/motion/*`.
- Existing accent asset bridge (`chromeAccentAssets.ts`) and no new art dependency.

If these are missing, B.10 should stop and report dependency gaps instead of recreating prior packets.

## 3) Current repo drift inventory
- `CityMapHub` hotspot labels were ad hoc local pills.
- `WorldModuleCard` selection/recommendation emphasis was local and disconnected.
- `LifeStartWizardModal` path hover/selected and wizard card selected states were ad hoc (including pseudo-element underlays).
- `ChangeHeartLawModal` active law emphasis was local border/shadow styling.

## 4) Canonical ownership decision
Shared ownership now lives in:
- `SelectionHalo`
- `ScenicLabel`
- `OverlaySwash`

These are the preferred shared entry points for selected/preview/recommended emphasis and scenic map labels.

## 5) Canonical API for `SelectionHalo`
- `SelectionHaloTone = 'default' | 'recommendation' | 'warning' | 'success'`
- `SelectionHaloVariant = 'ring' | 'panel' | 'label'`
- `SelectionHaloInset = 'tight' | 'normal' | 'wide'`
- Props: `active`, `tone`, `variant`, `inset`, `className`

Behavior:
- Decorative DOM-only layer.
- Absolute positioning, pointer-events none.
- Zero layout footprint.
- Motion safety integrated via `useMotionSafety({ emphasis: 'subtle', disableScale: true })`.

## 6) Canonical API for `ScenicLabel`
- `ScenicLabelTone = 'default' | 'recommendation' | 'warning'`
- Props: `title`, `subtitle`, `active`, `compact`, `tone`, `className`, `titleAttr`

Behavior:
- DOM-first scenic plaque label.
- Title line always rendered, optional subtitle line.
- Truncation-safe layout.
- Can compose `SelectionHalo` and `OverlaySwash` internally.

## 7) Canonical API for `OverlaySwash`
- `OverlaySwashVariant = 'shortBar' | 'blockFancy' | 'cornerFrame'`
- `OverlaySwashTone = 'default' | 'recommendation' | 'warning'`
- `OverlaySwashPlacement = 'fill' | 'center' | 'bottom'`
- Props: `active`, `variant`, `tone`, `placement`, `className`

Behavior:
- Decorative DOM-only underlay.
- Absolute positioned with no footprint.
- Bounded and text-safe.

## 8) Asset reuse rule
B.10 reuses first-pass assets via shared chrome accent ownership:
- `block_fancy.png`
- `bar_short.png`
- `buttoncorners.png`

No new art is introduced in this packet.

## 9) Adoption table
| target file | old pattern | new shared mapping | preserved local hooks |
|---|---|---|---|
| `CityMapHub.tsx/.scss` | Local hotspot label slab and active/preview styles | `ScenicLabel` + `SelectionHalo` + optional `OverlaySwash` for recommendation | `.cityMapHubHotspot`, `.cityMapHubHotspotLabel` |
| `WorldModuleCard.tsx/.scss` | Local active/preview/recommendation-only card styling | Card-local overlays via `SelectionHalo` + `OverlaySwash` | `.worldModuleCard--active`, `.worldModuleCard--previewed`, `.worldModuleCard--recommended` |
| `LifeStartWizardModal.tsx/.scss` | Path and wizard-card selected pseudo-element systems | Path and card emphasis via shared `SelectionHalo` + `OverlaySwash` | `.lifePathPanel`, `.wizardCard`, `.wizardCard--selected`, `.wizardCardButton--selected` |
| `ChangeHeartLawModal.tsx` + `HeartLawPanel.scss` | `.heartLawOption--active` local border/shadow owner | Active option now includes `SelectionHalo` + `OverlaySwash` | `.heartLawOption`, `.heartLawOption--active` |

## 10) Motion-safety and reduced-motion rules
- `SelectionHalo` uses shared motion-safety resolution (`useMotionSafety`).
- Reduced motion is expressed via `selectionHalo--reducedMotion` and no animated transform dependence.
- Path-panel selection host uses existing `MotionSafeSelectionSurface` where helpful.

## 11) No-layout-footprint rules
- `SelectionHalo` and `OverlaySwash` are absolute layers and never change host geometry.
- No border-width growth or padding mutation between selected/recommended states.
- `ScenicLabel` keeps bounded dimensions and truncation behavior to avoid hotspot growth.

## 12) Explicit non-goals
- No world layout redesign.
- No life-start flow redesign.
- No heart-law modal IA redesign.
- No new Pixi/FX work.
- No new art.

## 13) Manual QA and acceptance criteria
Manual QA should confirm:
- City map labels remain readable over scenic art.
- Active/preview/recommended emphasis is visible and bounded.
- Module/path/law selection emphasis is consistent across targeted surfaces.
- No layout shift from selection overlays.
- Reduced motion still preserves clear selected state.
