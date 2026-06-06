# MP5 Command Log

Generated: 2026-05-29T17:28:20.891Z

| Command | Result | Exit code | Duration | Artifact | Notes |
|---|---:|---:|---:|---|---|
| `npm run typecheck` | PASS | 0 | 0.332s | `artifacts/mp5/commands/logs/typecheck.final2.log` |  |
| `npm run check:icons` | PASS | 0 | 0.337s | `artifacts/mp5/commands/logs/check-icons.final2.log` |  |
| `npm run validate:content` | PASS | 0 | 1.028s | `artifacts/mp5/commands/logs/validate-content.final2.log` |  |
| `npm run build` | PASS | 0 | 7.208s | `artifacts/mp5/commands/logs/build.final2.log` |  |
| `npm audit --audit-level=moderate --json` | PASS | 0 | 0.999s | `artifacts/mp5/commands/logs/npm-audit-moderate.final2.log` |  |
| `npm run balance:report:json` | PASS | 0 | 47.289s | `artifacts/mp5/commands/logs/balance-report-json.final2.log` |  |
| `npm run release:route-report:json` | PASS | 0 | 72.589s | `artifacts/mp5/commands/logs/route-report-json.final2.log` |  |
| `npm run release:fresh-run-report:json` | PASS_WITH_WARNINGS | 0 | 52.885s | `artifacts/mp5/commands/logs/fresh-run-report-json.final2.log` | automated normal route passed; manual coverage remains incomplete and blocks final GO |
| `npm run release:reclaim-route-report -- --json` | PASS | 0 | 34.796s | `artifacts/mp5/commands/logs/reclaim-route-report-json.final2.log` |  |
| `npm run release:runtime-diagnostics:json` | PASS | 0 | 9.438s | `artifacts/mp5/commands/logs/runtime-diagnostics-json.final2.log` |  |
| `npm run test:contracts` | FAIL | 1 | 152.835s | `artifacts/mp5/commands/logs/test-contracts.final2.log` |  |
| `npm test` | FAIL | 1 | 162.506s | `artifacts/mp5/commands/logs/npm-test.final2.log` |  |
| `npm run release:gate:json` | FAIL | 2 | 385.663s | `artifacts/mp5/release-gate/release-gate.after.json` | headline=NO_GO; blockers=2; pendingManual=1; waiverCandidates=5; no timeout after Windows runner fix |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | 0 | 10.176s | `artifacts/mp5/commands/logs/tsconfig-tests.after-wrapper.log` | post-release-gate-wrapper TypeScript test compile |
| `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/releaseGateReport.test.js` | PASS | 0 | 0.157s | `artifacts/mp5/commands/logs/release-gate-report-focused.after-wrapper.log` | focused release-gate adapter regression coverage |
| `npm run release:gate -- --only=full_test_suite --json` | FAIL | 2 | 169.723s | `artifacts/mp5/release-gate/full_test_suite.exitcode-diagnostic-after-npmcli-resolution.log` | isolated full-suite subcheck correctly reports npm test exitCode=1 as blocker |
| `npx playwright test tests/e2e/mp2-ui-runtime-smoke.spec.ts --project=chromium` | PASS | 0 | 240s | `artifacts/mp5/browser/mp2-ui-runtime-smoke-for-mp5.log` | Playwright fallback for unavailable Browser plugin; MP5 screenshots and DOM summaries preserved |
