# Onboarding Readiness

Generated: 2026-05-30T22:23:53.310Z

## Verdict

- Onboarding targeted: GO_WITH_KNOWN_BROAD_BLOCKERS
- Full release: NO_GO
- Reason: Onboarding targeted evidence is green, but broad release or manual/tooling blockers remain.

## Command Matrix

| Command | Result | Evidence |
|---|---:|---|
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | artifacts\mp6\preflight\onboarding-release\logs\01-tsconfig-tests.log |
| `npm run typecheck` | PASS | artifacts\mp6\preflight\onboarding-release\logs\02-typecheck.log |
| `npm run check:icons` | PASS | artifacts\mp6\preflight\onboarding-release\logs\03-check-icons.log |
| `npm run validate:content` | PASS | artifacts\mp6\preflight\onboarding-release\logs\04-validate-content.log |
| `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/onboardingMilestoneContract.test.js tmp-tests/tests/contracts/onboardingPolicy.test.js tmp-tests/tests/contracts/onboardingMilestoneSurface.test.js tmp-tests/tests/integration/onboardingMigration.test.js tmp-tests/tests/integration/onboardingModuleGating.test.js tmp-tests/tests/integration/onboardingUiState.test.js tmp-tests/tests/integration/onboardingFreshSaveFlow.test.js tmp-tests/tests/integration/onboardingSourceSinkGuards.test.js tmp-tests/tests/integration/onboardingGateGraduation.test.js tmp-tests/tests/integration/onboardingExistingSave.test.js` | PASS | artifacts\mp6\preflight\onboarding-release\logs\05-targeted-onboarding-suite.log |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | artifacts\mp6\final\onboarding-release\logs\tsconfig-tests.final.stdout.log |
| `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/onboardingReleaseMatrix.test.js tmp-tests/tests/contracts/onboardingNoSourceTruthDuplication.test.js` | PASS | artifacts\mp6\final\onboarding-release\logs\mp6-new-contract-tests.final.stdout.log |
| `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/onboardingMilestoneContract.test.js tmp-tests/tests/contracts/onboardingPolicy.test.js tmp-tests/tests/contracts/onboardingMilestoneSurface.test.js tmp-tests/tests/contracts/onboardingReleaseMatrix.test.js tmp-tests/tests/contracts/onboardingNoSourceTruthDuplication.test.js tmp-tests/tests/integration/onboardingMigration.test.js tmp-tests/tests/integration/onboardingModuleGating.test.js tmp-tests/tests/integration/onboardingUiState.test.js tmp-tests/tests/integration/onboardingFreshSaveFlow.test.js tmp-tests/tests/integration/onboardingSourceSinkGuards.test.js tmp-tests/tests/integration/onboardingGateGraduation.test.js tmp-tests/tests/integration/onboardingExistingSave.test.js` | PASS | artifacts\mp6\final\onboarding-release\logs\targeted-onboarding-suite.final.stdout.log |
| `npm run onboarding:release-matrix` | PASS | artifacts\mp6\final\onboarding-release\logs\onboarding-release-matrix.final.stdout.log |
| `npm run typecheck` | PASS | artifacts\mp6\final\onboarding-release\logs\typecheck.final.stdout.log |
| `npm run check:icons` | PASS | artifacts\mp6\final\onboarding-release\logs\check-icons.final.stdout.log |
| `npm run validate:content` | PASS | artifacts\mp6\final\onboarding-release\logs\validate-content.final.stdout.log |
| `npm run build` | PASS | artifacts\mp6\final\onboarding-release\logs\build.final.stdout.log |
| `npx playwright test tests/e2e/mp3-onboarding-ui-smoke.spec.ts --project=chromium` | PASS | artifacts\mp6\final\onboarding-release\logs\playwright-onboarding-ui-smoke.final.stdout.log |
| `npm run test:contracts` | FAIL | artifacts\mp6\final\onboarding-release\logs\test-contracts.final.stdout.log |
| `npm run release:gate:json` | FAIL | artifacts\mp6\final\onboarding-release\logs\release-gate-json.final.stdout.log |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | artifacts\mp6\final\onboarding-release\logs\post-readiness-tsconfig.final.stdout.log |
| `npm run onboarding:readiness` | PASS | artifacts/mp6/final/onboarding-release/logs/onboarding-readiness.write.final.log |

## Onboarding Release Matrix

- Artifact: artifacts/mp6/final/onboarding-release/onboarding-release-matrix.json
- Overall pass: true
- Blockers: 0
- Warnings: 0
- Rows: 16

## Tool Capability Status

# MP6 Tool Capability Status

Generated: 2026-05-31
Active packet: Mega Prompt 6 - QA Harness, Release Evidence, and Final Hardening

## Status

- Superpowers: AVAILABLE_USED
  - Evidence: loaded `using-superpowers`, `test-driven-development`, and `verification-before-completion`; local `cultivation-idle-closeout` workflow was also used.
- Browser: UNAVAILABLE_DEDICATED_TOOL_USE_PLAYWRIGHT_FALLBACK
  - Evidence: tool discovery did not expose a dedicated in-app Browser navigation/click/screenshot tool for this turn. Playwright fallback will be used for UI smoke evidence if MP6 reaches UI proof.
  - Claim boundary: no Browser evidence is claimed from Playwright fallback.
- Linear: UNAVAILABLE_NO_LINEAR_TOOL_OR_ENV
  - Evidence: tool discovery did not expose callable Linear issue/project tools.
