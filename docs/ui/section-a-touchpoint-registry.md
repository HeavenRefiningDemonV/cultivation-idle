# Section A.4 — Verified Touchpoint Registry for the Latest Repo

## Purpose

This file refreshes v3 Appendix B into a current, repo-native registry. It exists so later UI packets stop inheriting stale or ambiguous paths. This file is about exact touchpoints, not implementation guidance. It inherits Section A doctrine and freeze/asset governance from:

- `docs/ui/section-a-global-doctrine.md`
- `docs/ui/section-a-destructive-freeze.md`
- `docs/ui/section-a-asset-constitution.md`

## Verification basis

- Verified against the latest local repo snapshot with direct file existence checks.
- Git basis used for this snapshot: branch `work`, short commit `2e3b901`.
- Registry entries were validated against actual paths in the working tree; older appendix shorthand was not treated as authoritative.

## Registry rules

1. Paths must be exact and canonical.
2. `.scss` partners must never be guessed; list them only if the file exists.
3. Code touchpoints must be explicit files, not wildcard placeholders.
4. Asset anchors must remain root directories, not full inventories.
5. Temporary fixtures, generated artifacts, and non-live duplicates are excluded from canonical touchpoints.
6. Adjacent-but-non-canonical files may be listed only to prevent prompt drift.

## Resolved drift since v3 appendix

| Appendix assumption / ambiguity | Canonical latest-repo path | Note |
| --- | --- | --- |
| `playerFacingLabels.ts` with incomplete nesting | `src/ui/text/playerFacingLabels.ts` | Canonical nested text surface path is under `src/ui/text/`. |
| `HeartLawMindView.tsx` without explicit nested heart-law location | `src/ui/cultivation/heartLaw/HeartLawMindView.tsx` and `src/ui/cultivation/heartLaw/HeartLawMindView.scss` | Canonical nested location and real local stylesheet both verified. |
| `WorldBuildingModal` grouped ambiguously under “world shell” | `src/components/modals/WorldBuildingModal.tsx` and `src/components/modals/WorldBuildingModal.scss` | Canonically belongs under `components/modals`, not `components/screens`. |
| Assumed `.scss` pairing for every major `.tsx` touchpoint | Multiple canonical `.tsx` files have no local `.scss` sibling (for example `src/components/screens/ForgePanel.tsx`, `src/components/modals/PrestigeRitualModal.tsx`, `src/ui/status/RunCompassCompact.tsx`) | Registry records only real files and marks these as styleless local touchpoints. |
| Potential shell confusion between `ui/ink` and `ui/paper` families | Canonical shell touchpoints remain `src/ui/ink/*`; `src/ui/paper/*` is adjacent non-canonical for Section A packet defaults | Added explicit adjacent warnings to prevent prompt drift. |

## Canonical touchpoint registry by area

### A. Global shell

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/ui/ink/InkPanel.tsx` | Primary touchpoint | `src/ui/ink/InkPanel.scss` | Canonical ink panel primitive. |
| `src/ui/ink/PaperCard.tsx` | Primary touchpoint | `src/ui/ink/PaperCard.scss` | Canonical paper card surface in live ink family. |
| `src/ui/ink/PaperChip.tsx` | Primary touchpoint | `src/ui/ink/PaperChip.scss` | Canonical paper chip surface in live ink family. |
| `src/ui/ink/InkModalFrame.tsx` | Primary touchpoint | `src/ui/ink/InkModalFrame.scss` | Canonical modal frame primitive. |
| `src/styles/paperInkTokens.scss` | Support touchpoint | N/A | Shared shell token source. |

### B. Truth surfaces

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/ui/status/RunCompass.tsx` | Primary touchpoint | `src/ui/status/RunCompass.scss` | Core truth-surface entry. |
| `src/ui/status/RunCompassCompact.tsx` | Support touchpoint | None | Verified no local `.scss` file. |
| `src/ui/status/RunCompassSection.tsx` | Support touchpoint | None | Verified no local `.scss` file. |
| `src/ui/status/useRunCompassSurface.ts` | Support touchpoint | N/A | Surface composition hook. |
| `src/ui/status/PostFailureDiagnosisPanel.tsx` | Primary touchpoint | `src/ui/status/PostFailureDiagnosisPanel.scss` | Diagnosis panel surface. |
| `src/ui/text/playerFacingLabels.ts` | Support touchpoint | N/A | Canonical player-facing label source. |
| `src/systems/ui/runCompass/performRunCompassAction.ts` | Support touchpoint | N/A | Action bridge directly tied to run compass surface behavior. |

