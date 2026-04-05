# Phase 0 P0-11 — Forge recovery

## Purpose
Restore workshop ownership and side/detail stability without drifting into the full Phase 8 Forge completion pass.

## Dependency state
- Checked required governance and packet-contract docs (`AGENTS.md`, Prompt Style, UI packet schema/template, Section A queue/prelude).
- Checked Phase 0 governance docs (source lock, packet register, destructive audit/ledger, screenshot baseline/manifest).
- Checked Section A doctrine stack (global doctrine, destructive freeze, cutover gate, recovery order/sequencing, four-layer model, family matrix, layout stability/truth surfacing, touchpoint registry, definition-of-done, screenshot workflow).
- Checked release docs (`docs/release/surface_truth_audit.md`, `docs/release/performance_smoke_checklist.md`, `docs/release/ui_cutover_red_flags.md`).
- Latest redesign `.docx` files and explicit current design-state record were not present in this snapshot; packet used in-repo doctrine + runtime source truth.

## Current snapshot findings
- Workshop owner status: **present**. Forge is mounted through `WorldBuildingModal -> ForgeWorkshop` and `ForgePanel` is a wrapper.
- Generic flattening/duplicate shell residue: **partially present** in the process rail + right detail panel, which read as utility chips/cards rather than stable workshop process/requirements rails.
- Later-phase-adjacent truthful surfaces: **already present and preserved** (RunCompassCompact, current floor, next gate baseline, missing-material blockers, source routing, queue/session model, refine/temper/runes tabs).
- Current floor/target/source surfaces: **useful**, but side-detail requirements lacked explicit owned/needed/missing truth and direct source links per row.
- Tab/list/detail/queue stabilization need: **moderate hardening needed** (stable process rail treatment and explicit compare slab inside detail panel).

## What was already correct and preserved
- Forge owner chain remained intact through World building modal.
- Forgewide background family and workshop ownership were preserved.
- Core three-tab policy (`refine`, `temper`, `runes`) and queue-first behavior were preserved.
- Existing floor summary, next-target summary, and top blocker routing were preserved.
- No deferred branches (talisman/Jade Core) were surfaced.

## Workshop-owner recovery changes
- Added a slim top warning line (`Top shortfall`) in the banner for immediate permanent-floor context.
- Added compact forge resource chips in the top ribbon (`Spirit Steel Ore`, `Quenching Oil`, `Artifact Shard`) so the room answers “what matters now” before deep interaction.
- Kept workshop scene ownership and avoided World-shell route redesign.

## Process rail / side-detail stabilization outcome
- Replaced the chip-style tab strip with a stable three-column process rail (`Refine/Temper/Runes`) using fixed tab buttons and count readouts.
- Hardened right detail requirements into explicit rows showing `Owned / Needed / Missing` plus source label/reason and direct `Source` routing where routeable.
- Added an explicit `Current → next baseline` delta slab in detail for refine/temper floor truth without hover dependency.
- Preserved queue/session mechanics and existing material-blocker summary cards.

## Deferred full-phase-8-forge work
- Full workshop scenic art/paintover pass and broad plaque family work.
- Broad forge minigame redesign.
- Broad crafting economy rebalance or blueprint ladder redesign.
- Large forge-specific FX expansion.

## Files changed
- `src/features/professions/forge/ForgeWorkshop.tsx`
- `src/features/professions/forge/ForgeWorkshop.scss`
- `docs/ui/phase-0-p0-11-forge-recovery.md`
- `docs/release/qa/ui-cutover/phase-0-p0-11-forge/README.md`
- `docs/ui/phase-0-packet-register.md`

## Review evidence
- Evidence folder: `docs/release/qa/ui-cutover/phase-0-p0-11-forge/`
- Screenshot state: **MANUAL-PENDING** (no browser capture tooling available in this runtime).
- Manual capture checklist provided in evidence README.

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
- No new art required or added.
- No World-shell architecture redesign.
- No broad crafting economy rebalance.
- No deferred branches surfaced.
- Diff remains a recovery/hardening pass, not full Phase 8 Forge completion.
