# Dao Mandate V2-0 Test and Guardrail Inventory

Date: 2026-05-21
Branch: Latest
Commit: 9f64c31f
Packet: V2-0 - Freeze, AGENTS.md guardrails, stale-test inventory

## Executive verdict

V2-0 updated repository guardrails and inventoried stale Dao Mandate assumptions before implementation resumes. Production UI and gameplay behavior were not changed: no screen, store, service, content, SCSS, migration, or test behavior was edited. The current repo still renders the old route-led Mandate Chamber in Status and still carries public Guidance Oath strategy-density contracts; those are documented here for future packets instead of being fixed in V2-0.

## V2 doctrine used for this audit

- Sparse Omen Projection, not raw route-led rendering.
- Status recovery, not Mandate Chamber polish.
- Guidance levels retired from player-facing strategy.
- Direct routes only under allowed conditions.
- Gate Trial owns full readiness.
- Quiet local modules render no Mandate banner.
- Preserve-first visual work.

## Source truth inspected

| Source | Evidence / notes |
| --- | --- |
| Embedded V2-0 prompt | Treated as active packet instructions and scope boundary. |
| `C:/Users/abdul/Downloads/Cultivation_Idle_Dao_Mandate_V2_Status_Recovery_Spec.docx` | Present and spot-read via DOCX XML extraction. It states Status should return to old hierarchy and that V2 should show sparse omen/proof symptoms instead of route commands. |
| `C:/Users/abdul/Downloads/Cultivation_Idle_Dao_Mandate_V2_Final_Implementation_Codex_Manual.docx` | Present and spot-read via DOCX XML extraction. It states the raw engine should remain internal, public UI should use Omen Projection, and Sealed/Elder/Jade player-facing strategy levels should retire. |
| `AGENTS.md` | Existing root guardrails preserved and extended. |
| `docs/codex-packet-rules.md` | Confirms packet scope, source-truth owners, test/evidence expectations, and no local duplication of progression truth. |
| `docs/progression-contract.md` | Confirms live realm/city/trial source truth and authored cap ending at `spirit_severing`. |

## Files changed in V2-0

| File | Change | Reason |
| --- | --- | --- |
| `AGENTS.md` | Updated | Added focused Dao Mandate V2 implementation and review guardrails while preserving existing instructions. |
| `docs/release/dao_mandate_v2_test_inventory.md` | Created | Records stale tests, old public copy, current render-tree risks, tool usage, validation, and future packet targets. |

## Repo state before edits

| Item | Value |
| --- | --- |
| Root inspected | `C:\Users\abdul\Desktop\cultivation-idle` |
| Nested `AGENTS.md` search | Only root `AGENTS.md` found. |
| Dependencies | `node_modules/` present. |
| Existing uncommitted changes | `?? review-bundles/` was present before V2-0 and was not touched. |
| Production UI files changed | No. |
| Gameplay/store/service files changed | No. |
| Test files changed | No. |

## Tool / plugin availability and usage

| Tool/plugin | Status | What was done | Evidence / notes |
| --- | --- | --- | --- |
| Browser | skipped | No external docs or browser observation was needed for a docs-only source audit. | `tool_search` did not expose a callable Browser/Browser Control tool in this thread. |
| Browser Control | skipped | No dev server was started and no screenshots were captured. | Optional in prompt; source inspection provided enough evidence. |
| Linear | unavailable | No Linear search was run. | `tool_search` did not expose Linear tools; `linear` CLI was not found. |
| Game Studio | skipped | No prototype or UI design work was created. | V2-0 is guardrails only. |
| Superpowers | used | Read `writing-plans` and `verification-before-completion` skills; followed constrained plan and evidence-before-claims workflow. | No separate plan file was created because V2-0 limits normal changed files to AGENTS and the inventory doc. |
| GitHub | used | Confirmed GitHub app access and repository visibility through the connector; checked git remote locally. | Connector listed `HeavenRefiningDemonV/cultivation-idle`; `gh` CLI was unavailable, so issue/PR search was not run. |
| Sentry | unavailable | No Sentry search was run. | `tool_search` did not expose Sentry tools; `sentry-cli` was not found. |
| CodeRabbit | unavailable | No CodeRabbit review was run. | `coderabbit` CLI was not found and no callable CodeRabbit tool was exposed. The CLI was not installed because V2-0 says to document unavailable plugins rather than block or expand scope. |
| HyperFrames by HeyGen | skipped | No video or stakeholder explainer was created. | Out of scope for guardrails-only packet. |
| Codex Security | skipped | Read the available security-scan skill, but did not run a full scan. Applied a lightweight manual safety check to the docs diff. | Only the full multi-phase security-scan workflow was available; this docs-only packet needed no repository-wide scan. No secrets, sandbox-bypass instructions, or unsafe shell install commands were added. |

