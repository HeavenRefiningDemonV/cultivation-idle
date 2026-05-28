# Performance Baseline Packet 1 Handoff

## 1. Scope Summary

Mega Prompt 1 added opt-in performance instrumentation, static report scripts, bundle/content inventory, performance budgets, and scenario documentation. It intentionally did not change gameplay math, scheduler cadence, combat resolution, rewards, save format, migration semantics, content JSON, or screen design.

## 2. Previous Packet Verification

Inspected:

- `AGENTS.md`
- `docs/release/current_implementation_baseline.md`
- `docs/release/current_implementation_baseline.json`
- `docs/release/build_warning_inventory.md`
- `docs/release/performance_smoke_checklist.md`
- `docs/release/release_handoff_bundle.md`
- `docs/release/go_no_go_checklist.md`
- `docs/release/known_issues.md`
- `docs/release/waiver_policy.md`
- `docs/codex/PROMPT_STYLE.md`
- `docs/codex/TASK_QUEUE.md`
- existing performance/baseline script and doc inventory

Status:

- Baseline docs and release command surface existed and were usable.
- Existing `performance_smoke_checklist.md` was interaction/idempotence focused and did not yet measure real performance scenarios.
- No prior `docs/release/performance_budget.md`, `release:performance-baseline`, `release:bundle-inventory`, or repo-native `src/services/performance/*` layer existed.
- Pre-existing broad contract debt remains outside this packet: `scenicLabelCityMapHubContract`, `statusToneUtils`, and a Pavilion record manifest expectation inside `trialLifecycle`.

Fixed within safe scope:

- Added the missing performance baseline layer and documentation.
- Extended the smoke checklist with scenario-oriented performance capture.

Deferred because out of scope:

- Scheduler cadence changes.
- Store selector cleanup.
- `JSON.stringify` signature replacement.
- Save scheduling/debouncing.
- Bundle/content splitting.
- Motion/Pixi/effect gating.

## 3. Plugin Usage And Availability

- Browser: the Browser skill guidance was available, but no dedicated Browser MCP action was exposed by tool search. A local headless Playwright smoke was run through `node_repl` against `http://127.0.0.1:5173/?ciPerf=1`.
- Linear: no callable Linear tool was exposed in this session. Plugin unavailable: Linear.
- Game Studio: used as browser-game scenario and budget reasoning guidance.
- Superpowers: used for planning, TDD discipline, and verification discipline.
- GitHub: used to inspect remote context and search open issues. No matching open issue was found for `performance lag optimization`; the first broader OR query was rejected by GitHub search limits.
- Sentry: no Sentry dependency/config or callable Sentry tool was available. Plugin unavailable: Sentry.
- CodeRabbit: `coderabbit` CLI was not installed. Plugin unavailable: CodeRabbit.
- HyperFrames by HeyGen: not used; core JSON/Markdown reports were prioritized.
- Codex Security: no callable security scan tool was exposed. A manual security/privacy pass was run against the new instrumentation/report paths.

## 4. Files Changed

Added:

- `src/services/performance/perfConfig.ts`
- `src/services/performance/perfLabels.ts`
- `src/services/performance/perfLogger.ts`
- `src/services/performance/perfReact.tsx`
- `src/services/performance/index.ts`
- `scripts/release/buildPerformanceBaselineReport.ts`
- `scripts/release/buildBundleInventory.ts`
- `tests/contracts/perfLoggerContract.test.ts`
- `tests/contracts/performanceBaselineReport.test.ts`
- `docs/release/performance_budget.md`
- `docs/release/performance_baseline_packet1_handoff.md`

Modified:

- `package.json`
- `src/main.tsx`
- `src/systems/gameLoop.ts`
- `src/stores/gameStore.ts`
- `src/stores/cultivationStore.ts`
- `src/services/cultivationService.ts`
- `src/stores/combatStore.ts`
- `src/services/save/SaveService.ts`
- `src/utils/saveload.ts`
- `src/content/loaders.ts`
- `src/stores/contentStore.ts`
- shell and exact owner components instrumented for render/surface timing
- generated release docs refreshed by baseline/build-audit preflight commands
- `docs/release/performance_smoke_checklist.md`

