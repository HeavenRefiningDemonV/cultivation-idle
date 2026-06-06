# MP4 Tuning Hypotheses

Generated: 2026-05-29T02:58:56.9444622+03:00

## MP4-001 - Runtime Qi Baseline Phase Timing

| Field | Value |
|---|---|
| Metric | `timing.phase.*`, `timing.cap_time`, `timing.foundation_entry`, `timing.gate_1_available` |
| Current value / observed result | `REALM_QI_BASELINE_RUNTIME_TUNING_MULTIPLIER = 1.19`; phase durations are 2729s, 3967s, 5951s, 8427s, 12397s against targets 3300s, 4800s, 7200s, 10200s, 15000s. |
| Target envelope | Phase targets 55/80/120/170/250 minutes; content cap 34200-48600s; Gate 1 available 1800-3300s; Foundation entry 2700-4500s. |
| Player-feel problem | The full life and each city phase run about 17 percent too fast, compressing the intended cultivation arc and making support loops feel less weighted. |
| Likely cause | Runtime Qi baseline multiplier no longer matches the current timing probe path after the live representative path/Heart Law setup. |
| Proposed change | Set `REALM_QI_BASELINE_RUNTIME_TUNING_MULTIPLIER` from `1.19` to `1.42`. |
| Expected result | Pinewind/Gate 1/Foundation move from 2729s to roughly 3250s; cap moves from 33471s to roughly 39900s; all remain within MP4 target windows. |
| Risk | Slowing Qi could delay early action too far, weaken prestige AP/hour, or push reclaim/fresh-run reports out of band. |
| Tests to prove it | `npm run test:balance-regression`, `npm run balance:report:json`, `npm run release:route-report:json`, `npm run release:fresh-run-report:json`, `npm run release:reclaim-route-report`, `npm run release:runtime-diagnostics:json`, `npm run typecheck`, `npm run check:icons`, `npm run validate:content`. |
| Rollback plan | Revert `REALM_QI_BASELINE_RUNTIME_TUNING_MULTIPLIER` to `1.19`; no report or target schema changes required. |

## Value Change Log

| Change ID | File | Old value | New value | Metric affected | Baseline result | Target | After result | Rationale | Risk | Rollback |
|---|---|---:|---:|---|---:|---|---|---|---|---|
| MP4-001 | `src/systems/balance/semesterBalanceTargets.ts` | 1.19 | 1.42 | phase timing and cap timing | Pinewind 2729s vs 3300s; cap 33471s vs 34200-48600s | Pinewind 3300s; cap 34200-48600s | Pinewind 3256s; cap 39939s | Restore proportional timing without altering route contracts, rewards, combat, AP targets, or UI. | Early milestones/prestige/reclaim could slow too much. | Revert value to 1.19. |

## Measurement Harness Repairs

| Change ID | File | Classification | Baseline result | Repair | After result |
|---|---|---|---|---|---|
| MP4-HARNESS-001 | `tests/helpers/balance/runPhaseTimingProbe.ts` | measurement_harness_gap | Phase timing probe tracked gate availability/resolution in local rows but did not emit progression gate events once timing assertions reached the event-count checks. | Emit `progression/gate_available` and `progression/gate_resolved` through `progressionTimingTracker` when the synthetic timing probe observes/clears each gate. | `npm run test:balance-regression` passes and event counts are present. |
| MP4-HARNESS-002 | `tests/helpers/release/runFreshSaveRoute.ts` | measurement_harness_gap | Fresh-run smoke spent breakthrough Qi on generic upgrades immediately before direct-grant gate clears, causing cap reachability to fail after the MP4 timing slowdown. | Preserve breakthrough Qi in the direct-grant smoke helper and leave prep/combat proof to the balance regression suite. | `release:fresh-run-report:json` automated pass, Spirit Severing/current cap reached. |

## MP4-002 - Heaven/Earth Path Pacing Parity

| Field | Value |
|---|---|
| Metric | Path-specific Gate 1/Foundation/cap timing for Heaven, Earth, and Martial. |
| Current value / observed result | With the representative timing tune, Earth Gate 1/Foundation was 3907s and Heaven cap was 31952s. Earth was too late for Gate 1; Heaven reached cap below the first-life cap band. |
| Target envelope | Gate 1 1800-3300s, Foundation 2700-4500s, cap 34200-48600s, each path viable without sameness. |
| Player-feel problem | Heaven could compress the life too hard while Earth delayed the first gate beyond the intended early milestone. |
| Likely cause | Path Qi multipliers were too widely spread for the new runtime baseline. |
| Proposed change | Set Heaven Qi multiplier `1.5 -> 1.4` and Earth Qi multiplier `1.0 -> 1.19`; leave Martial at `1.2`. |
| Expected result | Heaven remains fastest, Martial remains representative, Earth remains slightly slower than Martial while all three paths reach cap inside band. |
| Risk | Earth cultivation identity becomes closer to Martial; Heaven advantage narrows. Combat identity remains separated by HP/ATK/DEF/crit/dodge modifiers. |
| Tests to prove it | Path parity probe, `npm run test:balance-regression`, final typecheck/build/content/icon checks. |
| Rollback plan | Revert Heaven to `1.5` and Earth to `1.0`. |

| Change ID | File | Old value | New value | Metric affected | Baseline result | Target | After result | Rationale | Risk | Rollback |
|---|---|---:|---:|---|---:|---|---|---|---|---|
| MP4-002A | `src/constants/index.ts` | 1.5 | 1.4 | Heaven path timing | Cap 31952s, below 34200s minimum | 34200-48600s | Cap 34236s | Keep Heaven fastest without skipping the semester envelope. | Heaven advantage narrows. | Revert to 1.5. |
| MP4-002B | `src/constants/index.ts` | 1.0 | 1.19 | Earth path timing | Gate 1 3907s, above 3300s maximum | 1800-3300s | Gate 1 3283s | Keep Earth viable in the first gate window while preserving defensive identity. | Earth cultivation speed approaches Martial. | Revert to 1.0. |
