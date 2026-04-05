# Section A.4 — Verified Touchpoint Registry for the Latest Repo

## Purpose

This file keeps Section A touchpoints exact and current so later UI packets do not inherit stale or guessed paths. It inherits:

- `docs/ui/section-a-global-doctrine.md`
- `docs/ui/section-a-destructive-freeze.md`
- `docs/ui/section-a-asset-constitution.md`

## Verification basis

- Verified against latest local repo snapshot using direct file existence checks.
- Git basis: branch `work`, short commit `683f3e0`.
- Registry entries were validated against actual files; stale appendix shorthand was not treated as authority.

## Registry rules

1. Paths must be exact and canonical.
2. `.scss` partners must never be guessed.
3. Code touchpoints must be explicit files (no wildcard placeholders).
4. Asset anchors stay as root directories, not full inventories.
5. Fixtures/generated artifacts are excluded from canonical touchpoints.
6. Adjacent non-canonical files may be listed to prevent prompt drift.

## Resolved drift (current snapshot)

| Drift source | Canonical path | Note |
| --- | --- | --- |
| `playerFacingLabels.ts` shorthand | `src/ui/text/playerFacingLabels.ts` | Canonical nested text surface path. |
| `HeartLawMindView.tsx` nested ambiguity | `src/ui/cultivation/heartLaw/HeartLawMindView.tsx` + `.scss` | Canonical nested location verified. |
| `WorldBuildingModal` grouped under screens | `src/components/modals/WorldBuildingModal.tsx` + `.scss` | Canonical modal location verified. |
| Assumed local `.scss` for all `.tsx` | multiple | Some canonical touchpoints intentionally have no local `.scss`. |
| `ui/paper` vs `ui/ink` shell confusion | `src/ui/ink/*` | `ui/paper/*` remains adjacent non-canonical for Section A packet defaults. |

## Canonical touchpoint registry by area

### A. Global shell

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/ui/ink/InkPanel.tsx` | Primary touchpoint | `src/ui/ink/InkPanel.scss` | Canonical ink panel primitive. |
| `src/ui/ink/PaperCard.tsx` | Primary touchpoint | `src/ui/ink/PaperCard.scss` | Canonical paper card surface. |
| `src/ui/ink/PaperChip.tsx` | Primary touchpoint | `src/ui/ink/PaperChip.scss` | Canonical paper chip surface. |
| `src/ui/ink/InkModalFrame.tsx` | Primary touchpoint | `src/ui/ink/InkModalFrame.scss` | Canonical modal frame primitive. |
| `src/styles/paperInkTokens.scss` | Support touchpoint | N/A | Shared shell token source. |

### B. Truth surfaces

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/ui/status/RunCompass.tsx` | Primary touchpoint | `src/ui/status/RunCompass.scss` | Core truth-surface entry. |
| `src/ui/status/RunCompassCompact.tsx` | Support touchpoint | None | Verified no local `.scss`. |
| `src/ui/status/RunCompassSection.tsx` | Support touchpoint | None | Verified no local `.scss`. |
| `src/ui/status/useRunCompassSurface.ts` | Support touchpoint | N/A | Surface composition hook. |
| `src/ui/status/PostFailureDiagnosisPanel.tsx` | Primary touchpoint | `src/ui/status/PostFailureDiagnosisPanel.scss` | Diagnosis panel surface. |
| `src/ui/text/playerFacingLabels.ts` | Support touchpoint | N/A | Canonical player-facing labels. |
| `src/systems/ui/runCompass/performRunCompassAction.ts` | Support touchpoint | N/A | Action bridge for run compass behavior. |

### C. Cultivation

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/components/screens/CultivateScreen.tsx` | Primary touchpoint | `src/components/screens/CultivateScreen.scss` | Cultivation screen entrypoint. |
| `src/ui/cultivation/DantianOrb.tsx` | Primary touchpoint | `src/ui/cultivation/DantianOrb.scss` | Dantian visual surface. |
| `src/ui/cultivation/VerseMiniBar.tsx` | Support touchpoint | `src/ui/cultivation/VerseMiniBar.scss` | Compact progression support. |
| `src/ui/cultivation/QiLotusIcon.tsx` | Support touchpoint | `src/ui/cultivation/QiLotusIcon.scss` | Lotus support surface. |
| `src/ui/cultivation/CultivationBreakthroughPanel.tsx` | Support touchpoint | None | Verified no local `.scss`. |
| `src/ui/cultivation/CultivationDoctrineSummary.tsx` | Support touchpoint | None | Verified no local `.scss`. |
| `src/ui/cultivation/heartLaw/HeartLawMindView.tsx` | Primary touchpoint | `src/ui/cultivation/heartLaw/HeartLawMindView.scss` | Canonical nested heart-law view. |
| `src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx` | Support touchpoint | None | Verified no local `.scss`. |

### D. Selections / ritual modals

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/components/modals/LifeStartWizardModal.tsx` | Primary touchpoint | `src/components/modals/LifeStartWizardModal.scss` | Life-start selection modal. |
| `src/components/modals/DaoHeartModal.tsx` | Primary touchpoint | `src/components/modals/DaoHeartModal.scss` | Dao-heart modal. |
| `src/components/modals/PrestigeRitualModal.tsx` | Primary touchpoint | None | Verified no local `.scss`. |
| `src/components/modals/CurrentChapterExhaustedModal.tsx` | Support touchpoint | `src/components/modals/CurrentChapterExhaustedModal.scss` | End-of-chapter support modal. |
| `src/components/modals/LifeSummaryModal.tsx` | Support touchpoint | `src/components/modals/LifeSummaryModal.scss` | Life summary modal. |

