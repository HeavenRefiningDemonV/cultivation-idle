# B.12 Cleanup Ledger (post-approval gate check)

Date: 2026-03-30

## Gate decision

No destructive cleanup was executed in this packet because screenshot-approval evidence for the target host surfaces was not found in the repository under an explicit per-screen cutover approval artifact.

Searched evidence sources:
- `docs/release/qa/ui-cutover/`
- `docs/release/ui_screen_signoff_sheet.md`
- repository docs for `APPROVED FOR CLEANUP` markers

Result: no concrete approved surface artifacts with exact unlocked cleanup scope were present.

## Surface-by-surface cleanup eligibility

| Surface | Additive host adoption present | Screenshot approval artifact found | Cleanup executed |
| --- | --- | --- | --- |
| Bottom dock (`BottomTabBar` -> `BottomNavDock`) | Yes | No | No |
| Small ritual modal (`CurrentChapterExhaustedModal` -> `RitualModalFrame`) | Yes | No | No |
| World contextual inspector (`WorldScreen` -> `InspectorPanel`) | Yes | No | No |
| World map labels (`CityMapHub` -> `ScenicLabel`) | Yes | No | No |
| Compact secondary header (`ManualPavilionPanel` -> `PlaqueHeader`) | Yes | No | No |

## Intentionally left in place

The following duplicate/compat artifacts remain intentionally until explicit screenshot approval exists for each surface:
- legacy compatibility hooks (`bottomTabBar`, `bottomTabBarButton`, `uiNoShift`) that are still required by release audit truth
- local host content classes and wrappers that may still carry semantic/layout meaning (`worldCommandSummary`, `worldScreenAlerts`, `cityMapHubHotspot`, `pavilionShelfRowHeader`, etc.)
- legacy unmounted header/store contract (`Header.tsx` + `headerTitle` store fields), pending a separately scoped safe-removal proof

## Next unlock requirement

To unlock destructive cleanup in a follow-up B.12 patch:
1. record per-surface screenshot evidence in `docs/release/qa/ui-cutover/<screen-id>/`
2. record explicit `APPROVED FOR CLEANUP` with exact unlocked scope
3. run cleanup only for those approved exact surfaces