## 5. Commands Run

| Command | Result | Notes |
| --- | --- | --- |
| `npm run release:implementation-baseline:json` | pass | Pre-edit baseline verification; refreshed generated release docs. |
| `npm run release:runtime-content-manifest:json` | pass | Pre-edit content manifest verification. |
| `npm run typecheck` | pass | Pre-edit typecheck. |
| `npm run check:icons` | pass | Pre-edit icon guard. |
| `npm run test:contracts` | fail | Pre-existing broad failures outside this packet: scenic label city-map, status tone utils, and Pavilion manifest expectation in trial lifecycle. |
| `npm run release:build-audit:json` | pass with known warnings | Known warnings: stale Browserslist/caniuse-lite, unresolved `InsideDungeon.png`, chunks over 500KB. |
| `npm exec tsc -- --project tsconfig.tests.json` | pass | Compile after instrumentation. |
| `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/perfLoggerContract.test.js tmp-tests/tests/contracts/performanceBaselineReport.test.js` | pass | Focused tests for new perf utility and report script. |
| `npm run validate:content` | pass | Post-fix verification after separating React perf helpers from the non-React perf barrel. |
| `npm exec tsc -- --project tsconfig.progression-fixtures.json` | pass | Confirms progression fixture compile is not blocked by performance imports. |
| `npm run build` | pass with known warnings | Known warnings remain: stale Browserslist/caniuse-lite, unresolved `InsideDungeon.png`, chunks over 500KB. |
| `npm run release:performance-baseline` | pass | Generated `docs/release/performance_baseline_report.md` and JSON sidecar. |
| `npm run release:performance-baseline:json` | pass | JSON report is parseable and references the current `dist/assets/index-DEtiFykH.js` build. |
| `npm run release:bundle-inventory` | pass | Generated `docs/release/bundle_inventory.md` and JSON sidecar. |
| `npm run release:bundle-inventory:json` | pass | JSON inventory is parseable and references the current `dist/assets/index-DEtiFykH.js` build. |
| `npm run test:contracts` | fail | Reaches runtime tests and fails in pre-existing unrelated areas: scenic label city-map, status tone utils, Pavilion manifest expectations in trial lifecycle. |
| `npm run test` | fail | Blocked before assertions by Windows `TS5033` writes into `tmp-progression-fixtures`; standalone progression fixture compile passes. |
| `npm run release:gate -- --json` | fail / NO_GO | Content validation now passes; remaining blockers are pending manual fresh-run coverage and the full-suite `npm run test` blocker noted above. |
| Headless browser smoke via `node_repl`/Playwright | pass | `?ciPerf=1` booted, `window.__CI_PERF__` was present/enabled, and the exported snapshot contained counters without perf console spam. |
| Manual security/privacy scan | pass | New performance code exports aggregate timings/counters only; no save payload, raw localStorage, token, DSN, or secret export path was found. |

## 6. Metrics Now Available

- Game loop: rAF callbacks, total tick duration, delta duration, one-second interval jobs, autosave interval.
- Stores: `gameStore.tick` duration, Qi segment, HP regen segment, buff cleanup, cultivation consumable cleanup, progression diagnostics, set-call counter.
- Cultivation: service tick, Heart Law work, insight work, consumable modifiers, cultivation store hot actions.
- Combat: tick duration, medicine check, buff cleanup, resource regen, boss mechanics, technique AI, log append count, resolution duration.
- Saves: save request counts by reason, save total, gather, stringify, encryption, backup rotation, localStorage, load, migration.
- Content: load-all, per-file load labels, validation, normalization, content store publish.
- Surface builders: Gate Trial, Outskirts, Ruins, Apothecary, Forge, Manual Pavilion, Bounties, Expeditions, Techniques, Pavilion, Cultivation, Prestige.
- Renders: shell components and exact screen owners through `useRenderCounter` and `PerfProfiler`.
- Bundle/content inventory: runtime JSON sizes, source counts, dist chunks when present, dynamic import signals, visual runtime imports, localStorage writes, rAF and timer usages.
- Long tasks / long animation frames: captured when supported by browser `PerformanceObserver` and performance mode is enabled.

