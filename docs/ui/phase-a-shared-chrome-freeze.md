# Phase A.3 — Shared Chrome Freeze and Non-Destructive Compatibility Pass

## 1) Purpose of Packet A.3
Packet A.3 freezes the current shared chrome/runtime shell family into additive, scenic-compatible behavior before any screen-specific recovery work (A.4–A.7) proceeds.

## 2) Dependency on A.1 and A.2
This packet applies A.1 doctrine and A.2 continuity findings at the shared-layer runtime level:
- A.1 provides the non-destructive preservation-and-enhancement constitution.
- A.2 provides concrete screen continuity risks that shared chrome must not worsen.

## 3) Current Shared Chrome Owners in This Repo
Current runtime/style owners for shared chrome behavior:
- `src/styles/uiPanelChrome.scss`
- `src/styles/uiScreenComposition.scss`
- `src/styles/uiAssetContinuityGuards.scss` (added in A.3)
- `src/ui/fx/primitives/ScreenCompositionRoot.tsx`
- `src/ui/fx/primitives/ScenicBackdropMount.tsx`
- `src/ui/fx/primitives/AmbientUnderlayMount.tsx`
- `src/ui/fx/primitives/SafeDomOverlaySlot.tsx`
- `src/ui/ink/*`
- `src/ui/paper/*`

This packet does **not** create a speculative new runtime `src/ui/chrome/*` tree.

## 4) What “Freeze” Means
Freeze means shared chrome is now treated as local, additive Layer 2 runtime surface:
- shared chrome may wrap, frame, label, and organize scenic/base art,
- shared chrome may not replace or visually demote scenic/base art by default,
- shared chrome defaults are tuned toward scenic compatibility rather than page ownership.

## 5) Layer Contract
Runtime composition contract (explicitly reinforced in A.3):
- **Layer 1:** scenic/base art (`ScenicBackdropMount`, `uiScenicBasePlane`)
- **Layer 2:** shared chrome/material overlays (`InkPanel`, `PaperCard`, chips/stamps, modal panel shells)
- **Layer 3:** readable DOM content structure and safe DOM overlays
- **Layer 4:** atmosphere/FX underlay and hero FX lanes

## 6) Allowed Shared Chrome Behavior
- local paper planes and bounded card shells
- local texture overlays clipped to component bounds
- plaques/ribbons/chips/stamps as local labels
- inspector and modal panel framing as local overlay surfaces
- additive local shadows/outlines that preserve scenic readability

## 7) Prohibited Shared Chrome Behavior
- screen-wide scenic background ownership by shared shells
- full-page opaque replacement slabs
- default suppression of scenic Layer 1
- removing old scenic/base layers
- assuming scenic screens should be flattened into generic shared cards

## 8) File-by-File Freeze Mapping
- `src/styles/global.css`: imports `uiAssetContinuityGuards.scss` globally for stable class availability.
- `src/styles/uiAssetContinuityGuards.scss`: defines additive continuity classes (`uiScenicBaseHost`, `uiScenicBasePlane`, `uiChromeOverlaySurface`, etc.).
- `src/styles/uiPanelChrome.scss`: tuned to neutral additive local frame behavior while preserving buttoncorner tactile identity.
- `src/styles/uiScreenComposition.scss`: reinforced scenic/base vs underlay/content/overlay lane contract.
- `ScreenCompositionRoot.tsx`: now marks root as scenic host (`uiScenicBaseHost`) with stable layer-root data attrs.
- `ScenicBackdropMount.tsx`: now explicitly marks scenic/base plane (`uiScenicBasePlane`, `uiPreserveBaseArt`, `data-scenic-base`).
- `AmbientUnderlayMount.tsx`: now marked as FX underlay lane, not scenic replacement.
- `SafeDomOverlaySlot.tsx`: marked as safe DOM overlay lane with non-flatten semantic class.
- `InkPanel.tsx/.scss`: now advertises additive chrome intent with stable data attrs and less owning defaults.
- `ui/ink/PaperCard.tsx/.scss`: retains legacy class family, now tagged as additive local chrome surface.
- `ui/paper/PaperCard.tsx` + `ui/paper/paper.scss`: retains tactile paper identity while explicitly local/additive.
- `PaperChip/PaperStamp` wrappers: tagged as bounded local label surfaces.
- `InkModalFrame.tsx/.scss`: modal shell marked as local modal overlay surface, not thematic page owner.

## 9) Comparison Notes vs Latest
`Latest` / `origin/Latest` branch comparison was **not available** in this workspace. A.3 therefore uses current branch state + A.1/A.2 doctrine to apply non-destructive shared-layer freeze changes.

## 10) Compatibility Contract
Mandatory legacy class roots preserved:
- `inkPanel`
- `inkPaperCard`
- `paperCard`
- `inkPaperChip`
- `paperChip`
- `paperStamp`
- `inkModalFrame`

## 11) Later Packet Consumption
- A.4–A.7 can now perform screen restoration without shared chrome defaulting to visual ownership.
- This packet does **not** waive screen-level cutover gates.
- Later recovery packets must still obey A.1/A.2 doctrine and cutover requirements.

## 12) Manual QA and Acceptance
A.3 acceptance requires:
- shared-chrome freeze doc exists,
- continuity guard stylesheet exists,
- shared shells advertise additive/scenic-compatible intent,
- composition primitives clearly separate scenic base vs overlay lanes,
- legacy root classes are preserved,
- no screen files are touched,
- contract test passes,
- typecheck/build pass, or blockers are reported clearly.
