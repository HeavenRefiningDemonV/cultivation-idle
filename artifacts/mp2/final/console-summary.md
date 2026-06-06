# MP2 Console Summary

Generated: 2026-05-29T00:10:12+03:00

| Error/warning | Screen | Severity | First seen | Repro steps | Root cause | Fixed? | Evidence |
|---|---|---:|---|---|---|---:|---|
| No console errors captured by MP2 Playwright smoke | All MP2 smoke screens | Low | Final smoke | `npx playwright test tests/e2e/mp2-ui-runtime-smoke.spec.ts` | No runtime/page errors emitted during traversal | Yes | `artifacts/mp2/final/logs/mp2-ui-runtime-smoke.final.log`, `artifacts/mp2/browser/console-logs/` |
| Vite chunk-size warning | Build | Medium | Final build | `npm run build` | Existing bundle composition exceeds advisory chunk size | Deferred | `artifacts/mp2/final/logs/build.final.log` |
| Node experimental-loader warning | Content validation/build tooling | Low | Final content validation | `npm run validate:content` | Existing Node loader wiring emits advisory warning | Deferred | `artifacts/mp2/final/logs/validate-content.final.log` |
| Release gate timeout | Release gate | Medium | Final gate attempt | `npm run release:gate:json` | Broad release gate exceeded 5 minute command timeout and spawned broad contract work | Not fixed in MP2 | `artifacts/mp2/final/logs/release-gate.final.log` |
