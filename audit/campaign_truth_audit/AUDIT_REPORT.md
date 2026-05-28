# Cultivation Idle Campaign Truth Audit

Date: 2026-05-28
Branch: codex/perf-packet-3-selector-surface-cleanup
Commit inspected: 8a06616eeb177837f6db98702b648f89a3a6d2b2
Mode: audit only

## 1. Executive verdict

Not ready for story tutorial or final menu polish.

The narrow source-truth contracts are in better shape than the old hypotheses suggested: focused compiled tests passed for selectedPath path truth, first gate reward and breakthrough consumption parity, city unlock synchronization, prestige reset orchestration, offline eight-hour behavior, and prestige runtime catalog visibility. However, the current release and campaign-readiness evidence is not clean:

- `npm run release:gate:json` returned NO_GO with 5 unresolved blockers, 1 pending manual item, and 6 unaccepted waiver candidates.
- `npm run release:fresh-run-report:json` returned releaseReady=false because the automated normal route stopped at Soul Formation instead of the expected Spirit Severing content cap.
- `npm run balance:report:json`, `npm run release:route-report:json`, and `npm run release:reclaim-route-report` all failed at `Timing probe ended without milestone: foundation_entry`.
- Fresh browser playthrough showed the game accrues Qi and can show Breakthrough Ready before life identity is complete, and the life-start wizard can block navigation until exact card/finish interactions are found.
- Full contract suite execution is blocked by the existing Windows fixture emission failure in `tmp-progression-fixtures`.

Story/tutorial work would currently have to teach around uncertain campaign timing, release-gate NO_GO state, and first-run UX friction.

## 2. What was tested

- Repo instructions, package scripts, build/test configs, release scripts, and dirty git state.
- Typecheck, icon check, content validation, production build, npm audit, release gate, fresh-run report, runtime diagnostics, runtime content manifest, implementation baseline, prestige runtime audit, offline route report, route/reclaim/balance reports, broad contract runner, and direct high-signal compiled contract tests.
- Static source scans for path truth, gate item truth, city unlocks, ruins reachability, prestige reset, offline catchup, test-speed/debug markers, unsafe rendering, and UI terminology.
- Content summaries for authored cities, trials, modules, ruins, gate items, and prestige upgrades.
- Browser runtime through the Codex in-app browser and Playwright fresh contexts.
- Fresh-save first-run screenshots for intro, path selection, Heart Law selection, breath focus, finished life-start, Status ledger, and attempted main-tab traversal.
- GitHub connector checks for open PRs, recent PRs, issue search, and workflow runs for the inspected HEAD.
- Local security audit via `npm audit` and source searches.

## 3. What could not be tested

- Sentry production issue data: connector/tooling was unavailable and required env vars were not present.
- Linear backlog deduplication: no Linear MCP tool was exposed in this session.
- CodeRabbit secondary review: CLI/tooling was unavailable locally.
- Full menu/module screenshots after a clean fresh completion were only partially captured. The fresh wizard consumed much of the browser budget and main-tab clicks repeatedly failed under the wizard/ledger state. Screenshots and raw logs are still included.
- Full first prestige and second-life runtime playthrough were not completed manually. Focused reset tests and release reports were used instead.
- HyperFrames video summary was skipped because core audit deliverables were the priority.

## 4. Current critical path map

Fresh save starts on Cultivation with no selected path and an intro story card. Skipping the intro opens the life-start path overlay. Selecting Heaven updates the public Path seal and increases Qi rate, then shows the Heart Law step. Clicking the selected Heart Law card enables Next, then the Breath Focus step appears. Clicking the selected breath card exposes Finish. After Finish, the save records path, Heart Law, and breath, and a notification says the life begins.

While this happens, the underlying cultivation loop remains live: Qi accrues, Breakthrough can become Ready, and the nav remains visible beneath the modal. This is a first-run truth problem, not just polish.

## 5. Contract results

### Life/path truth

