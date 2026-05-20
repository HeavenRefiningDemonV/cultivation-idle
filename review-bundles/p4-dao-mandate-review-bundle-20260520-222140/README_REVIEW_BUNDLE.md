# P4 Dao Mandate Review Bundle

Purpose: focused review artifact for P4 Status Mandate Chamber and Cultivation Threshold Lens.

This is not a runnable repository export. It contains only the files needed to review the P4 source diff, tests, and verification notes.

Suggested review order:
1. REVIEW_NOTES.md
2. src/systems/ui/status/statusDashboardSurface.ts
3. src/components/screens/StatusScreen.tsx
4. src/features/cultivation/exact/cultivationExactTypes.ts
5. src/features/cultivation/exact/buildCultivationExactSurface.ts
6. src/features/cultivation/exact/CultivationExactScreen.tsx
7. tests/contracts/statusMandateChamberContract.test.ts
8. tests/contracts/cultivationMandateLensContract.test.ts

Excluded deliberately: node_modules, dist, tmp-tests, tmp-progression-fixtures, content JSON, generated screenshots/videos, old review bundles, and unrelated source files.
