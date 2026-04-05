# Phase 0 P0-11 — Forge recovery

## Purpose
Restore workshop ownership and side/detail stability without drifting into the full Phase 8 Forge completion pass.

## Dependency state
- Checked mandatory governance/docs stack (`AGENTS.md`, Codex prompt/schema/template/queue/prelude files).
- Checked Phase 0 files (source lock, packet register, destructive migration audit/ledger, screenshot baseline/manifest).
- Checked Section A doctrine set (global doctrine, destructive freeze, cutover gate, recovery order/sequencing, four-layer model, screen-family matrix, layout stability/truth surfacing, touchpoint registry, definition-of-done registry).
- Checked release docs (`docs/release/surface_truth_audit.md`, `docs/release/performance_smoke_checklist.md`, `docs/release/ui_cutover_red_flags.md`).
- Latest redesign/implementation `.docx` docs and explicit current design-state record were not present in this snapshot; packet execution followed in-repo doctrine + current runtime source truth.

## Current snapshot findings
- Workshop owner state: **present** (`WorldBuildingModal` mounts `ForgeWorkshop`, and `ForgePanel` remains a thin wrapper).
- Generic flattening / duplicate shell residue: **partially present**, especially in process-rail chips reading as floating pills and detail panel showing inputs without explicit owned/needed/missing/source routing truth.
- Later-phase-adjacent truthful surfaces already present and preserved: run compass, floor summary, next-gate baseline, missing-material top blockers, queue-first flow, and route-to-source actions.
- Current floor/target/source surfaces: **useful but uneven** (high-level blockers available, but selected blueprint side panel lacked explicit requirement accounting and floor compare slab readability).
- Tab/list/detail/queue stability: **mostly stable**; process rail visual identity and requirement-detail persistence needed hardening.

## What was already correct and preserved
- World → building modal → Forge owner chain.
- `refine / temper / runes` tab policy and semester-safe mode restrictions.
- Queue-first, low-babysit forge runtime and hands-on gating.
- Existing forgewide room/background family and workshop ownership.
- Existing top-level floor and missing-blocker summary surfaces.

## Workshop-owner recovery changes
- Preserved workshop-owner composition and strengthened in-panel process grammar by shifting the mode chips into a stable rail-like grid (instead of floating wrap pills).
- Added explicit blueprint requirement rows in the right detail panel with owned/needed/missing counts, source label/reason, and direct source-routing button when live route exists.
- Added a compact `Current → next floor target` compare slab in the blueprint detail pane, scoped to the active tab (refine/temper/runes), so current-vs-target truth stays visible without hover/guesswork.

## Process rail / side-detail stabilization outcome
- Process rail now has fixed-height, non-wrapping behavior on desktop and deterministic single-column fallback on narrow screens.
- Side detail now surfaces concrete requirements and deficits in DOM for each selected blueprint.
- Missing-material routing is now available directly from selected blueprint requirement rows (not only the top blocker card).
- Current-vs-next floor compare remains visible as a dedicated detail slab with no accordion dependency.

## Deferred full-phase-8-forge work
- Full workshop beauty pass/new art assets.
- Broad minigame redesign.
- Major crafting economy rebalance/blueprint ladder redesign.
- New deferred branch surfaces (talisman/Jade Core/etc.).
- Broad forge FX expansion from zero.

## Files changed
- `src/features/professions/forge/ForgeWorkshop.tsx`
- `src/features/professions/forge/ForgeWorkshop.scss`
- `docs/ui/phase-0-p0-11-forge-recovery.md`
- `docs/release/qa/ui-cutover/phase-0-p0-11-forge/README.md`
- `docs/ui/phase-0-packet-register.md`

## Review evidence
- Evidence folder: `docs/release/qa/ui-cutover/phase-0-p0-11-forge/`.
- Screenshot status: **MANUAL-PENDING** (runtime lacks browser capture tooling in this execution path).
- Manual checklist includes required after-state captures and owner/no-layout-shift proof slots.

## Verification results
- `git diff --check`
- `git diff --name-only`
- `npm run typecheck`
- `npm run build`
- `npm run ensure:vendor-links`
- `tsc --project tsconfig.tests.json`
- `npm run build:progression-fixtures`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tmp-tests/tests/contracts/forgeBlueprintLadder.test.js tmp-tests/tests/contracts/forgeFloorReadModel.test.js tmp-tests/tests/contracts/forgeLiveVisibility.test.js tmp-tests/tests/contracts/forgeModePolicy.test.js tmp-tests/tests/contracts/forgeRuneFamilyCleanup.test.js tmp-tests/tests/forgeOutcome.test.js tmp-tests/tests/forgeSessionEngine.test.js tmp-tests/tests/integration/forgeLiveGetterIntegration.test.js tmp-tests/tests/integration/forgeWorkshopSemesterContract.test.js tmp-tests/tests/integration/release/layoutInteractionStabilityMatrix.test.js tmp-tests/tests/integration/release/surfaceTruthAudit.test.js`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tmp-tests/tests/contracts/releaseVocabularyAudit.test.js tmp-tests/tests/contracts/placeholderStringPurge.test.js`

## Scope confirmation
- No new art created.
- No forgewide background replacement.
- No deferred branch rollout.
- No broad world-shell/crafting/economy redesign.
- Final diff remains recovery/hardening rather than full Phase 8 Forge completion.
