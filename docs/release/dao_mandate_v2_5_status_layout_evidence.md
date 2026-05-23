# Dao Mandate V2-5 Status Layout Recovery Evidence

## Packet
V2-5 - Status V2 surface and layout recovery.

## Previous packet preflight
- V2-0: PASS. Evidence: `AGENTS.md` exists with Dao Mandate V2 guardrails; `docs/release/dao_mandate_v2_test_inventory.md` exists and inventories stale Status chamber, Guidance Oath, local quiet-copy, source-map, and Prestige route-ribbon gaps. V2-0 evidence states production UI and gameplay behavior were not changed.
- V2-1: PASS. Evidence: projection types, builder, fixtures, export barrel, focused contract, and release evidence are present. `DaoOmenProjectionV1` includes current omen, bounded proof seals, bounded pressure badges, recent omens, reflections, source threads, and hard routes. Focused projection contract passed before V2-5 edits.
- V2-2: PASS. Evidence: direct-route and copy modules/tests/evidence are present. Focused direct-route and copy guard contracts passed before V2-5 edits; ordinary pressure route commands remain confined to fixtures, forbidden-pattern constants, legacy internals, tests, or docs.
- V2-3: PASS. Evidence: guidance retirement evidence and Settings retirement contract are present. Settings no longer imports or renders `DAO_GUIDANCE_OATH_OPTIONS`; old `sealed`, `elder`, and `jade` values remain compatibility-only. Focused Settings retirement contract passed before V2-5 edits.
- V2-4: PASS. Evidence: shared Omen component files, token SCSS, fixtures, contract, and release evidence are present. Purity scan found no store/service/gameplay imports in shared Omen components. Pre-cutover production scan found no `OmenSeal`, `ProofSealRow`, `PressureBadgeRow`, `SourceThreadDrawer`, or `ReflectionPlaque` imports in `src/components` or `src/features`. Focused shared component contract passed before V2-5 edits.
- Decision before implementation: GO_FOR_V2_5.
- Preflight repairs: None.

## Scope completed
- Changed files: `src/components/screens/StatusScreen.tsx`, `src/components/screens/StatusScreen.scss`, `src/dev/phase0CoreAudit/Phase0CoreAuditHarness.tsx`, `src/systems/ui/status/statusDashboardSurface.ts`, `src/systems/ui/status/statusTroubleshootingSurface.ts`, focused Status/stale-contract tests.
- New files: `src/systems/ui/status/statusV2Surface.ts`, `tests/contracts/statusV2LayoutContract.test.ts`, this evidence file, V2-5 screenshot files under `docs/release/qa/ui-cutover/status/after/`.
- Deleted/retired files: none. The old chamber components remain available for legacy/debug imports outside default Status.
- Tests added: `tests/contracts/statusV2LayoutContract.test.ts`; a Status surface no-mutation regression in `tests/contracts/statusDashboardSurface.test.ts`.
- Tests rewritten: `tests/contracts/statusMandateChamberContract.test.ts`, `tests/contracts/statusDashboardSurface.test.ts`, stale Status assertions in lesson cadence, layout stability, menu polish, proof normalization, and shared component contracts.
- Tests retired: old default Status Mandate Chamber expectations were inverted/retired in place.

## Status V2 surface result
- Surface builder path: `src/systems/ui/status/statusV2Surface.ts`.
- Omen projection source: `buildStatusDashboardSurface()` builds raw `DaoMandateSurfaceV1`, then `buildStatusV2Surface()` calls `buildDaoOmenProjectionV1(rawMandate, { currentScreen: 'status', routeContext: 'default' })`.
- Identity hero data source: existing Status troubleshooting/game/cultivation/city truth plus projected current omen.
- Metrics data source: existing Status combat metric builder output.
- Current work data source: existing active activity, combat, bounty, expedition, and profession queue read models, capped to four useful rows.
- Drawer data source: projection proof seals, source threads, and reflections.
- Debug/fallback notes: preserved through `statusV2.meta.debugNotes`; display builders now read trial progress without creating `TrialStore` entries.

## Status render tree result
- V2 root present: PASS, `.statusV2Root` / `data-testid="status-v2-root"`.
- Identity hero present: PASS, `data-testid="status-v2-hero"`.
- Metrics strip present: PASS, `data-testid="status-v2-metrics"`.
- Six-card grid present: PASS, `data-testid="status-v2-grid"` with six `status-v2-card-*` cards.
- Current Omen card present: PASS.
- Gate Proof card present: PASS.
- Life Identity card present: PASS.
- Preparation Health card present: PASS.
- Current Work card present: PASS.
- Recent Omens card present: PASS.
- Detail drawer present: PASS, `.statusV2DrawerLayer` with closed source-thread/reflection/proof detail until player action.

## Removed old default Status stack
- MandateChamberHero default removed: PASS.
- RequirementLedger default removed: PASS.
- ReadinessLedger default removed: PASS.
- SourceRouteSlip default removed: PASS.
- Public Primary Route label removed: PASS.
- Public Best Next Action label removed: PASS.
- Public Biggest Shortfall label removed: PASS.
- Public Guidance Oath strategy labels absent: PASS.

## Direct-route and copy policy result
- Ordinary medicine pressure does not show Open Apothecary by default: PASS by Status V2 source/copy contracts and screenshot DOM sweep.
- Ordinary forge pressure does not show Open Forge by default: PASS by Status V2 source/copy contracts and screenshot DOM sweep.
- Ordinary doctrine pressure does not show Tune Techniques by default: PASS by Status V2 source/copy contracts and screenshot DOM sweep.
- Threshold pressure does not show Cultivate Qi as default Status command: PASS by Status V2 source/copy contracts and screenshot DOM sweep.
- Allowed hard-lock/breakthrough/cap routes still supported: PASS through projection route policy and Status V2 action surfaces when `allowDirectRoute` or inspected detail policy permits.
- Drawer-inspected routes are clearly player-expanded: PASS; card/detail buttons open local drawer state before route actions are exposed.

