# Dao Mandate V2-3 Guidance Retirement Evidence

## Packet
V2-3 - Guidance Oath retirement and settings migration.

## Previous packet preflight
- V2-0: PASS. `AGENTS.md` and `docs/release/dao_mandate_v2_test_inventory.md` exist; guardrails and stale route-led/guidance-density inventory were inspected.
- V2-1: PASS. Projection types, builder, fixtures, export surface, contract test, and `docs/release/dao_mandate_v2_1_projection_evidence.md` were present. Projection targeted test passed.
- V2-2: PASS. Copy helper, priority helper, direct-route contract, copy-guard contract, and `docs/release/dao_mandate_v2_2_direct_route_copy_evidence.md` were present. Direct-route/copy targeted tests passed.
- Preflight repairs: none.
- Decision before implementation: `GO_FOR_V2_3`.

## Scope completed
- Changed files:
  - `src/components/screens/SettingsScreen.tsx` - removed public Guidance Oath cards and added a Dao Mandate interface/explanation section.
  - `src/components/screens/SettingsScreen.scss` - replaced old strategy-card styling with the interface/explanation section styles.
  - `src/systems/ui/daoMandate/daoMandateGuidanceSettings.ts` - retired public option metadata, documented `guidanceOath` as compatibility-only, and normalized legacy profile values to the standard sparse profile.
  - `src/systems/ui/daoMandate/daoMandateVisibility.ts` - removed old profile-density branching and kept granular settings as the only detail controls.
  - `src/systems/ui/daoMandate/daoMandateLessons.ts` - removed unused profile-gated lesson density while keeping lesson cadence settings.
  - `src/systems/ui/daoMandate/daoMandateModuleProjection.ts` - switched module source/sink variant selection from old profile values to source provenance detail.
  - `src/systems/ui/daoMandate/index.ts` - removed `DAO_GUIDANCE_OATH_OPTIONS` export and exported the standard sparse compatibility profile.
  - `src/stores/uiStore.ts` - normalized settings writes through the guidance sanitizer while preserving granular fields.
  - `src/components/modals/WorldBuildingModal.tsx`, `src/features/world/outskirts/OutskirtsScreenOwner.tsx`, `src/features/world/ruinsExact/RuinsScreenOwner.tsx`, `src/features/world/gateTrialExact/buildGateTrialExactSurface.ts` - removed local lens variant checks that branched on legacy `guidanceOath`.
  - Guidance/local/world contract tests - rewrote stale profile-density assertions to prove legacy profile inertness and granular controls.
- New files:
  - `tests/contracts/settingsGuidanceRetirement.test.ts`.
- Tests added:
  - Settings source contract for retired public profile UI.
  - Save compatibility and sanitizer normalization for `sealed`, `elder`, and `jade`.
  - Strategic visibility equality across old profile values.
  - Source provenance toggle control independent of old profiles.
- Tests rewritten:
  - `daoMandateGuidanceSettingsContract.test.ts`
  - `daoMandateGuidanceSaveMigration.test.ts`
  - `daoMandateGuidanceVisibilitySettings.test.ts`
  - `daoMandateP8GuidanceVisibilityOnly.test.ts`
  - `daoMandateSourceMapVisibility.test.ts`
  - `localMandateLensSurfaceContract.test.ts`
  - `worldMandateLensContract.test.ts`
- Tests retired: none.

## Public Settings result
- Guidance Oath cards removed: PASS. `SettingsScreen.tsx` no longer imports or renders `DAO_GUIDANCE_OATH_OPTIONS`, the old radiogroup, or `setGuidanceOath`.
- Sealed/Elder/Jade public strategy profile removed from Settings: PASS.
- Replacement section: `Dao Mandate Interface`, with `Explanation and accessibility`.
- Replacement copy states the Mandate uses one sparse omen-and-proof model and that controls never change rewards, power, route truth, or progression.
- Granular controls preserved:
  - Jade Slip lessons
  - Room relation stamps
  - Source provenance
  - Formula/detail rows
  - Failure reflections
  - Background support reminders
  - Recent omen memory
  - Mandate motion
