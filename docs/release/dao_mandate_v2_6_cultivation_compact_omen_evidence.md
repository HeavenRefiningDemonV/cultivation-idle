# Dao Mandate V2-6 Cultivation Compact Omen Evidence

## Previous packet preflight
- V2-0: PASS. Evidence: `AGENTS.md` includes Dao Mandate V2 guardrails; `docs/release/dao_mandate_v2_test_inventory.md` exists and lists stale route-led Status, Guidance Oath density, quiet-copy, source-map visibility, and Prestige route-ribbon tests.
- V2-1: PASS. Evidence: Omen Projection types, builder, fixtures, export barrel, contract test, and `docs/release/dao_mandate_v2_1_projection_evidence.md` are present.
- V2-2: PASS. Evidence: direct-route/copy policy modules and contracts are present; forbidden default route commands remain guarded by tests.
- V2-3: PASS. Evidence: guidance retirement evidence is present; Settings scans showed old `sealed`/`elder`/`jade` values only in compatibility/test contexts.
- V2-4: PASS. Evidence: shared Omen components, SCSS tokens, fixtures, contract, and evidence are present; purity scan found no store/service/gameplay imports in shared Omen components.
- V2-5: PASS. Evidence: Status V2 source, contract, screenshot artifacts, and evidence are present; Status V2 default render uses recovered V2 layout and does not render raw chamber ledgers.
- Decision: GO_FOR_V2_6.
- Preflight repairs: none.

## Scope completed
- Changed files: Cultivation exact surface types, builder, pure screen renderer, SCSS, and action controller.
- New files: `tests/contracts/cultivationCompactOmenContract.test.ts`, this evidence file, and V2-6 screenshot artifacts.
- Tests added: compact omen contract for projection surface, default renderer, bounded proof seals, route policy, and forbidden copy.
- Tests rewritten: stale Cultivation Mandate lens contract now enforces V2 compact Omen expectations.
- Tests retired: old P4 expectations for default `MandateSeal`, default `RequirementLedger`, default `SourceRouteSlip`, and profile-expanded proof ledger behavior.

## Cultivation compact omen result
- Projection source: `buildCultivationExactSurface.ts` builds raw Dao Mandate truth internally, then calls `buildDaoOmenProjectionV1(..., { currentScreen: 'cultivation', routeContext: 'default' })`.
- Default components: `CultivationExactScreen.tsx` renders `OmenSeal` and `ProofSealRow` in `data-region="cultivation-compact-omen"`.
- Proof seals shown: threshold-relevant seals only, capped to three by default; fallback seals are Qi Threshold, Realm Edge/Current Threshold, Gate Proof, and reincarnation only for cap handoff.
- Direct-route policy: Omen action is absent for ordinary threshold/Qi-short states; Gate Trial and Prestige routes are only surfaced through allowed projection hard routes; breakthrough stays in the local command deck.
- Drawer/detail behavior: `Inspect proof` opens the local drawer; `SourceThreadDrawer` is mounted only inside that detail layer and remains closed by default.
- Removed old default components: default Cultivation no longer renders `MandateSeal`, `RequirementLedger`, `ReadinessLedger`, or `SourceRouteSlip`.

## No-dashboard / no-duplication result
- No default MandateSeal: PASS.
- No default RequirementLedger: PASS.
- No default SourceRouteSlip: PASS.
- No full readiness table: PASS.
- No Status V2 grid clone: PASS.
- No Guidance Oath strategy labels: PASS.

## Copy policy result
- No default Cultivate Qi route command in Omen copy: PASS.
- No Open Apothecary/Open Forge/Tune Techniques default route commands: PASS.
- Gate proof hard-lock action: PASS, allowed through projection hard route / command deck.
- Breakthrough-ready handoff: PASS, `Break Through` remains local command deck primary when ready.
- Content-cap handoff: PASS, Prestige route remains projection-gated.

## Accessibility and motion result
- Icon + label + text: PASS. `OmenSeal` and `ProofSealRow` expose visible labels, state text, and icon surfaces.
- Focus-visible: PASS. Cultivation SCSS includes focus-visible styling for Omen action, proof inspect, and source thread toggle controls.
- Keyboard drawer behavior: PASS. Browser QA opened the drawer through the accessible `Inspect threshold proof` button.
- Reduced motion: PASS. Browser/Playwright reduced-motion capture confirmed `uiAuditReducedMotion` and the compact Omen remains visible.
- No color-only state: PASS. Proof seals include labels, details, and state text.
- No hover-only truth: PASS. Omen and proof details are visible or available through keyboard-reachable drawer controls.

## Browser / visual evidence
- Browser plugin used: yes, for DOM inspection and drawer interaction on `http://127.0.0.1:5175`.
- URL/port: `http://127.0.0.1:5175/?uiAudit=phase-0&surface=cultivation&slot=base&fx=high&controls=0&cultivationExactMode=fixture`.
- Screenshot paths:
  - `docs/release/qa/ui-cutover/cultivation/after/v2-6-default-cultivation.png`
  - `docs/release/qa/ui-cutover/cultivation/after/v2-6-fixture-cultivation.png`
  - `docs/release/qa/ui-cutover/cultivation/after/v2-6-proof-drawer-open.png`
  - `docs/release/qa/ui-cutover/cultivation/after/v2-6-reduced-motion.png`
  - `docs/release/qa/ui-cutover/cultivation/after/v2-6-browser-observations.json`
