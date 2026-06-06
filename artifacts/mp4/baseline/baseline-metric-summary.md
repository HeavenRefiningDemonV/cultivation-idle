# MP4 Baseline Metric Summary

Generated: 2026-05-29T02:58:56.9444622+03:00

## Baseline Verdict

The baseline is measurable and MP4 may tune values. The only baseline hard failures are timing-value drift: the five phase durations and content-cap time are consistently too fast. Activity throughput, prep economy, combat envelopes, offline policy, prestige/AP/reclaim, route comparison, fresh-run automation, reclaim route, and telemetry coverage are runnable and usable.

## Timing

| Metric | Baseline | Target | Status | Classification |
|---|---:|---:|---|---|
| Cap time | 33471s | 34200-48600s | Fail | tuning_value_drift |
| Gate 1 available | 2729s | 1800-3300s | Pass | measured |
| Foundation entry | 2729s | 2700-4500s | Pass | measured |
| Pinewind phase | 2729s | 3300s | Fail, -571s | tuning_value_drift |
| Stonecrag phase | 3967s | 4800s | Fail, -833s | tuning_value_drift |
| Spirit Cavern phase | 5951s | 7200s | Fail, -1249s | tuning_value_drift |
| Lotusford phase | 8427s | 10200s | Fail, -1773s | tuning_value_drift |
| Ironpeak phase | 12397s | 15000s | Fail, -2603s | tuning_value_drift |

## Balance Sections

| Section | Baseline status | Notes |
|---|---|---|
| Timing | Fail | Six failing metrics, all too fast. |
| Activities | Pass | Outskirts, Ruins, Bounties, and Expeditions satisfy throughput role targets. |
| Prep / Anti-stall | Pass | Prep/bypass ratios, reserve reachability, and recovery windows pass for all gates. |
| Combat | Pass | Below-minimum, minimum, and recommended win-rate/duration envelopes pass for all gates. |
| Offline | Pass | Base efficiency, cap behavior, max efficiency, and no-combat progression pass. |
| Prestige | Pass | AP curve, AP/hour, reclaim scenarios, and first purchase feel pass. |
| Telemetry | Pass | Required event families, kinds, sources, sinks, and KPI coverage pass. |

## Route And Fresh-Run

| Report | Status | Notes |
|---|---|---|
| Route comparison | Pass with warning | Final truth summary is true for fail-safe, offline bounds, low attention, high skill, reclaim, and no fake city 6; high-skill timing warning remains. |
| Fresh-run acceptance | Automated pass, releaseReady false | Hard failures 0. Manual coverage warnings remain for normal/cautious/aggressive routes. |
| Reclaim route | Pass | Foundation, Core, and Nascent reclaim speedups are measured and pass. |
| Runtime diagnostics | Pass | Clean baseline and expected-negative checks pass. |

## Telemetry Snapshot

| Field | Baseline |
|---|---:|
| Event count | 23 |
| Life count | 2 |
| Prestige count | 1 |
| Offline applied count | 1 |
| Gate 1 attempts | 2 |
| Gate 1 clears | 1 |
| Gate 1 defeats | 1 |
| Eligible defeat Merit | 5 |
| Gate Trial clear Merit | 40 |
| Bounty Merit | 10 |
| Fail-safe purchase | 100 gold |

## Tuning Candidate

The timing drift is nearly proportional across all phase targets. The existing runtime Qi baseline multiplier is `1.19`; observed phase durations imply a target correction near `1.44`:

| Phase | Current actual / target | Implied multiplier |
|---|---:|---:|
| Pinewind | 2729 / 3300 | 1.439 |
| Stonecrag | 3967 / 4800 | 1.440 |
| Spirit Cavern | 5951 / 7200 | 1.440 |
| Lotusford | 8427 / 10200 | 1.441 |
| Ironpeak | 12397 / 15000 | 1.440 |

This points to one narrow value change in the existing target model rather than route, combat, reward, or UI changes.
