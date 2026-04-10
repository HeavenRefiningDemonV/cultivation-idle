# Phase 2 proof-surface matrix (P2-13)

This matrix is the authoritative P2-13 proof classification map for existing surfaces only.

## Primary proof surfaces

| Surface id | Screen / modal | Owner that must remain intact | Shell primitives in use | FX path in use | Quality / evidence route | Screenshot folder / capture path | Remaining deferred issues | Packet classification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| world | `WorldScreen` | City map + city package routing owner | `TopRibbon`, `InspectorPanel`, `InspectorDrawer`, `RunCompass` | None (world map remains primary) | `phase0CoreAudit` `surface=world` (`high`,`low`,`reduced`) | `docs/release/qa/ui-cutover/phase-0-core-screens/04-world` | Broader world visual redesign deferred | Primary proof surface |
| cultivation | `CultivateScreen` | Central altar / cultivator center | `RunCompassCompact` (support lane) | `ScreenFxStage` + `FxStagePortal` + `CultivationFxScene` | `phase0CoreAudit` `surface=cultivation` (`high`,`low`,`reduced`) | `docs/release/qa/ui-cutover/phase-0-core-screens/02-cultivation` | Larger composition polish deferred | Primary proof surface |
| status | `StatusScreen` | Diagnostic-center troubleshooting owner | `RunCompass`, `StatusSummaryHeader` | `ScreenFxStage` + `FxStagePortal` + `StatusFxScene` | `phase0CoreAudit` `surface=status` (`high`,`low`,`reduced`) | `docs/release/qa/ui-cutover/phase-0-core-screens/03-status` | Non-critical visual polish deferred | Primary proof surface |
| prestige | `PrestigeScreen` | Decree / reincarnation owner | `TopRibbon`, `PaperStamp`, `RunCompassCompact` | None (screen-owned) | `phase0CoreAudit` `surface=prestige` (`high`,`low`,`reduced`) | `docs/release/qa/ui-cutover/phase-0-core-screens/10-prestige` | Tree/panel redesign deferred | Primary proof surface |
| prestige-ritual | `PrestigeRitualModal` | Ritual consequence truth blocks | `RitualModalFrame` | None | `sectionCAudit` `surface=prestige-ritual` (`high`,`low`,`reduced`) | `docs/release/qa/ui-cutover/prestige-ritual` | Any ritual retheme deferred | Primary proof surface |
| current-chapter-exhausted | `CurrentChapterExhaustedModal` | Chapter-cap consequence truth | `RitualModalFrame` | None | `sectionCAudit` `surface=current-chapter-exhausted` (`high`,`low`,`reduced`) | `docs/release/qa/ui-cutover/current-chapter-exhausted` | Content expansion beyond authored cap deferred | Primary proof surface |
| life-summary | `LifeSummaryModal` | Current/last-life summary truth | `RitualModalFrame` | None | `sectionCAudit` `surface=life-summary` (`high`,`low`,`reduced`) | `docs/release/qa/ui-cutover/life-summary` | Extended archive variants deferred | Primary proof surface |
| change-heart-law | `ChangeHeartLawModal` | Heart-law rewrite consequence truth | `RitualModalFrame` | None | `sectionCAudit` `surface=change-heart-law` (`high`,`low`,`reduced`) | `docs/release/qa/ui-cutover/change-heart-law` | Advanced rewrite UX deferred | Primary proof surface |
| bottom-tab-bar | `BottomTabBar` | Canonical dock/tab ownership | `BottomNavDock` (compat wrapper) | None | Manual runtime route + release layout interaction stability tests | `docs/release/qa/ui-cutover/phase-0-core-screens` (dock visible in core captures) | Any nav redesign deferred | Primary proof surface |

## Secondary already-opted-in compact consumers

| Surface id | Screen | Owner that must remain intact | Shell primitives in use | FX path in use | Quality / evidence route | Screenshot folder / capture path | Remaining deferred issues | Packet classification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| apothecary | `ApothecaryPanel` | Apothecary buy/brew/pouch truth | `RunCompassCompact` | None | `phase0CoreAudit` `surface=apothecary` | `docs/release/qa/ui-cutover/phase-0-core-screens/07-apothecary` | Panel redesign deferred | Secondary already-opted-in compact consumer |
| bounties-expeditions | `BountyBoardPanel`, `ExpeditionBoardPanel` | Bounty/expedition route truth | `RunCompassCompact` | None | `phase0CoreAudit` `surface=bounties-expeditions` | `docs/release/qa/ui-cutover/phase-0-core-screens/09-bounties-expeditions` | Split-screen restyle deferred | Secondary already-opted-in compact consumer |
| manual-pavilion | `ManualPavilionPanel` | Manual technique ownership | `RunCompassCompact` | None | `phase0CoreAudit` `surface=manual-pavilion` | `docs/release/qa/ui-cutover/phase-0-core-screens/05-manual-pavilion` | Full manual UX retheme deferred | Secondary already-opted-in compact consumer |
| techniques | `TechniqueLibraryScreen` | Technique library ownership | `RunCompassCompact` | None | `phase0CoreAudit` `surface=techniques` | `docs/release/qa/ui-cutover/phase-0-core-screens/06-techniques` | Broader sorting UX deferred | Secondary already-opted-in compact consumer |
| outskirts | `OutskirtsBuildingPanel` | Outskirts panel ownership | `RunCompassCompact` | None | World route QA + manual spot-check | `docs/release/qa/ui-cutover/phase-0-core-screens/04-world` | Panel redesign deferred | Secondary already-opted-in compact consumer |
| ruins | `RuinsBuildingPanel` | Ruins panel ownership | `RunCompassCompact` | None | World route QA + manual spot-check | `docs/release/qa/ui-cutover/phase-0-core-screens/04-world` | Panel redesign deferred | Secondary already-opted-in compact consumer |
| forge | `ForgeWorkshop` | Forge profession owner | `RunCompassCompact` | None | `phase0CoreAudit` `surface=forge` | `docs/release/qa/ui-cutover/phase-0-core-screens/08-forge` | Forge visual expansion deferred | Secondary already-opted-in compact consumer |

## Deferred / non-proof surfaces in this packet

| Surface id | Screen | Why deferred | Packet classification |
| --- | --- | --- | --- |
| inventory | `InventoryScreen` | Already live but not a P2-13 proof-owner target; kept under release visual audit scope only | Deferred / non-proof surface |
| settings | `SettingsScreen` | Not a proof-owner normalization target in this packet | Deferred / non-proof surface |
| world-building-modal | `WorldBuildingModal` | Existing support modal; no normalization work required for P2-13 | Deferred / non-proof surface |


## Evidence status snapshot (P2-14 closeout rerun)

- Canonical primary set remains: world, cultivation, status, prestige, prestige-ritual, current-chapter-exhausted, life-summary, change-heart-law, bottom-tab-bar.
- Screenshot slot files for these roots are currently README-only (`0/6` captured, or `0/5` where truth-state is N/A).
- BottomTabBar remains bound to dock-visible core-screen captures (no standalone harness surface id).
- No secondary compact consumer was promoted to primary in this rerun.
- WR-00 recovery lock clarifies that world failure-baseline references are diagnostic only and cannot be counted as legal cutover approval evidence.
- World-only capture/audit CLI filters (`--surface=world`) remain optional helpers; all-surface defaults are unchanged.
