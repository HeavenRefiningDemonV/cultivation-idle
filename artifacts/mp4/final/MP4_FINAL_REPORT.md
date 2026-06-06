# MP4 Final Report

Generated: 2026-05-29T03:40:43.8736850+03:00

## Executive Decision

MP4_GO

MP4-owned timing and path pacing drift is resolved. The remaining warnings are inherited/release evidence items: MP3 public adoption partials, MP2 Gate Trial advanced screenshot follow-up, and MP5 release/manual coverage hardening.

Story tutorial may begin: No.
Final menu polish may begin: No.
MP5 may begin: Yes, because MP4-owned numeric tuning gates are green and remaining hardening belongs to MP5.

## Previous Packet Verification

| Check | Result |
|---|---|
| AGENTS.md read | Yes |
| MP3 final decision | PARTIAL |
| MP3 shared readiness/source model | Present: `MilestoneReadinessSurfaceV1` |
| MP3 targeted contract | Pass |
| Proceed despite MP3 partial | Yes; partials are inherited public-adoption/screenshot/release-gate follow-up and do not block MP4 numeric tuning |

## Timing Before/After

| Metric | Baseline | After | Target | Pass |
|---|---:|---:|---|---|
| Gate 1 available | 2729s | 3256s | 1800-3300s | Yes |
| Foundation entry | 2729s | 3256s | 2700-4500s | Yes |
| Pinewind | 2729s | 3256s | 3300s | Yes |
| Stonecrag | 3967s | 4734s | 4800s | Yes |
| Spirit Cavern | 5951s | 7101s | 7200s | Yes |
| Lotusford | 8427s | 10056s | 10200s | Yes |
| Ironpeak | 12397s | 14792s | 15000s | Yes |
| Content cap | 33471s | 39939s | 34200-48600s | Yes |

## Economy/Source-Sink Before/After

| Area | Baseline | After | Pass |
|---|---|---|---|
| Activity throughput roles | Pass | Pass | Yes |
| Prep/bypass ratios | Pass | Pass | Yes |
| Bounty reserve pacing | Pass | Pass | Yes |
| Expedition ratios | Pass | Pass | Yes |
| Reward parity/source-sink ownership | Present from MP3 | Unchanged | Yes |

No reward amounts, fail-safe costs, shop costs, forge costs, expedition yields, or bounty payouts changed in MP4.

## Changed Values

| ID | File | Old | New | Reason |
|---|---|---:|---:|---|
| MP4-001 | `src/systems/balance/semesterBalanceTargets.ts` | 1.19 | 1.42 | Restore representative phase/cap timing into target band. |
| MP4-002A | `src/constants/index.ts` Heaven Qi multiplier | 1.50 | 1.40 | Keep Heaven fastest without cap under-run. |
| MP4-002B | `src/constants/index.ts` Earth Qi multiplier | 1.00 | 1.19 | Bring Earth Gate 1/Foundation into early milestone band. |

## Gate Readiness/Combat

| Gate | Below-min win | Minimum win | Recommended win | Min duration | Rec duration | Pass |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 0.060 | 0.350 | 0.875 | 39s | 27s | Yes |
| 2 | 0.050 | 0.300 | 0.850 | 44s | 31s | Yes |
| 3 | 0.040 | 0.265 | 0.830 | 49s | 35s | Yes |
| 4 | 0.035 | 0.235 | 0.790 | 56s | 41s | Yes |
| 5 | 0.025 | 0.175 | 0.750 | 63s | 49s | Yes |

## Path Parity

| Path | Qi multiplier | Gate 1 | Foundation | Cap | Pass |
|---|---:|---:|---:|---:|---|
| Heaven | 1.40 | 2791s | 2791s | 34236s | Yes |
| Earth | 1.19 | 3283s | 3283s | 40277s | Yes |
| Martial | 1.20 | 3256s | 3256s | 39939s | Yes |

## Prestige/AP/Reclaim

