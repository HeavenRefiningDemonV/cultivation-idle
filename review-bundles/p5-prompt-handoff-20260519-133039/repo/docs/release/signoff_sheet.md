# Release Sign-off Sheet

## Release candidate identity
- generatedAt: 2026-05-19T10:16:16.865Z
- releaseDecision: NO_GO
- cleanPass: false
- acceptedWaiverCount: 0
- unresolvedBlockerCount: 5
- pendingManualCount: 1
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
| `build_audit` | warning | `npm run release:build-audit:json` | build_audit completed with warnings. | 0 | 3 |
| `content_validation` | pass | `npm run validate:content` | Content validation passed. | 0 | 0 |
| `full_test_suite` | fail | `npm run test` | Full test suite failed. | 1 | 0 |

## Evidence summary: Progression / Fresh-run / Migration
| check id | status | evidence command/doc | summary | blockers | warnings |
| --- | --- | --- | --- | --- | --- |
| `progression_contract` | warning | `builder:buildProgressionContract + collectProgressionDiagnostics` | Progression diagnostics: 0 blockers, 4 warnings. | 0 | 4 |
| `fresh_run_acceptance` | pending_manual | `npm run release:fresh-run-report:json` | fresh_run_acceptance is pending manual coverage. | 1 | 3 |
| `migration_matrix` | pass | `npm run release:migration-matrix:json` | migration_matrix passed. | 0 | 0 |

## Evidence summary: Balance / Routes
| check id | status | evidence command/doc | summary | blockers | warnings |
| --- | --- | --- | --- | --- | --- |
| `balance_regression` | fail | `npm run balance:report:json` | balance_regression failed. | 1 | 0 |
| `route_comparison` | fail | `npm run release:route-report:json` | Adapter execution failed. | 1 | 0 |

## Evidence summary: Runtime diagnostics
| check id | status | evidence command/doc | summary | blockers | warnings |
| --- | --- | --- | --- | --- | --- |
| `runtime_diagnostics` | fail | `npm run release:runtime-diagnostics:json` | runtime_diagnostics failed with blocker findings. | 1 | 0 |

## Evidence summary: Vocabulary / Copy / Presentation
| check id | status | evidence command/doc | summary | blockers | warnings |
| --- | --- | --- | --- | --- | --- |
| `vocabulary_audit` | pass | `npm run release:vocab-audit:json` | vocabulary_audit passed. | 0 | 0 |

## Route summary
- Fresh-run (normal/cautious/aggressive):
  - normal: automated=pass, manual=missing
  - cautious: automated=not_run, manual=missing
  - aggressive: automated=not_run, manual=missing
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
| fresh_run_acceptance_fresh_run_manual_pending_required_manual_fres | fresh_run_manual_pending | blocker | from_check | Required manual fresh-run coverage is incomplete. | fix before GO | npm run release:fresh-run-report:json |
| balance_regression_balance_regression_command_failed_balance_regression_c | balance_regression_command_failed | blocker | from_check | balance_regression command returned non-zero exit code. | fix before GO | npm run balance:report:json |
| route_comparison_adapter_exception | adapter_exception | blocker | from_check | Cannot read properties of undefined (reading 'toLowerCase') | fix before GO | route_comparison |
| runtime_diagnostics_runtime_diagnostics_errors_runtime_diagnostics_ | runtime_diagnostics_errors | blocker | from_check | Runtime diagnostics reported 5 error-level findings. | fix before GO | npm run release:runtime-diagnostics:json |
| full_test_suite_test_suite_failed_npm_run_test_failed | test_suite_failed | blocker | from_check | npm run test failed. | fix before GO | npm run test |

## Sign-off owner fields
| owner area | reviewer name | decision/initials | date | notes |
| --- | --- | --- | --- | --- |
| Engineering |  |  |  |  |
| Progression/Content |  |  |  |  |
| Balance/Systems |  |  |  |  |
| QA/Release |  |  |  |  |

## Final decision
- RELEASE DECISION: NO_GO
- reason: 5 unresolved blockers remain; 1 pending-manual checks remain; 6 waiver-candidate findings are untracked/unaccepted
- accepted waivers listed separately: 6