Status: mostly fixed in current build, with first-run UX caveat.

Evidence:
- `src/stores/gameStore.ts:296` writes canonical `selectedPath` once and recalculates derived values.
- Direct compiled `p0ProgressionTruth.test.js` passed selectedPath and legacy lifePath migration assertions.
- Browser screenshot `SS-033-after-heaven-path-select.png` shows Path changed to Heaven and Qi rate increased.

Risk:
- Fresh save starts accumulating Qi before life-start is complete, and Breakthrough can be Ready before Heart Law/Breath are locked.

### Gate/trial/breakthrough truth

Status: likely fixed for core contract; broad lifecycle suite still has a fixture/content-loading failure.

Evidence:
- `src/stores/gameStore.ts:471` uses `getGateTransitionItemIdForRealmIndex(...)` for breakthrough consumption.
- `src/systems/progression/runtime/trialLifecycle.ts:107` maps trials through the progression contract and returns `gateItemId`.
- Direct compiled P0 tests passed entry-without-proof, clear-grants-consumed-item, and fail-safe parity checks.
- `npm run release:gate:json` still warns about legacy gate namespace references in runtime-adjacent files.

### City progression and ruins

Status: authored and contract-tested, but full runtime route still not release-clean.

Evidence:
- Content has 5 cities and each city exposes `outskirts, ruins, gateTrial, manualPavilion, apothecary, forge, bounties, expeditions`.
- City unlocks are authored by `unlockMajorRealm`: Qi Condensation, Foundation Establishment, Core Formation, Nascent Soul, Soul Formation.
- `src/stores/cityStore.ts:252` syncs city state on realm entry.
- `cityUnlockRuntime.test.js` passed Foundation unlock and no fake city six assertions.
- Fresh-run report reached all five cities but did not reach Spirit Severing content cap.

### Prestige/reset

Status: focused reset truth passes; release gate still tracks partial reset warning candidates.

Evidence:
- `src/services/prestige/PrestigeResetService.ts:108` resets game run, cultivation, inventory, equipment, trials, ruins, zones, outskirts, bounties, activity, manuals, tech collection, professions, expeditions, crafting, combat, and city baseline.
- `prestigeResetRuntime.test.js` passed.
- `release:prestige-runtime-audit:json` found 27 upgrades, 11 visible live, 5 deferred, 11 hidden unsupported, with no blockers.

### Offline/save/load

Status: focused offline behavior passes; old helper surfaces remain.

Evidence:
- `src/services/time/OfflineCatchup.ts:97` is the live mutating catchup path.
- `src/systems/offline.ts:21` explicitly says legacy helpers must delegate and not mutate queue, expedition, combat, or Qi themselves.
- `offlineEightHourReturn.test.js` passed no-combat and no-double-apply assertions.
- In-app browser existing save showed offline summary capped at 12 hours and "Combat never progresses while offline."

## 6. Balance and pacing

Measurement is blocked by current probe failures. `balance:report:json`, `release:route-report:json`, and `release:reclaim-route-report` all failed before Foundation entry. That means the current run cannot claim reliable first-gate, first-prestige, or second-life pacing measurements from the automated balance harness.

The browser fresh start also shows very fast early Qi: after a few seconds the player can exceed the first 100 Qi cap before life-start is complete. This may be intentional test-speed scaffolding, but it should be decided explicitly before story/tutorial writing.

## 7. UI and screenshot findings

Screenshot artifacts are under `audit/campaign_truth_audit/screenshots/`.

Confirmed UI risks:
- Fresh save shows active Cultivation, Qi gain, Break Through, and nav under the intro and life-start wizard.
- The Heart Law and Breath steps require clicking already-selected cards before Next/Finish affordances become usable; this is discoverability friction.
- Main-tab capture after fresh completion repeatedly stayed on/near the Status ledger or was blocked by the wizard state in automation, which indicates fragile first-run navigation and modal layering.
- The in-app browser existing save showed migration warnings and offline summary on load, useful for diagnostics but not a clean first-player experience.

