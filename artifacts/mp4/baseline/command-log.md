# MP4 Baseline Command Log

Generated: 2026-05-29T02:58:56.9444622+03:00

| Command | Status | Notes | Log / output |
|---|---|---|---|
| `git status --short` | Pass | Dirty before MP4 work; preserved. | `artifacts/mp4/baseline/git-status.txt` |
| `npm run typecheck` | Pass | No type errors. | `artifacts/mp4/baseline/logs/typecheck.log` |
| `npm run check:icons` | Pass | No emoji icon violations. | `artifacts/mp4/baseline/logs/check-icons.log` |
| `npm run validate:content` | Pass | Content validation completed. | `artifacts/mp4/baseline/logs/validate-content.log` |
| `npm exec tsc -- --project tsconfig.tests.json` | Pass | Compiled tests into `tmp-tests`. | `artifacts/mp4/baseline/logs/tsconfig-tests.log` |
| `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/milestoneReadinessSurfaceContract.test.js` | Pass | MP3 shared readiness/source model contract passed. | `artifacts/mp4/baseline/logs/mp3-targeted-milestone-readiness.log` |
| `npm run build` | Pass with warnings | Existing unresolved `InsideDungeon.png` build-time warning and chunk-size warning. | `artifacts/mp4/baseline/logs/build.log` |
| `npm run release:runtime-diagnostics:json` | Pass | Runtime diagnostics baseline passed. | `artifacts/mp4/baseline/runtime-diagnostics.baseline.json` |
| `npm run balance:report:json` | Ran; report failed | Overall pass false due timing drift; non-timing sections passed. | `artifacts/mp4/baseline/balance-report.baseline.json` |
| `npm run release:route-report:json` | Pass with warning | Overall pass true; high-skill timing warning retained. | `artifacts/mp4/baseline/route-report.baseline.json` |
| `npm run release:fresh-run-report:json` | Automated pass, releaseReady false | Hard failures 0; manual coverage warnings remain. | `artifacts/mp4/baseline/fresh-run-report.baseline.json` |
| `npm run release:reclaim-route-report` | Pass | Reclaim route text report passed. | `artifacts/mp4/baseline/logs/release-reclaim-route-report.log` |
| `npm run release:reclaim-route-report -- --json` | Pass | Reclaim route JSON captured. | `artifacts/mp4/baseline/reclaim-route-report.baseline.json` |
| `npm run test:balance-regression` | Fail | Two timing tests failed: city phase duration and phase timing envelope. | `artifacts/mp4/baseline/logs/test-balance-regression.log` |
| `npm run validate:balance-telemetry` | Pass | Telemetry schema/coverage validation passed. | `artifacts/mp4/baseline/logs/validate-balance-telemetry.log` |
| `npm run telemetry:export` | Not sufficient alone | Script requires `--input`; rerun with generated input. | `artifacts/mp4/baseline/logs/telemetry-export.log` |
| `npm run telemetry:summary` | Not sufficient alone | Script requires `--input`; rerun with generated input. | `artifacts/mp4/baseline/logs/telemetry-summary.log` |
| `npm run telemetry:export -- --input artifacts/mp4/baseline/telemetry-input.baseline.json --out-dir artifacts/mp4/baseline/telemetry-export` | Pass | Telemetry export artifacts captured. | `artifacts/mp4/baseline/telemetry.baseline.json` |
| `npm run telemetry:summary -- --input artifacts/mp4/baseline/telemetry-input.baseline.json --json` | Pass | Telemetry summary captured. | `artifacts/mp4/baseline/telemetry-summary.baseline.json` |
