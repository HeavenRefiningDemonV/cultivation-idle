# Phase 2 Touchpoint Registry (Repo-Truth Map)

## Purpose

Provide the Phase 2 canonical touchpoint map from live repo state so packet prompts reference verified files instead of stale shorthand.

## Current git basis (verified from repo)

- Branch: `work`
- Short commit: `cbcf65a`
- Detached HEAD: `no`

## Verification basis

This registry was built from direct file-content and import-consumer inspection of:

- `src/ui/fx/`
- `src/ui/shell/`
- `src/ui/ink/`
- `src/ui/paper/`
- `src/styles/paperInkTokens.scss`
- live consumers under `src/components/`, `src/ui/`, `src/features/`

## Registry rules

1. File paths are listed exactly (case-sensitive).
2. Consumer claims are import/usage-verified.
3. “Canonical” means current Phase 2 default authority, not total project exclusivity.
4. “Adjacent/non-canonical” means still-live or useful, but not the default authority for new Phase 2 packet prompts.
5. Where prior docs are stale, drift is recorded here without retroactively rewriting old docs.

## Resolved drift / ambiguity

- `docs/ui/section-a-touchpoint-registry.md` has stale git basis (`cbcf65a`) relative to current HEAD (`cbcf65a`).
- Section A marks `src/ui/paper/*` as non-canonical for defaults, but live repo truth shows active screen consumers still importing it.
- Phase 2 therefore records a split truth: `ui/ink` is canonical default, while `ui/paper` is adjacent legacy still live.

## Canonical vs adjacent mapping summary

| Path family | Phase 2 classification | Why |
| --- | --- | --- |
| `src/ui/fx/*` | canonical runtime substrate (with partial scene completion) | Active provider/stage/portal runtime and live usage on Cultivate + Status. |
| `src/ui/shell/*` | canonical shared shell primitive family | Live usage on World, modals, dock, and additional screens. |
| `src/ui/ink/*` | canonical material primitive default | Most active screen/material consumers import from `ui/ink`. |
| `src/ui/paper/*` | adjacent legacy material family (still live) | Still imported by live Bounty/Expedition board screens. |
| `src/styles/paperInkTokens.scss` | canonical shared token source | Existing shared token/alias root used by both material families and shell styles. |

## 1) FX substrate (exact file classification)

| File | Classification | Notes |
| --- | --- | --- |
| `src/ui/fx/FxQualityProvider.tsx` | canonical runtime substrate | Global quality context, stage registry, reduced-motion/document-hidden handling. |
| `src/ui/fx/ScreenFxStage.tsx` | canonical runtime substrate | Registers screen stage hosts and updates bounds/DPR. |
| `src/ui/fx/FxStagePortal.tsx` | canonical runtime substrate | Portals scene markup into registered stage host. |
| `src/ui/fx/pixi/PixiUiStage.tsx` | canonical runtime substrate (Pixi bridge) | React→Pixi stage bridge with ownership arbitration. |
| `src/ui/fx/runtime.ts` | canonical runtime helper | Scene contract/budget/runtime helper functions. |
| `src/ui/fx/types.ts` | canonical runtime contract | Shared types for quality, stage, scene, portal. |
| `src/ui/fx/constants.ts` | canonical runtime constants | Quality/stage IDs/budget constants. |
| `src/ui/fx/dev/fxDebug.ts` | dev-only helper | Dev debug API installer (`window.__ciFxDebug`). |
| `src/ui/fx/scenes/CultivationFxScene.tsx` | canonical live scene | Non-null scene implementation used by CultivateScreen. |
| `src/ui/fx/scenes/StatusFxScene.tsx` | canonical live scene | Non-null scene implementation used by StatusScreen. |
| `src/ui/fx/scenes/WorldFxScene.tsx` | scene stub / partial scene | Exists, currently returns `null`. |
| `src/ui/fx/scenes/ForgeFxScene.tsx` | scene stub / partial scene | Exists, currently returns `null`. |
| `src/ui/fx/scenes/SelectionFxScene.tsx` | scene stub / partial scene | Exists, currently returns `null`. |
| `src/ui/fx/ScreenFxStage.scss` | canonical style support | Base stage host/layer/content styling. |

## 2) Shared shell primitives (exact files)

| File | Classification |
| --- | --- |
| `src/ui/shell/FrameCard.tsx` + `FrameCard.scss` | canonical shared primitive |
| `src/ui/shell/PlaqueHeader.tsx` + `PlaqueHeader.scss` | canonical shared primitive |
| `src/ui/shell/TopRibbon.tsx` + `TopRibbon.scss` | canonical shared primitive |
| `src/ui/shell/BottomNavDock.tsx` + `BottomNavDock.scss` | canonical shared primitive |
| `src/ui/shell/InspectorPanel.tsx` + `InspectorPanel.scss` | canonical shared primitive |
| `src/ui/shell/InspectorDrawer.tsx` + `InspectorDrawer.scss` | canonical shared primitive |
| `src/ui/shell/RitualModalFrame.tsx` + `RitualModalFrame.scss` | canonical shared primitive |
| `src/ui/shell/ScenicLabel.tsx` + `ScenicLabel.scss` | canonical shared primitive |
| `src/ui/shell/BadgeSlot.tsx` + `badgeSpace.ts` | canonical support primitive |
| `src/ui/shell/PaperStamp.tsx` + `PaperStamp.scss` | canonical support primitive |
| `src/ui/shell/index.ts` | canonical export surface |