#### Section C ritual-selection exact target ids

| target screen id | owner files (canonical) | family | exact surface |
| --- | --- | --- | --- |
| `life-start-path` | `src/components/modals/LifeStartWizardModal.tsx`, `src/components/modals/LifeStartWizardModal.scss` | Hero ritual | Life Start step 1 (path selection only). |
| `life-start-heart-law` | `src/components/modals/LifeStartWizardModal.tsx`, `src/components/modals/LifeStartWizardModal.scss` | Hero ritual | Life Start step 2 (Heart Law selection only). |
| `life-start-breath-focus` | `src/components/modals/LifeStartWizardModal.tsx`, `src/components/modals/LifeStartWizardModal.scss` | Hero ritual / ritual selection | Life Start step 3 (Breath Focus only). |
| `dao-heart-law` | `src/components/modals/DaoHeartModal.tsx`, `src/components/modals/DaoHeartModal.scss` | Hero ritual modal | Dao Heart modal, Heart Law tab only. |
| `dao-heart-study` | `src/components/modals/DaoHeartModal.tsx`, `src/components/modals/DaoHeartModal.scss` | Ritual modal / support | Dao Heart modal, Study tab only. |
| `change-heart-law` | `src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx` | Ritual modal | Full Change Heart Law modal surface. |
| `prestige-ritual` | `src/components/modals/PrestigeRitualModal.tsx` | Ritual modal | Full Prestige Reincarnation modal surface. |
| `current-chapter-exhausted` | `src/components/modals/CurrentChapterExhaustedModal.tsx`, `src/components/modals/CurrentChapterExhaustedModal.scss` | Ritual modal | Full Current Chapter Exhausted modal surface. |
| `life-summary` | `src/components/modals/LifeSummaryModal.tsx`, `src/components/modals/LifeSummaryModal.scss` | Ritual modal | Full Life Summary modal surface. |

### E. World shell

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/components/screens/WorldScreen.tsx` | Primary touchpoint | `src/components/screens/WorldScreen.scss` | World screen entrypoint. |
| `src/components/screens/CityMapHub.tsx` | Primary touchpoint | `src/components/screens/CityMapHub.scss` | City-map shell. |
| `src/components/modals/WorldBuildingModal.tsx` | Primary touchpoint | `src/components/modals/WorldBuildingModal.scss` | World-building modal location. |
| `src/ui/world/OutskirtsSummaryCard.tsx` | Support touchpoint | None | World support card. |
| `src/ui/world/RuinsSummaryCard.tsx` | Support touchpoint | None | World support card. |
| `src/ui/world/TrackedBountyProgressLine.tsx` | Support touchpoint | None | Progress support surface. |
| `src/ui/world/WorldCommandAlert.tsx` | Support touchpoint | None | Command alert surface. |
| `src/ui/world/WorldCommandCard.tsx` | Support touchpoint | None | Verified no local `.scss`. |
| `src/ui/world/WorldCommandGroup.tsx` | Support touchpoint | None | Command grouping surface. |
| `src/ui/world/WorldModuleCard.tsx` | Support touchpoint | `src/ui/world/WorldModuleCard.scss` | Module-card support with style pair. |
| `src/ui/world/WorldModuleGroup.tsx` | Support touchpoint | None | Module grouping surface. |
| `src/ui/world/WorldRouteChip.tsx` | Support touchpoint | None | Verified no local `.scss`. |
| `src/systems/ui/world/worldCommandSurface.ts` | Support touchpoint | N/A | World command system support surface. |
| `src/systems/ui/world/worldModuleRoutingSurface.ts` | Support touchpoint | N/A | World routing support surface. |

### F. Module screens

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx` | Primary touchpoint | None | Building panel touchpoint. |
| `src/components/screens/world/buildings/RuinsBuildingPanel.tsx` | Primary touchpoint | None | Building panel touchpoint. |
| `src/components/screens/world/buildings/GateTrialBuildingPanel.tsx` | Primary touchpoint | None | Building panel touchpoint. |
| `src/components/screens/ManualPavilionPanel.tsx` | Primary touchpoint | `src/components/screens/ManualPavilionPanel.scss` | Manual Pavilion panel. |
| `src/components/screens/ApothecaryPanel.tsx` | Primary touchpoint | `src/components/screens/ApothecaryPanel.scss` | Apothecary panel. |
| `src/components/screens/ForgePanel.tsx` | Primary touchpoint | None | Verified no local `.scss`. |
| `src/components/screens/BountyBoardPanel.tsx` | Primary touchpoint | `src/components/screens/BountyBoardPanel.scss` | Bounty panel. |
| `src/components/screens/ExpeditionBoardPanel.tsx` | Primary touchpoint | `src/components/screens/ExpeditionBoardPanel.scss` | Expedition panel. |

