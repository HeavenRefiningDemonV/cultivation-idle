# Dao Mandate V2-10 Prestige Silence Evidence

## Scope
- Packet: V2-10 - Prestige silence rule.
- Goal: Remove unrelated live-run route context from Prestige and show reincarnation counsel only when relevant.
- Non-goals honored: no AP rebalance, no reset mechanics rewrite, no Gate Trial readiness migration, no Status/Cultivation/local-lens changes.

## Previous packet preflight
- V2-0: PASS - `AGENTS.md` exists with Dao Mandate V2 guardrails, `docs/release/dao_mandate_v2_test_inventory.md` exists, and the inventory records stale route-led assumptions without requiring production UI/gameplay changes.
- V2-1: PASS - projection types/builders/fixtures/contracts exist; evidence doc read; focused previous-packet suite passed with the repo loader.
- V2-2: PASS - `daoOmenCopy.ts`, `daoOmenPriority.ts`, direct-route eligibility, and copy guard contracts exist and passed in the focused previous-packet suite.
- V2-3: PASS - guidance retirement/settings migration contract exists and passed in the focused previous-packet suite.
- V2-4: PASS - shared Omen UI component contract exists and passed in the focused previous-packet suite.
- V2-5: PASS - Status V2 layout contract exists and passed in the focused previous-packet suite.
- V2-6: PASS - Cultivation compact omen contract exists and passed in the focused previous-packet suite.
- V2-7: PASS - Gate Trial detail ownership evidence/contract exists and passed in the focused previous-packet suite.
- V2-8: PASS - local quiet rule evidence/contract exists and passed in the focused previous-packet suite.
- V2-9: PASS - module source drawer evidence/source-sink contract exists and passed in the focused previous-packet suite.
- Dirty preflight state: `git status --short` was already dirty before V2-10, including V2-7/V2-9 evidence and many non-Prestige source/test/tmp-progression files. Prestige exact production files were not dirty before this packet.
- Preflight command note: raw `node --test tests/contracts/...` failed with `ERR_MODULE_NOT_FOUND` because TypeScript tests use `.js` specifiers. The repo loader form was used instead and passed: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/...`.

## Files changed
- `src/features/prestige/prestigeLedgerExact/PrestigeLedgerScreenOwner.tsx`
- `src/features/prestige/prestigeLedgerExact/buildPrestigeLedgerExactSurface.ts`
- `src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.tsx`
- `src/features/prestige/prestigeLedgerExact/prestigeLedgerExactTypes.ts`
- `src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.scss`
- `tests/contracts/prestigeSilenceRule.test.ts`
- `tests/contracts/prestigeScreenHonesty.test.ts`
- `tests/contracts/prestigeLedgerExactSurface.test.ts`
- `tests/integration/runCompassV2ScreenAgreement.test.ts`
- `docs/release/qa/ui-cutover/prestige-v2-10/prestige-v2-10-fixture.png`
- `docs/release/qa/ui-cutover/prestige-v2-10/prestige-v2-10-browser-smoke.json`
- `docs/release/qa/ui-cutover/prestige-v2-10/prestige-v2-10-live.png`
- `docs/release/qa/ui-cutover/prestige-v2-10/prestige-v2-10-live-browser-smoke.json`
- `docs/release/dao_mandate_v2_10_prestige_silence_evidence.md`

## Prestige silence result
- `useRunCompassSurface`: removed from `PrestigeLedgerScreenOwner.tsx`.
- `runCompassHint`: removed from owner input, live input type, public surface type, builder return, and screen render path.
- `Primary Route`: absent from production Prestige screen source and visual smoke.
- `Mandate Context`: absent from production Prestige screen source and visual smoke.
- Too-early state: no live-run route ribbon; locked ritual remains expressed through Reincarnation-owned decree/ledger fields.
- Viable/recommended/cap: Prestige-owned counsel only through decree, AP forecast, reset contract, receipt rows, and reclaim forecast.

## State behavior
### Too Early
- Contract coverage confirms `meta.advisorState` can be `Too Early`, `reincarnationDecree.sealState` is locked, the primary ritual action is disabled as `Reincarnation Locked`, and too-early reason text remains in `reincarnationDecree` or `currentLifeLedger`.
- No current-run room command or raw route-board label is rendered from Prestige.

### Viable
- Existing advisor/forecast/reset contracts remain green.
- Prestige keeps viability as an outer-loop ledger choice through Reincarnation Decree, AP forecast, reset/carry truth, and recommended decree rows.

### Recommended / cap
- Contract coverage confirms recommended/cap surfaces serialize without `Primary Route` or `Mandate Context` and preserve Reincarnation-owned handoff language.
- Content-cap handling remains in Prestige-owned decree/forecast/reset fields, not a raw Run Compass route card.

### Post-reset reclaim
- The post-reset reclaim objective render path was preserved.
- The removed route ribbon was separate from `postResetReclaimObjective`; no `Primary Route` label is introduced there.

## Tests added/updated
- Added `tests/contracts/prestigeSilenceRule.test.ts`.
- Updated `tests/contracts/prestigeScreenHonesty.test.ts` to keep Prestige framed as a reincarnation ledger and reject route-board public copy.
- Updated `tests/contracts/prestigeLedgerExactSurface.test.ts` for the deleted `runCompassHint` field and too-early/recommended surface coverage.
- Updated `tests/integration/runCompassV2ScreenAgreement.test.ts` so Status/Cultivation may continue to consume Run Compass while Prestige remains route-silent.

## Commands run
- `git status --short` - PASS; dirty tree was present before V2-10.
- `Get-Content AGENTS.md` and `Get-Content docs/release/dao_mandate_v2_test_inventory.md` - PASS.
- `npm exec tsc -- --project tsconfig.tests.json` - PASS during preflight, PASS after implementation.
- Raw `node --test tests/contracts/...` previous-packet command - FAIL, environment/runner mismatch (`ERR_MODULE_NOT_FOUND` on TS `.js` specifiers).
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoOmenProjectionContract.test.js tmp-tests/tests/contracts/daoOmenDirectRouteEligibility.test.js tmp-tests/tests/contracts/daoOmenCopyGuard.test.js tmp-tests/tests/contracts/settingsGuidanceRetirement.test.js tmp-tests/tests/contracts/daoOmenSharedComponentsContract.test.js tmp-tests/tests/contracts/statusV2LayoutContract.test.js tmp-tests/tests/contracts/cultivationCompactOmenContract.test.js tmp-tests/tests/contracts/gateTrialDetailOwnershipContract.test.js tmp-tests/tests/contracts/localOmenLensQuietIsSilent.test.js tmp-tests/tests/contracts/daoMandateProductionModuleSourceSinkSurfaces.test.js` - PASS, 74/74.
- Red-stage `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/prestigeSilenceRule.test.js tmp-tests/tests/contracts/prestigeScreenHonesty.test.js tmp-tests/tests/contracts/prestigeLedgerExactSurface.test.js` - FAIL as expected before production edits because the old `runCompassHint` route path still existed.
- `npm run typecheck` - PASS.
- `npm run check:icons` - PASS.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/prestigeSilenceRule.test.js tmp-tests/tests/contracts/prestigeScreenHonesty.test.js tmp-tests/tests/contracts/prestigeLedgerExactSurface.test.js tmp-tests/tests/contracts/prestigeAdvisorSurface.test.js tmp-tests/tests/contracts/prestigeForecastSurfaceV2.test.js tmp-tests/tests/contracts/prestigeResetPreviewMatchesService.test.js tmp-tests/tests/contracts/prestigeRuntimeEffectAudit.test.js tmp-tests/tests/contracts/daoMandateReincarnationCounselContract.test.js tmp-tests/tests/contracts/statusV2LayoutContract.test.js tmp-tests/tests/contracts/localOmenLensQuietIsSilent.test.js tmp-tests/tests/contracts/daoMandateProductionModuleSourceSinkSurfaces.test.js tmp-tests/tests/integration/runCompassV2ScreenAgreement.test.js` - PASS, 51/51. Non-failing warning: `[Prestige] Game store getter not initialized`.
- `npm run validate:content` - PASS.
- `npm run build` - PASS. Existing warnings: outdated Browserslist data, unresolved `../../assets/background/InsideDungeon.png` left for runtime, and chunk size warning.
- `npm run test:contracts` - FAIL, broad-suite debt outside V2-10. Examples seen: `scenicLabelCityMapHubContract.test.js` missing `CITY_MAP_HUB_SCENIC_LABEL_VARIANT = 'building' as const`; `statusToneUtils.test.js` expected `locked` but got `route`; `trialLifecycle.test.js` failed on `[PavilionContent] manifest root must be an object`.
- `npm run test` - FAIL, broad-suite debt outside V2-10. Examples seen in tail: missing generated Ruins exact mockup/progress files, Ruins FX tier expectation, and other non-Prestige exact/generated-source failures.
- `npm run progression:report` - PASS with existing warnings: `GATE_NAMESPACE_SPLIT`, `OFFLINE_PIPELINE_SPLIT`, `HIDDEN_PRESTIGE_RUNTIME_CONSUMER`, `PARTIAL_PRESTIGE_RESET`.
- `npm run release:gate -- --json` - FAIL/TIMEOUT after 244s; full release remains NO_GO.

## Browser / visual QA
- Browser plugin/tool was not exposed in this turn, so Playwright fallback was used.
- Dev server command: `npm run dev -- --host 127.0.0.1 --port 5200`; port 5200 was already occupied, Vite started on `http://127.0.0.1:5201/`.
- Fixture route: `http://127.0.0.1:5201/?uiAudit=phase-0&surface=prestige&slot=base&fx=high&controls=0&prestigeLedgerMode=fixture`.
  - PASS. `routeRibbonCount: 0`; no `Primary Route`, `Mandate Context`, `Run Compass`, `Best Next Action`, `Biggest Shortfall`, ordinary room commands, or `Mandate points elsewhere`.
  - Required text found: `Reincarnation Ledger`, `Reincarnation Decree`, `Current Life Ledger`, `Reset Contract`, `Next Life Preview`, `Reclaim Forecast`, `Recommended Decrees`.
  - Screenshot: `docs/release/qa/ui-cutover/prestige-v2-10/prestige-v2-10-fixture.png`.
