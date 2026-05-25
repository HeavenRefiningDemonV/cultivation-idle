# Dao Mandate V2-11 Vocabulary / Stale Test / Old-Guide Decommission Evidence

Generated: 2026-05-24T00:42:09+03:00
Branch: Latest
Commit: 4aaf0ccf
Packet: V2-11 - Vocabulary, stale test, and old-guide decommission

## Executive verdict
- V2-11 targeted acceptance: GO
- Full release: NO_GO
- Summary: Active Dao Mandate V2 public/default vocabulary is now guarded by a classified release audit with zero blockers. Stale P8 vocabulary tests were rewritten as V2-11 decommission guards. Full release remains blocked by broad pre-existing contract debt and a release gate timeout.

## Previous-packet preflight
| Packet | Evidence doc | Focused checks | Result | Notes |
| --- | --- | --- | --- | --- |
| V2-0 | docs/release/dao_mandate_v2_test_inventory.md | AGENTS.md guardrails + inventory read | PASS | Root guardrails present; V2-0 used the inventory as evidence. |
| V2-1 | docs/release/dao_mandate_v2_1_projection_evidence.md | daoOmenProjectionContract | PASS | Projection model and fixtures remain present; raw surface preserved internally. |
| V2-2 | docs/release/dao_mandate_v2_2_direct_route_copy_evidence.md | daoOmenDirectRouteEligibility + daoOmenCopyGuard | PASS | Ordinary pressure still suppresses direct route commands by default. |
| V2-3 | docs/release/dao_mandate_v2_3_guidance_retirement_evidence.md | settingsGuidanceRetirement | PASS | Legacy Guidance Oath values remain compatibility-only. |
| V2-4 | docs/release/dao_mandate_v2_4_shared_components_evidence.md | daoOmenSharedComponentsContract | PASS | Shared Omen components remain pure render infrastructure. |
| V2-5 | docs/release/dao_mandate_v2_5_status_layout_evidence.md | statusV2LayoutContract | PASS | Default Status remains V2 old-layout recovered. |
| V2-6 | docs/release/dao_mandate_v2_6_cultivation_compact_omen_evidence.md | cultivationCompactOmenContract | PASS | Cultivation remains compact and threshold-owned. |
| V2-7 | docs/release/dao_mandate_v2_7_gate_trial_detail_ownership_evidence.md | gateTrialDetailOwnershipContract | PASS | Gate Trial detail ownership remains intact. |
| V2-8 | docs/release/dao_mandate_v2_8_local_omen_lens_evidence.md | localOmenLensQuietIsSilent | PASS | Quiet local modules remain silent. |
| V2-9 | docs/release/dao_mandate_v2_9_module_source_drawers_evidence.md | daoMandateProductionModuleSourceSinkSurfaces | PASS | Module source/provenance detail remains local/inspected. |
| V2-10 | docs/release/dao_mandate_v2_10_prestige_silence_evidence.md | prestigeSilenceRule | PASS | Prestige route-ribbon silence remains intact. |

Preflight notes:
- `git status --short` was dirty before V2-11 edits, including prior V2 docs/source/tests, QA artifacts, and generated `tmp-progression-fixtures`. These were treated as pre-existing local state.
- `npm exec tsc -- --project tsconfig.tests.json` passed before edits.
- Previous-packet focused preflight suite passed: 80 tests.
- Red-stage V2-11 target suite failed only in the stale P8 vocabulary contract because it scanned `daoOmenCopy.ts` forbidden-string guards as public UI.
- Plugin/tool availability: Browser, Linear, Game Studio callable tools, Sentry, CodeRabbit, HyperFrames, and Codex Security were not exposed in this run. GitHub tooling was discoverable but not used because no PR/CI task was requested.

