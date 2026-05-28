# Performance Scheduler Packet 2 Handoff

## Previous Packet Verification

Status: pass-with-known-pre-existing-failures

Inspected files:
- AGENTS.md
- docs/codex/PROMPT_STYLE.md
- docs/codex/TASK_QUEUE.md
- docs/release/performance_baseline_packet1_handoff.md
- docs/release/performance_budget.md
- docs/release/performance_baseline_report.md
- docs/release/performance_baseline_report.json
- docs/release/bundle_inventory.md
- docs/release/bundle_inventory.json
- docs/release/current_implementation_baseline.md
- docs/release/current_implementation_baseline.json
- docs/release/build_warning_inventory.md
- docs/release/performance_smoke_checklist.md
- docs/release/go_no_go_checklist.md
- docs/release/known_issues.md
- docs/release/release_handoff_bundle.md
- C:/Users/abdul/Downloads/Cultivation_Idle_Optimization_Mega_Report.docx

Missing optional packet files:
- MEGA_PROMPT_2_START_HERE.md
- README_MEGA_PROMPT_2_BUNDLE.md
- reference-prompts/Cultivation_Idle_Mega_Prompt_1_Performance_Baseline.md
- reference-docs/Cultivation_Idle_Optimization_Mega_Report.docx

Confirmed Packet 1 artifacts:
- performance service: present
- performance labels: present
- performance report script: present
- bundle inventory script: present
- tests: present
- docs: present
- package scripts: present for release:performance-baseline, release:performance-baseline:json, release:bundle-inventory, release:bundle-inventory:json

Pre-edit commands:
| Command | Result | Notes |
| --- | --- | --- |
| `git status --short` | pass | Worktree was already dirty with Packet 1 instrumentation/report files, generated fixture output, and route/shell perf instrumentation. Preserved as predecessor state. |
| `npm run release:implementation-baseline:json` | pass | No blockers or warnings; dirty branch `Latest`. |
| `npm run release:performance-baseline:json` | pass | Confirms rAF usage in `src/systems/gameLoop.ts`; `pavilion_records.json` remains large; next recommended prompt is fixed-step scheduler. |
| `npm run release:bundle-inventory:json` | pass | Dist exists; large JS/CSS/assets and large `pavilion_records.json` remain downstream bundle/content work. |
| `npm run typecheck` | pass | `tsc --noEmit` passed before edits. |
| `npm run check:icons` | pass | No emoji icon usage found. |
| `npm run test:contracts` | fail | Blocked during `build:progression-fixtures` by known Windows `TS5033` write failures in `tmp-progression-fixtures`. |
| `npm run validate:content` | pass | Content validation passed. |
| `npm run build` | pass with known warnings | Known stale Browserslist, unresolved `InsideDungeon.png`, and over-500KB chunk warnings remain. |

Conclusion:
- Scheduler work is safe to proceed because Packet 1 instrumentation, reports, docs, and package scripts exist, and Packet 1 handoff explicitly deferred scheduler cadence changes.
- The current source still has `requestAnimationFrame` authority in `src/systems/gameLoop.ts`: rAF calls `this.tick()`, which calls `useGameStore.getState().tick(deltaTime)`, `cultivationService.tick(deltaTime)`, and `useCombatStore.getState().tick(deltaTime)` for combat activities.
- Issues not fixed because out of scope: broad fixture write failures, bundle/content splitting, selector cleanup, exact surface builder caching, SaveScheduler, and visual runtime optimization.

## Scheduler Architecture

Implemented:
- Scheduler file: `src/services/time/SimulationScheduler.ts`
- Progression diagnostics helper: `src/services/diagnostics/progressionGateAvailability.ts`
- Job registration owner: `src/systems/gameLoop.ts`

Jobs and cadences:
| Job | Cadence | Catch-up policy | Hidden policy |
| --- | ---: | --- | --- |
| `cultivation-authoritative` | 250ms | max 1000ms catch-up, max 4 steps/drain | paused/clamped while hidden |
| `combat-fixed-step` | 100ms | max 250ms catch-up, max 2 steps/drain | paused/clamped while hidden |
| `queues-and-expeditions` | 1000ms | max 1000ms catch-up, max 1 step/drain | paused/clamped while hidden |
| `progression-diagnostics` | 1000ms | max 1000ms catch-up, max 1 step/drain | paused/clamped while hidden |
| `autosave` | 60000ms | max 60000ms catch-up, max 1 step/drain | paused/clamped while hidden |