## Commands run

| Command | Result | Notes |
| --- | --- | --- |
| `Get-ChildItem -Force` | PASS | Repository root inspected. |
| `Test-Path -LiteralPath AGENTS.md` | PASS | Existing root AGENTS file found. |
| `Get-ChildItem -Recurse -Filter AGENTS.md -File` | PASS | Only root `AGENTS.md` found. |
| `Get-Content -LiteralPath package.json` | PASS | Package scripts inspected. |
| `git status --short` | PASS | Pre-existing `?? review-bundles/`; later V2-0 doc changes visible as expected. |
| `git branch --show-current` | PASS | Branch: `Latest`. |
| `git rev-parse --short HEAD` | PASS | Commit: `9f64c31f`. |
| `git remote -v` | PASS | Remote: `HeavenRefiningDemonV/cultivation-idle`. |
| `rg -n "MandateChamberHero|RequirementLedger|ReadinessLedger|SourceRouteSlip|BackgroundSupportStrip|SafetyNetPlaque|ReincarnationCounsel|RecentOmensFeed|JadeSlipHelp" src tests docs` | PASS | Found Status raw stack, UI components, docs, and stale contracts. |
| `rg -n "Guidance Oath|guidanceOath|Sealed|Elder|Jade|daoMandateGuidanceSettings|daoMandateVisibility" src tests docs` | PASS | Found Settings UI, save/migration helpers, visibility filters, and density tests. |
| `rg -n "Primary Route|Best Next Action|Best Next Actions|Biggest Shortfall|Mandate points elsewhere|points elsewhere|Open Apothecary|Open Forge|Raise Forge|Tune Techniques|Cultivate Qi|Attempt Gate|Restock Apothecary|Brew Medicine|Run Ruins|Launch Expedition" src tests docs` | PASS | Found route-led labels in Status, Prestige, local lenses, internal raw engine, Gate Trial, and historical docs. |
| `rg -n "statusMandateChamberContract|daoMandateP8GuidanceVisibilityOnly|daoMandateGuidanceVisibilitySettings|MandateChamberHero|RequirementLedger|Primary Route|Guidance Oath|Sealed|Elder|Jade|points elsewhere" tests src` | PASS | Found stale Status and Guidance Oath contracts. |
| `rg -n "runCompassHint|Mandate Context|Primary Route|ReincarnationCounsel|Prestige|reincarnation|cap" src/features/prestige src/components/screens tests docs` | PASS | Found Prestige live-run route hint surface. |
| `rg -n "points elsewhere|Mandate points|current Mandate points|available, but|not relevant|quiet" src/systems src/ui src/components tests docs` | PASS | Found local quiet scolding copy and some existing null-hiding behavior. |
| `rg -n "capture|screenshot|audit|playwright|release:.*capture|status.*capture|prestige.*capture|cultivation.*capture|gate.*capture" package.json scripts docs tests` | PASS | Found Playwright config and release capture/audit scripts. |
| `npm run typecheck` | PASS | `tsc --noEmit` exited 0 after the final docs edits. |
| `npm run check:icons` | PASS | No emoji icon usage found. |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | Test TypeScript project compile exited 0. |
| `npm run test:contracts` | NOT RUN | Broad suite was not run for this docs-only packet; existing P8 evidence records broad contract debt unrelated to V2-0. |
| `npm run validate:content` | NOT RUN | No content files changed. |
| `npm run build` | NOT RUN | No production source changed; typecheck and test compile were sufficient for V2-0. |

## Current raw Status / Mandate render tree evidence