- Live route: `http://127.0.0.1:5201/?uiAudit=phase-0&surface=prestige&slot=base&fx=high&controls=0`.
  - PASS. `routeRibbonCount: 0`; no forbidden route-board copy.
  - Required ledger text found.
  - Screenshot: `docs/release/qa/ui-cutover/prestige-v2-10/prestige-v2-10-live.png`.
- The V2-10 dev server process was stopped after the Playwright smoke. The pre-existing 5200 listener was left untouched.

## Plugin usage
- Browser: not callable/exposed; Playwright fallback used.
- Linear: not used; no Linear tool was exposed for this turn.
- Game Studio: not used; no gameplay mechanics were changed.
- Superpowers: used for TDD and verification workflow.
- GitHub: not used; no GitHub connector action was needed for local implementation.
- Sentry: not used; no Sentry tool was exposed for this turn.
- CodeRabbit: not used; no CodeRabbit review tool was exposed for this turn.
- HyperFrames: not used; video proof was not required.
- Codex Security: not used as a plugin; manual static mutation scans were run.

## Static scans
- `rg -n "Primary Route|Mandate Context|prestigeLedgerRunCompass|surface\.runCompassHint|runCompassHint|useRunCompassSurface" src\features\prestige` - PASS, no production Prestige matches.
- `rg -n "Best Next Action|Biggest Shortfall|Run Compass|Open Apothecary|Open Forge|Tune Techniques|Cultivate Qi|Attempt Gate|Mandate points elsewhere" src\features\prestige` - PASS, no production Prestige matches.
- `rg -n "RewardService|grantRewards|spendCurrency|performPrestige|performPrestigeReset|resetForNewLife|startCombat|recordFailure|markCleared|markBypassed" src\features\prestige\prestigeLedgerExact\PrestigeLedgerExactScreen.tsx` - PASS, no pure-screen mutation matches.
- Broader scans over docs/tests only found guard assertions, historical evidence, or generated QA cache references; production Prestige source was clean.

## Known failures / NO_GO risks
- Broad contract and broad test suites remain red from existing non-V2-10 repo debt.
- `npm run release:gate -- --json` timed out after 244s.
- The repo had extensive dirty/untracked files before V2-10; unrelated files were not reverted or normalized.
- Full release remains NO_GO until broad-suite and release-gate blockers are resolved or explicitly waived.

## Acceptance result
- V2-10 targeted acceptance: GO.
- Full release: NO_GO.