## 3) Material primitive split (`ui/ink` vs `ui/paper` vs token source)

### Canonical defaults for Phase 2

- `src/ui/ink/*` is the default material primitive family for Phase 2 packet prompts.
- `src/styles/paperInkTokens.scss` is the shared token source to treat as authority for shell/material tokenization.

### Adjacent / legacy / not-yet-converged

- `src/ui/paper/*` remains live and should be treated as adjacent legacy family, not deleted-by-default.
- Convergence is unresolved: active board screens still rely on `ui/paper` components.

### Live `ui/paper` import consumers (verified)

- `src/components/screens/BountyBoardPanel.tsx`
- `src/components/screens/ExpeditionBoardPanel.tsx`

### Live `ui/ink` import consumers (verified, non-exhaustive but direct)

- `src/features/professions/forge/ForgeWorkshop.tsx`
- `src/features/apothecary/ApothecaryBrewPanel.tsx`
- `src/components/screens/TechniqueLibraryScreen.tsx`
- `src/components/screens/InventoryScreen.tsx`
- `src/components/screens/ApothecaryPanel.tsx`
- `src/components/screens/ManualPavilionPanel.tsx`
- `src/components/screens/PrestigeScreen.tsx`
- `src/components/consumables/MedicinePouchPanel.tsx`
- `src/components/modals/LifeStartWizardModal.tsx`
- `src/components/modals/MedicinePouchModal.tsx`
- `src/components/modals/ManualDetailModal.tsx`

## 4) Current live consumer tables

### FX consumers

| Consumer file | Current usage |
| --- | --- |
| `src/components/GameLayout.tsx` | Wraps app tree with `FxQualityProvider`. |
| `src/components/screens/CultivateScreen.tsx` | Uses `ScreenFxStage`, `FxStagePortal`, `useFxQuality`, `useFxStageSnapshot`, runtime contract builder, `CultivationFxScene`. |
| `src/components/screens/StatusScreen.tsx` | Uses `ScreenFxStage`, `FxStagePortal`, `useFxQuality`, `useFxStageSnapshot`, runtime contract builder, `StatusFxScene`. |
| `src/components/modals/LifeStartWizardModal.tsx` | Uses `useFxQuality` (quality-aware behavior). |
| `src/components/modals/DaoHeartModal.tsx` | Uses `useFxQuality` (quality-aware behavior). |

### Shell consumers

| Consumer file | Shell imports used |
| --- | --- |
| `src/components/screens/WorldScreen.tsx` | `TopRibbon`, `InspectorPanel`, `InspectorDrawer` |
| `src/components/screens/CityMapHub.tsx` | `ScenicLabel` |
| `src/components/screens/ManualPavilionPanel.tsx` | `PlaqueHeader` |
| `src/components/screens/PrestigeScreen.tsx` | `TopRibbon`, `PaperStamp` (shell variant) |
| `src/components/BottomTabBar.tsx` | `BottomNavDock` |
| `src/components/modals/PrestigeRitualModal.tsx` | `RitualModalFrame` |
| `src/components/modals/CurrentChapterExhaustedModal.tsx` | `RitualModalFrame` |
| `src/components/modals/LifeSummaryModal.tsx` | `RitualModalFrame` |
| `src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx` | `RitualModalFrame` |

### `ui/ink` consumers

See list in Material Primitive Split section; those files actively import from `../../ui/ink/index.js` or equivalent relative path.

### `ui/paper` consumers

| Consumer file | Imports |
| --- | --- |
| `src/components/screens/BountyBoardPanel.tsx` | `PaperCard`, `PaperChip`, `PaperStamp` from `../../ui/paper/index.js` |
| `src/components/screens/ExpeditionBoardPanel.tsx` | `PaperCard`, `PaperChip`, `PaperStamp` from `../../ui/paper/index.js` |

## 5) Docs/governance touchpoints Phase 2 packets must cite

Later Phase 2 prompts should inherit, not replace, these docs:

- `docs/ui/renderer-stack-foundation.md`
- `docs/ui/phase-1-exit-audit.md`
- `docs/ui/phase-1-asset-packaging-ledger.md`
- `docs/ui/phase-1-phase2-handoff.md`
- `docs/ui/phase-0-packet-register.md`
- `docs/ui/phase-0-p0-14-universal-cutover-gate.md`
- `docs/ui/phase-0-phase1-phase2-handoff-watchpoints.md`
- `docs/ui/section-a-touchpoint-registry.md`
- `docs/ui/section-a-screenshot-approval-workflow.md`
- `docs/ui/section-a-definition-of-done-registry.md`
- `docs/ui/section-a-cutover-gate.md`

## 6) Adjacent but non-canonical for Phase 2 packet defaults

These are real files, but not default authority for new Phase 2 packet prompts:

- `src/ui/paper/PaperCard.tsx`
- `src/ui/paper/PaperChip.tsx`
- `src/ui/paper/PaperStamp.tsx`
- `src/ui/paper/paper.scss`
- `src/ui/fx/scenes/WorldFxScene.tsx` (scene stub)
- `src/ui/fx/scenes/ForgeFxScene.tsx` (scene stub)
- `src/ui/fx/scenes/SelectionFxScene.tsx` (scene stub)

These should be handled as explicit convergence or completion targets in later packets, not silently treated as already-canonical defaults.
