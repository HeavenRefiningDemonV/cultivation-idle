# Release Sign-off Sheet

## Release candidate identity
- generatedAt: 2026-05-09T11:36:55.662Z
- releaseDecision: NO_GO
- cleanPass: false
- acceptedWaiverCount: 0
- unresolvedBlockerCount: 1
- pendingManualCount: 0
- version: unknown
- buildId: unknown
- commit: unknown

## Slice summary
- semesterSliceId: semester_0
- semesterSliceLabel: Five-city / five-trial authored slice ending at Spirit Severing
- contentCapRealm: spirit_severing
- liveCityChain: city_pinewind_hamlet -> city_stonecrag_town -> city_spirit_cavern_city -> city_lotusford -> city_ironpeak_bastion
- liveGateCount: 5
- liveGateChain: trial_novices_clearing -> trial_stone_core_sanctum -> trial_patriarchs_seal -> trial_soul_lantern_vault -> trial_severing_court
- deferredSystems: none listed
- fakeCity6Detected: false

## Evidence summary: Build / Content / Test
| check id | status | evidence command/doc | summary | blockers | warnings |
| --- | --- | --- | --- | --- | --- |
| `build_audit` | fail | `npm run release:build-audit:json` | stub | 1 | 0 |
| `content_validation` | pass | `npm run validate:content` | stub | 0 | 0 |
| `full_test_suite` | pass | `npm run test` | stub | 0 | 0 |

## Evidence summary: Progression / Fresh-run / Migration
| check id | status | evidence command/doc | summary | blockers | warnings |
| --- | --- | --- | --- | --- | --- |
| `progression_contract` | pass | `builder:buildProgressionContract + collectProgressionDiagnostics` | stub | 0 | 0 |
| `fresh_run_acceptance` | pass | `npm run release:fresh-run-report:json` | stub | 0 | 0 |
| `migration_matrix` | pass | `npm run release:migration-matrix:json` | stub | 0 | 0 |

## Evidence summary: Balance / Routes
| check id | status | evidence command/doc | summary | blockers | warnings |
| --- | --- | --- | --- | --- | --- |
| `balance_regression` | pass | `npm run balance:report:json` | stub | 0 | 0 |
| `route_comparison` | pass | `npm run release:route-report:json` | stub | 0 | 0 |

## Evidence summary: Runtime diagnostics
| check id | status | evidence command/doc | summary | blockers | warnings |
| --- | --- | --- | --- | --- | --- |
| `runtime_diagnostics` | pass | `npm run release:runtime-diagnostics:json` | stub | 0 | 0 |

## Evidence summary: Vocabulary / Copy / Presentation
| check id | status | evidence command/doc | summary | blockers | warnings |
| --- | --- | --- | --- | --- | --- |
| `vocabulary_audit` | pass | `npm run release:vocab-audit:json` | stub | 0 | 0 |

## Route summary
- Fresh-run (normal/cautious/aggressive):
  - normal: automated=unknown, manual=unknown
  - cautious: automated=unknown, manual=unknown
  - aggressive: automated=unknown, manual=unknown
- Route classes (fail_safe/offline_heavy/low_attention/high_skill/reclaim):
  - fail_safe: status=unknown, automation=unknown
  - offline_heavy: status=unknown, automation=unknown
  - low_attention: status=unknown, automation=unknown
  - high_skill: status=unknown, automation=unknown
  - reclaim: status=unknown, automation=unknown
- Automated proof source: `release:fresh-run-report` + `release:route-report`.
- Manual coverage source: `docs/release/qa/manual_results.example.json` and fresh-run manual ingestion in fresh-run report.

