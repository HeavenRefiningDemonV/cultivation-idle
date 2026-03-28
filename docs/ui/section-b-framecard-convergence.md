# Section B.3 — FrameCard family convergence

## 1) Purpose of B.3
B.3 makes `src/ui/chrome/FrameCard` the single real shared-shell implementation and converts legacy card/panel families into compatibility wrappers.

## 2) Dependency on B.1 and B.2
Required dependencies:
- B.1 canonical ownership surface (`src/ui/chrome/index.ts`, `FrameCard` entry point)
- B.2 canonical token layers (`src/styles/uiChromeTokens.scss`, `src/styles/uiMotionTokens.scss`)

B.3 assumes both are present and does not re-implement them.

## 3) Current repo shell split
Legacy families converged in this packet:
- `src/ui/ink/InkPanel`
- `src/ui/ink/PaperCard`
- `src/ui/paper/PaperCard`

## 4) Why FrameCard is now the single implementation owner
Maintaining three independent shell bases caused drift in state behavior, layout-shift risk, and duplicated style ownership. B.3 centralizes behavior, variant/state semantics, and token-backed motion/selection emphasis in one canonical implementation (`FrameCard.tsx` + `FrameCard.scss`).

## 5) Canonical FrameCard API
### Variants
- `shell`
- `tray`
- `label`
- `inspector`
- `modal`
- `dock`

### Skins
- `default`
- `apothecary`
- `forge`
- `manual`
- `techniques`
- `prestige`
- `pouch`
- `heartlaw`

### States
- `interactive`
- `selected`
- `disabled`
- `complete`
- `claimed`
- `recommended`
- `warning`

### Optional shell helpers
- `header`
- `watermark`

## 6) Legacy wrapper mapping table

| Legacy component | Old variant(s) | New FrameCard mapping | Preserved legacy classes |
| --- | --- | --- | --- |
| `ui/paper/PaperCard` | `card`, `tray`, `label` | `card->shell`, `tray->tray`, `label->label` | `paperCard`, `paperCard--*`, `paperCard--interactive`, `paperCard--selected`, `paperCard--disabled`, `isInteractive`, `isSelected`, `isComplete`, `isClaimed`, `isDisabled` |
| `ui/ink/PaperCard` | `card`, `tray`, `label`, `pouch` | `card->shell`, `tray->tray`, `label->label`, `pouch->shell + skin=pouch` | `inkPaperCard`, `inkPaperCard--*`, `inkPaperCard--interactive`, `inkPaperCard--selected`, `inkPaperCard--disabled` |
| `ui/ink/InkPanel` | `default`, `apothecary`, `forge`, `manual`, `techniques`, `prestige`, `pouch`, `heartlaw`, `modal` | mostly `variant=shell` + mapped `skin`, except `modal->variant=modal` | `inkPanel`, `inkPanel--*`, `inkPanel--watermark`; header/body lanes preserved (`.inkPanel__header`, `.inkPanel__body`) |

## 7) Styling ownership rules
- `src/ui/chrome/FrameCard.scss` is now the canonical shared-shell style owner.
- `src/ui/ink/InkPanel.scss` is now a compatibility skin/header/body layer.
- `src/ui/ink/PaperCard.scss` is now a compatibility alias layer (including pouch tuning).
- `src/ui/paper/paper.scss` no longer owns full card-base implementation; it keeps `paperChip`/`paperStamp` ownership and paper-card compatibility hooks.

## 8) No-layout-shift rules
- Selected state emphasis is non-layout-changing (inset/outline/box-shadow) in `FrameCard`.
- Legacy `inkPaperCard` selected styling no longer increases border width.
- Hover/press remain transform/shadow based with token-backed motion timing.

## 9) Explicit non-goals
B.3 does not:
- migrate screen imports,
- redesign screen layouts,
- converge chips/stamps/nav/ribbon/modal ecosystems,
- add assets or FX work.

## 10) Manual QA and acceptance criteria
Manual QA for B.3:
1. `npm run typecheck`
2. `tsc --project tsconfig.tests.json && node --test tmp-tests/tests/contracts/frameCardConvergenceContract.test.js`
3. `npm run build`
4. Smoke-check legacy live shell surfaces (Forge/Apothecary/TechniqueLibrary/Prestige/ManualPavilion/MedicinePouch/LifeStartWizard/BountyBoard/ExpeditionBoard).

Acceptance:
- FrameCard is real implementation owner.
- Legacy wrappers delegate to FrameCard and preserve compatibility classes/APIs.
- Selected state does not grow element footprint.
- No screen import migration occurred.
