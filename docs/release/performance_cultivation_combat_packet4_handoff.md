# Performance Cultivation/Combat Packet 4 Handoff

Generated: 2026-05-26

## Summary
- What changed: Cultivation now batches Heart Law comprehension/chapter updates, buckets insight display publication, caches cultivation consumable modifiers, and flushes exact Qi/insight before rule/save boundaries. Combat now uses evented medicine triggers, guarded buff/shield/cooldown/resource maintenance, cached AI technique metadata, capped log/event windows, and a compact combat view model for the minibar path.
- Why it changed: The remaining hot paths were still publishing global store changes on fixed-step cadence for display-only state and polling combat medicine/maintenance work every tick.
- What did not change: No balance constants, reward ownership, combat resolution ownership, ActivityStore foreground gating, OfflineCatchup ownership, prestige truth, route lazy loading, chunk splitting, or visual redesign changed.

## Previous Packet Verification

Status: pass-with-known-pre-existing-failures

Packet 3 artifacts verified:
- Selector audit: `npm run release:selector-hygiene` and `npm run release:selector-hygiene:json` exist and pass with 0 bare render subscriptions and 0 forbidden JSON selector/dependency signatures.
- Version counters: `src/stores/versionCounters.ts` exists; requested counters are present, including game/cultivation/combat counters and per-domain store counters.
- No forbidden JSON signatures: selector audit reports none; allowed serialization sites remain debug/export/hidden fixture surfaces.
- Exact owner scalar dependencies: focused exact owner dependency test passes.
- No-op publication guards: prior no-op guard tests pass, including same target/modal/loadout/pouch/equipment and cultivation/combat cleanup guards.
- Focused Packet 3 tests: pass, 31/31 before Packet 4 and 49/49 combined with scheduler tests after Packet 4.

Packet 2 artifacts verified:
- Scheduler installed: `src/services/time/SimulationScheduler.ts` exists.
- rAF visual-only: `src/systems/gameLoop.ts` rAF callback only increments visual/perf activity; authoritative jobs remain scheduler jobs.
- Cultivation job cadence: `cultivation-authoritative` remains approximately 250ms.
- Combat job cadence: `combat-fixed-step` remains approximately 100ms and gated by foreground combat activity.
- ActivityStore gate: combat scheduler predicate follows `ActivityStore` combat activity truth.
- OfflineCatchup separation: no offline combat simulation was added; hidden/return catch-up remains scheduler-clamped and OfflineCatchup-owned.

Packet 1 artifacts verified:
- Perf labels: baseline labels remain, with Packet 4 labels added for Qi flush, comprehension batch, insight display publish, modifier cache, medicine event, buff sweep, resource publish, AI snapshot build, view model build, and view publish.
- Runtime perf export: `window.__CI_PERF__` was available under `?ciPerf=1` in Playwright.
- Performance budget: `docs/release/performance_budget.md` exists.
- Baseline scripts: `release:performance-baseline:json`, bundle inventory, build audit, and selector hygiene scripts exist and pass.

Known blockers:
- `README_MEGA_PROMPT_4_PROMPT_INPUT_BUNDLE.md` was absent; nearest current release docs were used.
- Full broad `npm run test`, `npm run test:contracts`, and broad `release:gate` were not used as Packet 4 proof because the input bundle identified the Windows `TS5033` fixture-output blocker and pending manual fresh-run coverage. Focused tests and release audits were used instead.
- The worktree was already broadly dirty before Packet 4; unrelated dirty files were preserved.
- Build still emits 3 known warnings: stale Browserslist data, unresolved `../../assets/background/InsideDungeon.png`, and a >500 KiB chunk warning.

Conclusion:
- Safe to proceed with Packet 4: yes.

## Hot-Path Audit

