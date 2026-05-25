# Dao Mandate V2-9 Module-local Source Drawers Evidence

## Scope
- Packet: V2-9 - Module-local source drawers and role stamps.
- Goal: Wire source provenance locally without turning Status into a source map.
- Non-goals honored: no Status source-map cutover, no V2-10 Prestige silence work, no new economy/content/reward tables, no gameplay mutation from shared source UI, no Gate Trial readiness ownership move.

## Previous packet preflight
- V2-0: GO. Root `AGENTS.md` and `docs/release/dao_mandate_v2_test_inventory.md` were present with Dao Mandate V2 guardrails and stale-test inventory.
- V2-1: GO. Omen Projection types, builder, fixtures, exports, and projection contract were present and focused regression passed.
- V2-2: GO. Direct-route and copy guard artifacts were present; ordinary pressure routes stayed suppressed in focused regression.
- V2-3: GO. Guidance Oath retirement evidence and compatibility-only profile behavior were present; focused settings regression passed.
- V2-4: GO. Shared Omen/source components were present and pure-render contract passed.
- V2-5: GO. Status V2 evidence existed and `statusV2LayoutContract.test.ts` passed.
- V2-6: GO. Cultivation compact Omen evidence existed and focused contract passed.
- V2-7: GO. Gate Trial detail ownership evidence/test existed and focused contract passed.
- V2-8: GO. Local Omen Lens evidence/test existed; quiet/null behavior passed focused regression.
- Repairs made during preflight: none to previous packets. During Browser QA, V2-9 repaired Techniques local copy from solved-next-action wording to gap/evidence wording.
- Decision: GO_FOR_V2_9 targeted base.

## Files changed
- Production: `src/systems/ui/daoMandate/daoMandateSourceMap.ts`, `src/systems/ui/daoMandate/daoMandateLedger.ts`, `src/systems/economy/purposeSourceSurface.ts`, `src/ui/daoMandate/ModuleSourceSinkPanel.tsx`, `src/ui/daoMandate/SourceRouteSlip.tsx`, `src/features/professions/forgeExact/ForgeExactScreen.tsx`, `src/features/world/bountiesExact/BountiesExactScreen.tsx`, `src/features/techniquesExact/TechniquesExactScreen.tsx`, `src/features/techniquesExact/buildTechniquesExactSurface.ts`, `src/features/techniquesExact/techniquesExactPresentation.ts`, `src/features/techniquesExact/techniquesExactTypes.ts`.
- Tests: `tests/contracts/daoMandateProductionModuleSourceSinkSurfaces.test.ts`, `tests/contracts/daoMandateSourceMapContract.test.ts`.
- Evidence: `docs/release/dao_mandate_v2_9_module_source_drawers_evidence.md`, `docs/release/qa/ui-cutover/modules/after/v2-9-browser-observations.json`.

## Shared source/provenance architecture
- Source map adapter changes: module source/sink projection no longer re-applies legacy `sealed`/`elder`/`jade` profile filtering; records support is not gated by old profile names; quiet/no-primary projections return `null`.
- Module projection changes: preserved existing shared `buildLiveDaoMandateModuleSourceSinkProjection` wiring already present in Apothecary, Forge, Manual Pavilion, Techniques, Bounties, Expeditions, and Records builders.
- Shared UI changes: `ModuleSourceSinkPanel` now hides quiet surfaces and maps raw relation keys to player-safe stamps: Relevant source, Supporting source, Locked source, Proof sealed.
- Route action handling: `SourceRouteSlip` fallback detail now follows explicit `variant="expanded"` instead of legacy `profile="jade"`.
- Quiet/null handling: `ModuleSourceSinkPanel` and source-map contracts assert null/quiet surfaces stay silent.

## Module results
### Apothecary
- Source/provenance behavior: existing shared projection wiring retained; panel title remains local as `Medicine reserve`; Browser confirmed the exact room preserved buy/brew/pouch/prescription job and no forbidden route-board copy.
- Status/quiet guardrails: current early Browser state rendered no shared panel, consistent with quiet/null hiding.