| Finding | File | Evidence | Category | Future packet |
| --- | --- | --- | --- | --- |
| Status imports the full Dao Mandate raw UI stack. | `src/components/screens/StatusScreen.tsx:23` | `BackgroundSupportStrip`, `JadeSlipHelp`, `MandateChamberHero`, `ReadinessLedger`, `RecentOmensFeed`, `ReincarnationCounsel`, `RequirementLedger`, `SafetyNetPlaque`, `SourceRouteSlip`. | status-default-overload | V2-5/V2-11 |
| Default Status opens with a route-led Mandate Chamber section. | `src/components/screens/StatusScreen.tsx:296` | `aria-label="Mandate Chamber Primary Route"` followed by `<MandateChamberHero ... />` at line 297. | status-default-overload | V2-5 |
| Default Status renders full ledger/readiness/source components before legacy diagnostic panels. | `src/components/screens/StatusScreen.tsx:317` | `<RequirementLedger>` at 319, `<ReadinessLedger>` at 329, `<SourceRouteSlip>` at 339. | status-default-overload | V2-5 |
| Default Status side column renders support/safety/prestige/omens/tutorial stack. | `src/components/screens/StatusScreen.tsx:350` | Background support, SafetyNetPlaque, ReincarnationCounsel, RecentOmensFeed, and JadeSlipHelp render in one Status side column. | status-default-overload | V2-5/V2-10 |
| Status CSS is organized around the chamber grid and raw components. | `src/components/screens/StatusScreen.scss:325` | `.statusMandateChamber__grid .daoRequirementLedger`, `.daoReadinessLedger`, `.daoSourceRouteSlip`, `.daoReincarnationCounsel`, `.daoJadeSlipHelp`. | status-default-overload | V2-5 |
| MandateChamberHero exposes the old first-layer labels. | `src/ui/daoMandate/MandateChamberHero.tsx:51` | `Current Mandate`, `Primary Obstruction`, `Primary Route`, and secondary route buttons. | public-ui-old-route-led | V2-5/V2-11 |
| RequirementLedger exposes full current/target/action rows. | `src/ui/daoMandate/RequirementLedger.tsx:101` | Row renders `Current`, `Target`, and a route action slot. | public-ui-old-route-led | V2-5/V2-9 |
| SourceRouteSlip exposes source/sink rows and route buttons. | `src/ui/daoMandate/SourceRouteSlip.tsx:85` | `Source and sink`, `Needed`, `Sink`, `Impact`, and route buttons. | public-ui-old-route-led | V2-5/V2-9 |
| Raw UI components exist as reusable internals/specimens. | `src/ui/daoMandate/index.ts:31` | Exports `MandateChamberHero`, `RequirementLedger`, `SourceRouteSlip`, and related components. | raw-engine-ok | V2-11 only if decommissioned from public default UI |

## Guidance Oath / strategy-level evidence

| Finding | File | Evidence | Category | Future packet |
| --- | --- | --- | --- | --- |
| Settings reads public guidance profile state. | `src/components/screens/SettingsScreen.tsx:152` | `const guidanceOath = useUIStore((state) => state.settings.guidanceOath);` | guidance-level-public | V2-3 |
| Settings renders Guidance Oath as a player-facing strategy choice. | `src/components/screens/SettingsScreen.tsx:389` | `<h3 ...>Guidance Oath</h3>` and `role="radiogroup" aria-label="Guidance Oath"` at line 396. | guidance-level-public | V2-3 |
| Settings writes old strategy profile values. | `src/components/screens/SettingsScreen.tsx:406` | `name="guidanceOath"` radio inputs call `setGuidanceOath(option.id)`. | guidance-level-public | V2-3 |
| Guidance settings define public Sealed/Elder/Jade values. | `src/systems/ui/daoMandate/daoMandateGuidanceSettings.ts:26` | `['sealed', 'elder', 'jade']`. | guidance-level-public | V2-3 |
| Guidance option metadata advertises strategy-density tiers. | `src/systems/ui/daoMandate/daoMandateGuidanceSettings.ts:39` | `Sealed Counsel`, `Elder's Counsel`, `Jade Slip Tutor` with low/default/maximum guidance. | guidance-level-public | V2-3 |
| Guidance defaults preserve Elder as current default. | `src/systems/ui/daoMandate/daoMandateGuidanceSettings.ts:99` | `guidanceOath: 'elder'`. | guidance-level-public | V2-3 |
| Visibility logic changes rendered detail by profile. | `src/systems/ui/daoMandate/daoMandateVisibility.ts:307` | `applySealed`, `applyElder`, and profile-gated source/readiness/recent-omens filtering. | guidance-level-public | V2-3/V2-11 |
| Save compatibility preserves old fields. | `src/save/defaultSaveState.ts:684` | `guidanceOath`, `jadeSlipLessons`, and granular guidance fields are sanitized in save UI settings. | raw-engine-ok | V2-3 migration compatibility |

