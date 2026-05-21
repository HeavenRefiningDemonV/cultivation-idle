# Dao Mandate V2-2 Direct Route and Copy Guard Evidence

## Packet
V2-2 - Direct-route policy and copy guard

## V2-0 preflight result
- AGENTS.md present: yes.
- V2 test inventory present: yes, `docs/release/dao_mandate_v2_test_inventory.md`.
- Guardrails include no raw route list / no points-elsewhere / no gameplay mutation: yes. The root guardrails include the Dao Mandate V2 section, default UI forbidden route-led copy, direct-route policy, source-truth owner rules, and preserve-first visual constraints.
- Any V2-0 repair performed: none.

## V2-1 preflight result
- Projection types present: yes, `src/systems/ui/daoMandate/daoOmenProjectionTypes.ts`.
- Projection builder present: yes, `src/systems/ui/daoMandate/buildDaoOmenProjectionV1.ts`.
- Projection fixtures present: yes, `src/systems/ui/daoMandate/daoOmenProjectionFixtures.ts`.
- Projection tests present: yes, `tests/contracts/daoOmenProjectionContract.test.ts`.
- Projection evidence present: yes, `docs/release/dao_mandate_v2_1_projection_evidence.md`.
- Targeted V2-1 projection test rerun: PASS through the direct compiled Node test runner.
- Production screen no-cutover scan: PASS, no projection consumption found under `src/components`, `src/features`, or `src/ui`.
- Any V2-1 repair performed: none.

## Scope completed
- New files:
  - `src/systems/ui/daoMandate/daoOmenCopy.ts`
  - `src/systems/ui/daoMandate/daoOmenPriority.ts`
  - `tests/contracts/daoOmenDirectRouteEligibility.test.ts`
  - `tests/contracts/daoOmenCopyGuard.test.ts`
  - `docs/release/dao_mandate_v2_2_direct_route_copy_evidence.md`
- Modified files:
  - `src/systems/ui/daoMandate/buildDaoOmenProjectionV1.ts`
  - `src/systems/ui/daoMandate/index.ts`
- Tests added:
  - `daoOmenDirectRouteEligibility.test.ts`
  - `daoOmenCopyGuard.test.ts`
- Tests updated: none.

## Direct-route policy summary
V2-2 centralizes omen priority, ordinary-pressure classification, Gate Trial target checks, direct-route eligibility, and exposed hard-route copy normalization in `daoOmenPriority.ts`.

Ordinary pressure remains symptom/proof-first by default. The policy suppresses direct routes for threshold, medicine reserve, forge floor, doctrine, support reserve, currency reserve, source drought, and quiet states. Allowed hard routes are limited to setup repair, hard proof/Gate Trial locks, repeated failure reflection, safety net, breakthrough, reincarnation, content cap, and explicit player-expanded detail contexts.

Attemptable and risky gate states expose a direct route only when the raw route targets Gate Trial. A test-local non-Gate Trial route replacement verifies that `Open Apothecary` style routes are suppressed even when the omen kind remains attemptable or risky.

## Copy guard summary
V2-2 centralizes default Omen Projection copy in `daoOmenCopy.ts`. The default copy dictionary covers every `DaoOmenKind`, stays within compact display budgets, and avoids route-led commands for ordinary pressure states.

The copy guard tests collect default first-layer projection text from current omen, proof seals, pressure badges, reflections, and source threads while intentionally excluding debug notes. The guard bans legacy route-board language such as `Open Apothecary`, `Open Forge`, `Raise Forge`, `Tune Techniques`, `Cultivate Qi`, `Primary Route`, `Best Next Action`, `Biggest Shortfall`, and `Mandate points elsewhere` from default projection text.

## Fixture matrix summary
- Setup: `life_setup_missing_path` exposes one setup route.
- Ordinary pressure: `qi_short_before_realm_edge`, `medicine_floor_short`, `forge_floor_shortfall`, `doctrine_gap`, `merit_reserve_low`, and `source_drought_herbs` expose no direct route and no hard routes.
- Gate proof / attempt: `gate_proof_missing_attemptable`, `attemptable_gate_viable`, and `attemptable_gate_risky` expose only Gate Trial hard-lock routes.
- Reflection / mercy / breakthrough / meta handoff: `repeated_underprepared_failure`, `safety_net_ready`, `breakthrough_ready`, `prestige_viable_not_recommended`, and `content_cap_reached` expose one allowed route with the expected reason.
- Source thread route visibility: ordinary pressure source threads remain non-`hard_lock`.

