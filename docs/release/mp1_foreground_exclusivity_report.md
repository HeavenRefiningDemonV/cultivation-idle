# MP1 Foreground Exclusivity Report

Date: 2026-06-04
Packet: Mega Prompt 1 - Foreground Exclusivity, Online Training Tick, Offline One-Focus Catch-Up
Verdict: MP1_GO_WITH_BROAD_RELEASE_BLOCKERS

## Scope Source

The pasted Mega Prompt 1 text is the authoritative contract. Attached audit and implementation documents were inspected for context, but this pass stayed inside MP1: foreground exclusivity, online Path Training ticking, Dao Heart/Qi non-stacking, and offline one-focus catch-up.

## Implementation Summary

- Added `src/systems/cultivation/foregroundGrowthResolver.ts` as the shared foreground growth resolver.
- Wired the authoritative simulation loop to tick Path Training only when `ActivityStore.active.type === "path_training"`.
- Updated `GameStore.tick` so full cultivation Qi accrues only in cultivation foreground states and Dao Heart practice accrues only in Dao Heart foreground state.
- Updated offline catch-up to apply exactly one primary focus: cultivation, Path Training, Dao Heart, or no primary growth for combat/queued-only states.
- Added offline catch-up surface and modal copy for visible foreground focus and paused systems.

## Changed Files

- `src/systems/cultivation/foregroundGrowthResolver.ts`
- `src/systems/gameLoop.ts`
- `src/stores/gameStore.ts`
- `src/services/time/OfflineCatchup.ts`
- `src/systems/offline/offlineCatchupSurface.ts`
- `src/components/modals/OfflineProgressModal.tsx`
- `src/components/modals/OfflineProgressModal.scss`
- `src/systems/balance/offlineTargets.ts`
- `tests/contracts/foregroundGrowthResolver.test.ts`
- `tests/contracts/offlineCatchupSurface.test.ts`
- `tests/contracts/offlineModalPriority.test.ts`
- `tests/contracts/offlineSummaryReadModel.test.ts`
- `tests/contracts/trainingRuntimeMp1Contract.test.ts`
- `tests/integration/foregroundGrowthContract.test.ts`
- `tests/integration/gameLoopSchedulerIntegration.test.ts`
- `tests/integration/trainingStoreMp1Integration.test.ts`

## Acceptance Evidence

### Focused MP1 Checks

- `npm exec tsc -- --project tsconfig.tests.json` - PASS.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/foregroundGrowthResolver.test.js tmp-tests/tests/integration/foregroundGrowthContract.test.js tmp-tests/tests/integration/gameLoopSchedulerIntegration.test.js tmp-tests/tests/integration/trainingStoreMp1Integration.test.js` - PASS, 23 tests.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/offlineCatchupSurface.test.js tmp-tests/tests/contracts/offlineSummaryReadModel.test.js tmp-tests/tests/contracts/offlineModalPriority.test.js tmp-tests/tests/contracts/trainingRuntimeMp1Contract.test.js tmp-tests/tests/contracts/daoHeartMp3RuntimeContract.test.js tmp-tests/tests/contracts/mp5OfflineTrustSurface.test.js` - PASS, 17 tests.

### Required Baseline Commands

- `npm run typecheck` - PASS.
- `npm run check:icons` - PASS, no emoji icon usage found in UI source files.
- `npm run validate:content` - PASS.
- `npm run build` - PASS, with existing chunk-size warning.
- `npm run test:balance-regression` - PASS, 14 tests.
- `npm run release:offline-route-report` - PASS. `offline_combat_progress=0`, `offline_trial_clear_count=0`, and offline Qi route remains non-dominant versus active theoretical.

## UI Evidence

- Offline modal/surface now shows `Foreground Focus` and `Paused systems` in stable DOM text.
- Offline surface identifies the active focus label and the systems paused by that focus.
- Screenshot not taken for MP1; the UI change is copy/surface information only, and contract/source/build checks covered the visible text path.

## Blocked / Broad Release Evidence

- `npm run test:contracts` - FAIL outside MP1. Existing `lifeSummarySurface.test.js` expects 9 blocks, while current Life Summary returns 10 including Mandate Memory:
  - `tmp-tests/tests/contracts/lifeSummarySurface.test.js:33` - `10 !== 9`
  - `tmp-tests/tests/contracts/lifeSummarySurface.test.js:63` - `10 !== 9`
- `npm run release:gate:json` - FAIL, completed with JSON `NO_GO`:
  - `overallPass:false`
  - `releaseReady:false`
  - `unresolvedBlockerCount:3`
  - `pendingManualCount:1`
  - `unresolvedWaiverCandidateCount:5`
- Follow-up isolated gate diagnostics identified these broad non-MP1 blockers:
  - `fresh_run_acceptance` - blocker plus pending manual coverage: normal, cautious, and aggressive manual routes are missing.
  - `migration_matrix` - blocker: `current-save` fixture reports source-version kind drift (`expected current`, actual `legacy-versioned`).
  - `route_comparison` - blocker: `fail_safe:post_bypass_breakthrough_failed:Could not continue route after bypass.`
  - `full_test_suite` - blocker: `npm run test`/contracts fail due the Life Summary block-count mismatch above.
- Non-blocking or waiver-candidate diagnostics observed:
  - `build_audit` - chunk-size warning only, no blocker.
  - `progression_contract` - 4 waiver-candidate warnings, no blocker.
  - `route_comparison` - high-skill timing warning.

## Deferred To Later Packets

- MP2: Training Hall staged stats, staged ETA, and slot-flow UI polish.
- MP3: Heart Law parity details, speed/root mismatch handling, and deeper Dao Heart UI proof.
- Release closeout: Life Summary block-count contract resolution, migration matrix `current-save` fixture classification, fail-safe route continuation, fresh-run manual coverage completion, and broad release gate blocker acceptance or fixes.

## Skill / Plugin Usage

- Documents skill: used to inspect the attached `.docx` files.
- Superpowers test-driven-development skill: used for focused MP1 contract/test cadence.
- Superpowers verification-before-completion skill: used to close with command evidence and documented blockers.
- Browser/Game Studio: skipped because MP1 only changed modal/surface copy and no screenshot route was required after contract/build verification.
- GitHub, Linear, CodeRabbit, Codex Security, Sentry: skipped because no external issue/PR/review/security action was requested and local packet evidence was sufficient.

## Explicit Non-Goals Preserved

- No Training Hall visual redesign.
- No Heart Law parity speed tuning.
- No root mismatch implementation.
- No technique overhaul.
- No destructive art cutover.