## Route-led public copy evidence

| String / symbol | File | Reachable UI or internal? | V2 concern | Future packet |
| --- | --- | --- | --- | --- |
| `Primary Route` | `src/ui/daoMandate/MandateChamberHero.tsx:83` | Public default Status through MandateChamberHero. | Default route-led label. | V2-2/V2-5/V2-11 |
| `Mandate Chamber Primary Route` | `src/components/screens/StatusScreen.tsx:296` | Public Status section aria label. | Status is currently framed as route board. | V2-5 |
| `Cultivate Qi` | `src/systems/ui/status/statusDashboardSurface.ts:412` | Status action surface. | Default Status can command ordinary cultivation pressure. | V2-2/V2-5/V2-11 |
| `Open Apothecary` | `src/systems/ui/status/statusDashboardSurface.ts:416` | Status action surface. | Ordinary reserve pressure should become symptom/proof by default. | V2-2/V2-5/V2-11 |
| `Open Forge` | `src/systems/ui/status/statusDashboardSurface.ts:418` | Status action surface. | Gear floor pressure should not route-command first layer. | V2-2/V2-5/V2-11 |
| `Restock Apothecary`, `Brew Medicine`, `Run Ruins`, `Launch Expedition`, `Raise Forge Floor`, `Attempt Gate`, `Cultivate Qi` | `src/systems/ui/runCompass/buildRunCompassSurfaceV2.ts:155` | Internal raw engine/read-model labels. | Allowed internally, but must not leak into default Omen Projection. | V2-1/V2-2 |
| `Tune Techniques` | `src/systems/ui/runCompass/buildRunCompassSurfaceV2.ts:258` | Internal raw engine failure route. | Allowed for repeated failure/detail; forbidden as ordinary default Status command. | V2-2/V2-7 |
| `Attempt Gate Trial` | `src/systems/ui/runCompass/buildRunCompassSurfaceV2.ts:831` | Internal route and Gate Trial route. | Allowed when gate is legally attemptable or Gate Trial owns detail. | V2-2/V2-7 |
| `Open Apothecary`, `Open Forge` | `src/systems/ui/daoMandate/daoMandateSourceMap.ts:96` | Source-map route labels. | Allowed in source/detail drawers; should stay closed by default. | V2-2/V2-9 |
| `Best Next Action` / `Biggest Shortfall` | `docs/release/menu-polish-audit.md:51` and `docs/release/dao_mandate_p8_evidence.md:15` | Historical docs. | Docs-only reference to old labels and P8 decommissioning. | docs-only-reference |

## Local quiet-rule evidence

| Finding | File | Evidence | Category | Future packet |
| --- | --- | --- | --- | --- |
| Local module copy says the current Mandate points elsewhere. | `src/systems/world/localMandateLensSurface.ts:105` | `Outskirts are available, but the current Mandate points elsewhere.` | local-quiet-scolding | V2-8 |
| Forge/Apothecary/Manual/Techniques/Bounties/Expeditions repeat the same quiet scold. | `src/systems/world/localMandateLensSurface.ts:137` | `Forge is available, but the current Mandate points elsewhere.` and parallel strings through line 217. | local-quiet-scolding | V2-8 |
| Fallback local copy also points elsewhere. | `src/systems/world/localMandateLensSurface.ts:236` | ``${moduleKey} is available, but the current Mandate points elsewhere.`` | local-quiet-scolding | V2-8 |
| Visibility helper already hides quiet local lens when applied. | `src/systems/world/localMandateLensSurface.ts:466` | `if (lens.relation === 'quiet') return null;` | raw-engine-ok | Keep and strengthen in V2-8 |
| Source map local detail can still emit points-elsewhere copy. | `src/systems/ui/daoMandate/daoMandateSourceMap.ts:611` | `Inventory is available, but the current Mandate points elsewhere.` | local-quiet-scolding | V2-8/V2-9 |
| Module source map fallback repeats the same local scold. | `src/systems/ui/daoMandate/daoMandateSourceMap.ts:618` | ``${MODULE_DESTINATION_LABELS[moduleKey]} is available, but the current Mandate points elsewhere.`` | local-quiet-scolding | V2-8/V2-9 |
| World tests already assert quiet relations can be hidden by profile. | `tests/contracts/worldMandateLensContract.test.ts:124` | `visibleRelationByModuleKey.ruins ?? null, null`. | raw-engine-ok | Use as base for V2-8 quiet-is-null contract |