## Accessibility and motion result
- Icon + label + text: PASS; cards, metrics, proof seals, pressure badges, work rows, and recent rows include icons/labels/text.
- Focus-visible: PASS; Status V2 SCSS includes focus-visible rules for buttons, cards, and drawer controls.
- Keyboard drawer open/close: PASS by native buttons, close button, and Escape handler in drawer layer.
- Reduced motion: PASS; Status V2 root and legacy Status FX compatibility selectors include reduced-motion rules. Reduced-motion screenshot captured.
- No color-only state: PASS; statuses include labels/text/icons in addition to tone classes.
- No hover-only truth: PASS; drawer/detail controls are visible and keyboard reachable.

## Visual QA / Browser evidence
- Browser plugin used: yes for in-app DOM verification; supplemental headless Playwright used for screenshots.
- URL/port: `http://127.0.0.1:5174/`. Vite used 5174 because 5173 was already occupied.
- Screenshot paths:
  - `docs/release/qa/ui-cutover/status/after/v2-5-default-status.png`
  - `docs/release/qa/ui-cutover/status/after/v2-5-medium-width.png`
  - `docs/release/qa/ui-cutover/status/after/v2-5-drawer-open.png`
  - `docs/release/qa/ui-cutover/status/after/v2-5-reduced-motion.png`
- DOM observations: each capture found root=1, hero=1, metrics=1, grid=1, cards=6, oldChamberHero=0, forbiddenVisible=[]; drawer-open capture found drawer=1. No story, life-start, or migration overlays blocked the audit route.
- Reduced-motion observation: reduced-motion capture kept the same V2 DOM with no console errors.
- Medium-width observation: 1440x900 capture kept six cards and no old guide labels.
- Known visual limitations: normal app navigation was blocked by a persisted local migration-warning modal during in-app Browser exploration; the phase-0 audit route was used for deterministic Status screenshots after clearing audit overlays.

## Plugin usage
- Browser: used for local DOM verification; Playwright used for screenshot capture.
- Linear: not used; no Linear issue lookup was required to complete the bounded packet.
- Game Studio: not used.
- Superpowers: used for planning/TDD/debugging/verification workflow discipline.
- GitHub: not used; no PR/CI update was requested.
- Sentry: not used; no runtime exception remained after local browser verification.
- CodeRabbit: not used.
- HyperFrames: not used.
- Codex Security: not used; source scans confirmed no unsafe DOM/network additions in V2-5 Status files.

## Commands run
| Command | Result | Notes |
| --- | --- | --- |
| `git status --short` | PASS | No initial output. |
| `node -e "const p=require('./package.json'); ..."` | PASS | Listed typecheck, icons, tests, content, build, and capture/audit scripts. |
| previous packet artifact presence scan | PASS | Required V2-0 through V2-4 artifacts present. |
| V2-4 purity scan | PASS | No matches in shared Omen components. |
| V2-4 production pre-cutover scan | PASS | No shared Omen component imports in `src/components` or `src/features`. |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | Test TypeScript compiled before Status edits. |
| focused V2-1/V2-2/V2-3/V2-4 contracts | PASS | 43 tests passed before Status edits. |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | Recompiled after implementation. |
| focused Status/V2 contracts | PASS | `statusV2LayoutContract`, `statusMandateChamberContract`, `statusDashboardSurface`, `daoOmenSharedComponentsContract`, and `statusFxSceneAtmosphereContract`: 22 tests passed. |
| focused V2 packet contracts | PASS | Projection, direct-route/copy, shared components, Settings retirement, Status V2, Status surface, old chamber retirement, and Status FX: 57 tests passed. |
| `npm run typecheck` | PASS | `tsc --noEmit` completed. |
| `npm run check:icons` | PASS | No emoji icon usage found. |
| `npm run validate:content` | PASS | Content validation passed; existing content validation warning logs about technique/pavilion pool counts were informational. |
| Browser visual QA | PASS | In-app Browser confirmed `status-v2-root`; Playwright captured four V2-5 screenshots with no console errors. |
| `npm run build` | PASS | Production build completed. Existing warnings: Browserslist data age, unresolved runtime background asset reference for `InsideDungeon.png`, and large chunk size warning. |
| `npm run test:contracts` | FAIL | Broad suite attempted. First attempt hit transient Windows `TS5033` writes in `tmp-progression-fixtures`; after stopping the dev server, fixture build passed and the suite reached existing unrelated failures such as `scenicLabelCityMapHubContract`, stale generated `statusToneUtils`, and `trialLifecycle` pavilion manifest errors. Targeted V2-5 contracts passed. |
| final Status no-regression scans | PASS | `StatusScreen.tsx` has no old chamber imports; `StatusScreen.tsx` + `statusV2Surface.ts` have no forbidden public copy, gameplay-owner imports, `setState`, or `getProgress()` calls. Legacy labels remain only in old compatibility fields not consumed by Status V2. |

## Current blockers
- Broad `npm run test:contracts` remains red due existing non-Status failures outside V2-5 scope. Targeted V2-5 checks, typecheck, icons, content validation, build, and browser screenshot evidence pass.

## Deferred / not done
- Item: broad contract-suite cleanup.
- Why deferred: failures are outside V2-5 Status cutover scope and include stale/non-Status contracts.
- Owner/source truth: owning screen/content packets for City Map Hub, stale Status tone generated contract cleanup, and trial lifecycle/pavilion content validation.
- Suggested verification: run `npm run test:contracts` after those owning areas are repaired.

## Final decision
GO
