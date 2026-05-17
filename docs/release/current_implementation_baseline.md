# Current Implementation Baseline

Generated: 2026-05-17T19:52:04.428Z
CWD: `C:\Users\abdul\Desktop\cultivation-idle`
Package: cultivation-idle 0.0.0
Node: v24.14.0
npm: 11.9.0
Git branch: Latest
Git dirty: yes

## Git status preview
- `M docs/release/build_warning_inventory.md`
- ` M docs/release/current_implementation_baseline.json`
- ` M docs/release/current_implementation_baseline.md`
- ` M docs/release/known_issues.md`
- ` M docs/release/runtime_content_manifest.md`
- ` M src/components/GameLayout.tsx`
- ` M src/components/screens/StatusScreen.tsx`
- ` M src/components/screens/WorldScreen.tsx`
- ` M src/features/cultivation/exact/CultivationExactScreen.scss`
- ` M src/features/cultivation/exact/CultivationExactScreen.tsx`
- ` M src/features/cultivation/exact/buildCultivationExactSurface.ts`
- ` M src/features/cultivation/exact/cultivationExactTypes.ts`
- ` M src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.scss`
- ` M src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.tsx`
- ` M src/features/prestige/prestigeLedgerExact/PrestigeLedgerScreenOwner.tsx`
- ` M src/features/prestige/prestigeLedgerExact/buildPrestigeLedgerExactSurface.ts`
- ` M src/features/prestige/prestigeLedgerExact/prestigeLedgerExactTypes.ts`
- ` M src/features/world/gateTrialExact/GateTrialExactScreen.scss`
- ` M src/features/world/gateTrialExact/GateTrialExactScreen.ts`
- ` M src/features/world/gateTrialExact/buildGateTrialExactSurface.ts`

## Checks
| Check | Status | Summary |
| --- | --- | --- |
| package.json | PASS | package.json parsed successfully. |
| Dependencies | PASS | node_modules is present. |
| Lockfile | PASS | package-lock.json is present. |
| Local vendor dependencies | PASS | vendor directory is present. |
| Runtime content manifest | PASS | All runtime content files required by the manifest are present and non-empty. |
| Test sources | PASS | 580 TypeScript test source files found under tests/. |
| Compiled tmp-tests | INFO | tmp-tests directory is present. |
| Test tsconfig files | PASS | Checks for tsconfig.tests.json and tsconfig.progression-fixtures.json. |
| Key package scripts | PASS | All 9 expected scripts are present. |
| Release/capture package scripts | PASS | All 9 expected scripts are present. |
| Release docs directory | PASS | docs/release is present. |

## Blockers
- None

## Warnings
- None

## Recommended next commands
- `npm run release:runtime-content-manifest:json`
- `npm run typecheck`
- `npm run check:icons`
- `npm run test:contracts`
- `npm run validate:content`
- `npm run progression:report`
- `npm run build`
- `npm run release:gate -- --json`
