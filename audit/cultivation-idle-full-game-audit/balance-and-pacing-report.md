# Balance Measurements

## Measurement environment

- Commit: `8a06616eeb177837f6db98702b648f89a3a6d2b2`
- Branch: `codex/perf-packet-3-selector-surface-cleanup`
- Date: 2026-05-28
- Node: `v24.14.0`
- npm: `11.9.0`
- Commands used: `npm run balance:report:json`, `npm run release:route-report:json`, `npm run release:reclaim-route-report`, `npm run release:fresh-run-report:json`, browser fresh-save Playwright runs, content summary script.

## Measurement status

Automated balance measurement is blocked in the current checkout.

| Measurement | Result | Evidence |
|---|---:|---|
| Balance regression report | Failed | `Timing probe ended without milestone: foundation_entry` |
| Route comparison report | Failed | `Timing probe ended without milestone: foundation_entry` |
| Reclaim route report | Failed | `Timing probe ended without milestone: foundation_entry` |
| Fresh-run report | Failed acceptance | normal route final realm `soul_formation`, expected `spirit_severing` |
| Offline route report | Passed | offline combat/trial stayed 0; offline Qi non-dominant |

## Key timing estimates

| Milestone | Minimal path estimate | Reasonable-prep estimate | Offline-assisted estimate | Notes |
|---|---:|---:|---:|---|
| First substage | Unable to trust | Unable to trust | Unable to trust | Browser fresh save reached 100 Qi in seconds, but no accepted target was confirmed |
| First final substage | Unable to trust | Unable to trust | Unable to trust | Timing probe failed before Foundation entry |
| First Gate Trial eligible | Unable to trust | Unable to trust | Unable to trust | Focused tests prove contract shape, not pacing |
| First Gate Trial clear | Unable to trust | Unable to trust | Unable to trust | Trial lifecycle fixture currently fails |
| Foundation breakthrough | Unable to trust | Unable to trust | Unable to trust | Balance and route probes fail before this milestone |
| City 2 unlock | Contract-tested | Contract-tested | Contract-tested | `cityUnlockRuntime.test.js` passed, but timing is unmeasured |
| First prestige | Unable to trust | Unable to trust | Unable to trust | Reclaim route report fails before Foundation entry |
| Second-life first gate | Unable to trust | Unable to trust | Unable to trust | Reset tests pass, pacing unmeasured |

## Content-derived progression table

| From realm | To realm | Gate Trial | Trial reward item | Fail-safe | City unlocked at target realm | Evidence |
|---|---|---|---|---|---|---|
| Qi Condensation | Foundation Establishment | `trial_novices_clearing` | `gate_foundation_pill` | enabled after 3 eligible fails | Stonecrag Town | `public/.../trials.json`, `cities.json` |
| Foundation Establishment | Core Formation | `trial_stone_core_sanctum` | `gate_core_catalyst` | enabled after 3 eligible fails | Spirit Cavern City | `public/.../trials.json`, `cities.json` |
| Core Formation | Nascent Soul | `trial_patriarchs_seal` | `gate_core_stabilizer` | enabled after 3 eligible fails | Lotusford | `public/.../trials.json`, `cities.json` |
| Nascent Soul | Soul Formation | `trial_soul_lantern_vault` | `gate_soul_condensate` | enabled after 3 eligible fails | Ironpeak Bastion | `public/.../trials.json`, `cities.json` |
| Soul Formation | Spirit Severing | `trial_severing_court` | `gate_severing_seal` | enabled after 3 eligible fails | none authored beyond current five cities | `public/.../trials.json`, fresh-run cap mismatch |

## Early fresh-save observations

| Observation | Measurement | Evidence | Concern |
|---|---:|---|---|
| Fresh first screen Qi rate | 43 to 117 Qi/s depending spirit root/path roll in runs | `SS-002`, `SS-015`, `SS-016`, raw text logs | First cap is 100 Qi, so cap can be exceeded before identity completion |
| Heaven path select | Qi rate increased from 43.16/s to 63.16/s in one run | `SS-032`, `SS-033`, `SS-075` | Path effects are visible, but identity flow does not pause accumulation |
| Life-start finish | Heart Law and breath persisted after Finish | `SS-088` raw text | Final state coherent once completed |

## Economy and systems

Only source/sink structure was audited in this pass; numeric rates are not reliable until probes are repaired.

| Resource | Current evidence | Measurement status |
|---|---|---|
| Qi | Live browser Qi gain and offline route report observed | needs repaired timing probe |
| Gate items | Content and P0 tests show gate reward/breakthrough parity | needs lifecycle fixture repair |
| City modules | 5 cities all author outskirts, ruins, gateTrial, manualPavilion, apothecary, forge, bounties, expeditions | reachability needs full browser route smoke |
| Prestige AP | 27 upgrades audited; 11 visible live, 5 deferred, 11 hidden unsupported | first prestige timing unmeasured |
| Offline | 12-hour cap and combat exclusion observed/passed | numeric target decision still needed |

## Test-speed and debug values found

| File/command | Symbol/value | Evidence | Impact | Future decision |
|---|---|---|---|---|
| Browser fresh save | First Qi cap 100; Qi rate often 40 to 117/s | screenshots/raw logs | first cap can be exceeded in seconds | decide whether this is intended onboarding pace or test-speed residue |
| `npm run balance:report:json` | missing `foundation_entry` | command failure | blocks target-range evidence | repair harness before tuning |
| `npm run release:fresh-run-report:json` | expected Spirit Severing but ended Soul Formation | command failure | cap mismatch blocks release truth | decide cap contract |

## Recommendations, not implemented

- First meaningful wall target: decide after route probe can reach Foundation.
- First Gate Trial readiness target: do not tune until `foundation_entry` probe is green.
- First prestige target: do not tune until reclaim route is green.
- Second-life reclaim target: measure only after prestige route can complete.
- Offline cap/efficiency: current 12-hour cap and 50 percent base are visible and tested; target design still needs review.
- Active/background split: preserve no-offline-combat rule; verify queued crafting/expedition yields after balance harness repair.
