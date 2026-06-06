# MP2 Preflight Command Log

Generated: 2026-05-28T22:36:22.5431668+03:00

| Command | Status | Log | Notes |
|---|---|---|---|
| `npm run typecheck` | PASS | `artifacts/mp2/preflight/logs/typecheck.preflight.log` | Live MP2 preflight rerun. |
| `npm run check:icons` | PASS | `artifacts/mp2/preflight/logs/check-icons.preflight.log` | No emoji icon usage found. |
| `npm run validate:content` | PASS | `artifacts/mp2/preflight/logs/validate-content.preflight.log` | Content validation green; Node loader warning only. |
| `npm run build` | PASS with warnings | `artifacts/mp2/preflight/logs/build.preflight.log` | Build output generated; stale Browserslist, `InsideDungeon.png`, and chunk-size warnings remain. |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | `artifacts/mp2/preflight/logs/tsc-tests.preflight.log` | Test TypeScript compile passed. |
| `npm run build:progression-fixtures` | PASS | `artifacts/mp2/preflight/logs/build-progression-fixtures.preflight.log` | MP0 fixture-output failure class remains fixed. |
| `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/trialLifecycle.test.js` | PASS | `artifacts/mp2/preflight/logs/trial-lifecycle.preflight.log` | Pavilion root-shape / trial lifecycle focused proof remains green. |
| `npm run release:fresh-run-report:json` | PASS with warnings | `artifacts/mp2/preflight/logs/fresh-run-report.preflight.log` | Spirit Severing reached; manual coverage warnings remain MP3. |
| `npm run release:route-report:json` | PASS with warning | `artifacts/mp2/preflight/logs/route-report.preflight.log` | Route proof works; high-skill timing warning remains MP4. |
| `npm run release:reclaim-route-report` | PASS | `artifacts/mp2/preflight/logs/reclaim-route-report.preflight.log` | Reclaim proof green. |
| `npm run release:vocab-audit:json` | PASS | `artifacts/mp2/preflight/logs/vocab-audit.preflight.log` | Milestone/stale vocabulary audit green. |
| `npx playwright test tests/e2e/mp1-route-proof.spec.ts` | PASS | `artifacts/mp2/preflight/logs/mp1-route-proof.preflight.log` | Supplemental live app boot/browser proof for MP1 handoff. |
| `npm run balance:report:json` | FAIL timing bands (expected residual) | `artifacts/mp2/preflight/logs/balance-report.preflight.log` | `foundation_entry` present and passing; cap/phase timing bands remain MP4. |