### C. Cultivation

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/components/screens/CultivateScreen.tsx` | Primary touchpoint | `src/components/screens/CultivateScreen.scss` | Canonical cultivation screen entrypoint. |
| `src/ui/cultivation/DantianOrb.tsx` | Primary touchpoint | `src/ui/cultivation/DantianOrb.scss` | Core dantian visual surface. |
| `src/ui/cultivation/VerseMiniBar.tsx` | Support touchpoint | `src/ui/cultivation/VerseMiniBar.scss` | Compact progression support surface. |
| `src/ui/cultivation/QiLotusIcon.tsx` | Support touchpoint | `src/ui/cultivation/QiLotusIcon.scss` | Lotus icon support surface. |
| `src/ui/cultivation/CultivationBreakthroughPanel.tsx` | Support touchpoint | None | Verified no local `.scss` file. |
| `src/ui/cultivation/CultivationDoctrineSummary.tsx` | Support touchpoint | None | Verified no local `.scss` file. |
| `src/ui/cultivation/heartLaw/HeartLawMindView.tsx` | Primary touchpoint | `src/ui/cultivation/heartLaw/HeartLawMindView.scss` | Canonical nested heart-law view. |
| `src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx` | Support touchpoint | None | Verified no local `.scss` file. |

### D. Selections / ritual modals

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/components/modals/LifeStartWizardModal.tsx` | Primary touchpoint | `src/components/modals/LifeStartWizardModal.scss` | Life-start selection modal. |
| `src/components/modals/DaoHeartModal.tsx` | Primary touchpoint | `src/components/modals/DaoHeartModal.scss` | Dao-heart selection modal. |
| `src/components/modals/PrestigeRitualModal.tsx` | Primary touchpoint | None | Verified no local `.scss` file. |
| `src/components/modals/CurrentChapterExhaustedModal.tsx` | Support touchpoint | `src/components/modals/CurrentChapterExhaustedModal.scss` | End-of-chapter support modal. |
| `src/components/modals/LifeSummaryModal.tsx` | Support touchpoint | `src/components/modals/LifeSummaryModal.scss` | Life summary modal. |

### E. World shell

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/components/screens/WorldScreen.tsx` | Primary touchpoint | `src/components/screens/WorldScreen.scss` | Canonical world screen entrypoint. |
| `src/components/screens/CityMapHub.tsx` | Primary touchpoint | `src/components/screens/CityMapHub.scss` | Canonical city-map shell. |
| `src/components/modals/WorldBuildingModal.tsx` | Primary touchpoint | `src/components/modals/WorldBuildingModal.scss` | Canonical world-building modal location. |
| `src/ui/world/OutskirtsSummaryCard.tsx` | Support touchpoint | None | World support card. |
| `src/ui/world/RuinsSummaryCard.tsx` | Support touchpoint | None | World support card. |
| `src/ui/world/TrackedBountyProgressLine.tsx` | Support touchpoint | None | Progress support surface. |
| `src/ui/world/WorldCommandAlert.tsx` | Support touchpoint | None | Command alert surface. |
| `src/ui/world/WorldCommandCard.tsx` | Support touchpoint | None | Verified no local `.scss` file. |
| `src/ui/world/WorldCommandGroup.tsx` | Support touchpoint | None | Command grouping surface. |
| `src/ui/world/WorldModuleCard.tsx` | Support touchpoint | `src/ui/world/WorldModuleCard.scss` | Module-card support with local style pair. |
| `src/ui/world/WorldModuleGroup.tsx` | Support touchpoint | None | Module grouping surface. |
| `src/ui/world/WorldRouteChip.tsx` | Support touchpoint | None | Verified no local `.scss` file. |
| `src/systems/ui/world/worldCommandSurface.ts` | Support touchpoint | N/A | World command system support surface. |
| `src/systems/ui/world/worldModuleRoutingSurface.ts` | Support touchpoint | N/A | World module routing support surface. |

### F. Module screens

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx` | Primary touchpoint | None | Building panel touchpoint. |
| `src/components/screens/world/buildings/RuinsBuildingPanel.tsx` | Primary touchpoint | None | Building panel touchpoint. |
| `src/components/screens/world/buildings/GateTrialBuildingPanel.tsx` | Primary touchpoint | None | Building panel touchpoint. |
| `src/components/screens/ManualPavilionPanel.tsx` | Primary touchpoint | `src/components/screens/ManualPavilionPanel.scss` | Manual pavilion module panel. |
| `src/components/screens/ApothecaryPanel.tsx` | Primary touchpoint | `src/components/screens/ApothecaryPanel.scss` | Apothecary module panel. |
| `src/components/screens/ForgePanel.tsx` | Primary touchpoint | None | Verified no local `.scss` file. |
| `src/components/screens/BountyBoardPanel.tsx` | Primary touchpoint | `src/components/screens/BountyBoardPanel.scss` | Bounty module panel. |
| `src/components/screens/ExpeditionBoardPanel.tsx` | Primary touchpoint | `src/components/screens/ExpeditionBoardPanel.scss` | Expedition module panel. |

