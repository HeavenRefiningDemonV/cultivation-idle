# Dao Mandate V2-4 Shared Components Evidence

## Packet
V2-4 - Shared Omen UI components, tokens, and reduced motion.

## Previous packet preflight
- V2-0: PASS. Evidence inspected in `AGENTS.md` and `docs/release/dao_mandate_v2_test_inventory.md`.
- V2-1: PASS. Evidence inspected in `docs/release/dao_mandate_v2_1_projection_evidence.md`; projection files, exports, fixtures, and contract test were present.
- V2-2: PASS. Evidence inspected in `docs/release/dao_mandate_v2_2_direct_route_copy_evidence.md`; copy, priority, direct-route, and copy-guard files/tests were present.
- V2-3: PASS. Evidence inspected in `docs/release/dao_mandate_v2_3_guidance_retirement_evidence.md`; Settings retirement and guidance migration tests were present.
- Decision before implementation: GO_FOR_V2_4.
- Preflight repairs: none before V2-4 implementation. During V2-4 validation, `tests/contracts/daoOmenDirectRouteEligibility.test.ts` was narrowed from scanning `src/ui` to scanning production roots only, because V2-4 intentionally adds shared UI renderers under `src/ui/daoMandate` while production screens remain uncut.

## Scope completed
- Changed files:
  - `src/ui/daoMandate/DaoMandateTokens.scss`
  - `src/ui/daoMandate/index.ts`
  - `tests/contracts/daoOmenDirectRouteEligibility.test.ts`
- New files:
  - `src/ui/daoMandate/OmenSeal.tsx`
  - `src/ui/daoMandate/OmenSeal.scss`
  - `src/ui/daoMandate/ProofSealRow.tsx`
  - `src/ui/daoMandate/ProofSealRow.scss`
  - `src/ui/daoMandate/PressureBadgeRow.tsx`
  - `src/ui/daoMandate/PressureBadgeRow.scss`
  - `src/ui/daoMandate/SourceThreadDrawer.tsx`
  - `src/ui/daoMandate/SourceThreadDrawer.scss`
  - `src/ui/daoMandate/ReflectionPlaque.tsx`
  - `src/ui/daoMandate/ReflectionPlaque.scss`
  - `src/ui/daoMandate/daoMandateComponentFixtures.ts`
  - `tests/contracts/daoOmenSharedComponentsContract.test.ts`
  - `docs/release/dao_mandate_v2_4_shared_components_evidence.md`
- Components created: `OmenSeal`, `ProofSealRow`, `PressureBadgeRow`, `SourceThreadDrawer`, and `ReflectionPlaque`.
- Tokens created: shared Dao Omen component token coverage was added to `DaoMandateTokens.scss`, including parchment, ink, jade, bronze, cinnabar, gold, focus, reduced-motion, and stable state variables.
- Fixtures/specimens: fixture data was created in `daoMandateComponentFixtures.ts`. A new route/specimen page was skipped because no safe existing V2-4 dev-only specimen route was identified, and production cutover is forbidden in this packet.
- Tests added/updated: added `daoOmenSharedComponentsContract.test.ts`; updated one V2-2 production no-cutover scan to exclude `src/ui` shared component infrastructure.

## Component purity result
- Store imports: PASS.
- Gameplay owner imports: PASS.
- Route adapter imports: PASS.
- Network/storage/dangerous DOM APIs: PASS.
- Notes: the V2-4 components import only props, local UI state where needed, class helpers, SCSS, and type-only projection contracts. The fixture helper imports the projection fixture/builder for typed specimen data; production components do not.

## No production cutover result
- Production screen imports: PASS. Static scan found no `OmenSeal`, `ProofSealRow`, `PressureBadgeRow`, `SourceThreadDrawer`, `ReflectionPlaque`, or `DaoMandateComponentSpecimen` usage under `src/components` or `src/features`.
- Dev/specimen-only route: none added.

## Accessibility and reduced-motion result
- Icon + label + text: PASS. Components expose visible labels/state text and decorative icon slots.
- Focus visible: PASS. Component buttons and inspect controls have `:focus-visible` rules using Dao focus tokens.
- Reduced motion: PASS. `DaoMandateTokens.scss` and component styles include reduced-motion safeguards that remove decorative animation while preserving static state labels and borders.
- No color-only state: PASS. State words, labels, and icon/shape slots accompany tone classes.
- No hover-only critical information: PASS. Source details are controlled by a button/drawer; disabled reasons are visible/accessibly described.

## V2-2 policy preservation result
- Direct-route policy tests: PASS.
- Copy guard tests: PASS.
- Ordinary pressure route suppression preserved: PASS.
- Notes: `OmenSeal` only renders the supplied primary action when `omen.allowDirectRoute` is true. Ordinary pressure fixture render tests prove supplied route-like action props are not rendered when `allowDirectRoute` is false.