## Known issues / waivers
### Accepted waivers
| issue id | title | classification | owner | rationale | mitigation | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| waiver_build_npm_env_http_proxy_warning | http-proxy | accepted_waiver | release_engineering | The warning is environment/tooling metadata and does not indicate product/runtime drift. | Track npm config cleanup outside the semester RC critical path. | docs/release/build_warning_inventory.md |
| waiver_build_node_experimental_loader_warning | experimental-loader | accepted_waiver | release_engineering | Node experimental-loader warnings are emitted by strip-types test/runtime wiring in this environment and are non-blocking for product correctness. | Remove loader warnings when Node/register migration is completed in follow-up tooling cleanup. | docs/release/build_warning_inventory.md |
| waiver_build_node_trace_warning_hint | trace-warnings | accepted_waiver | release_engineering | The trace-warnings hint line is emitted with experimental warnings and does not indicate a standalone build defect. | Treat as coupled noise with experimental-loader warnings until loader migration is complete. | docs/release/build_warning_inventory.md |
| waiver_build_css_syntax_minifier_warning | css-syntax-error | accepted_waiver | release_engineering | Current minifier warnings are stable non-fatal diagnostics from generated CSS token interpolation and do not fail build output generation. | Track style-pipeline cleanup separately; keep as explicit accepted warning while build remains green. | docs/release/build_warning_inventory.md |
| waiver_build_chunk_size_warning_limit | chunksizewarninglimit | accepted_waiver | release_engineering | Rollup chunk-size warning is advisory and expected for current bundle composition. | Track chunking optimization separately from release-blocking build correctness. | docs/release/build_warning_inventory.md |
| waiver_build_chunk_size_guidance_line | adjust chunk size limit | accepted_waiver | release_engineering | Chunk-size guidance text is a non-blocking advisory line emitted by Vite after successful build output. | Keep advisory tracked while bundle-splitting backlog is addressed. | docs/release/build_warning_inventory.md |

### Post-semester debt
| issue id | title | classification | owner | rationale | mitigation | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| debt_progression_gate_namespace_split | GATE_NAMESPACE_SPLIT | post_semester_debt | progression | Progression gate namespace wiring still has legacy split points that are known and non-blocking for this release. | Consolidate gate namespace ownership under progression contract runtime mirror and remove split aliases. | docs/progression-contract.md, docs/progression-fixtures.md |
| debt_progression_offline_pipeline_split | OFFLINE_PIPELINE_SPLIT | post_semester_debt | progression | Offline progression pipeline still traverses split legacy/runtime edges that are explicitly tracked as debt. | Unify offline progression pipeline with the same contract-backed progression path used in live runtime. | docs/progression-contract.md, docs/progression-fixtures.md |
| debt_progression_hidden_prestige_runtime_consumer | HIDDEN_PRESTIGE_RUNTIME_CONSUMER | post_semester_debt | progression | Hidden prestige runtime consumption paths exist as known legacy behavior and are tracked until migration cleanup lands. | Remove hidden prestige runtime consumer paths and enforce explicit prestige state reads through contract selectors. | docs/progression-contract.md, docs/progression-fixtures.md |
| debt_progression_partial_prestige_reset | PARTIAL_PRESTIGE_RESET | post_semester_debt | progression | Partial prestige reset residue is still observed in legacy fixtures and tracked as post-semester migration debt. | Complete prestige reset migration path and remove partial reset residue compatibility shims. | docs/progression-contract.md, docs/progression-fixtures.md |

### Unresolved blockers
| issue id | title | classification | owner | rationale | mitigation | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| build_audit_blocker | blocker | blocker | from_check | blocker | fix before GO | build_audit |
| build_audit_blocker | blocker | blocker | from_check | blocker | fix before GO | content_validation |
| build_audit_blocker | blocker | blocker | from_check | blocker | fix before GO | progression_contract |
| build_audit_blocker | blocker | blocker | from_check | blocker | fix before GO | fresh_run_acceptance |
| build_audit_blocker | blocker | blocker | from_check | blocker | fix before GO | migration_matrix |
| build_audit_blocker | blocker | blocker | from_check | blocker | fix before GO | balance_regression |
| build_audit_blocker | blocker | blocker | from_check | blocker | fix before GO | route_comparison |
| build_audit_blocker | blocker | blocker | from_check | blocker | fix before GO | runtime_diagnostics |
| build_audit_blocker | blocker | blocker | from_check | blocker | fix before GO | vocabulary_audit |
| build_audit_blocker | blocker | blocker | from_check | blocker | fix before GO | full_test_suite |

## Sign-off owner fields
| owner area | reviewer name | decision/initials | date | notes |
| --- | --- | --- | --- | --- |
| Engineering |  |  |  |  |
| Progression/Content |  |  |  |  |
| Balance/Systems |  |  |  |  |
| QA/Release |  |  |  |  |

## Final decision
- RELEASE DECISION: NO_GO
- reason: no go
- accepted waivers listed separately: 6