## Files changed
- `src/services/diagnostics/release/vocabularyAudit.ts`
- `src/systems/ui/status/statusDashboardSurface.ts`
- `src/systems/ui/status/statusTroubleshootingSurface.ts`
- `src/ui/status/StatusSummaryHeader.tsx`
- `src/ui/daoMandate/daoMandateUiFormatters.ts`
- `src/features/pavilion/buildGeneratedPavilionRecords.ts`
- `src/features/pavilion/pavilionPresentation.ts`
- `src/features/world/gateTrialExact/buildGateTrialExactSurface.ts`
- `src/features/world/gateTrialExact/gateTrialExactPresentation.ts`
- `tests/contracts/daoMandateP8VocabularyDecommissionContract.test.ts`
- `tests/contracts/releaseVocabularyAudit.test.ts`
- `tests/contracts/daoMandateUiTokenContract.test.ts`
- `tests/contracts/moduleRoleBannerSurfaceContract.test.ts`
- `tests/integration/statusTroubleshootingSurfaceRuntime.test.ts`
- `docs/release/dao_mandate_v2_11_vocabulary_decommission_evidence.md`

## Old-guide vocabulary policy
- Forbidden public/default terms: Primary Route, Primary Obstruction, Best Next Action(s), Biggest Shortfall, Run Compass as public guide label, Guidance Oath strategy labels, Mandate Context, Mandate points elsewhere, and ordinary pressure route commands such as Open Apothecary, Open Forge, Open Techniques, Tune Techniques, Raise Forge Floor, Cultivate Qi.
- Allowed internal/debug/test/doc contexts: raw Run Compass/Dao Mandate adapters, Omen copy blocklists, fixtures, migration compatibility, historical evidence, negative tests, legacy component specimens.
- Public active roots scanned: Status, Settings, World, World modal, Status V2/dashboard/troubleshooting surfaces, Cultivation exact, Gate Trial exact, Prestige exact, Forge exact, Apothecary exact, Pavilion, Techniques exact, Bounties exact, Expeditions exact, local lens, module source/sink UI, Omen UI components, and `src/ui/status`.
- Internal allowlist: raw Run Compass V2/adapters, raw Dao Mandate V1/fixtures/source map/copy guards, legacy Mandate chamber components/specimens, legacy ModuleRoleBanner files.

## Stale tests updated or retired
| Test | Action | Replacement / rationale |
| --- | --- | --- |
| `daoMandateP8VocabularyDecommissionContract.test.ts` | Rewritten | Now uses classified V2-11 audit, guards Status/Settings/Prestige, ModuleRoleBanner quarantine, profile label retirement, and stale-test expectations. |
| `releaseVocabularyAudit.test.ts` | Expanded | Covers V2-11 report shape, public blocker fixture, docs/test exclusions, and internal raw route truth. |
| `daoMandateUiTokenContract.test.ts` | Updated | Old Sealed/Elder/Jade public labels now normalize to one sparse compatibility label. |
| `moduleRoleBannerSurfaceContract.test.ts` | Relabeled/tightened | Explicitly legacy internal-only; irrelevant modules stay silent with no route buttons. |
| `statusTroubleshootingSurfaceRuntime.test.ts` | Updated | Expects Current pressure and rejects old route-command top-fix copy. |

## Static scans
| Command | Result | Notes |
| --- | --- | --- |
| `rg -n "Primary Route|...|Cultivate Qi" src` | PASS with classification | Raw grep still finds owner/context/internal/test/audit strings. Classified audit has 0 blockers and 51 allowed internal/debug matches. |
| `rg -n "<MandateChamberHero|...|<ModuleRoleBanner" ...` | PASS with classification | No raw chamber stack or ModuleRoleBanner default mount. Remaining `RunCompassCompact`/legacy `RunCompass` mounts are in legacy non-exact panels, not Status/Prestige default V2 roots. |
| `rg -n "runCompassHint|useRunCompassSurface|Primary Route|Mandate Context|Run Compass" src/features/prestige src/components/screens/PrestigeScreen.tsx` | PASS | No Prestige matches. |
| `rg -n "Guidance Oath|Sealed Counsel|Elder's Counsel|Jade Slip Tutor" ...` | PASS with classification | Matches are comments/tests asserting retirement or compatibility; `SettingsScreen.tsx` is clean. |
| `rg -n "Mandate points elsewhere|points elsewhere|available, but the current Mandate" ...` | PASS | No production local quiet copy matches. |

