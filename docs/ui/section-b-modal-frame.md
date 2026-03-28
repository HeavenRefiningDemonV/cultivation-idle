# Packet B.9 — ModalFrame Convergence and Z-Layer Repair

## 1) Purpose of B.9
B.9 converges shared modal overlay/dialog shells behind one canonical owner (`ModalFrame`) and removes raw z-index drift so modal stacking respects the tokenized layer system.

## 2) Dependency on B.1–B.8
This packet assumes:
- B.1 chrome ownership baseline
- B.2 token normalization
- B.3 `FrameCard` variants (including `modal`)
- B.4 plaque/ribbon conventions
- B.5 chip/stamp conventions
- B.6 dock conventions
- B.7 top ribbon conventions
- B.8 inspector conventions

## 3) Current repo modal-shell drift inventory
- Legacy shell: `InkModalFrame` owned its own backdrop/dialog/z-layer behavior.
- Separate shell: `DetailScrollModal` implemented a second overlay/dialog shell.
- Direct portal overlays existed in chapter and life summary modals.
- `WorldBuildingModal` used low-level `Modal` with independent shell/z policy.
- Wrapper-local z-index hacks existed in `LifeStartWizardModal` and `MedicinePouchModal`.

## 4) Canonical ownership decision
Canonical shared owner for modal shells:
- `src/ui/chrome/ModalFrame`

`InkModalFrame` and `DetailScrollModal` remain exported as compatibility/shared compositions, but shell ownership now routes through `ModalFrame`.

## 5) Canonical `ModalFrame` API
- `open: boolean`
- `onClose: () => void`
- `children: ReactNode`
- `kind?: 'detail' | 'feature' | 'blocking'`
- `surface?: 'frame' | 'none'`
- `header?: ReactNode`
- `frameSkin?: 'default' | 'apothecary' | 'forge' | 'manual' | 'techniques' | 'prestige' | 'pouch' | 'heartlaw'`
- `watermark?: boolean`
- `showCloseButton?: boolean`
- `closeButtonLabel?: string`
- `className?: string`
- `overlayClassName?: string`
- `dialogClassName?: string`
- `panelClassName?: string`
- `ariaLabel?: string`
- `ariaLabelledby?: string`

## 6) Modal class mapping
- **detail**: information-review modals (`DetailScrollModal`, medicine pouch context)
- **feature**: large feature surfaces (`WorldBuildingModal`, `LifeSummaryModal`)
- **blocking ritual**: high-priority modal gates (`CurrentChapterExhaustedModal`, Dao Heart, wizard modal branch)

## 7) Adoption table
| target file | old shell pattern | new shared mapping | preserved local inner-content owners |
| --- | --- | --- | --- |
| `src/ui/ink/InkModalFrame.tsx` | standalone shell over `InkPanel` | compatibility wrapper over `ModalFrame` (`surface='frame'`) | `InkModalFrame.scss` sizing aliases only |
| `src/ui/primitives/DetailScrollModal.tsx` | direct low-level `Modal` + local shell | `ModalFrame kind='detail' surface='none'` | sticky header/body shadow internals in local SCSS |
| `src/components/modals/CurrentChapterExhaustedModal.tsx` | raw portal overlay/dialog | `ModalFrame kind='blocking' surface='frame'` | local body/action styles |
| `src/components/modals/LifeSummaryModal.tsx` | raw portal overlay/dialog | `ModalFrame kind='feature' surface='frame'` | local summary block grid/actions |
| `src/components/modals/WorldBuildingModal.tsx` | low-level `Modal` shell | `ModalFrame kind='feature' surface='none'` | scenic inner world-building body |
| `src/components/modals/DaoHeartModal.tsx` | custom overlay shell | `ModalFrame kind='blocking' surface='none'` | ritual parchment/tabs/fx internals |

## 8) Z-layer policy
- Modal shell layers use tokenized bands only.
- Added semantic aliases:
  - `--ui-layer-modal-detail-shell`
  - `--ui-layer-modal-feature-shell`
  - `--ui-layer-modal-blocking-shell`
- Removed raw modal-shell z-index ownership from touched shared shell files.

## 9) Backdrop / textured scrim rules
- Shared shell backdrop is now a restrained dark wash + low-opacity texture layer.
- `kind` classes adjust backdrop intensity while preserving readability.
- No new art files introduced; existing neutral texture is reused.

## 10) Explicit non-goals
- No rewrite of `TechniqueDetailModal`, `ManualDetailModal`, `PrestigeRitualModal` structures.
- No world scenic redesign.
- No hero-screen redesign.
- No modal content UX redesign beyond shell convergence.

## 11) Manual QA and acceptance criteria
Manual QA focus:
- Modal stacking remains coherent across detail/feature/blocking classes.
- Bottom dock remains below modals.
- Blocking ritual modals remain above lower modal classes and below emergency layer.
- Existing modal inner bodies continue functioning (scroll/header/actions/tabs).

Acceptance:
- `ModalFrame` is real owner.
- `InkModalFrame` delegates.
- `DetailScrollModal` uses `ModalFrame` shell ownership.
- Required modal surfaces adopt converged shell/layer policy.
- Wrapper-local z-index hacks removed from targeted callers.