Policy:
- Scheduler uses `GameClock.nowMono()` for elapsed-time arithmetic and `GameClock.nowWall()` for job contexts that need wall timestamps.
- Re-registering a job name intentionally replaces that job; `GameLoop.start()` clears and re-registers the packet-owned jobs.
- Job errors are caught, counted, and logged without stopping other jobs.
- Diagnostics expose run, skip, error, clamp, elapsed, max, and average data per job.
- rAF remains as a visual-only counter loop. It no longer calls authoritative game, cultivation, combat, queue, diagnostics, or autosave ticks.

## Code Changes

Added:
- `src/services/time/SimulationScheduler.ts`
- `src/services/diagnostics/progressionGateAvailability.ts`
- `tests/contracts/simulationSchedulerContract.test.ts`
- `tests/integration/gameLoopSchedulerIntegration.test.ts`
- `tests/integration/schedulerCultivationEquivalence.test.ts`
- `tests/integration/schedulerCombatActivityGate.test.ts`
- `tests/integration/schedulerProgressionDiagnostics.test.ts`

Modified:
- `src/systems/gameLoop.ts`: registers fixed-step scheduler jobs, starts/stops scheduler, keeps rAF visual-only, migrates one-second queue/craft/expedition heartbeat into scheduler, migrates autosave into scheduler at the same 60s cadence, and records scheduler hidden state on visibility/pagehide.
- `src/stores/gameStore.ts`: removed progression gate availability diagnostics from the high-frequency game tick path.
- `src/services/performance/perfLabels.ts`: added scheduler labels.
- `tests/contracts/perfLoggerContract.test.ts`: added scheduler label/export sanitization coverage.
- `tests/helpers/release/runFreshSaveRoute.ts`: calls the extracted progression diagnostics helper at the route's one-second simulation cadence, because the release route intentionally bypasses `GameLoop`.

Not changed intentionally:
- Combat math, combat resolution, rewards, trial resolution, prestige reset, content JSON, UI design, bundle splitting, and save format.

## Tests

Added/updated:
- Scheduler contract tests: idempotent start/stop, intervals, disabled/enabled jobs, catch-up clamps, max steps, errors, replacement, unregister, clear, diagnostics, monotonic/wall context, hidden policy.
- GameLoop integration tests: scheduler start/stop, visual rAF has no authoritative ticks, scheduler drains call authoritative jobs, repeated start/stop does not duplicate jobs, job cadences/gates are registered.
- Cultivation equivalence tests: 60 seconds of old-style small deltas vs 250ms scheduled deltas remain equivalent within Decimal tolerance; timestamps stay valid.
- Combat activity tests: combat job runs only for `outskirts`, `trial`, and `ruins`; hidden/resume catch-up is clamped.
- Progression diagnostics tests: `gameStore.tick` no longer calls `trackGateAvailability`; extracted helper preserves content/progression contract ownership.
- Release fresh-run test coverage re-run after adapting the release route to the extracted diagnostics helper.

Results:
- `npm exec tsc -- --project tsconfig.tests.json`: pass.
- Focused scheduler and release tests: 28 pass, 0 fail.
- `npm run release:fresh-run-report:json`: pass for automated normal route; manual coverage remains missing for normal/cautious/aggressive.

## Performance Evidence

Pre-edit static evidence:
- `requestAnimationFrame` usages: 33 in the pre-edit `release:performance-baseline:json` output.
- `src/systems/gameLoop.ts` rAF usage: rAF callback calls `this.tick()`.
- `src/systems/gameLoop.ts` authoritative tick path: `gameStore.tick`, `cultivationService.tick`, and combat tick are called from `this.tick()`.
- Large deferred content file: `public/cultivation_idle_content_bible_v1_config/pavilion_records.json`.
- Dist warning: `dist/assets/index-DEtiFykH.js` over 500 KiB uncompressed.

After static evidence:
- `requestAnimationFrame` remains in `src/systems/gameLoop.ts` only as a visual-only loop that increments `ci:gameLoop:rafCallback`.
- Production callsites for `useGameStore.getState().tick`, `cultivationService.tick`, and `useCombatStore.getState().tick` are in `registerSimulationSchedulerJobs`.
- `RewardService.grantRewards` was not added to scheduler/time code; the only `gameLoop.ts` hit is the existing fresh-run starter grant.
- `OfflineCatchup` remains separate; scheduler code does not call offline progress.