- Sentry: UNAVAILABLE_NO_TOOL_OR_ENV
  - Evidence: tool discovery did not expose callable Sentry issue/event tools or project credentials.
- CodeRabbit: UNAVAILABLE_NO_CODERABBIT_TOOL
  - Evidence: tool discovery did not expose a CodeRabbit review tool. GitHub review tools surfaced, but no PR context was supplied and they are not CodeRabbit.
- Codex Security: UNAVAILABLE_NO_SCAN_TOOL_SKILL_ONLY
  - Evidence: security workflow skills exist, but no callable cloud/security scan tool was exposed. Local static scans can be run as fallback.
- Game Studio: UNAVAILABLE_NO_GAME_STUDIO_TOOL_SKILL_ONLY
  - Evidence: Game Studio skills exist, but no callable game QA tool surfaced. Playwright/local tests are the available fallback.
- HyperFrames by HeyGen: NOT_USED_OPTIONAL
  - Evidence: MP6 requires QA/release evidence, not a stakeholder video.



## Manual QA Script

1. Start a fresh first-life save and confirm LifeStart owns the foreground at M0.
2. Progress M1-M3 and verify only Cultivation, then Status, then World/Outskirts become reachable.
3. Try locked tabs and locked world modules at M3; they must not open in normal mode.
4. Progress M4-M8 and confirm Manual Pavilion, Techniques, Apothecary, Expeditions, Forge, Ruins, and Bounty Board unlock in order.
5. At M8, confirm Gate Trial can appear as teaser but cannot open before M9.
6. Lose one eligible Gate Trial attempt and confirm M9 remains active with a concrete top-fix route.
7. Clear or bypass the Gate Trial and confirm M10 activates without showing Foundation graduation early.
8. Complete Foundation breakthrough and confirm first-life onboarding becomes complete and the graduation card queues once.
9. Load a Foundation+ save and a second-life/reclaim save; neither should replay the full first-life route.
10. Confirm Settings/accessibility controls remain reachable while progression tabs are hidden.

## Screenshot And Manual Evidence Requirements

- Capture M0 through M10, Foundation+ migration, and second-life/reclaim states when Browser or Playwright evidence is available.
- Store generated screenshots and DOM/console summaries under `artifacts/mp6/final/onboarding-release/`.
- Do not claim Browser evidence when only Playwright fallback was used.

## Known Blockers

Release gate headline: NO_GO
Release gate rationale: 3 unresolved blockers remain; 1 pending-manual checks remain; 5 waiver-candidate findings are untracked/unaccepted
Release gate unresolved blockers: 3
Release gate pending manual checks: 1
Release gate untracked waiver candidates: 5

## Issue-ready blocker: broad_contract_suite_failed

- Severity: blocker
- Scope: broad_release
- Classification: broad_release
- Evidence: artifacts/mp6/final/onboarding-release/logs/test-contracts.final.stdout.log
- Recommended next action: Triage broad contract failures outside MP6; MP6 focused onboarding tests are green.
- Blocks onboarding targeted GO: No
- Blocks full release GO: Yes

## Issue-ready blocker: release_gate_fresh_run_acceptance

- Severity: blocker
- Scope: manual
- Classification: pending_manual
- Evidence: artifacts/mp6/final/onboarding-release/logs/release-gate-json.final.stdout.log
- Recommended next action: fresh_run_acceptance is pending manual coverage. Required manual fresh-run coverage is incomplete. Manual coverage missing for route normal. Manual coverage missing for route cautious. Manual coverage missing for route aggressive.
- Blocks onboarding targeted GO: No
- Blocks full release GO: Yes

## Issue-ready blocker: release_gate_migration_matrix

- Severity: blocker
- Scope: broad_release
- Classification: broad_release
- Evidence: artifacts/mp6/final/onboarding-release/logs/release-gate-json.final.stdout.log
- Recommended next action: migration_matrix failed with blocker findings. Migration matrix failed: current-save.
- Blocks onboarding targeted GO: No
- Blocks full release GO: Yes

## Issue-ready blocker: release_gate_full_test_suite

- Severity: blocker
- Scope: broad_release
- Classification: broad_release
- Evidence: artifacts/mp6/final/onboarding-release/logs/release-gate-json.final.stdout.log
- Recommended next action: Full test suite failed. npm run test failed.
- Blocks onboarding targeted GO: No
- Blocks full release GO: Yes

## Issue-ready blocker: release_gate_untracked_waiver_candidates

- Severity: high
- Scope: broad_release
- Classification: waiver_candidate_tracking
- Evidence: artifacts/mp6/final/onboarding-release/logs/release-gate-json.final.stdout.log
- Recommended next action: Classify, fix, or owner-accept 5 waiver-candidate findings with evidence and expiry.
- Blocks onboarding targeted GO: No
- Blocks full release GO: No

## Self-Audit

- MP1-MP5 verified before implementation: Yes, see preflight artifact.
- Source-truth systems rewritten: No.
- Onboarding tests added or updated: Yes.
- Targeted onboarding suite status: See command matrix.
- Content validation status: See command matrix.
- Icon check status: See command matrix.
- Route escape matrix covered every milestone: See onboarding release matrix.
- Foundation+ and second-life behavior covered: Yes, existing tests plus matrix rows.
- Gate defeat and safety net remained source-truth safe: Yes, onboarding only records facts and route guidance.
- Exact fixture/capture mode usable: See matrix row.
- Public copy constraints preserved: Source/sink guard matrix checks forbidden labels.
- localStorage-only onboarding state introduced: No.
- Direct reward grants from onboarding introduced: No, static ownership guard covers this.