- DOM observations: compact Omen, OmenSeal, ProofSealRow, center altar, Qi rail, command deck, and breakthrough seal were present; proof seal count was three; forbidden copy list was empty.
- Reduced-motion observation: reduced-motion audit route preserved the compact Omen and reported `uiAuditReducedMotion: true`.
- Known visual limitations: Browser screenshot capture timed out on full-page capture, so screenshots were saved through a Playwright viewport capture against the same local dev server and audit routes.

## Plugin usage
- Browser: used for local DOM verification and drawer interaction; screenshot save path fell back to Playwright after Browser full-page screenshot timeout.
- Linear: not used; no issue context was required for this local packet.
- Game Studio: not used; scoped implementation and screenshot review were sufficient.
- Superpowers: used for skill workflow/TDD discipline.
- GitHub: not used; no PR/CI operation was requested.
- Sentry: not used; Browser console had no packet-specific runtime errors.
- CodeRabbit: not used; no review request or PR handoff was requested.
- HyperFrames: not used; video evidence was not needed.
- Codex Security: not used; scoped source scans found no unsafe DOM or gameplay mutation path in the pure screen.

## Commands run
| Command | Result | Notes |
| --- | --- | --- |
| `git status --short` | PASS | Initial preflight state was clean before V2-6 edits. |
| Preflight artifact/source scans from prompt sections 0.1-0.6 | PASS | V2-0 through V2-5 artifacts present; V2-4 purity scan returned no gameplay/store imports. |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | Pre-edit baseline and post-edit compile passed. |
| `npm run typecheck` | PASS | TypeScript app compile passed. |
| `npm run check:icons` | PASS | No emoji icon usage found. |
| `npm run validate:content` | PASS | Content validation passed with normal content count output. |
| `node --test tests/contracts/cultivationCompactOmenContract.test.ts tests/contracts/cultivationMandateLensContract.test.ts` | FAIL | Expected runner mismatch during TDD red step; direct TS tests cannot resolve generated JS imports without the repo loader/tmp-tests path. |
| `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/cultivationCompactOmenContract.test.js tmp-tests/tests/contracts/cultivationMandateLensContract.test.js` | FAIL | Intentional TDD red after tests were written first; old P4 implementation failed new V2-6 assertions before production edits. |
| Focused V2-6/daoOmen/statusV2 compiled contract set | PASS | 58 tests passed, 0 failed. |
| `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/CultivationExactLiveSurface.contract.test.js tmp-tests/tests/contracts/cultivationCompactOmenContract.test.js tmp-tests/tests/contracts/cultivationMandateLensContract.test.js` | PASS | 13 tests passed after final cleanup. |
| `npm run test:contracts -- --test-name-pattern "daoOmen\|cultivation\|Cultivation\|statusV2\|guidanceRetirement"` | FAIL | Command did not stay limited in this shell and pulled broad unrelated contracts; first failures were existing `CityMapHub`, `statusToneUtils`, and `trialLifecycle` issues. |
| `node --loader=./scripts/relativeJsLoader.mjs --test --test-name-pattern '(daoOmen\|cultivation\|Cultivation\|statusV2\|guidanceRetirement)' tmp-tests/tests/contracts/**/*.js` | FAIL | 448 passed, 3 failed in `cultivationConsumables.test.js`; failures stop in existing `[PavilionContent] manifest root must be an object` content validation before V2-6 UI code. |
| Source scans after V2-6 | PASS | Old raw/default component hits are internal raw-builder or forbidden-test assertions only; forbidden Cultivation copy scan returned no production matches; pure screen gameplay mutation scan returned no matches. |
| Browser DOM inspection on port 5175 | PASS | Compact Omen/proof row present, drawer opens, source threads folded, no forbidden route-led copy. |
| Playwright viewport screenshot capture | PASS | Four V2-6 screenshots and observation JSON written under `docs/release/qa/ui-cutover/cultivation/after/`. |
| `npm run build` | PASS | Production build passed; Vite reported only existing asset/chunk-size/browserlist warnings. |

## Current blockers
- None blocking V2-6 targeted GO.
- Broad filtered contract run still has unrelated content-test failures in `cultivationConsumables.test.js`: `[PavilionContent] manifest root must be an object`.

## Deferred / not done
- No bespoke screenshot harness was added for every projection state. Gate-proof-missing, breakthrough-ready, and content-cap behavior are covered by contract tests; visual screenshots use live/fixture/default/reduced/drawer audit states.
- No Status V2 files were changed.
- No gameplay owners, content JSON, reward/combat/trial/prestige services, or save migration files were changed.

## Final decision
GO
