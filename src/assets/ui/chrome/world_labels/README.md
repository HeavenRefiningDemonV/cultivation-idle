# world_labels support-art family (WR-07)

## Folder purpose
World-facing support-art family for diegetic labels/plates that support the painted map owner without replacing it.

## Preserve-first guardrails
- Map remains hero plane (`city.png` + city overlays).
- Support art must not hide routing truth, RunCompass guidance, selector truth, or inspector readability.
- Support art may not imply deferred modules or unreleased city content.
- New art requests require screenshot-backed proof that current assets and code layering cannot cover the role.

## Current generated asset inventory (repo)
- `ui_label_building_world_default_m.png`
- `ui_label_district_world_default_l.png`
- `ui_plate_building_selected_world_default_m.png`
- `ui_plate_city_current_world_default_l.png`
- `ui_banner_city_arrival_world_default_l.png`
- `ui_hint_route_world_default_s.png`

## WR-07 mandatory support-role matrix
| # | Role | Current visible owner | Generated asset exists | Reuse/tint/layering possible | Acceptable as-is? | Partially solved/inconsistent? | Integrate now? | Deferred? | Screenshot-backed art request needed? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | building label plaque | `ScenicLabel` building variant + `CityMapHub` label shell | Yes (`ui_label_building_world_default_m`) | Yes | Yes | No | No | No | No |
| 2 | selected-building emphasis plate / underplate | Scenic active state + hotspot glint | Yes (`ui_plate_building_selected_world_default_m`) | Yes | Yes | Mildly (visual style only) | No | Yes | Not yet |
| 3 | district / area label | Not currently a primary owner in live World | Yes (`ui_label_district_world_default_l`) | Yes | Yes | No | No | Yes | Not yet |
| 4 | current-city identity plate | Top ribbon current-city strip | Yes (`ui_plate_city_current_world_default_l`) | Yes | Yes | No | **Yes (WR-07)** | No | No |
| 5 | city-arrival banner treatment | `CityArrivalBanner` container + phase details | Yes (`ui_banner_city_arrival_world_default_l`) | Yes | Yes | No | **Yes (WR-07)** | No | No |
| 6 | world route-hint plaque/chip support (route-hint / breadcrumb / recommendation accent) | `WorldRouteChip` + command alerts | Yes (`ui_hint_route_world_default_s`) | Yes | Yes | No | **Yes (WR-07)** | No | No |
| 7 | inspector title/context support plaque | `InspectorPanel` title + shell styles | Shared assets exist (`ui_titleplate_inspector_standard_default_m`, `inspector_shell_standard_default`) | Yes | Yes | No | No | Yes | Not yet |
| 8 | overlay/mask map→inspector integration (scene-to-panel overlay / mask integration) | `WorldScreen` gradients + panel overlays | Code role | Yes | Yes | No | No | Yes | No |
| 9 | soft fog mask (fog / atmospheric mask role, audit only) | `WorldFxScene` atmosphere | Code role | Yes | Yes | No | No | **WR-08** | No |
| 10 | selected-building glint role (audit only) | `CityMapHub` active/recommended glow | Code role | Yes | Yes | No | No | **WR-08 tuning if needed** | No |

## Live usage status (after WR-07)
- **Live imported now:** current-city plate, city-arrival banner, route-hint plaque.
- **Scaffold-only / deferred:** building label plaque, selected-building plate, district label plaque (kept as candidate assets to avoid map-clutter regressions).
- **Code-only ownership remains:** overlay/mask, fog mask, selected-building glint, recommended route swash.
- **recommended-building / route-swash** remains intentionally code-owned in WR-07 to avoid badge clutter.

## Integration policy
- Generated assets are wired only where they stay subordinate to map ownership and preserve no-shift behavior.
- If an asset increases clutter or fights scenic readability, leave it scaffold-only and document the defer.
- Favor reuse/tint/layering before any request for new world-specific art.

## Screenshot evidence gate (required outside this CI environment)
Capture and attach:
1. default World (before/after)
2. selected-building state
3. current-city identity state
4. city-arrival state
5. route/recommendation state
6. High FX / Low FX / Reduced Motion
7. narrow layout

If these captures do not show a real role gap, do not create new art requests.