| Metric | After | Target | Pass |
|---|---:|---:|---|
| Core AP/hour | 4.956 | >= 4.4 | Yes |
| Core AP | 11 | 10-14 | Yes |
| Nascent AP | 26 | 24-32 | Yes |
| Soul AP | 45 | 42-56 | Yes |
| Spirit Severing AP | 76 | 72-90 | Yes |
| First purchase feel | 0.2306 | >= 0.15 | Yes |
| Foundation reclaim speedup | 0.2125 | >= 0.15 | Yes |
| Core reclaim speedup | 0.1736 | >= 0.15 | Yes |
| Nascent reclaim speedup | 0.2745 | >= 0.10 | Yes |

## Offline

| Metric | After | Target | Pass |
|---|---:|---:|---|
| Base efficiency | 0.5 | 0.5 | Yes |
| Max efficiency | 0.9 | 0.9 | Yes |
| Max catchup | 43200s | 43200s | Yes |
| Offline combat/trial progress | false | false | Yes |

## Browser/Game-Feel

| Route | Viewports | Result |
|---|---|---|
| Cultivation after life-start | 1366x768, 1920x1080 | Pass |
| Status after life-start | 1366x768, 1920x1080 | Pass |
| World recommendations | 1366x768, 1920x1080 | Pass |
| Gate Trial readiness | 1366x768, 1920x1080 | Pass |
| Prestige projection | 1366x768, 1920x1080 | Pass |

Browser checks found no console errors, no horizontal overflow, no placeholder tokens, and no forbidden public Dao/Omen/Proof/Source labels in captured visible text.

## Commands

| Command | Result |
|---|---|
| `npm run test:balance-regression` | Pass |
| `npm run balance:report:json` | Pass |
| `npm run release:route-report:json` | Pass |
| `npm run release:fresh-run-report:json` | Pass with inherited manual coverage warnings |
| `npm run release:reclaim-route-report` | Pass |
| `npm run release:reclaim-route-report -- --json` | Pass |
| `npm run release:runtime-diagnostics:json` | Pass |
| `npm run typecheck` | Pass |
| `npm run check:icons` | Pass |
| `npm run validate:content` | Pass |
| `npm run build` | Pass with existing build warnings |

## Files Changed

| File | Purpose |
|---|---|
| `src/systems/balance/semesterBalanceTargets.ts` | Tuned representative runtime Qi baseline multiplier. |
| `src/constants/index.ts` | Tuned Heaven/Earth Qi path multipliers for parity. |
| `tests/helpers/balance/createTimingProbeScenario.ts` | Added explicit path selection for path parity probes. |
| `tests/helpers/balance/runPhaseTimingProbe.ts` | Added explicit path option and gate progression event emission for measurement correctness. |
| `tests/helpers/release/runFreshSaveRoute.ts` | Prevented direct-grant smoke route from spending breakthrough Qi before cap measurement. |
| `artifacts/mp4/**` | MP4 preflight, baseline, after, browser, report, and final evidence. |

## Blockers And Deferred

| Item | Owner | Blocks MP4 | Notes |
|---|---|---|---|
| MP3 public shared-surface adoption partial | MP3 follow-up | No | Numeric reports and browser smoke remain truthful. |
| Gate Trial advanced lifecycle screenshot matrix | MP2 follow-up | No | Not touched by MP4. |
| Fresh-run manual coverage warnings | MP5/release evidence | No | Automated normal route passes; manual coverage remains missing. |
| Broad release gate/full-suite timeout | MP5 | No | Outside MP4 numeric tuning. |

## Narrative

The first life now lands Gate 1/Foundation near 54 minutes on the representative route instead of around 45 minutes, giving support systems more room to matter without delaying the first threshold beyond the target window. The full representative semester reaches cap at 39939 seconds, inside the 9.5-13.5 hour envelope.

Gate prep and combat were not retuned because they were already green; post-tune checks confirm prep windows, win-rate bands, fail-safe ratios, and combat durations still pass. Prestige and reclaim remain honest: AP is in bracket, starter spend does not use unsupported nodes, and second-life reclaim remains materially faster.

Story/tutorial and final menu polish remain deferred until MP5/release hardening is complete.
