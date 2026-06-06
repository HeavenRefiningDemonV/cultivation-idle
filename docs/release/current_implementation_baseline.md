# Current Implementation Baseline

Generated: 2026-06-05T13:43:58.479Z
CWD: `C:\Users\abdul\Desktop\cultivation-idle`
Package: cultivation-idle 0.0.0
Node: v24.14.0
npm: 11.9.0
Git branch: Latest
Git dirty: yes

## Git status preview
- `M .gitignore`
- ` M AGENTS.md`
- ` M docs/codex-packet-rules.md`
- ` M docs/release/build_warning_inventory.md`
- ` M docs/release/current_implementation_baseline.json`
- ` M docs/release/current_implementation_baseline.md`
- ` M docs/release/go_no_go_checklist.md`
- ` M docs/release/known_issues.md`
- ` M docs/release/p4_prestige_runtime_effect_audit.json`
- ` M docs/release/p4_prestige_runtime_effect_audit.md`
- ` M docs/release/playwright-report/index.html`
- ` M docs/release/runtime_content_manifest.md`
- ` M docs/release/signoff_sheet.md`
- ` M package-lock.json`
- ` M package.json`
- ` M public/cultivation_idle_content_bible_v1_config/cities.json`
- ` M public/cultivation_idle_content_bible_v1_config/prestige_store.json`
- ` M public/cultivation_idle_content_bible_v1_config/techniques.json`
- ` M scripts/exportBalanceTelemetry.ts`
- ` M scripts/generateProgressionContractDoc.ts`

## Checks
| Check | Status | Summary |
| --- | --- | --- |
| package.json | PASS | package.json parsed successfully. |
| Vite app entry | PASS | Root index.html references existing Vite entry src/main.tsx. |
| Root project files | PASS | All expected root project/config files are present. |
| Root script files | PASS | Required root helper scripts are present. |
| Dependencies | PASS | node_modules is present. |
| Lockfile | PASS | package-lock.json is present. |
| Local vendor dependencies | PASS | vendor directory is present. |
| Runtime content manifest | PASS | All runtime content files required by the manifest are present and non-empty. |
| Runtime content source files | PASS | All 25 runtime content files are present. |
| Test sources | PASS | 750 TypeScript test source files found under tests/. |
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