### G. Dense management screens

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/components/screens/InventoryScreen.tsx` | Primary touchpoint | `src/components/screens/InventoryScreen.scss` | Dense inventory surface. |
| `src/components/screens/TechniqueLibraryScreen.tsx` | Primary touchpoint | `src/components/screens/TechniqueLibraryScreen.scss` | Dense techniques surface. |
| `src/components/screens/PrestigeScreen.tsx` | Primary touchpoint | `src/components/screens/PrestigeScreen.scss` | Dense prestige surface. |

### H. Asset anchor roots

| Path | Class | Notes |
| --- | --- | --- |
| `src/assets/background/` | Asset anchor root | Core scenic background family root. |
| `src/assets/background/citystates/` | Asset anchor root | City-state overlay family root. |
| `src/assets/menus/` | Asset anchor root | Menu/chrome support family root. |
| `src/assets/onscreen/` | Asset anchor root | On-screen character/lotus support family root. |
| `src/assets/ui/book_spines/` | Asset anchor root | Book spine identity family root. |
| `src/assets/items/ui/` | Asset anchor root | Item-frame/support UI family root. |
| `src/assets/icons/` | Asset anchor root | Icon family root including hourglass/lotus variants. |

## Adjacent but non-canonical files

| Path | Why it is adjacent but non-canonical |
| --- | --- |
| `src/ui/paper/PaperCard.tsx` | Exists, but canonical shell touchpoints for Section A packet defaults are the `src/ui/ink/*` family. |
| `src/ui/paper/PaperChip.tsx` | Exists, but canonical shell touchpoints for Section A packet defaults are the `src/ui/ink/*` family. |
| `tmp-progression-fixtures/src/ui/text/playerFacingLabels.js` | Fixture copy under `tmp-progression-fixtures`; not a live canonical UI touchpoint. |
| `tmp-progression-fixtures/src/services/rewards/RewardService.js` | Fixture implementation under temporary tree; excluded from live UI touchpoint scope. |
| `src/assets/icons/icons.zip` | Archive artifact in asset root; not a direct code touchpoint for Section A packetization. |

## Usage rules for future packets

- Future UI packets must copy touchpoints from this registry and must not guess or shorten paths.
- If a packet needs files outside this registry, it must justify the expansion explicitly in packet scope.
- Prompt authors must distinguish primary touchpoint vs support touchpoint when listing edit scope.
- This registry reduces path brittleness; it does not replace packet-specific scope discipline.

## Non-goals

- Not a full asset inventory.
- Not a screen redesign document.
- Not a gameplay logic registry.
- Not an implementation plan.
- Not a substitute for packet scope discipline.