## 7. How To Enable Runtime Instrumentation

Instrumentation is disabled by default.

Enable in a browser by either:

- appending `?ciPerf=1` to the app URL, or
- running `localStorage.setItem('ci:perf:enabled', '1')` and reloading.

In scripts/tests, set `CI_PERF=1` or use the test-only config helper.

When enabled, the app exposes:

```ts
window.__CI_PERF__?.export();
window.__CI_PERF__?.reset();
window.__CI_PERF__?.startScenario('freshIdle');
window.__CI_PERF__?.endScenario('freshIdle');
window.__CI_PERF__?.markScenario('worldModal');
window.__CI_PERF__?.isEnabled();
```

The export is aggregated and sanitized. It does not include save payloads, localStorage values, tokens, DSNs, or raw player data.

## 8. How To Run Reports

```bash
npm run release:performance-baseline
npm run release:performance-baseline:json
npm run release:bundle-inventory
npm run release:bundle-inventory:json
```

Expected report paths after `--write` commands:

- `docs/release/performance_baseline_report.md`
- `docs/release/performance_baseline_report.json`
- `docs/release/bundle_inventory.md`
- `docs/release/bundle_inventory.json`

## 9. How To Run Scenarios

Manual Browser path:

1. Start the app with `npm run dev` or use preview after build.
2. Open the app with `?ciPerf=1`.
3. Confirm `window.__CI_PERF__?.isEnabled()` returns `true`.
4. Run one scenario from `docs/release/performance_budget.md`.
5. Call `window.__CI_PERF__?.export()`.
6. Save the snapshot as release evidence if the scenario was controlled and contains no private data.
7. Run `npm run release:performance-baseline:json` to regenerate the static baseline report.

Suggested scenario names:

- `freshIdle`
- `heartLawIdle`
- `worldModal`
- `activeCombat`
- `techniquesLibrary`
- `saveBurst`
- `startupInventory`

## 10. How To Interpret Results

Mega Prompt 1 is baseline-only. Bad metrics are expected and should be preserved as evidence. Use counts/sec and measured durations to decide later work:

- Mega Prompt 2 should reduce authoritative store publication from rAF cadence.
- Mega Prompt 3 should reduce shell rerenders and exact surface/signature churn.
- Mega Prompt 4 should reduce cultivation/combat hot-path write pressure.
- Mega Prompt 5 should reduce startup parse/eval and content/bundle load pressure.
- Mega Prompt 6 should convert proven budgets into gates.

## 11. Known Limitations

- Runtime scenarios are manual/documented in this packet; no brittle Playwright route fixture was added.
- Store write counts are local to instrumented actions and not a global Zustand middleware.
- The static script reports suspicious patterns; it does not classify every false positive perfectly.
- Current baseline numbers are not release blockers until later optimization prompts convert specific metrics into gates.
- Plugin evidence is documented from this session rather than embedded in the static script, which cannot query Codex plugin state.

## 12. Deferred Fixes For Later Mega Prompts

- Fixed-step SimulationScheduler and removal of authoritative gameplay publication from `requestAnimationFrame`.
- Selector cleanup for broad store subscriptions.
- Replace JSON/string owner signatures with semantic version counters or typed read models.
- Cultivation/combat publication cadence and no-op write cleanup.
- SaveScheduler and direct save burst reduction.
- Bundle/content split for optional exact screens and heavy records.
- Motion/Pixi/effect visibility gates.
- Performance regression gates after measured improvements land.

## 13. Next Prompt Recommendation

Proceed to Mega Prompt 2: fixed-step SimulationScheduler and removal of authoritative gameplay publication from `requestAnimationFrame`, using the new baseline labels and reports to compare before/after behavior.