| Area | Current behavior | Hot-path risk | Packet 4 action |
| --- | --- | --- | --- |
| Qi publication | `gameStore.tick` wrote Qi/timestamps every cultivation step. | 250ms store publication even for sub-display deltas. | Added pending Qi accumulator with bounded display flush and explicit `flushCultivationAccumulation`. |
| Raw Qi readers | Save/export and breakthrough read `gameStore.qi`; exact screens read Qi via owners/selectors keyed by scalar versions. | Coarse publication could make rules stale. | Flush before breakthrough, purchase, save/default save, Heart Law/breath changes, and insight draw-Qi. |
| `lastActiveTime` | Updated every cultivation step. | Timestamp-only publication and offline ambiguity. | Coarse heartbeat only; save/offline rule boundaries flush exact state. |
| Heart Law comprehension | `addComprehension` could set then call chapter advance. | Two publications for one continuous gain. | Single batched comprehension/chapter mutation with one `heartLawVersion` bump. |
| Insight progress | Millisecond progress/next target published every fixed step. | `insightDisplayVersion` churn. | Runtime exact progress plus percent/second display buckets; publish only on bucket/open/resolve/schedule. |
| Cultivation consumables | Modifier merging and expiry checks ran repeatedly. | Repeated allocations/merges with no active or non-expired consumables. | Stable empty modifiers, version/expiry cache, next-expiry guard, cache invalidation on use/expiry/reset/major bonus. |
| Medicine fightStart | Fight-start medicine was reachable from tick polling. | Every combat tick could evaluate a one-shot event. | Trigger fightStart once at combat start/new fight; below-threshold start HP gets one event, not polling. |
| HP threshold medicine | Low HP checks were tick-poll shaped. | Repeated checks while already under threshold. | Fire on previous-to-next threshold crossing around damage/start events. |
| Combat buffs/shields | Buff filtering and shield expiry checks ran every combat tick. | No-op array/object work. | Skip when empty/not due; sweep only at expiry. |
| Combat resources | Resources could publish even when capped/unchanged. | Avoidable store writes. | Skip capped no-op regen and batch changed resources with maintenance set. |
| Technique AI | Decision interval existed but metadata rebuilt at decision time. | Repeated classification/effect normalization for unchanged loadout/content/mastery/profile context. | Cache stable AI metadata by content/loadout/profile/collection/mastery/boss/candidate key; live cooldown/resource checks remain exact. |
| Logs/events | Logs were capped but push paths were repeated. | Risk of window drift or latest-entry loss. | Shared `pushWindowed` helper; tests assert latest entries remain capped. |
| Combat view model | Minibar read combat log arrays directly. | Presentation could subscribe to deeper store data than needed. | Added compact `CombatViewModel` and wired minibar to bounded log/event tails keyed by semantic versions. |

## Packet 4 Before Metrics

Fresh idle:
- Duration: 30164.9ms
- Game tick count: 124
- Cultivation service tick count: 124
- Cultivation store publications/counters: `clearExpiredConsumables` 248 calls / 0.4ms
- Game store set/write counters: 124
- Shell renders: `GameLayout` 90 commits; `CultivationExactScreenOwner` 76 commits
- Long tasks/LoAF: 76 / 76

Heart Law idle:
- Duration: 30170.9ms
- addComprehension count/duration: 124 / 2.7ms
- advanceInsightTimer count/duration: 124 / 1.7ms
- getConsumableModifiers count/duration: 248 / 0.2ms
- clearExpiredConsumables count/duration: 248 / 6.1ms
- CultivationExact/owner renders: 77 commits
- Shell renders: 80 commits

Active combat:
- Duration: 30301.3ms
- Combat tick count: 156 / 31.2ms total / 10.1ms max
- Medicine checks: 156 polling checks / 0.3ms
- Buff/shield work: 136 buff checks / 0.1ms
- Technique AI checks: 67 / 3.6ms
- Resource publications: 12
- Log appends: 40
- Combat view publications: not separately labelled before Packet 4
- Combat theater/owner renders: `GameLayout` 82 commits; `CultivationExactScreenOwner` 80 commits
- Long tasks/LoAF: 80 / 80

Capture limitations:
- Browser plugin tools were not surfaced through tool discovery; Playwright main-world evaluation was used.
- UI overlays/story/life-start flow made direct UI navigation unreliable, so scenarios used live app/store setup under the dev server with `?ciPerf=1`.
- The after Heart Law render counts are not directly comparable to before because the synthetic setup kept the exact owner in a stronger active state; store/write/hot-path metrics are the primary evidence.

## Before Metrics