### G. Dense management screens

| Path | Class | Paired local stylesheet | Notes |
| --- | --- | --- | --- |
| `src/components/screens/InventoryScreen.tsx` | Primary touchpoint | `src/components/screens/InventoryScreen.scss` | Inventory surface. |
| `src/components/screens/TechniqueLibraryScreen.tsx` | Primary touchpoint | `src/components/screens/TechniqueLibraryScreen.scss` | Techniques surface. |
| `src/components/screens/PrestigeScreen.tsx` | Primary touchpoint | `src/components/screens/PrestigeScreen.scss` | Prestige dense-management surface. |

### H. Asset anchor roots

| Path | Class | Notes |
| --- | --- | --- |
| `src/assets/background/` | Asset anchor root | Scenic background family root. |
| `src/assets/background/citystates/` | Asset anchor root | City-state overlay root. |
| `src/assets/menus/` | Asset anchor root | Menu/chrome support root. |
| `src/assets/onscreen/` | Asset anchor root | On-screen character/lotus root. |
| `src/assets/ui/book_spines/` | Asset anchor root | Book spine identity root. |
| `src/assets/ui/chrome/` | Phase 1 support-art scaffold root | Locked scaffold root for shared chrome support assets. |
| `src/assets/ui/chrome/plaques/` | Phase 1 support-art scaffold root | Shared plaque/ribbon/titleplate scaffold root (P1-02A). |
| `src/assets/ui/chrome/world_labels/` | Phase 1 support-art scaffold root | Dedicated world-label scaffold root (P1-02B). |
| `src/assets/ui/overlays/` | Phase 1 support-art scaffold root | Locked scaffold root for overlay/mask support assets. |
| `src/assets/ui/fx/` | Phase 1 support-art scaffold root | Locked scaffold root for shared FX support assets. |
| `src/assets/ui/heroes/` | Phase 1 support-art scaffold root | Locked scaffold root for later-wave hero support kits. |
| `src/assets/items/ui/` | Asset anchor root | Item-frame/support UI root. |
| `src/assets/icons/` | Asset anchor root | Icon root including hourglass family. |

Phase 1 scaffold spec reference: `docs/ui/phase-1-asset-spec-sheet.md` is the canonical support-art root/naming/format contract.

### I. Docs-area packet governance touchpoints

| Path | Class | Notes |
| --- | --- | --- |
| `docs/ui/phase-1-p1-01-wave0-asset-audit.md` | Governance touchpoint | Human-readable Wave 0 preserve-owner lock for Phase 1. |
| `docs/ui/phase-1-support-art-backlog.json` | Governance touchpoint | Machine-readable support-art backlog and bucket status source. |

## Adjacent but non-canonical files

| Path | Why adjacent but non-canonical |
| --- | --- |
| `src/ui/paper/PaperCard.tsx` | Exists, but canonical shell defaults for Section A packets are `src/ui/ink/*`. |
| `src/ui/paper/PaperChip.tsx` | Exists, but canonical shell defaults for Section A packets are `src/ui/ink/*`. |
| `tmp-progression-fixtures/src/ui/text/playerFacingLabels.js` | Fixture copy under temporary tree; not live canonical touchpoint. |
| `tmp-progression-fixtures/src/services/rewards/RewardService.js` | Fixture implementation under temporary tree; excluded from live touchpoint scope. |
| `src/assets/icons/icons.zip` | Archive artifact in asset root; not direct code touchpoint for packetization. |

## Usage rules for future packets

- Copy touchpoints from this registry; never guess paths.
- If expansion is required, justify it explicitly in packet scope.
- Distinguish primary vs support touchpoints in packet edit scope.
- This registry reduces path drift; it does not replace packet scope discipline.

## Non-goals

- Not a full asset inventory.
- Not a screen redesign plan.
- Not gameplay logic documentation.
- Not implementation guidance.
