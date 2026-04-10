# world_labels support-art family (P5-09 refined)

## Folder purpose
World-facing support-art family for diegetic labels/plates that sit on top of the painted map without replacing map ownership.

## Preserve-first guardrails
- Map remains hero plane (`city.png` + city overlays).
- Support art must never hide routing truth, RunCompass text, selector truth, or inspector readability.
- No support art may imply deferred modules.
- No new art request is valid without screenshot-backed proof that existing assets cannot cover the role.

## Current generated asset inventory (repo)
- `ui_label_building_world_default_m.png`
- `ui_label_district_world_default_l.png`
- `ui_plate_building_selected_world_default_m.png`
- `ui_plate_city_current_world_default_l.png`
- `ui_banner_city_arrival_world_default_l.png`
- `ui_hint_route_world_default_s.png`

## Role matrix (P5-09 audit)
| # | Role | Current visual owner | Generated repo asset exists | Reuse/tint/layer coverage possible | Audit result | Integrate now? | Art request gate |
|---|---|---|---|---|---|---|---|
| 1 | building label plaque | `ScenicLabel` building variant + CityMapHub styling | Yes (`ui_label_building_world_default_m`) | Yes | Already sufficient; no-shift semantics already reliable | No | No request needed |
| 2 | district / area label | Not currently shown as primary world truth | Yes (`ui_label_district_world_default_l`) | Yes | Optional role; currently avoid clutter and preserve building readability | No | Defer unless screenshots prove navigation value |
| 3 | selected-building emphasis plate | ScenicLabel active state + hotspot glint support | Yes (`ui_plate_building_selected_world_default_m`) | Yes | Partially solved in code, coherent enough for current packet | No | Defer art; existing plate can be wired later if glint/label stack proves insufficient |
| 4 | current-city identity plate | Top ribbon city chips + current-city status copy | Yes (`ui_plate_city_current_world_default_l`) | Yes | Already solved in current shell hierarchy | No | No request needed |
| 5 | city-arrival banner | Existing city-arrival banner surface | Yes (`ui_banner_city_arrival_world_default_l`) | Yes | Sufficient for current additive role | No | No request needed |
| 6 | world route-hint plaque/chip support | `WorldRouteChip`, command alerts, grouped cards | Yes (`ui_hint_route_world_default_s`) | Yes | Solved by current chip family; no mismatch found | No | No request needed |
| 7 | overlay/mask map→inspector integration | WorldScreen panel gradients/overlays | N/A (code role) | Yes (CSS layering) | Already sufficient and preserve-first | No | No request needed |
| 8 | soft fog mask | `WorldFxScene` fog layer | N/A (code role) | Yes | Sufficient in High/Medium, static-safe in Low/Reduced | No | No request needed |
| 9 | selected-building glint | CityMapHub active glint support | N/A (code role) | Yes | Solved and calm | No | No request needed |
| 10 | recommended-building / route-swash | ScenicLabel recommended + softer glint + route chips | No dedicated swash needed | Yes | Partially solved but intentionally minimal to avoid ambiguity | No | Defer unless screenshot gap appears |

## Preserve / enhance / defer summary
- **Preserve:** current map ownership, city overlays, ScenicLabel no-shift routing truth, inspector and command band hierarchy.
- **Enhance (this packet):** documentation clarity + explicit role mapping manifest (`index.ts`) to prevent drift between generated assets and support-art roles.
- **Defer:** district labels and dedicated route-swash art until screenshot-backed evidence shows a real readability gap.

## Integration policy
- Generated world-label assets are now **inventory-approved**, not auto-wired by default.
- Wiring is only justified when screenshots show current code-only treatment is insufficient.
- First preference remains reuse/tint/layering before any new-art request.

## Screenshot evidence gate (required outside this CI environment)
Capture and attach:
1. before default World
2. after default World
3. selected-building state
4. current-city emphasis state
5. city-arrival banner state (if available)
6. recommendation/route-hint state
7. High FX / Low FX / Reduced Motion comparison

If these captures do not show a role gap, do not create new art requests.