## Commands run
- `git status --short`: PASS - clean before V2-2 edits.
- `sed`/`rg` preflight scans over `AGENTS.md`, `docs/release/dao_mandate_v2_test_inventory.md`, `src/systems/ui/daoMandate`, and `tests/contracts`: PASS - V2-0 and V2-1 artifacts present.
- `npm run typecheck`: PASS.
- `npm run check:icons`: PASS.
- `npm exec tsc -- --project tsconfig.tests.json`: PASS after implementation. It failed before implementation as the intended TDD red because the new tests referenced missing V2-2 copy/policy exports.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoOmenProjectionContract.test.js --test-name-pattern DaoOmenProjection`: PASS.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoOmenDirectRouteEligibility.test.js tmp-tests/tests/contracts/daoOmenCopyGuard.test.js`: PASS.
- `npm run test:contracts -- --test-name-pattern "DaoOmen|DirectRoute|CopyGuard"`: FAIL - the repo script executed unrelated broad contract files despite the test-name pattern. Observed unrelated failures were `statusFxSceneAtmosphereContract.test.js` missing expected low-quality mist/glint CSS selector, `statusToneUtils.test.js` expecting `locked` but receiving `route`, and `trialLifecycle.test.js` failing `[PavilionContent] manifest root must be an object`. The direct V2-2 compiled Node runner tests passed.
- `git diff --check`: PASS, with line-ending warnings only.
- `rg -n "buildDaoOmenProjectionV1|DaoOmenProjectionV1|daoOmenProjection" src/components src/features src/ui`: PASS - no production screen cutover.
- `rg -n "useGameStore|useUIStore|useCombatStore|useTrialStore|usePrestigeStore|RewardService|CombatStore|ActivityStore|performBreakthrough|grantRewards|spendCurrency|recordFailure|markCleared|markBypassed|resetPrestige" src/systems/ui/daoMandate/daoOmenCopy.ts src/systems/ui/daoMandate/daoOmenPriority.ts src/systems/ui/daoMandate/buildDaoOmenProjectionV1.ts`: PASS - no gameplay owner imports or mutation patterns.
- `rg -n "Open Apothecary|Open Forge|Raise Forge|Tune Techniques|Cultivate Qi|Primary Route|Best Next Action|Biggest Shortfall|Mandate points elsewhere" src/systems/ui/daoMandate tests/contracts`: PASS with expected matches only in old raw/internal source modules, forbidden-pattern constants, and tests. No default copy dictionary entry or builder default string uses those commands.
- `coderabbit --version`: FAIL - CodeRabbit CLI is not installed. Installation was not attempted because this packet forbids installing third-party tooling solely to satisfy plugin availability.
- GitHub issue searches for `Dao Mandate V2 V2-2 direct route copy guard Omen Projection` and `Guidance Oath Mandate points elsewhere Status route commands`: PASS - no open matching issues returned.

## Plugin/tool usage

### Browser
- Available: no callable Browser tool was exposed by tool discovery in this session.
- Used: no.
- Result: not used.
- Reason if not used: V2-2 changed model/test/doc files only and did not include a screen cutover or visual proof requirement.

### Linear
- Available: no callable Linear tool was exposed; `linear` CLI was not installed.
- Used: no.
- Query/context: not run.
- Result: unavailable.
- Linked issue/project refs, if any: none.

### Game Studio
- Available: no callable Game Studio tool was exposed for this packet.
- Used: no.
- Result: not used.
- Reason if not used: V2-2 is a model/test policy packet, not a prototype or visual design packet.

### Superpowers
- Available: yes, skills available from local Codex skill files.
- Used: yes.
- Workflow support: used for TDD framing and verification-before-completion discipline.
- Result: tests were added before the implementation pass; no additional planning file was committed.

### GitHub
- Available: yes, GitHub connector was exposed.
- Used: yes.
- Result: searched repository PRs/issues for Dao Mandate V2 / V2-2 / direct-route / copy-guard / Omen Projection context; no matching open PRs or issues were returned.

### Sentry
- Available: no callable Sentry tool was exposed; `sentry-cli` was not installed.
- Used: no.
- Query/context: not run.
- Result: unavailable.
- Privacy note: no event payloads or private stack traces were committed.

### CodeRabbit
- Available: no callable CodeRabbit tool was exposed; `coderabbit` CLI was not installed.
- Used: no.
- Findings: unavailable. The CodeRabbit skill was checked, but the CLI prerequisite failed at `coderabbit --version`.
- Fixes applied: none from CodeRabbit.
- Deferred findings: none.

### HyperFrames by HeyGen
- Available: no callable HyperFrames tool was exposed for this packet.
- Used: no.
- Reason if not used: V2-2 has no visual/prototype/video scope.

### Codex Security
- Available: no callable Codex Security diff-scan tool was exposed for this packet.
- Used: manual focused scan.
- Scope: changed V2-2 production model files.
- Findings: no network calls, dynamic evaluation, shell execution, filesystem writes, secret reads, screen imports, or gameplay mutation imports were found.
- Fixes applied: none required.

## Known blockers
- Broad `npm run test:contracts -- --test-name-pattern "DaoOmen|DirectRoute|CopyGuard"` remains blocked by unrelated stale/broad contract failures that execute despite the test-name pattern. Targeted V2-1 and V2-2 compiled Node runner tests pass.
- Old raw/internal route-led strings remain in existing raw resolver/source-map code and in tests. This is expected for V2-2; V2-2 prevents default Omen Projection leakage and leaves broad vocabulary decommission to later packets.

## GO / NO_GO for V2-3
GO for V2-3.

Reason: V2-0 guardrails and V2-1 projection seam were verified; V2-2 centralized Omen copy and direct-route policy; direct-route eligibility and copy guard tests pass; ordinary pressure states expose no direct route; allowed hard states expose the expected route reason; typecheck passes; no production screen imports the projection; no gameplay owner imports or mutations were added. Remaining broad-suite failures are documented as pre-existing/stale or unrelated and were not caused by V2-2 changed files.