Positive UI notes:
- Status V3 ledger exists and answers current goal, bottleneck, mission requirements, safety net, build/prep, and current work in concrete game language.
- Fresh path selection is visually strong and preserves cultivation identity language.

## 8. Test/build/CI results

Passing:
- `npm run typecheck`
- `npm run check:icons`
- `npm run validate:content`
- `npm run build`
- `npm exec tsc -- --project tsconfig.tests.json`
- `npm run release:runtime-diagnostics:json`
- `npm run release:runtime-content-manifest:json`
- `npm run release:implementation-baseline:json`
- `npm run release:prestige-runtime-audit:json`
- `npm run release:offline-route-report`
- Direct compiled P0/city/prestige/offline/prestige-catalog tests: 26 of 29 passed; the 3 failures were in `trialLifecycle.test.js` content fixture setup.

Failing or NO_GO:
- `npm run test:contracts`
- Direct `trialLifecycle.test.js` cases fail with `[PavilionContent] manifest root must be an object`.
- `npm run release:fresh-run-report:json`
- `npm run balance:report:json`
- `npm run release:route-report:json`
- `npm run release:reclaim-route-report`
- `npm run release:gate:json`
- `npm audit --audit-level=moderate --json`

## 9. Plugin findings

- Browser: used. Captured in-app DOM state and Playwright screenshots.
- GitHub: used. Found 10 open PRs, no workflow runs for current HEAD, no matching open issues from the broad search.
- Linear: unavailable in this session.
- Sentry: unavailable; env vars were absent.
- CodeRabbit: unavailable locally.
- Codex Security: local security scan performed with npm audit and source searches; connector-specific deep scan was not exposed.
- Game Studio and Superpowers: used as audit structure and playtest framing, not as behavior-changing implementation.
- HyperFrames: skipped.

## 10. Top blockers

1. Release gate is NO_GO.
2. Automated fresh-run does not reach expected content cap.
3. Timing/balance/reclaim probes fail before Foundation entry.
4. Full contract suite is blocked by fixture write failures.
5. First-run identity wizard allows live Qi progression and Breakthrough Ready before identity is complete.

## 11. Recommended fix order

1. CI-P0-READINESS-GATES: make release/fresh-run/balance probes deterministic and green or explicitly waive with evidence.
2. CI-P0-LIFESTART-TRUTH: freeze foreground progression until path, Heart Law, and breath are completed, and make Finish/Next affordances unambiguous.
3. CI-P0-TESTS: repair Windows fixture emission and standalone trial lifecycle fixture loading.
4. CI-P0-CAP-ROUTE: resolve why normal fresh-run stops at Soul Formation instead of Spirit Severing.
5. CI-P1-UI-RUNTIME-SMOKE: add a stable fresh-save browser traversal for every main screen and core module.
6. CI-P1-BALANCE-HARNESS: restore timing probes and then set first-gate/first-prestige target ranges.
7. CI-P1-SECURITY-DEPS: update vulnerable dev/build dependencies after compatibility check.

## 12. Open design decisions

- Should a new life accrue Qi before identity is complete, or should ActivityStore/cultivation be paused behind life-start?
- Is the current expected content cap Spirit Severing, or should fresh-run expectations be lowered to Soul Formation until the next slice is wired?
- Are runtime content validation warnings in the browser console intended player-dev noise, or should they be hidden behind diagnostics in dev?
- Should first-run Heart Law and Breath default choices be automatically accepted, or should the user explicitly confirm with clearer buttons?

## 13. Appendix

Raw command and browser evidence is in:

- `COMMAND_LOG.md`
- `PLUGIN_LOG.md`
- `SCREENSHOT_INDEX.md`
- `BALANCE_MEASUREMENTS.md`
- `SECURITY_AUDIT.md`
- `raw/*.txt`
- `raw/*.json`
- `screenshots/*.png`