## Prestige silence evidence

| Finding | File | Evidence | Category | Future packet |
| --- | --- | --- | --- | --- |
| Prestige screen renders live-run Mandate context. | `src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.tsx:68` | `surface.runCompassHint` renders a `prestigeLedgerRunCompass` section. | prestige-screen-ownership-leak | V2-10 |
| Prestige uses public route labels. | `src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.tsx:74` | Displays `Primary Route` or `Mandate Context`. | prestige-screen-ownership-leak | V2-10/V2-11 |
| Prestige owner derives the hint from Run Compass. | `src/features/prestige/prestigeLedgerExact/PrestigeLedgerScreenOwner.tsx:120` | `runCompass.v2.milestone.label`, `primaryBlocker.label`, `primaryRoute.label`, `primaryRoute.detail`. | prestige-screen-ownership-leak | V2-10 |
| Current prestige honesty tests do not guard route-context silence. | `tests/contracts/prestigeScreenHonesty.test.ts:9` | Tests advisor/reset vocabulary, but no assertion bans `Primary Route` or `Mandate Context`. | release-evidence-gap | V2-10 |

## Stale contract/test inventory

| Test file | Current assertion / behavior | Why stale for V2 | Proposed future action | Packet |
| --- | --- | --- | --- | --- |
| `tests/contracts/statusMandateChamberContract.test.ts` | Lines 20-33 require `MandateChamberHero`, `RequirementLedger`, and route stack before the supporting grid. | V2 forbids the raw chamber as default Status. | Rewrite to `statusV2LayoutContract.test.ts`: identity hero, metric strip, six-card diagnostic grid, no default chamber/full ledgers. | V2-5/V2-11 |
| `tests/contracts/statusMandateChamberContract.test.ts` | Lines 51-58 require `Mandate Chamber`, `Mandate Ledger`, `Primary Route`, and `Recent Omens`. | V2 should not require `Primary Route` or Mandate Chamber copy in default Status. | Convert into copy guard and Omen Projection summary expectations. | V2-2/V2-5/V2-11 |
| `tests/contracts/statusDashboardSurface.test.ts` | Lines 77-84 require non-success requirements to have a route action or disabled reason. | Default Status should be allowed to show symptom/proof without direct route for ordinary pressure. | Rewrite to distinguish allowed direct-route states from ordinary pressure badges. | V2-2/V2-5 |
| `tests/contracts/statusDashboardModel.test.ts` | Lines 26-40 assert `Go` action state for Run Compass-style routes. | Route action state may remain internal, but default Status should not expose it for ordinary pressure. | Keep as raw/action helper only or move to detail drawer/Gate Trial route tests. | V2-2/V2-11 |
| `tests/contracts/daoMandateGuidanceSettingsContract.test.ts` | Lines 27-35 require Sealed/Elder/Jade metadata as player-facing options. | V2 retires public strategy profiles. | Rewrite for migration compatibility and non-strategy accessibility/explanation preferences. | V2-3/V2-11 |
| `tests/contracts/daoMandateGuidanceSaveMigration.test.ts` | Lines 37-75 require old saves to receive Elder defaults and preserve guidance fields. | Old values should remain loadable but not define public strategic density. | Keep migration assertions but change expectation to compatibility mapping. | V2-3 |
| `tests/contracts/daoMandateP8GuidanceVisibilityOnly.test.ts` | Lines 21-43 assert visible density order Sealed <= Elder <= Jade while raw truth is invariant. | Good invariant proof, stale public profile model. | Convert to raw-engine/debug compatibility test or replace with Omen Projection bounded-seals contract. | V2-1/V2-3/V2-11 |
| `tests/contracts/daoMandateGuidanceVisibilitySettings.test.ts` | Lines 139-152 assert Guidance Oath density order; lines 179-199 assert Sealed compact local-lens behavior. | Public density profiles retire; quiet rule should be independent of profile. | Split into migration compatibility and `localOmenLensQuietIsSilent.test.ts`. | V2-3/V2-8/V2-11 |
| `tests/contracts/daoMandateVisibilityContract.test.ts` | Lines 76-137 assert Sealed/Elder/Jade ledger density. | Useful internal raw-engine behavior, stale as public strategy contract. | Keep only if explicitly dev/debug compatibility; replace public expectations with bounded Omen Projection. | V2-1/V2-3/V2-11 |
| `tests/contracts/daoMandateSourceMapVisibility.test.ts` | Lines 106-118 assert Sealed/Elder/Jade source map detail. | Source threads should be closed by default and opened by inspect/detail context. | Rewrite as source thread closed/open eligibility contract. | V2-2/V2-9/V2-11 |
| `tests/contracts/daoMandateRecentOmensContract.test.ts` | Lines 70-90 assert Sealed/Elder/Jade recent omens density. | V2 wants only meaningful changes, not strategy-profile density. | Rewrite to meaningful-change filtering independent of public profile labels. | V2-1/V2-11 |
| `tests/contracts/localMandateLensSurfaceContract.test.ts` | Lines 257-287 assert quiet hides under visibility helper but Elder/Jade still expose support relations. | Good quiet-null base; support detail should move to inspect/source drawers. | Keep quiet-null assertion; rewrite support/Jade density into source drawer tests. | V2-8/V2-9/V2-11 |
| `tests/contracts/worldMandateLensContract.test.ts` | Lines 139-158 keep Elder/Jade support detail without promoting quiet modules. | Support detail should not be profile-driven in default local banners. | Rewrite to explicit inspect/detail policy. | V2-8/V2-9 |
| `tests/contracts/cultivationMandateLensContract.test.ts` | Lines 81-92 expect compact Cultivation Mandate lens but also `RequirementLedger`. | Cultivation should become compact omen/proof, not ledger-heavy. | Rewrite to compact Cultivation Omen contract and keep route actions only for breakthrough/gate legal states. | V2-6/V2-11 |
| `tests/contracts/prestigeScreenHonesty.test.ts` | Does not forbid `runCompassHint`, `Primary Route`, or `Mandate Context`. | Missing regression guard for Prestige silence. | Add `prestigeSilenceRule.test.ts`. | V2-10 |
| `tests/contracts/daoMandateP8VocabularyDecommissionContract.test.ts` | Lines 32-43 ban old P8 labels but not `Primary Route`, `Open Apothecary`, or `Mandate points elsewhere`. | V2 copy guard needs a stronger default-UI forbidden list. | Extend or replace as `daoOmenCopyGuard.test.ts`. | V2-2/V2-11 |