### Forge
- Source/provenance behavior: existing shared projection wiring retained; panel title changed to `Forge floor`; Browser confirmed floor, material inspector, refine/temper/rune controls, and local source buttons stayed room-owned.
- Status/quiet guardrails: no source-map panel or solved-victory copy appeared in Status or Forge Browser snapshots.

### Manual Pavilion
- Source/provenance behavior: existing shared projection wiring retained; panel title remains `Doctrine source`.
- Doctrine tag behavior: contract verifies local panel placement and no solved-build/route-board titles. Browser exact-room confirmation was partial due overlay state.
- Status/quiet guardrails: Status regression contract and Browser Status pass held.

### Techniques
- Source/provenance behavior: existing shared projection wiring retained; panel title remains `Doctrine expression`.
- Doctrine/loadout gap behavior: Browser found solved-next-action risk. Production copy now uses `Loadout gap signal`, `Observed Gap`, and `empty technique slot`.
- Status/quiet guardrails: focused V2-9 test now blocks `Best next loadout fix`, `Recommended Action`, and `Best build solved`.

### Bounties
- Source/provenance behavior: existing shared projection wiring retained; panel title changed to `Merit reserve`.
- Support-fit behavior: contract keeps Bounties on shared source/sink projection; Browser World inspector kept role metadata non-prescriptive.
- Status/quiet guardrails: no default Status route command added.

### Expeditions
- Source/provenance behavior: existing shared projection wiring retained; panel title remains `Background support`.
- Passive support behavior: contract keeps Expeditions on shared source/sink projection; Browser World inspector kept support metadata non-prescriptive.
- Status/quiet guardrails: no `No expedition overlap` or quiet negative filler was visible.

### Inventory
- Purpose/source behavior: currency and item purpose surfaces now use local provenance wording such as `Reserve` and `Known source/refill source`.
- Conservative tags: safe-sell/discard advice was not added; `Sellable` remains absent from the V2-9 purpose-source assertions.
- Status/quiet guardrails: Browser Inventory showed local currency provenance, not a Status clone.

## Tests added/updated
- Test file: `tests/contracts/daoMandateProductionModuleSourceSinkSurfaces.test.ts`
- What it proves: production exact builders/screens consume shared projection, local panel titles are non-route-boarded, relation stamps are human-safe, quiet panel renders null, fallback detail is explicit-variant based, Inventory tags are conservative, Techniques copy is gap/evidence framed, and shared source UI does not mutate gameplay.
- Test file: `tests/contracts/daoMandateSourceMapContract.test.ts`
- What it proves: source rows use provenance proof copy, module surfaces stay local, and legacy Guidance Oath profile names do not affect source/sink visibility.

## Commands run
- Command: `npm exec tsc -- --project tsconfig.tests.json`
- Result: PASS
- Notes: Compiled test TS to `tmp-tests` for loader-based node tests.
- Command: `npm run typecheck`
- Result: PASS
- Notes: Also rerun through `npm run build`.
- Command: `npm run check:icons`
- Result: PASS
- Notes: No emoji icon usage found.
- Command: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoMandateSourceMapContract.test.js`
- Result: PASS, 5 tests.
- Notes: V2-9 source-map hardening.
- Command: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoMandateSourceMapVisibility.test.js`
- Result: PASS, 3 tests.
- Notes: Source detail setting remains explicit.
- Command: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoMandateProductionModuleSourceSinkSurfaces.test.js`
- Result: PASS, 12 tests after Techniques copy repair.
- Notes: Main V2-9 contract.
- Command: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/localOmenLensQuietIsSilent.test.js`
- Result: PASS, 5 tests.
- Notes: V2-8 quiet non-regression.
- Command: `node --test tests/contracts/statusV2LayoutContract.test.ts`
- Result: PASS, 3 tests.
- Notes: Status sparse non-regression.
- Command: V2-1 through V2-8 focused regressions (`daoOmenProjectionContract`, `daoOmenDirectRouteEligibility`, `daoOmenCopyGuard`, `settingsGuidanceRetirement`, `daoOmenSharedComponentsContract`, `cultivationCompactOmenContract`, `gateTrialDetailOwnershipContract`)
- Result: PASS
- Notes: Each focused regression passed with the project loader where needed.
- Command: `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/TechniquesExactSurface.fixture.test.js`
- Result: PASS, 1 test.
- Notes: Techniques copy repair did not break fixture anatomy.
- Command: `npm run validate:content`
- Result: PASS
- Notes: Content validation passed.
- Command: `npm run build`
- Result: PASS with existing warnings.
- Notes: Warnings were stale Browserslist data, unresolved `../../assets/background/InsideDungeon.png`, and large chunk size.
- Command: `npm run test:contracts`
- Result: FAIL
- Notes: Broad suite remains red in unrelated existing contract areas: menu identity overlay, exact CTA token contracts, WorldModuleCard slot contracts, Outskirts exact ownership, combat exact/theater overlays, Ruins exact contracts, CityMapHub ScenicLabel contract, `statusToneUtils`, and `trialLifecycle`/PavilionContent fixture validation.

