# Current Implementation Baseline

Generated: 2026-05-18T20:10:23.825Z
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
- ` M docs/release/go_no_go_checklist.md`
- ` M docs/release/known_issues.md`
- ` M docs/release/release_handoff_bundle.md`
- ` M docs/release/runtime_content_manifest.md`
- ` M docs/release/signoff_sheet.md`
- ` M src/components/modals/WorldBuildingModal.tsx`
- ` M src/components/screens/CityMapHub.scss`
- ` M src/components/screens/CityMapHub.tsx`
- ` M src/components/screens/ManualPavilionPanel.tsx`
- ` M src/components/screens/WorldScreen.tsx`
- ` M src/features/apothecary/exact/buildApothecaryExactSurface.ts`
- ` M src/features/professions/forgeExact/buildForgeExactSurface.ts`
- ` M src/features/techniquesExact/TechniquesExactScreen.scss`
- ` M src/features/techniquesExact/TechniquesExactScreen.tsx`
- ` M src/features/techniquesExact/TechniquesScreenOwner.tsx`
- ` M src/features/techniquesExact/buildTechniquesExactSurface.ts`
- ` M src/features/world/bountiesExact/buildBountiesExactSurface.ts`

## Checks
| Check | Status | Summary |
| --- | --- | --- |
| package.json | PASS | package.json parsed successfully. |
| Dependencies | PASS | node_modules is present. |
| Lockfile | PASS | package-lock.json is present. |
| Local vendor dependencies | PASS | vendor directory is present. |
| Runtime content manifest | PASS | All runtime content files required by the manifest are present and non-empty. |
| Test sources | PASS | 608 TypeScript test source files found under tests/. |
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
