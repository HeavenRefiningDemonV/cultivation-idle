# Current Implementation Baseline

Generated: 2026-05-19T14:58:33.618Z
CWD: `C:\Users\abdul\Desktop\cultivation-idle`
Package: cultivation-idle 0.0.0
Node: v24.14.0
npm: 11.9.0
Git branch: codex/p5-xianxia-memory-mechanics
Git dirty: yes

## Git status preview
- `M docs/release/build_warning_inventory.md`
- ` M docs/release/current_implementation_baseline.json`
- ` M docs/release/current_implementation_baseline.md`
- ` M docs/release/known_issues.md`
- ` M docs/release/p4_prestige_runtime_effect_audit.json`
- ` M docs/release/p4_prestige_runtime_effect_audit.md`
- ` M docs/release/runtime_content_manifest.md`
- ` D review-bundles/p5-prompt-handoff-20260519-133039/README_P5_PROMPT_HANDOFF.md`
- ` D review-bundles/p5-prompt-handoff-20260519-133039/bundle-file-manifest.txt`
- ` D review-bundles/p5-prompt-handoff-20260519-133039/git-diff-stat.txt`
- ` D review-bundles/p5-prompt-handoff-20260519-133039/git-diff-tracked-no-screenshots.patch`
- ` D review-bundles/p5-prompt-handoff-20260519-133039/git-status-short.txt`
- ` D review-bundles/p5-prompt-handoff-20260519-133039/references/Cultivation_Idle_Codex_Master_Implementation_Plan_EXTREME_FINAL.docx`
- ` D review-bundles/p5-prompt-handoff-20260519-133039/references/Cultivation_Idle_Ultimate_Seamless_Loop_Xianxia_UI_Bible.docx`
- ` D review-bundles/p5-prompt-handoff-20260519-133039/repo/AGENTS.md`
- ` D review-bundles/p5-prompt-handoff-20260519-133039/repo/QUICK-START.md`
- ` D review-bundles/p5-prompt-handoff-20260519-133039/repo/README.md`
- ` D "review-bundles/p5-prompt-handoff-20260519-133039/repo/docs/Part A \342\200\224 Manual Pavilion and Combat Techniques Overhaul.txt"`
- ` D review-bundles/p5-prompt-handoff-20260519-133039/repo/docs/apothecary-medicine-pouch-modal-qa.md`
- ` D review-bundles/p5-prompt-handoff-20260519-133039/repo/docs/apothecary-pass0-map.md`

## Checks
| Check | Status | Summary |
| --- | --- | --- |
| package.json | PASS | package.json parsed successfully. |
| Dependencies | PASS | node_modules is present. |
| Lockfile | PASS | package-lock.json is present. |
| Local vendor dependencies | PASS | vendor directory is present. |
| Runtime content manifest | PASS | All runtime content files required by the manifest are present and non-empty. |
| Test sources | PASS | 625 TypeScript test source files found under tests/. |
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