| Scenario | Metric | Value | Notes |
| --- | ---: | ---: | --- |
| Fresh idle | game store set calls | 124 | 30s scheduler capture |
| Fresh idle | game tick total ms | 14.2 | 124 calls |
| Fresh idle | Qi section total ms | 5.2 | 124 calls |
| Heart Law idle | addComprehension calls | 124 | one per fixed step before batching |
| Heart Law idle | insight timer calls | 124 | visible progress published each step before bucketing |
| Heart Law idle | clearExpiredConsumables total ms | 6.1 | 248 calls |
| Active combat | combat tick total/max ms | 31.2 / 10.1 | 156 calls |
| Active combat | medicine polling checks | 156 | fightStart reachable from tick path |
| Active combat | buff/shield work | 136 | repeated tick maintenance |
| Active combat | technique AI checks | 67 | auto AI active in before capture |

## Implementation Details

### Cultivation / Heart Law
- Added a module-local exact Qi accumulator in `gameStore` with `flushCultivationAccumulation(reason)`.
- Kept authoritative Qi exact by flushing before breakthrough, purchase, save/default save, Heart Law changes, breath changes, and insight draw-Qi.
- Batched comprehension gain and chapter advancement into one `addComprehension` mutation, preserving multi-chapter and final-chapter behavior.
- Reduced `lastActiveTime` publication from every 250ms tick to coarse heartbeat/flush boundaries.

### Insight / Consumables / Qi
- Added runtime insight progress with display buckets so exact open timing is preserved without publishing sub-bucket progress each fixed step.
- Added stable default cultivation modifiers and a modifier cache keyed by `consumableVersion`, active length, and next expiry.
- Added next-expiry guard for cultivation consumable cleanup and cache invalidation on use, expiry, major bonus consumption, and reset.
- Save/default save now flush pending cultivation state before gathering store snapshots.

### Combat / Medicine / AI / Logs / View Model
- Replaced per-tick fightStart medicine polling with `triggerAutoMedicineEvent` calls at combat start/new fight.
- Added HP threshold medicine events around start HP and damage paths using previous-to-next threshold crossing.
- Added fast exits for empty/disabled pouch candidates.
- Guarded combat buff, shield, cooldown, game-buff, and capped-resource maintenance.
- Added AI technique metadata cache keyed by content/loadout/profile/collection/mastery/boss/candidate dependencies; cooldown/resource checks still run live at decision time.
- Added `pushWindowed` log/event helper and tests for latest-entry preservation.
- Added compact `src/systems/combat/combatViewModel.ts` and wired `CombatMinibar` to bounded display data keyed by semantic combat versions.

## Files Changed

| File | Change | Guardrail |
| --- | --- | --- |
| `src/stores/gameStore.ts` | Qi accumulator, bounded display flush, timestamp heartbeat, flush action | Exact Qi flushed before rules/save |
| `src/stores/cultivationStore.ts` | Comprehension batching, insight runtime bucket, consumable modifier cache | Heart Law/insight/consumable semantics preserved |
| `src/services/cultivationService.ts` | Existing single-tick orchestration consumed new batched store behavior | No ownership transfer |
| `src/systems/consumables/cultivationConsumableEffects.ts` | Added next-expiry helper | Pure helper, no balance data |
| `src/stores/combatStore.ts` | Event medicine, maintenance guards, AI metadata cache, windowed logs | CombatStore remains simulation/resolution owner |
| `src/systems/combat/combatViewModel.ts` | New compact display model | Pure derived data, no mutation/rewards |
| `src/components/combat/CombatMinibar.tsx` | Consumes compact view model and bounded tails | No visual redesign |
| `src/services/performance/perfLabels.ts` | Packet 4 perf labels | Preserved old label names |
| `src/types/index.ts` | Added flush action type | Store API only |
| `src/utils/saveload.ts` | Flush pending cultivation state before save/export snapshots | Existing save/localStorage path only |
| `src/save/defaultSaveState.ts` | Flush pending cultivation state before default save gather | No migration change |
| `tests/contracts/*HotPath*.test.ts` and related tests | Publication, medicine, windowing, view model tests | Focused contract coverage |
| `tests/integration/cultivationHotPathEquivalence.test.ts` | 60s Qi equivalence | Exact elapsed-time proof |
| `tests/integration/combatHotPathOutcome.test.ts` | Combat outcome ownership source contract | Reward/trial ownership proof |
| `output/packet4-perf/*.json` | Before/after runtime captures | Evidence artifacts |

