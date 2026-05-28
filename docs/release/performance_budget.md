# Cultivation Idle Performance Budget

## Purpose

These budgets are release guardrails for lag prevention. They are not balance, content, or visual-design targets. Mega Prompt 1 records the current baseline even when the numbers are bad; later optimization packets must use the same labels and scenarios to prove improvement.

## Current Known Lag Risks

- Frame-rate store mutation from authoritative gameplay ticks running from `requestAnimationFrame`.
- Broad Zustand subscriptions in persistent shell and screen components.
- `JSON.stringify` signatures in exact screen owners.
- Eager loading of large feature and visual runtime code.
- Heavy runtime content load, especially optional records content.
- Synchronous save gather, stringify, encryption, backup rotation, and localStorage writes.
- Motion, Pixi, and effect surfaces that may mount more broadly than the visible player surface.

## Baseline Scenarios

| Scenario | Purpose | Capture path |
| --- | --- | --- |
| Fresh idle cultivation, 30 seconds | Measure idle game-loop, cultivation, shell render, long-task, and long-frame pressure | Start with `?ciPerf=1`, call `window.__CI_PERF__.startScenario('freshIdle')`, wait, end, export |
| Heart Law selected idle, 30 seconds | Measure Heart Law comprehension, insight timer, cultivation store writes, and shell renders | Same browser export flow after selecting a safe Heart Law |
| World modal / exact screens sequence | Measure modal render, exact surface builder, signature, and chunk/load pressure | Open World, Outskirts, Gate Trial, Ruins, Apothecary, Forge, then export |
| Active combat, 30 seconds | Measure combat tick, log, HP publication, combat render, long-task, and long-frame pressure | Start reachable Outskirts or Gate Trial combat through UI, then export |
| Techniques library interaction | Measure loadout/library surface build and render pressure | Open Techniques, change a loadout/profile or inspect a detail modal |
| Save burst / event save sequence | Measure save request and synchronous save segment cost | Trigger representative save-producing UI events and export |
| Startup/content/build inventory | Measure static content size, source inventory, build chunks, and known warnings | Run `npm run release:performance-baseline:json` and `npm run release:bundle-inventory:json` |

## Budgets

| Budget area | Target | Measurement |
| --- | --- | --- |
| Idle React commits | No global shell component should commit at requestAnimationFrame cadence while idle | Render counter + React Profiler |
| Idle store writes | Core stores should not write more than planned cadence after refactor; for current baseline, record actual writes without failing | Perf logger instrumentation |
| Active combat UI publication | Future target 100-250ms snapshot cadence; current baseline records actual frame-rate behavior | Combat scenario |
| Long tasks / LoAF | No common interaction should create >50ms long tasks or long animation frames in optimized state; current baseline records actual count | PerformanceObserver + Browser/Playwright trace |
| Interaction response | Aim for common UI interaction response under 200ms in optimized state | Browser/Playwright trace |
| Frame work | Aim for JS work below about 3-4ms inside animation frames after optimization | Browser performance traces |
| Tab switch | Under 100ms scripting for common tab switches after chunks are loaded | Browser scenario |
| World modal open | Under 150ms scripting after chunks are loaded | World modal scenario |
| Initial chunks | No unexpected initial app chunk over 500KB uncompressed; heavy features lazy | Vite build stats |
| Content startup | Core startup should avoid heavy optional records after future content split; current baseline records actual content load | Content load timing |
| Save cost | No repeated direct save bursts after future scheduler; current baseline records actual repeated saves | Save instrumentation |
| Visual effects | Only one active scenic/effect owner after future gating; current baseline inventories effect owners | DOM/canvas/static audit |

## What Is Not A Failure In Mega Prompt 1

The current baseline is expected to show bad numbers. Frame-rate `GameLoop` ticks, shell commits, broad store subscriptions, large chunks, large content files, synchronous saves, and exact surface rebuild pressure are baseline evidence in this packet. Do not hide or gate on those numbers yet.

## What Becomes A Failure After Later Prompts

- Frame-rate global store writes after the scheduler refactor.
- Bare full-store component subscriptions after selector cleanup.
- `JSON.stringify` owner signatures after surface-builder cleanup.
- Direct save bursts after a SaveScheduler lands.
- Eager initial loading of optional exact screens after bundle/content split.
- Unbounded performance buffers, console spam, or debug exports enabled by default.

## How To Update Budgets

Update budgets only with measured evidence from the repo-native report, Browser/Playwright snapshots, or release traces. Do not weaken budgets silently. Any waiver must name the scenario, metric, reason, owner, expiry condition, and follow-up packet.