## Proposed future V2 contract tests

| Future test file | Purpose | Packet | Notes |
| --- | --- | --- | --- |
| `tests/contracts/daoOmenProjectionContract.test.ts` | Raw states produce one current omen, bounded proof seals, bounded pressure badges, and no default route unless allowed. | V2-1 | Create after projection types/fixtures exist. |
| `tests/contracts/daoOmenDirectRouteEligibility.test.ts` | Direct routes appear only for setup, hard lock, repeated failure, safety net, breakthrough, reincarnation/cap, or expanded detail. | V2-2 | Should use explicit fixture matrix and negative ordinary-pressure cases. |
| `tests/contracts/daoOmenCopyGuard.test.ts` | Default Status/Cultivation do not show route-led commands for ordinary pressure. | V2-2/V2-5 | Ban `Primary Route`, `Best Next Action`, `Biggest Shortfall`, `Mandate points elsewhere`, ordinary `Open ...` commands in first-layer UI. |
| `tests/contracts/statusV2LayoutContract.test.ts` | Default Status renders Status V2 layout and does not render MandateChamberHero/full ledgers. | V2-5 | Should assert identity hero, metric strip, bounded diagnostic cards. |
| `tests/contracts/settingsGuidanceRetirement.test.ts` | Settings no longer exposes public strategy profiles; old save values still load safely. | V2-3 | Should keep migration truth without public density controls. |
| `tests/contracts/localOmenLensQuietIsSilent.test.ts` | Quiet relation renders null/no banner and never says points elsewhere. | V2-8 | Build on existing quiet-null tests. |
| `tests/contracts/prestigeSilenceRule.test.ts` | Prestige does not show live-run `Primary Route` / `Mandate Context` unless reincarnation/cap context is relevant. | V2-10 | Current prestige tests do not cover this. |
| `tests/contracts/cultivationCompactOmenContract.test.ts` | Cultivation shows compact omen/proof only. | V2-6 | Should forbid full ledger in default compact threshold lens. |
| `tests/contracts/gateTrialDetailOwnershipContract.test.ts` | Full readiness/failure/source detail remains in Gate Trial, not Status. | V2-7 | Gate Trial currently has readiness rail/fail-safe/failure-detail ownership to preserve. |