- Settings-specific old public strategy scan: PASS, no matches in `SettingsScreen.tsx` or `SettingsScreen.scss`.
- Broader old-label scan: `src/ui/daoMandate/daoMandateUiFormatters.ts` still contains old formatter labels for non-Settings raw Mandate UI. This was left untouched because V2-3 explicitly forbids Status/production screen cutover outside Settings.

## Save compatibility result
- no uiSettings: PASS.
- old sealed value: PASS.
- old elder value: PASS.
- old jade value: PASS.
- malformed field behavior: PASS.
- chosen policy: old values normalize to standard sparse compatibility profile (`elder`) at runtime; valid granular settings remain preserved.

## Visibility stability result
- old sealed/elder/jade strategic visibility equality: PASS.
- granular toggles still work: PASS.
- `daoMandateVisibility.ts` no longer branches strategic density on `settings.guidanceOath`.
- Local/module lens variant hooks no longer branch on `guidanceOath`; they use granular detail settings.

## V2-2 preservation result
- direct-route policy tests: PASS.
- copy guard tests: PASS.
- ordinary pressure route suppression preserved: PASS.
- projection no-production-cutover scan: PASS, no `buildDaoOmenProjectionV1` / `DaoOmenProjectionV1` production screen imports found under `src/components`, `src/features`, or `src/ui`.

