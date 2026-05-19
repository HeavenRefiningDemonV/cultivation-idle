# P5 Prompt Handoff Bundle

Generated: 2026-05-19T13:30:41.9589786+03:00
Source checkout: C:\Users\abdul\Desktop\cultivation-idle

Purpose: give ChatGPT enough current-source and evidence context to draft a constrained P5 Codex implementation prompt after P4 closeout.

Suggested read order:
1. repo/AGENTS.md
2. repo/docs/codex-packet-rules.md
3. references/Cultivation_Idle_Codex_Master_Implementation_Plan_EXTREME_FINAL.docx
4. references/Cultivation_Idle_Ultimate_Seamless_Loop_Xianxia_UI_Bible.docx
5. repo/docs/release/p4_prestige_trust_report.md
6. repo/docs/release/p4_offline_catchup_trust_report.md
7. repo/docs/release/p4_browser_smoke.md
8. repo/docs/release/known_issues.md
9. repo/docs/release/release_handoff_bundle.md
10. repo/src and repo/tests for current implementation details.

Current closeout facts to preserve in the P5 prompt:
- P4 focused tests passed.
- P4 browser evidence was regenerated and lives under repo/docs/release/qa/.
- npm run build passes; build audit reports 0 blockers and 3 warnings.
- npm run release:gate remains NO_GO because of non-P4 broad release blockers listed in repo/docs/release/known_issues.md.
- OfflineCatchup.apply remains the single mutating offline path.
- PrestigeResetService remains reset owner.
- P5 prompt should not assume a clean release gate until the listed non-P4 blockers are handled or explicitly waived.

Included:
- Current source excluding repo/src/assets to keep the archive small.
- Runtime content config pack.
- Tests and release scripts.
- Curated release docs and P4 screenshots.
- User-supplied master plan and UI bible docx references.
- git-status-short.txt, git-diff-stat.txt, and git-diff-tracked-no-screenshots.patch for current uncommitted state.

Excluded:
- node_modules, dist, build output, tmp compiled fixtures, logs, large source art assets, and unrelated bulky release audit dumps.