## Browser / visual QA
- Tool used: Browser plugin against dev server `http://127.0.0.1:5179/`.
- Routes/screens checked: Status, World, Apothecary, Forge, Techniques, Inventory; Manual Pavilion/Bounties/Expeditions exact-room checks were partial.
- Observation artifact: `docs/release/qa/ui-cutover/modules/after/v2-9-browser-observations.json`.
- Findings: Status remained sparse; World avoided quiet negative copy; Apothecary/Forge preserved room jobs; Inventory purpose/source tags were visible; Techniques solved-next-action copy was found and repaired. Reduced-motion visual verification was not completed.

## Plugin usage
- Browser: Used for local visual QA.
- Linear: Not used; no connected issue context was required to complete the patch.
- Game Studio: Not used; no callable game-feel review was run.
- Superpowers: Used for planning/TDD/verification workflow discipline.
- GitHub: Not used; no PR/CI context was requested or needed.
- Sentry: Not used; no connected Sentry issue context was needed.
- CodeRabbit: Not used; no CodeRabbit review run was completed in this turn.
- HyperFrames: Not used; optional video evidence was not created.
- Codex Security: Plugin scan not run; equivalent targeted static scans checked shared source UI for gameplay mutation and unsafe source-map regressions.

## Static scans
- Forbidden-copy scan: PASS for V2-9 reachable source surfaces. Allowed source matches were guard/blocklist constants in `daoOmenCopy`, `daoMandateRecentOmens`, and `daoMandateUiFormatters`, a legacy non-default `MandateChamberHero`, V2-10 Prestige `Primary Route` debt, `combatExactPattern` future-packet metadata, and a legacy packet comment in `VerseProgressMiniBar`.
- Gameplay-mutation scan: PASS for `src/ui/daoMandate` and `src/systems/ui/daoMandate`; no shared source/provenance UI mutation matches.
- Status regression scan: PASS for `ModuleSourceSinkPanel`, `SourceRouteSlip`, source-map/full-ledger imports, `MandateChamberHero`, `RequirementLedger`, and `ReadinessLedger` in Status source. Existing folded `SourceThreadDrawer` remains allowed by V2-5.
- Allowed matches: tests/docs and the non-default/deferred source matches listed above.

## Known failures / NO_GO risks
- Broad-suite failures: `npm run test:contracts` remains red across unrelated full-repo contract debt.
- Pre-existing failures: Broad failures are outside V2-9 source/provenance surfaces and were already represented by V2-8 evidence as broad exact-screen/content debt.
- V2-9 regressions: none found in targeted checks.
- Deferred items: visual proof of non-null `ModuleSourceSinkPanel` in Manual Pavilion, Bounties, Expeditions, and reduced-motion mode remains deferred because Browser state stayed early/quiet and later reloads returned migration/onboarding overlays.

## Acceptance result
- GO/NO_GO for V2-9 targeted acceptance: GO.
- NO_GO for full release if applicable: NO_GO until broad `npm run test:contracts` repo debt is resolved.