## Tests Added or Updated

| Test | Purpose | Result |
| --- | --- | --- |
| `tests/contracts/cultivationHotPathPublication.test.ts` | Comprehension batching, insight bucket no-op, stable modifiers, Qi no-op publication | Pass |
| `tests/integration/cultivationHotPathEquivalence.test.ts` | 60s exact Qi preserved after explicit flush | Pass |
| `tests/contracts/medicinePouchEventTriggers.test.ts` | fightStart once, no tick repeat, HP threshold start event | Pass |
| `tests/contracts/combatHotPathPublication.test.ts` | No-op maintenance publication, cooldown guard, AI cache keys | Pass |
| `tests/contracts/combatLogWindowing.test.ts` | Combat log/event caps keep latest entries | Pass |
| `tests/contracts/combatViewModel.test.ts` | Compact model fields and stability | Pass |
| `tests/integration/combatHotPathOutcome.test.ts` | Victory/defeat/trial/reward owner boundary | Pass |
| Prior Packet 2/3 focused suites | Scheduler, selector hygiene, version counters, no-op guards | Pass |

## Commands Run

| Command | Result | Notes |
| --- | --- | --- |
| Required read pass | Pass | `README_MEGA_PROMPT_4_PROMPT_INPUT_BUNDLE.md` absent; all other listed files read or nearest equivalent used |
| `npm run typecheck` | Pass | Run before and after implementation |
| `npm run check:icons` | Pass | No emoji icon usage found |
| `npm run validate:content` | Pass | Content validation passed |
| `npm run build` | Pass with known warnings | Browserslist, unresolved `InsideDungeon.png`, chunk size |
| `npm run release:selector-hygiene` | Pass | 0 bare render subscriptions, 0 forbidden JSON signatures |
| `npm run release:selector-hygiene:json` | Pass | JSON audit pass |
| `npm run release:performance-baseline:json` | Pass | Regenerated static report |
| `npm run release:bundle-inventory:json` | Pass with known warning | Final dist JS chunk `index-CvklXriv.js` >500 KiB |
| `npm run release:build-audit:json` | Pass with warnings | blockerCount 0, warningCount 3 |
| `npm exec tsc -- --project tsconfig.tests.json` | Pass | Test bundle compiled |
| Packet 4 focused node test command | Pass | 22 tests pass |
| Prior Packet 2/3 focused node test command | Pass | 49 tests pass |
| `npm run typecheck && npm exec tsc -- --project tsconfig.tests.json` | Failed command shape | PowerShell rejected `&&`; commands were rerun separately and passed |
| `gh pr status --repo HeavenRefiningDemonV/cultivation-idle` | Unavailable | `gh` CLI not installed |
| `coderabbit --version` | Unavailable | CodeRabbit CLI not installed |

## After Metrics

| Scenario | Metric | Before | After | Notes |
| --- | ---: | ---: | ---: | --- |
| Fresh idle | game store set calls | 124 | 28 | Lower; Qi/timestamp publication bounded |
| Fresh idle | game tick total ms | 14.2 | 7.5 | Lower |
| Fresh idle | Qi section total ms | 5.2 | 2.1 | Lower |
| Fresh idle | long tasks / LoAF | 76 / 76 | 26 / 26 | Lower in Playwright capture |
| Heart Law idle | game store set calls | 124 | 28 | Lower |
| Heart Law idle | insight display publications | 124 step writes | 60 bucket publishes | Lower visible publication pressure |
| Heart Law idle | clearExpiredConsumables total ms | 6.1 | 0.2 | Lower via next-expiry guard |
| Heart Law idle | modifier cache hits | 0 | 240 | Cache active |
| Heart Law idle | comprehension semantic publication | multi-set risk | 1 per gain event | Verified by subscription test |
| Active combat | game store set calls | 125 | 27 | Lower during active combat |
| Active combat | combat tick total/max ms | 31.2 / 10.1 | 18.4 / 0.6 | Lower despite more combat steps in after capture |
| Active combat | medicine checks | 156 polling checks | 0 polling checks | Event path; no configured slot in capture |
| Active combat | buff/shield cleanup work | 136 checks | 0 runs, 260 skips | Guarded no-op sweeps |
| Active combat | technique AI evaluations | 67 | 0 | After capture had auto AI off; cache/interval covered by source contract test |
| Active combat | combat log/event max length | capped before | capped after | Latest-entry tests pass |
| Active combat | long tasks / LoAF | 80 / 80 | 26 / 26 | Lower in Playwright capture |