## Commands run
- `git status --short`: PASS during preflight; initial tree was clean.
- `git log --oneline -8`: PASS; recent V2-0/V2-1/V2-2 history inspected.
- `npm run typecheck`: PASS in preflight and after implementation.
- `npm run check:icons`: PASS in preflight and after implementation.
- `npm exec tsc -- --project tsconfig.tests.json`: PASS in preflight and after implementation.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoOmenProjectionContract.test.js --test-name-pattern DaoOmenProjection`: PASS, 11/11.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoOmenDirectRouteEligibility.test.js tmp-tests/tests/contracts/daoOmenCopyGuard.test.js`: PASS, 20/20.
- TDD red run, `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/settingsGuidanceRetirement.test.js`: expected FAIL before implementation; failures proved Settings still had old cards, sanitizer/save preserved old profile values, and visibility differed by profile.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/settingsGuidanceRetirement.test.js`: PASS after implementation, 5/5.
- Guidance/local/world direct run: PASS, 45/45 across settings retirement, guidance migration/visibility/source, local/world lens, lesson cadence, and lesson memory contracts.
- `npm run test:contracts -- --test-name-pattern "Guidance|guidance|settingsGuidance|DaoOmen|DirectRoute|CopyGuard"`: FAIL. The script ran the broad contract glob rather than a bounded V2-3 subset and reported unrelated stale failures.
- Broad rerun to temp log: FAIL with TS5033 fixture write errors while rebuilding `tmp-progression-fixtures`; generated side effects were cleaned from the working tree.
- Direct all-contract node sweep from compiled `tmp-tests`: FAIL with unrelated broad-suite failures listed below.
- Public Settings old strategy profile scan: PASS for `SettingsScreen.tsx` / `SettingsScreen.scss`.
- Visibility strategy-density branch scan: no `guidanceOath === sealed/elder/jade` production branch matches in V2-3 visibility paths; remaining old-label matches are non-Settings raw formatter/tests.
- Projection no-production-cutover scan: PASS.
- V2-2 forbidden route-copy scan: expected internal/test matches only in fixtures, copy-guard dictionaries, raw source-map labels, and old raw Status/Prestige surfaces; V2-2 targeted copy/direct-route tests pass.
- Gameplay owner mutation scan: expected pre-existing store/save imports and debug reward grant in Settings; no V2-3 gameplay owner mutation was added.
- Changed-file security smell scan: expected pre-existing `localStorage` save/load code and Settings export `Blob` helpers; no new dynamic evaluation, unsafe DOM HTML, secrets logging, or network calls were added.
- `coderabbit --help`: FAIL/unavailable; command not installed.

## Broad failures observed
The broad all-contract sweep remains red for existing unrelated exact-screen/content/Status/Outskirts/Ruins/trial lifecycle debt. Exact failing test names observed from compiled all-contract sweep:
- Gate Trial Exact fixture screen renders deferred scenic stage without visible placeholder copy
- scenic stage, readiness seal, reward, summary, rail, and CTA are locked
- builder preserves fixture mode and does not import forbidden gameplay or legacy UI
- manual pavilion exact spine titles use painted text, not dark title boxes
- C1 no visual rendering change: active combatStage data does not mount combat theater visuals
- P9 strip includes reduced-motion guardrails without geometry drift hooks
- P11 auto-repeat pill reflects boolean state and dispatches toggle callback
- Outskirts exact page has a hard height containment chain
- Outskirts exact body grid reserves lower action owners inside contained page
- Outskirts exact compact-height budget keeps CTA and summary in the layout contract
- P4/P5 route preservation: World modal route still mounts Outskirts screen owner
- P11 screen owner keeps grounded settings/start semantics and routes pouch via apothecary intent
- techniques exact live mapping uses store loadouts, casting display labels, slots, and learned rows
- every live apothecary stock item and live brew output has an implemented consumable spec
- city package registry entries expose the exact packet 2.7 authored contract facts
- all live cultivation-use items have implemented use logic
- Qi Elixir t1/t2 adjust qps and circulation t2 overrides t1 within the same family registry slot
- Meridian Warmth boosts qps and stability gain, Quiet Breath boosts comprehension and insight cadence
- Purity Elixir only affects major breakthroughs, grants stability on success, and expires honestly
- offline catch-up honors partial buff duration and save snapshot carries cultivation buffs
- carryover windows keep cultivation buff modifiers honest across overlapping families and expiry boundaries
- P8 active player-facing source does not expose old guide authority labels
- P7 Recent Omens profile visibility keeps Sealed quiet, Elder compact, and Jade full
- Dao Mandate fixtures expose stable complete surfaces for every required state
- Dao Mandate UI route helpers require actionable target and explain disabled states
- Sealed visibility keeps the primary readiness obstruction ahead of current-gate proof rows
- Dao Mandate fixture profiles keep Sealed compact and preserve Jade ledger density
- proof surfaces continue using their screen-owned exact shell contract paths
- P6.3C reduced motion and low tiers collapse to static-safe gate trial atmosphere
- status troubleshooting layout keeps six-card composition with chamber hierarchy anchors
- path atmosphere stylesheet defines distinct high/low/reduced behaviors without layout geometry mutation hooks
- life summary surface always returns the locked V2 memory block structure
- last-completed summary renders from normalized stored snapshot
- doctrine verse row carries a fixed-size lotus icon plus visible paired text
- packet 4.9 visible slot counts per city are unchanged
- packet 4.9 corrected stock contains build-relevant offers
- packet 4.9 core visible uniqueness is still preserved
- packet 4.9 correction pass preserves slot metadata and only swaps technique ids
- menu identity semantic tokens cover action, state, screen, material, and nav roles
- menu identity primitives are exported and use semantic role classnames
- global token import and color defaults allow inverse and on-action text
- status screen adopts ledger identity primitives for routes and state
- full menu identity overlay is loaded after app styles
- menu identity overlay gives every major surface visible material treatment
- menu identity overlay styles real screen components, not only root variables
- major menu roots declare local menu identity tokens
- exact screen primary CTAs map to gold action tokens, not default jade fills
- Status desktop surface uses broad diagnostic width instead of a narrow document stack
- WorldModuleCard reserves module-meta state slot and keeps a capped two-chip lane
- outskirts screen owner is routed through dedicated exact owner component
- C7 Test J: no premature result overlay
- C0 active surface model contract keeps exact-shell ownership and stop CTA intent
- C0 active exact page render contract keeps exact screen mounted and blocks legacy tokens
- C4 Test D: unknown enemy art renders mist fallback without fake enemy body text
- C6 Test J: no old combat options or utility tray
- C6 Test K: no premature result overlay
- C8 Test J: no full result screen or old UI tokens
- C3 active route mounts theater shell and retains stage layers
- C3 shell contract enables hp bars only for active
- P0 target now reflects screen-owned exact host/layout owner files
- P13 bottom-zone stability keeps CTA and summary dock footprints in enabled/disabled and long-value states
- P14 planning purity excludes combat-shell chrome in planning owner/surface
- Packet A owner baseline keeps OutskirtsScreenOwner mounted for planning/active without legacy fallback
- Packet A no broken raw-src contract for Outskirts exact-screen module set
- Packet B scenic stylesheet removes legacy scenic card-shell selector
- outskirts summary surface preserves canonical role framing and boundary copy
- WorldScreen considers Run Compass secondary world-module routes independently of primary target kind
- null selected path means no fit
- same-path strong offensive and support signatures score 2
- same-path neutral support and farm passives score 1
- cross-path offensive techniques are off
- cross-path support techniques remain neutral support
- world, cultivate, status, prestige remain legally wired to frozen shell/fx truth
- World and Prestige TopRibbon titles normalize through canonical shell tab labels
- ruins CTA zone keeps one dominant action and secondary auto-repeat control
- ruins exact class coverage contract includes critical child selectors (not test ids)
- route mapping and quarantine/deferred art contracts stay locked
- ruins exact css polish contract owns exact layout and excludes legacy tokens
- ruins exact dom contract keeps exact slots and avoids legacy component tokens
- ruins evidence manifest and readme target exact surface
- phase6 capture/validate include ruins exact route + dom audit guards
- live binding source uses dropsPerRoom pool and final chest guaranteed
- exact owner/action controller quarantine old ruins components
- Ruins review mode threading stays explicit and live-default safe
- ruins exact scenic stage source guard has no forbidden scenic imports
- ruins exact right rail source does not import legacy summary path
- ruins fx scene contract uses bounded local atmosphere families
- P6.2I FX tier contract keeps reduced/low coherent and calm
- ruins progress keeps first-read and recap/history regions split
- combat theater reuses ruins progress in rail mode without world CTA zone
- ruins summary card foregrounds deterministic trio and keeps boundary secondary
- ruins summary surface preserves deterministic targeted-material framing
- CityMapHub keeps ScenicLabel diegetic wiring frozen for world map hotspots
- status atmosphere quality fallback rules keep low and reduced motion calm
- status tone helpers map ready and blocked text without changing source labels
- trial lifecycle reports an available first gate and exposes fail-safe progress
- trial fail-safe authoring aliases normalize into canonical threshold and cost shape
- trial lifecycle distinguishes bypassed trials from cleared trials

## Plugin/tool usage
- Browser: unavailable. Tool discovery did not expose a Browser navigation/screenshot tool; no browser smoke was run.
- Linear: unavailable. Tool discovery did not expose Linear issue tools.
- Game Studio: available as a plugin in the environment list but not used; V2-3 is a bounded Settings/settings-migration/test packet, not a prototype task.
- Superpowers: used. TDD and verification-before-completion workflows guided red/green tests and closeout verification.
- GitHub: used. Searched issues and PRs in `HeavenRefiningDemonV/cultivation-idle` for V2-3 / Guidance Oath / settings migration overlap; no matching issues or PRs returned.
- Sentry: unavailable. Tool discovery did not expose Sentry issue/event tools.
- CodeRabbit: unavailable. No callable CodeRabbit tool was exposed and `coderabbit --help` was not installed.
- HyperFrames: available as plugin context but not used; video/prototype work is out of V2-3 scope.
- Codex Security: no callable security plugin surfaced; manual changed-area smell scan was run and found no new unsafe dynamic evaluation, DOM HTML injection, external network call, secret logging, or storage behavior beyond existing save/export APIs.

## Known blockers
- Broad all-contract suite remains red for unrelated pre-existing exact-screen/content/Status/Outskirts/Ruins/trial lifecycle contracts listed above.
- Non-Settings raw Mandate UI formatter still contains old profile labels in `src/ui/daoMandate/daoMandateUiFormatters.ts`; left untouched because V2-3 forbids Status/production screen cutover outside Settings.
- Browser visual smoke was not run because the Browser tool was not callable.

## GO / NO_GO for V2-4
GO for V2-4. V2-3 targeted tests pass, public Settings strategy cards are retired, old save values load and normalize to the standard sparse profile, legacy profile values no longer alter strategic visibility, V2-2 route/copy tests still pass, no Omen Projection was imported into production screens, and no gameplay owner mutation was added.
