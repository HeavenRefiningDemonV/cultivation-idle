# Release Sign-off Sheet

## Release candidate identity
- generatedAt: 2026-03-27T14:20:00.000Z
- releaseDecision: GO
- cleanPass: false
- acceptedWaiverCount: 1
- unresolvedBlockerCount: 0
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
| `build_audit` | pass | `npm run release:build-audit:json` | stub | 0 | 0 |
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
  - normal: automated=pass, manual=pass
  - cautious: automated=pass, manual=pass
  - aggressive: automated=pass, manual=pass
- Route classes (fail_safe/offline_heavy/low_attention/high_skill/reclaim):
  - fail_safe: status=pass, automation=automated
  - offline_heavy: status=pass, automation=automated
  - low_attention: status=pass, automation=automated
  - high_skill: status=pass, automation=automated
  - reclaim: status=pass, automation=automated
- Automated proof source: `release:fresh-run-report` + `release:route-report`.
- Manual coverage source: `docs/release/qa/manual_results.example.json` and fresh-run manual ingestion in fresh-run report.

## Known issues / waivers
### Accepted waivers
| issue id | title | classification | owner | rationale | mitigation | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| waiver_build_npm_env_http_proxy_warning | unknown http-proxy | accepted_waiver | release_engineering | The warning is environment/tooling metadata and does not indicate product/runtime drift. | Track npm config cleanup outside the semester RC critical path. | docs/release/build_warning_inventory.md |

### Post-semester debt
| issue id | title | classification | owner | rationale | mitigation | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| none | none | none | none | none | none | none |

### Unresolved blockers
| issue id | title | classification | owner | rationale | mitigation | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| none | none | none | none | none | none | none |

## Sign-off owner fields
| owner area | reviewer name | decision/initials | date | notes |
| --- | --- | --- | --- | --- |
| Engineering |  |  |  |  |
| Progression/Content |  |  |  |  |
| Balance/Systems |  |  |  |  |
| QA/Release |  |  |  |  |

## Final decision
- RELEASE DECISION: GO
- reason: 1 accepted waiver active
- accepted waivers listed separately: 1