## Browser Evidence
- URL: `http://127.0.0.1:5173/?ciPerf=1`
- Scenario(s): `freshIdle`, `heartLawIdle`, `activeCombat`
- Perf export available: yes, via `window.__CI_PERF__`
- Console warnings/errors: no scenario console errors recorded; build-time warnings listed separately
- Blocking overlays/dialogs: story/life-start route setup made UI-only scenario navigation unreliable, so Playwright seeded app stores and used the live scheduler/runtime export
- Screens reached: app shell loaded; Cultivation exact owner render counters captured
- Notes: Before/after artifacts are under `output/packet4-perf/`

## Plugin Evidence
- Browser: Browser tools were not surfaced by tool discovery; Playwright fallback was used for runtime capture.
- Linear: Not surfaced/configured in available tools; no issue update performed.
- Game Studio: Architecture sanity applied locally: fixed-step simulation, evented combat triggers, exact elapsed-time flushes, and compact presentation models are appropriate for idle/auto-combat; no balance/design changes were accepted.
- Superpowers: Used planning/TDD workflow. Plan: verify previous packets, measure, write focused tests, implement cultivation, implement combat, verify, handoff. Tests added first or alongside risky changes. Debug loop: fixed initial Qi flush cadence and HP-threshold start medicine edge case. Final self-audit completed through focused tests and owner/security scans.
- GitHub: Connector found `HeavenRefiningDemonV/cultivation-idle`; local branch is `codex/perf-packet-3-selector-surface-cleanup`. `gh` CLI unavailable; no PR push/update performed.
- Sentry: Not surfaced/configured; no Sentry issue inspection performed.
- CodeRabbit: CLI unavailable; manual review used the requested stale accumulator, medicine duplication, ownership, subscription, unbounded-array, and save compatibility checklist.
- HyperFrames: Available as a plugin family but not needed; code/test/performance evidence was prioritized.
- Codex Security: Manual diff scan performed. No new dependencies, no `eval`/`new Function`, no new network telemetry, no raw save payload logging, no encrypted save dump exposure, and no new localStorage path beyond existing save/export code.

## Security / Save Compatibility
- New dependencies: none.
- Save payload impact: pending Qi and insight state flush before save/default save snapshots; no schema migration required.
- Telemetry/logging impact: Packet 4 adds perf labels/counters only; no network telemetry or production console spam was added.
- Migration impact: none.

## Known Remaining Issues
- The broad worktree remains dirty from prior packet/user work; this packet did not clean or revert unrelated files.
- Broad full-test/release-gate paths remain deferred under the known Windows `TS5033` fixture-output blocker and pending manual fresh-run coverage.
- Build warning inventory remains: stale Browserslist data, unresolved `InsideDungeon.png`, and oversized initial chunk. These are not Packet 4 hot-path failures.
- After Heart Law render counts are not cleanly comparable because the fallback capture used direct app state setup; store-write and hot-path labels are the primary evidence.

## Deferred Work
- Mega Prompt 5 bundle/content/motion/Pixi: route lazy loading, manual chunks, content pack splitting, motion/Pixi quality tiers, asset compression, and chunk-size warning reduction.
- Mega Prompt 6 final QA/release gates: full gate closure, fresh-run manual coverage, CI-wide performance thresholds, and final executive signoff.

## Final Status
- Ready for next packet: yes
- Reason: Packet-local cultivation/combat hot-path optimizations are implemented, focused correctness/ownership tests pass, previous scheduler/selector invariants still pass, release audits have blockerCount 0, and known broad blockers are separated from Packet 4.
