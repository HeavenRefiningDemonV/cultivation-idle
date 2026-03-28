# Packet B.8 — InspectorPanel Family

## 1) Purpose of B.8
B.8 converges contextual side-lane detail UI into one canonical shared shell (`InspectorPanel`) so World, Techniques, and Manual Pavilion stop maintaining ad hoc inspector-like card patterns.

## 2) Dependency on B.1–B.7
This packet assumes:
- B.1 shared chrome ownership and barrel conventions
- B.2 token normalization
- B.3 `FrameCard` shell family with `inspector` variant
- B.4 plaque/ribbon conventions
- B.5 chip/stamp conventions
- B.6 bottom dock conventions
- B.7 top ribbon conventions

## 3) Current repo inspector/detail drift inventory
- `WorldScreen` had no dedicated contextual inspector lane.
- `TechniqueLibraryScreen` used a local selected-technique summary card pattern.
- `ManualPavilionPanel` had no persistent selected-manual inspector lane.
- `ManualDetailModal` and `TechniqueDetailModal` remain intentionally separate deep-detail flows.

## 4) Canonical ownership decision
The canonical shared owner for contextual detail lanes is:
- `src/ui/chrome/InspectorPanel`

It is implemented as a real chrome primitive backed by `FrameCard variant="inspector"`.

## 5) Canonical `InspectorPanel` API
- `title: ReactNode`
- `subtitle?: ReactNode`
- `eyebrow?: ReactNode`
- `chips?: ReactNode`
- `meta?: ReactNode`
- `footer?: ReactNode`
- `scrollBody?: boolean`
- `className?: string`
- `bodyClassName?: string`
- `children: ReactNode`

Behavior:
- Header lane supports eyebrow/title/subtitle.
- Chips and meta are optional and bounded.
- Body can be scrollable (`scrollBody`) while header/footer remain structurally stable.
- Footer supports contextual actions without changing outer panel dimensions.

## 6) Adoption table
| target file | old pattern | new shared mapping | preserved local placement hooks |
| --- | --- | --- | --- |
| `src/components/screens/WorldScreen.tsx` | no contextual inspector lane | added right-side `InspectorPanel` driven by world module routing card truth | `worldScreenDetailGrid`, `worldInspectorDock`, `worldInspectorPanel` |
| `src/components/screens/TechniqueLibraryScreen.tsx` | one-off selected-technique `PaperCard` summary | replaced with `InspectorPanel` while keeping altar above | `techInspectorDock`, `techniqueLibraryPanel--summary` |
| `src/components/screens/ManualPavilionPanel.tsx` | no persistent selected-manual side inspector | added side-lane `InspectorPanel`; modal kept for deep flow | `manualPavilionMain`, `manualPavilionInspectorDock` |

## 7) World inspector behavior rules
Preview source priority:
1. live preview module from hotspot/card hover/focus
2. active/open module if valid
3. strong recommendation module
4. first visible module

Fallback behavior:
- if no module is available, inspector renders stable placeholder (`Select a module`) and guidance.

No duplication rule:
- `RunCompass` and world summary/alerts remain outside inspector.
- Inspector only shows module-specific contextual detail and action CTA.

## 8) Styling ownership rules
- `src/ui/chrome/InspectorPanel.scss` owns shared inspector shell look/lanes.
- Screen SCSS owns only placement and composition hooks.
- No screen-local bespoke inspector shell visuals are introduced.

## 9) No-layout-shift and scroll-body rules
- Stable header/body/footer lane structure.
- Long title/subtitle use safe wrapping.
- Chips remain wrapped in-lane without width growth.
- `scrollBody` allows internal overflow with stable outer dimensions.
- Hover/preview/selection states avoid border-width growth and outer-size changes.

## 10) Explicit non-goals
- No modal-family rewrite (`ManualDetailModal` / `TechniqueDetailModal` remain).
- No world scenic overhaul.
- No hero-screen redesign.
- No asset generation.
- No Run Compass replacement.

## 11) Manual QA and acceptance criteria
Manual QA focus:
- World hotspots/cards preview into inspector and recover fallback on pointer exit.
- Technique selected detail uses `InspectorPanel` with stable empty state.
- Manual Pavilion shows persistent inspector lane while shelf and modal flow remain stable.
- Titles/chips/footer remain aligned and stable with long content.

Acceptance:
- `InspectorPanel` is real shared owner using `FrameCard` inspector variant.
- World, Technique Library, and Manual Pavilion adopt it.
- World preview callbacks are wired from `CityMapHub` and `WorldModuleCard`.
- No new art files or modal-family convergence introduced.
