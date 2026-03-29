# Section B.1 — Chrome ownership map and compatibility strategy

## 1) Purpose of packet B.1
Packet B.1 establishes a single canonical ownership surface for shared chrome primitives so future Section B work can converge visuals and behavior without multiplying ownership drift.

This packet is intentionally architecture-only:
- no screen adoption,
- no visual redesign,
- no asset work,
- no behavior changes to current live screens.

## 2) Current repo truth inventory
Current shared-shell ownership is split across two legacy families:
- `src/ui/ink/*`
- `src/ui/paper/*`

Current truth that must remain compatible in B.1:
- Duplicate ownership exists for `PaperCard` and `PaperChip` in both `ui/ink` and `ui/paper`.
- `InkPanel` and `InkModalFrame` exist only in `ui/ink`.
- `PaperStamp` exists only in `ui/paper`.
- `BottomTabBar` is still the current live primary bottom nav implementation.
- `CultivationHeaderRibbon` is still a local cultivation ribbon implementation, not a global shared ribbon owner.

Reference owner files (documented only in B.1, not rewritten):
- `src/components/BottomTabBar.tsx`
- `src/components/BottomTabBar.scss`
- `src/ui/cultivation/CultivationHeaderRibbon.tsx`
- `src/ui/cultivation/CultivationHeaderRibbon.scss`
- `src/components/GameLayout.tsx`
- `src/styles/paperInkTokens.scss`
- `src/ui/ink/inkTheme.scss`
- `src/ui/paper/paper.scss`
- `src/styles/uiLayerTokens.css`
- `src/styles/global.css`

## 3) Canonical ownership decision
`src/ui/chrome/*` is now the canonical public surface for **new shared UI work**.

Compatibility remains in place:
- `src/ui/ink/*` and `src/ui/paper/*` stay functional as legacy implementation families.
- Existing screen imports are not migrated in B.1.

## 4) Ownership mapping table

| Canonical component name | Canonical path | Current backing implementation | Current status | Future convergence packet |
| --- | --- | --- | --- | --- |
| FrameCard | `src/ui/chrome/FrameCard.tsx` | `src/ui/paper/PaperCard.tsx` | Thin semantic wrapper | B.3 |
| PlaqueHeader | `src/ui/chrome/PlaqueHeader.tsx` | semantic DOM shell (no legacy backing) | New owner shell | B.4 |
| ChromeChip | `src/ui/chrome/ChromeChip.tsx` | `src/ui/paper/PaperChip.tsx` | Thin semantic wrapper | B.5 |
| ChromeStamp | `src/ui/chrome/ChromeStamp.tsx` | `src/ui/paper/PaperStamp.tsx` | Thin semantic wrapper | B.5 |
| BottomNavDock | `src/ui/chrome/BottomNavDock.tsx` | semantic DOM shell (no `BottomTabBar` rewrite) | New owner shell | B.6 |
| TopRibbon | `src/ui/chrome/TopRibbon.tsx` | semantic DOM shell (no `CultivationHeaderRibbon` rewrite) | New owner shell | B.7 |
| InspectorPanel | `src/ui/chrome/InspectorPanel.tsx` | `src/ui/ink/InkPanel.tsx` | Thin semantic wrapper | B.8 |
| ModalFrame | `src/ui/chrome/ModalFrame.tsx` | `src/ui/ink/InkModalFrame.tsx` | Thin semantic wrapper | B.9 |
| SelectionHalo | `src/ui/chrome/SelectionHalo.tsx` | semantic DOM shell | New owner shell | B.10 |
| ScenicLabel | `src/ui/chrome/ScenicLabel.tsx` | semantic DOM shell | New owner shell | B.10 |

## 5) Legacy compatibility rules
- Legacy `ui/ink` and `ui/paper` families remain fully functional in B.1.
- New shared chrome work should import from `src/ui/chrome/*` instead of choosing between legacy families.
- Avoid creating new components that import from **both** legacy families in one file.
- B.1 does not perform visual rewrite or screen migration.

## 6) Explicit non-goals
B.1 does **not**:
- redesign cards/chips/panels/nav/modals/ribbons,
- migrate existing screens to `src/ui/chrome/*`,
- rewrite `BottomTabBar` or `CultivationHeaderRibbon`,
- change token/z-index behavior,
- add FX/Pixi/asset work,
- delete legacy families.

## 7) Adoption plan
- **B.2:** token ownership alignment for chrome-ready semantics.
- **B.3:** `FrameCard` convergence (remove duplicate card truth drift).
- **B.4:** plaque/ribbon shared visual shell convergence.
- **B.5:** chip/stamp semantic and style convergence.
- **B.6:** dock ownership convergence with nav shell policy.
- **B.7:** top ribbon ownership convergence.
- **B.8:** inspector panel convergence.
- **B.9:** modal frame convergence.
- **B.10:** selection halo + scenic label convergence.

## 8) Current live import inventory
Representative live split (unchanged in B.1):

`ui/ink` usage examples:
- `src/features/professions/forge/ForgeWorkshop.tsx` imports `InkPanel`, `PaperCard`, `PaperChip`.
- `src/components/screens/ApothecaryPanel.tsx` imports `InkPanel`, `PaperCard`, `PaperChip`, `PurposeSourceCallout`.
- `src/components/screens/TechniqueLibraryScreen.tsx` imports `InkPanel`, `PaperCard`, `PurposeSourceCallout`.
- `src/components/screens/PrestigeScreen.tsx` imports `InkPanel`, `PaperCard`.
- `src/components/screens/ManualPavilionPanel.tsx` imports `PaperCard`.
- `src/components/consumables/MedicinePouchPanel.tsx` imports `InkPanel`, `PaperCard`, `PaperChip`.
- `src/components/modals/LifeStartWizardModal.tsx` imports `InkModalFrame`, `PaperCard`, `PaperChip`.

`ui/paper` usage examples:
- `src/components/screens/ExpeditionBoardPanel.tsx` imports `PaperCard`, `PaperChip`, `PaperStamp`.
- `src/components/screens/BountyBoardPanel.tsx` imports `PaperCard`, `PaperChip`, `PaperStamp`.

Adoption into `src/ui/chrome/*` is intentionally deferred to later B packets.

## 9) Risks and guard rails
- **Risk: circular imports.** Guard rail: keep `src/ui/chrome/index.ts` as a pure barrel with no side effects.
- **Risk: API overdesign too early.** Guard rail: wrappers stay thin and close to existing live semantics.
- **Risk: accidental visual drift in ownership packet.** Guard rail: no SCSS/token rewrites and no screen migration in B.1.

## 10) Manual QA steps and acceptance criteria
Manual QA steps for B.1:
1. Run typecheck (`npm run typecheck`).
2. Run the chrome ownership contract test (`node --test tmp-tests/tests/contracts/chromeOwnershipContract.test.js`).
3. Run build if practical (`npm run build`).
4. Confirm no existing screen imports were migrated to `src/ui/chrome/*`.
5. Confirm `src/ui/chrome/index.ts` exports all canonical names and has no circular behavior.

Acceptance criteria for B.1:
- canonical public surface exists at `src/ui/chrome/index.ts`,
- ownership map exists and is explicit,
- compatibility strategy is documented,
- legacy families remain functional,
- no visual redesign or screen adoption was introduced.