## Tests run
| Command | Result | Notes |
| --- | --- | --- |
| `git status --short` | PASS | Dirty before edits; many unrelated/pre-existing local changes present. |
| `git branch --show-current` | PASS | `Latest`. |
| `git rev-parse --short HEAD` | PASS | `4aaf0ccf`. |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | Pre-edit and post-edit. |
| Previous-packet focused preflight suite | PASS | 80/80 tests passed. |
| Red-stage V2-11 stale target suite | FAIL expected | Only stale P8 vocabulary contract failed by treating `daoOmenCopy.ts` guard strings as public UI. |
| Focused V2-11 regression suite | PASS | 100/100 tests passed. |
| `npm run release:vocab-audit` | PASS | 0 stale findings, 0 placeholder findings, 0 Dao Mandate V2 blockers. |
| `npm run release:vocab-audit -- --fail-on-drift` | PASS | Classified drift gate passes. |
| `npm run release:vocab-audit:json` | PASS | JSON includes `dao-mandate-v2-11-vocabulary-audit`. |
| `npm run typecheck` | PASS | Production TypeScript compiles. |
| `npm run check:icons` | PASS | No emoji icon usage found. |
| `npm run validate:content` | PASS | Content validation passed. |
| `npm run build` | PASS | Vite build passed; pre-existing Browserslist/chunk-size/runtime asset warnings remain. |
| `npm run test:contracts` | FAIL | Broad suite has many unrelated failures: exact-screen stale contracts, PavilionContent manifest root errors, old Dao profile-density contracts, menu/ruins/outskirts debt. |
| `npm run test` | FAIL | Same broad-suite debt plus story/integration coverage. |
| `npm run progression:report` | PASS with warnings | Existing warnings: gate namespace split, offline pipeline split, hidden prestige runtime consumer, partial prestige reset. |
| `npm run release:gate -- --json` | FAIL/TIMEOUT | Timed out after about 244s. Full release remains NO_GO. |

## Browser / visual QA
- Browser plugin available: no callable Browser tool exposed in this run.
- Fallback used: source/static audit, focused contracts, typecheck, content validation, and production build.
- Screens checked: source/test coverage for Status, Settings, Prestige, Cultivation, Gate Trial, World/local lens, and module exact surfaces.
- Findings: no screenshot evidence was generated because V2-11 is a source/test/audit cleanup packet rather than a visual cutover, and Browser was unavailable.

## Plugin usage
| Plugin | Used? | Result / fallback |
| --- | --- | --- |
| Browser | No | Not callable/exposed; used source/tests/build fallback. |
| Linear | No | Not callable/exposed. |
| Game Studio | No | Not callable/exposed. |
| Superpowers | Yes | Used workflow discipline: preflight, TDD/red-stage classification, focused verification, completion check. |
| GitHub | No | Discoverable, but no PR/CI task requested; local checkout used. |
| Sentry | No | Not callable/exposed. |
| CodeRabbit | No | Not callable/exposed; manual audit/tests used. |
| HyperFrames | No | Not needed for V2-11 and not used. |
| Codex Security | No | Not callable/exposed; audit script reviewed manually for local deterministic file traversal and no shell/network execution. |

## Known failures / blockers
- Full release blocker: `npm run test:contracts` remains red across broad exact-screen and content-contract debt unrelated to V2-11.
- Full release blocker: `npm run test` remains red for the same broad debt.
- Full release blocker: `npm run release:gate -- --json` timed out after about 244s.
- Broad failure families observed: Gate Trial exact fixture expectations, Manual Pavilion exact visual contract, Outskirts exact and combat theater contracts, Ruins exact missing/stale files, PavilionContent manifest root validation, older Dao Mandate profile-density contracts, menu identity contracts, CityMapHub scenic label contract, status tone helper contract, and trial lifecycle content validation.

## Deferred items
- Full broad-suite/release-gate repair belongs outside V2-11.
- Legacy non-exact panels still mount `RunCompassCompact`/legacy `RunCompass` components. They are not Status/Prestige default peer guide surfaces and are excluded from the V2-11 targeted blocker audit, but they remain visible in raw mount grep for a future legacy-panel cleanup if desired.
- Browser screenshot/visible-text smoke can be done in a later visual QA packet when Browser tooling is available.

## Acceptance decision
- Targeted V2-11: GO because the classified V2-11 vocabulary audit passes with 0 blockers, focused V2-11/prior-packet regressions pass, stale tests no longer enforce old guide-board behavior, typecheck/check:icons/content/build pass, and no gameplay owner mutations were added.
- Full release: NO_GO because broad `test:contracts`/`test` are red and `release:gate -- --json` timed out.