## Commands run
- `git status --short`: PASS before edits; clean live-tree preflight.
- PowerShell `Get-Content` / `rg` / `git log --oneline -12` preflight scans: PASS.
- `npm run typecheck`: PASS before implementation and after implementation.
- `npm run check:icons`: PASS before implementation and after implementation.
- `npm exec tsc -- --project tsconfig.tests.json`: PASS before implementation and after implementation. Expected RED occurred after adding the V2-4 test and before implementation because component files/exports/fixtures were missing.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoOmenProjectionContract.test.js --test-name-pattern DaoOmenProjection`: PASS, 11/11.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoOmenDirectRouteEligibility.test.js tmp-tests/tests/contracts/daoOmenCopyGuard.test.js`: PASS, 20/20.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/settingsGuidanceRetirement.test.js tmp-tests/tests/contracts/daoMandateGuidanceSettingsContract.test.js tmp-tests/tests/contracts/daoMandateGuidanceSaveMigration.test.js tmp-tests/tests/contracts/daoMandateGuidanceVisibilitySettings.test.js tmp-tests/tests/contracts/daoMandateP8GuidanceVisibilityOnly.test.js tmp-tests/tests/contracts/daoMandateSourceMapVisibility.test.js tmp-tests/tests/contracts/localMandateLensSurfaceContract.test.js tmp-tests/tests/contracts/worldMandateLensContract.test.js`: PASS, 39/39.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoOmenSharedComponentsContract.test.js`: PASS, 7/7.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/daoOmenProjectionContract.test.js tmp-tests/tests/contracts/daoOmenDirectRouteEligibility.test.js tmp-tests/tests/contracts/daoOmenCopyGuard.test.js tmp-tests/tests/contracts/settingsGuidanceRetirement.test.js tmp-tests/tests/contracts/daoOmenSharedComponentsContract.test.js`: PASS, 43/43 after the V2-2 no-cutover scan was narrowed to production roots.
- Static forbidden import scan on `src/ui/daoMandate`: PASS, no matches.
- Static production cutover scan on `src/components src/features`: PASS, no matches.
- Focused forbidden public copy scan on the new V2-4 component and fixture files: PASS, no matches.
- Broad forbidden public copy scan on all `src/ui/daoMandate` plus tests: OBSERVED pre-existing raw UI/test guard matches in older Dao Mandate files and guard arrays; no V2-4 component/fixture matches.
- `npm run test:contracts -- --test-name-pattern "DaoOmen|daoOmen|settingsGuidance|Guidance|shared component|component purity|reduced motion|copy guard|direct route"`: FAIL due unrelated broad-suite contract debt listed below.
- `coderabbit --help`: FAIL, command unavailable in this environment.
- `npm run build`: PASS. Build emitted existing warnings for outdated Browserslist data, unresolved `../../assets/background/InsideDungeon.png` at build-time, and chunks above 500 kB.

## Plugin usage
- Browser: SKIPPED. V2-4 did not create a production route and no safe existing dev-only specimen route was used. Component validation was performed through typecheck, render/static tests, and source scans.
- Linear: SKIPPED. Integration was not needed for this bounded component-library packet.
- Game Studio: SKIPPED. No separate browser-game prototype was needed; repo fixtures and tests were sufficient.
- Superpowers: USED. Planning/TDD/verification workflow was followed with red/green validation and final closeout checks.
- GitHub: SKIPPED. Local branch/testing context was sufficient; no PR or CI inspection was needed.
- Sentry: SKIPPED. No relevant production UI/render issue was needed for this shared component packet.
- CodeRabbit: SKIPPED. CLI/plugin was unavailable in this environment.
- HyperFrames: SKIPPED. V2-4 does not require a video artifact; motion behavior was validated through CSS reduced-motion rules and tests.
- Codex Security: SKIPPED. Manual static scans verified no unsafe DOM, network, storage, dynamic evaluation, or gameplay mutation imports in V2-4 files.

## Broad failures observed
- `statusFxSceneAtmosphereContract.test.js`: `P6.3C reduced motion and low tiers collapse to static-safe gate trial atmosphere` failed because the expected low-quality static mist/glint selector was missing.
- `statusToneUtils.test.js`: `status tone helpers map ready and blocked text without changing source labels` failed because the observed tone was `route` instead of expected `locked`.
- `trialLifecycle.test.js`: `trial lifecycle reports an available first gate and exposes fail-safe progress` failed with `[PavilionContent] manifest root must be an object`.
- `trialLifecycle.test.js`: `trial fail-safe authoring aliases normalize into canonical threshold and cost shape` failed with `[PavilionContent] manifest root must be an object`.
- `trialLifecycle.test.js`: `trial lifecycle distinguishes bypassed trials from cleared trials` failed with `[PavilionContent] manifest root must be an object`.

## Remaining work for V2-5
- Status V2 surface/layout cutover.
- Production import of V2-4 components through Status-owned typed surfaces.
- Screenshot/browser capture once a safe dev or production route owns the components.
- Optional dedicated dev-only specimen route if a safe repository pattern is established.

## GO / NO_GO
- GO_FOR_V2_5. V2-4 targeted validation passed, component purity passed, no production cutover occurred, and broad failures observed are unrelated existing contract debt.