After runtime evidence, Playwright `?ciPerf=1`:
| Scenario | Duration | rAF callbacks | old `ci:gameLoop:tick` counter | scheduler drains | cultivation job | queue job | progression diagnostics job | combat job | measured game tick count | measured cultivation tick count | measured combat tick count |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| fresh idle | 30.3s | 77 | 0 | 74 | 120 | 30 | 30 | 0 | 120 | 120 | 0 |
| active combat | 30.2s | 80 | 0 | 80 | 124 | 31 | 31 | 160 | 124 | 124 | 160 |

Notes:
- In this perf logger, store/service tick activity is represented as measure counts (`ci:store:game:tick`, `ci:service:cultivation:tick`, `ci:store:combat:tick`), while scheduler job activity is represented as counters.
- Active combat started through `CombatStore.startCombat` with `outskirts_training_forest` / `enemy_forest_rabbit`. The encounter ended before 30s, so 160 combat ticks is bounded and expected for the active portion.
- Fresh idle max scheduler drain was 2.1ms. Active combat max scheduler drain was 10.1ms; max combat tick was 9.8ms.
- Browser plugin opened the app and captured page/log state, but its read-only evaluation surface did not expose `window.__CI_PERF__`; Playwright was used for main-world perf export.
- Console warnings/errors captured in runtime evidence were the existing `GameLoop Already running` warning and content validation pool-size warnings. No new scheduler exception was observed.

## Plugin Evidence

- Browser: Used. Opened `http://127.0.0.1:5175/?ciPerf=1`, confirmed the app rendered and collected DOM/console evidence. Browser read-only evaluation did not expose `window.__CI_PERF__`, so Playwright captured perf exports.
- Linear: Plugin/tool unavailable through tool discovery; no Linear evidence captured.
- Game Studio: Used for browser-game loop architecture guidance. Cadences follow the simulation/presentation split: cultivation 250ms, combat 100ms, queues/diagnostics 1000ms.
- Superpowers: Used for TDD-first implementation, systematic debugging when release fresh-run regressed, and verification-before-completion.
- GitHub: Used. Installed accounts are `HeavenRefiningDemonV` and `Eudemonia-Games`; recent issue listing did not surface a Cultivation Idle scheduler issue. Local `gh` CLI unavailable.
- Sentry: Plugin/tool unavailable through tool discovery; no Sentry evidence captured.
- CodeRabbit: Plugin/tool unavailable through tool discovery and local `coderabbit` CLI unavailable; manual review checklist run instead.
- HyperFrames by HeyGen: Available but not needed; no explainer artifact created.
- Codex Security: Manual security/privacy pass run: no new dependencies, no `eval`/`new Function`, no save payload export, no scheduler reward grants, no trial outcome mutation, and no new network telemetry.

## Final Commands

| Command | Result | Notes |
| --- | --- | --- |
| `git status --short` | pass | Worktree remains dirty with predecessor Packet 1 files plus Packet 2 changes. |
| `npm exec tsc -- --project tsconfig.tests.json` | pass | Compiled focused tests. |
| focused `node --loader=./scripts/relativeJsLoader.mjs --test ...` | pass | 28 tests passed. |
| `npm run typecheck` | pass | `tsc --noEmit`. |
| `npm run check:icons` | pass | No emoji icons. |
| `npm run test:contracts` | fail | Known Windows `TS5033` fixture write failure under `tmp-progression-fixtures`; focused scheduler tests pass. |
| `npm run validate:content` | pass | Content validation passed. |
| `npm run build` | pass with known warnings | Stale Browserslist, unresolved `InsideDungeon.png`, and large chunk warning remain. |
| `npm run release:performance-baseline:json` | pass | Static performance report generated. |
| `npm run release:bundle-inventory:json` | pass | Large JS/assets/content remain downstream work. |
| `npm run release:build-audit:json` | pass with warnings | 3 known build warnings. |
| `npm run release:fresh-run-report:json` | pass with warnings | Automated route passes; manual coverage missing. |
| `npm run release:gate -- --json` | fail / NO_GO | Remaining blockers: manual fresh-run coverage and full-suite `tmp-progression-fixtures` TS5033; 7 waiver candidates unaccepted. |

## Deferred Work

- Mega Prompt 3: selector cleanup, no-op store writes, Header/Sidebar view models, JSON signature replacement, exact surface caching.
- Mega Prompt 4: deeper cultivation batching, insight progress publication, combat view-model optimization, medicine trigger eventing, combat log caps.
- Mega Prompt 5: lazy loading, content split, Vite chunks, Motion/Pixi gating, effect tiers.
- Mega Prompt 6: final cross-device performance QA and release gate enforcement.
