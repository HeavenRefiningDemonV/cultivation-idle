# Cultivation Idle Performance Baseline Report

Generated: 2026-05-26T13:11:10.159Z
Package: cultivation-idle 0.0.0
Node: v24.14.0
npm: 11.9.0
Branch: codex/perf-packet-3-selector-surface-cleanup
Dirty: yes

## Previous Packet Verification
Status: pass
- AGENTS.md
- docs/release/current_implementation_baseline.md
- docs/release/current_implementation_baseline.json
- docs/release/build_warning_inventory.md
- docs/release/performance_smoke_checklist.md
- docs/release/release_handoff_bundle.md
- docs/release/go_no_go_checklist.md
- docs/release/known_issues.md
- docs/release/waiver_policy.md
- docs/codex/PROMPT_STYLE.md
- docs/codex/TASK_QUEUE.md

## Static Findings
- Runtime content files: 19
- Largest content file: public/cultivation_idle_content_bible_v1_config/pavilion_records.json (1374820 bytes)
- requestAnimationFrame usages: 34
- bare store subscriptions: 0
- JSON.stringify owner/component usages: 7
- lazy/dynamic import signals: 13

### Largest Source Files
- src/assets/icons/icons.zip: 4765927 bytes
- src/assets/cutscenes/S00/S00 Slide 4.png: 2982446 bytes
- src/assets/cutscenes/S00/S00 Slide 3.png: 2966226 bytes
- src/assets/cutscenes/S00/S00 Slide 5.png: 2934511 bytes
- src/assets/cutscenes/S00/S00 Slide 2.png: 2828902 bytes
- src/assets/cutscenes/S00/S00 Slide 1.png: 2653791 bytes
- src/assets/Gate trail screen.png: 2629488 bytes
- src/assets/world/gateTrial/foundation-gate-scene-approved-plate.png: 2629488 bytes
- src/assets/onscreen/qisign.png: 2623951 bytes
- src/assets/mockups/ChatGPT Image Apr 17, 2026, 04_24_04 PM.png: 2593728 bytes

### Bundle Chunks
- dist/assets/foundation-gate-scene-approved-plate-BL_HEwmo.png: 2629488 bytes (asset, >500KiB)
- dist/assets/qisign-Dn9Gogcg.png: 2623951 bytes (asset, >500KiB)
- dist/assets/index-CvklXriv.js: 2617705 bytes (js, >500KiB)
- dist/assets/apothecary_room_scenic_plate-ClS60XbF.png: 2456259 bytes (asset, >500KiB)
- dist/assets/prescription_parchment_frame_cropped-DWAlllyd.png: 2310140 bytes (asset, >500KiB)
- dist/assets/gold_cta_plaque_cropped-B19YjFsW.png: 2287819 bytes (asset, >500KiB)
- dist/assets/ui_plate_building_selected_world_default_m-DLL6fkFQ.png: 2246085 bytes (asset, >500KiB)
- dist/assets/path_heaven 1-CVjlRklu.png: 2030310 bytes (asset, >500KiB)
- dist/assets/medicine_pouch_object_cropped-BHJeYotG.png: 1827278 bytes (asset, >500KiB)
- dist/assets/path_martial 1-BMAwfsPc.png: 1820470 bytes (asset, >500KiB)
- dist/assets/path_earth 1-Dm42n3Uk.png: 1651422 bytes (asset, >500KiB)
- dist/cultivation_idle_content_bible_v1_config/pavilion_records.json: 1374820 bytes (other, >500KiB)
- dist/assets/Aged parchment vignette for game-DYgfySMP.png: 1144921 bytes (asset, >500KiB)
- dist/assets/index-Cw1dqdSf.css: 867565 bytes (css, >500KiB)
- dist/assets/ui_banner_city_arrival_world_default_l-BsRiwPOV.png: 766243 bytes (asset, >500KiB)

## Runtime Scenario Findings
- Not measured by the static report. Use `?ciPerf=1` and `window.__CI_PERF__.export()` for runtime snapshots.

## Budget Status
| Budget | Status | Evidence |
| --- | --- | --- |
| Idle React commits | not-measured | Runtime scenario capture is required; render counters are available when ?ciPerf=1 is enabled. |
| Idle store writes | baseline-only | Mega Prompt 1 records current behavior without failing on it. |
| Long tasks / LoAF | not-measured | PerformanceObserver data appears in runtime snapshots when supported by the browser. |
| Initial chunks | warning | 1 JS chunks over 500 KiB found in dist. |
| Content startup | warning | 1 runtime content files over 100 KiB found. |
| Save cost | not-measured | Save gather/stringify/encrypt/localStorage timers are available in runtime snapshots. |

## Plugin Evidence
- Browser: not captured by static script
- Linear: not captured by static script
- Game Studio: not captured by static script
- Superpowers: not captured by static script
- GitHub: not captured by static script
- Sentry: not captured by static script
- CodeRabbit: not captured by static script
- HyperFrames by HeyGen: not captured by static script
- Codex Security: not captured by static script

## Next Actions
Proceed to Mega Prompt 2: fixed-step SimulationScheduler and removal of authoritative gameplay publication from requestAnimationFrame.