## Screenshot / audit infrastructure found

| Script/file | Purpose | Future packet |
| --- | --- | --- |
| `playwright.config.ts` | E2E browser config with Vite web server, screenshots on failure, reduced motion. | V2-5/V2-12 |
| `tests/e2e/menu-interactions.spec.ts` | Browser interaction audit with screenshot evidence helper. | V2-5/V2-12 |
| `scripts/release/capturePhase0CoreEvidence.ts` | Repo-native core-screen capture harness. | V2-5/V2-12 |
| `scripts/release/validatePhase0CoreEvidence.ts` | Validates phase-0 core evidence. | V2-12 |
| `scripts/release/capturePhase6CombatEvidence.ts` and `validatePhase6CombatEvidence.ts` | Combat/exact-screen evidence capture and validation. | V2-7/V2-12 |
| `scripts/release/auditVocabulary.ts` | Vocabulary audit. | V2-2/V2-11 |
| `docs/release/qa/ui-cutover/status` and `docs/release/qa/ui-cutover/phase-0-core-screens/03-status` | Existing evidence folders for Status-related visual QA. | V2-5/V2-12 |

## Known risks before V2-1

- The raw `DaoMandateSurfaceV1` and Run Compass route labels should stay internally available for now; deleting them early would destroy source truth instead of creating a projection.
- Existing tests strongly encode the old route-led Status chamber and Guidance Oath density profiles. Future packets must rewrite tests in the same packet that changes behavior.
- The local quiet rule has a partial implementation (`quiet` returns null through `applyLocalMandateLensVisibility`) but source/local detail strings still contain points-elsewhere copy.
- Prestige currently receives live Run Compass hints even when reincarnation/cap context is not necessarily relevant.
- Broad `test:contracts` was not run in V2-0. Prior P8 evidence already recorded broad contract debt, so V2 packets should use targeted tests first and separate pre-existing debt from packet regressions.
- Browser screenshots were not captured in V2-0. V2-5 and V2-12 need fresh Status/Settings/Prestige/local screenshots once UI behavior changes.

## Future V2 packet roadmap

1. V2-1 - Omen Projection type contract and fixtures.
2. V2-2 - Direct-route policy and copy guard.
3. V2-3 - Guidance Oath retirement and settings migration.
4. V2-4 - Shared Omen UI components, tokens, and reduced motion.
5. V2-5 - Status V2 surface and layout recovery.
6. V2-6 - Cultivation compact omen integration.
7. V2-7 - Gate Trial detail ownership and reflection handoff.
8. V2-8 - Local Omen Lens rewrite and World quiet rule.
9. V2-9 - Module-local source drawers and role stamps.
10. V2-10 - Prestige silence rule.
11. V2-11 - Vocabulary, stale test, and old-guide decommission.
12. V2-12 - Visual QA, accessibility, and release evidence.

## V2-0 merge decision

GO for proceeding to V2-1: yes.

Reason: V2-0 added the required AGENTS guardrails, created this detailed inventory, mapped stale tests/copy/render-tree risks to future packets, preserved production UI and gameplay behavior, did not delete or weaken tests, and passed `npm run typecheck`, `npm run check:icons`, and test TypeScript compile. This GO is only for starting V2-1; it is not a release-readiness claim and does not mean the current player-facing Dao Mandate UI is acceptable.
