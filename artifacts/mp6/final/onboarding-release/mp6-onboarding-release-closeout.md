# MP6 Onboarding Release Closeout

Generated: 2026-05-31
Active packet: Mega Prompt 6 - QA Harness, Release Evidence, and Final Hardening

## Previous-Packet Verdict

- MP1 foundation: PASS.
- MP2 gating: PASS.
- MP3 guidance: PASS.
- MP4 source/sink: PASS.
- MP5 capstone: PASS.
- Proceed decision recorded before implementation: `GO_MP6_IMPLEMENTATION`.
- Evidence: `artifacts/mp6/preflight/onboarding-release/previous-packet-verification.md`.

## MP6 Targeted Verdict

- Onboarding targeted readiness: `GO_WITH_KNOWN_BROAD_BLOCKERS`.
- Full release readiness: `NO_GO`.
- Reason: MP6 onboarding tests, release matrix, typecheck, icons, content validation, build, and Playwright fallback passed. Broad contract suite and release gate still fail outside the MP6 onboarding slice.

## Implemented

- Added an onboarding release matrix harness that verifies M0-M10, completed first life, Foundation+ existing save, second-life/reclaim, dev override, and exact fixture/capture scenarios.
- Added source/sink route validation to ensure guarded onboarding dead ends route to concrete currently allowed surfaces.
- Added static ownership tests preventing onboarding systems from owning rewards, combat, gate-entry proof, M10 breakthrough, or new `lifePath` truth.
- Added readiness report generation for `docs/release/onboarding_readiness.md` and JSON summary.
- Added an onboarding release evidence rule to `docs/codex-packet-rules.md`.

## Files Changed For MP6

- `scripts/onboarding/buildOnboardingReleaseMatrix.ts`
- `scripts/onboarding/buildOnboardingReadinessReport.ts`
- `tests/contracts/onboardingReleaseMatrix.test.ts`
- `tests/contracts/onboardingNoSourceTruthDuplication.test.ts`
- `docs/release/onboarding_readiness.md`
- `docs/codex-packet-rules.md`
- `package.json` for onboarding evidence scripts only.
- `artifacts/mp6/**` evidence outputs.

Note: the live checkout was already dirty before MP6. Existing unrelated package/doc/source changes were preserved and not reverted.

## Verification

See `artifacts/mp6/final/onboarding-release/final-command-summary.json`.

| Command | Result |
|---|---:|
| `npm exec tsc -- --project tsconfig.tests.json` | PASS |
| MP6 new contract tests | PASS, 5 tests |
| targeted onboarding suite including MP6 tests | PASS |
| `npm run onboarding:release-matrix` | PASS, matrix overallPass true, blockers 0 |
| `npm run typecheck` | PASS |
| `npm run check:icons` | PASS |
| `npm run validate:content` | PASS |
| `npm run build` | PASS |
| `npx playwright test tests/e2e/mp3-onboarding-ui-smoke.spec.ts --project=chromium` | PASS |
| `npm run test:contracts` | FAIL, 1513 pass / 81 fail / 3 skipped |
| `npm run release:gate:json` | FAIL / NO_GO |

## Release Gate Blockers

Release gate output: `artifacts/mp6/final/onboarding-release/logs/release-gate-json.final.stdout.log`.

- `fresh_run_acceptance`: pending manual coverage; normal, cautious, and aggressive manual routes are missing.
- `migration_matrix`: blocker, `current-save` failed.
- `full_test_suite`: blocker, `npm run test` failed.
- Waiver candidates: 5 untracked/unaccepted findings remain.

## Browser And Plugin Evidence

- Dedicated Browser tool: unavailable through tool discovery.
- Playwright fallback: PASS. This is not claimed as Browser evidence.
- Tool statuses: `artifacts/mp6/preflight/onboarding-release/tool-capability-status.md`.

## Deferred

- Full release remains blocked until broad contract/full-suite failures, migration matrix `current-save`, manual fresh-run coverage, and untracked waiver candidates are resolved.
- Dedicated Browser screenshot pass for every M0-M10 state remains future manual/Browser evidence. MP6 generated a release matrix and Playwright fallback smoke instead.

## Risk Notes

- The new harness imports existing onboarding policy, route guard, and source/sink builders. It does not invent gameplay truth.
- The static ownership guard allows only legacy `lifePath` migration input and continues blocking new mechanical `lifePath` truth in onboarding systems.
- No source-truth owner systems were rewritten by MP6.

