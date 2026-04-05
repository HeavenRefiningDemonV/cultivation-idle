# Phase 0 P0-09 — Techniques recovery

## Purpose
Restore Inner Palace / altar ownership and slot stability in Techniques without drifting into the full Phase 7 dense-screen completion pass.

## Dependency state
- Checked Phase 0 governance stack: source lock, packet register, destructive audit/ledger, screenshot baseline/manifest.
- Checked Section A doctrine and recovery rules (global doctrine, destructive freeze, four-layer model, recovery order/sequencing, layout stability/truth surfacing, cutover gate).
- Checked Techniques QA/release docs: `docs/techniques-final-polish-qa.md`, `docs/release/performance_smoke_checklist.md`, `docs/release/surface_truth_audit.md`, `docs/release/ui_cutover_red_flags.md`.
- `.docx` redesign/implementation files are not present in this snapshot; this packet used in-repo Section A + Phase 0 docs as authority.

## Current snapshot findings
- Altar owner status: **present and functional**, with `InnerPalaceEquipAltar` mounted in the right dock.
- Generic flattening / duplicate shell residue: **partially present** through neutral shell weight competing with altar ownership.
- Later-phase-adjacent truthful surfaces: **already live and worth preserving** (`RunCompassCompact`, `BuildAltarSummary`, selected-technique summary, filter drawer, detail modal).
- Stability status: slot geometry was mostly stable; loadout selection idempotence was not explicit in screen-local handlers and summary chip area could vary density.
- Build-gap / AI / casting / mastery surfaces: **already useful** (not merely present) and preserved.

## What was already correct and preserved
- Techniques remained a dense-management ritual surface with active Inner Palace / slot-map center.
- Existing truthful build diagnosis surfaces (path alignment, mastery/rank/rune floors, AI/casting lines, next-fix line) remained in DOM.
- Filter drawer and selected-technique detail flow were preserved.
- Manual Pavilion handoff affordance was preserved for acquisition-side gaps.

## Inner Palace / altar recovery changes
- Added a dedicated altar-owner stage treatment (`techStage--altarOwned`) to keep altar context visually dominant over generic shell flattening.
- Strengthened altar dock framing (`techniqueLibraryPanel--altar`) so the altar panel reads as a stable owner node in the composition.

## Slot / loadout / inspector stabilization outcome
- Added explicit screen-local no-op guard for same-target loadout selection (`handleSelectLoadout`) and routed both top select + loadout buttons through it.
- Added reserved summary-chip row height in selected-technique summary to keep dense info states from visual jitter.
- Preserved existing slot, filter drawer, and detail modal structures while hardening presentation hierarchy.

## Deferred full-techniques-pass work
- Full final Inner Palace completion architecture.
- Deep recommendation-engine expansion beyond current truthful surfaces.
- Broad inventory/manual/progression cross-screen redesign.
- New art roles or scenic repaints.

## Files changed
- `src/components/screens/TechniqueLibraryScreen.tsx`
- `src/components/screens/TechniqueLibraryScreen.scss`
- `docs/ui/phase-0-p0-09-techniques-recovery.md`
- `docs/release/qa/ui-cutover/phase-0-p0-09-techniques/README.md`
- `docs/ui/phase-0-packet-register.md`

## Review evidence
- Evidence folder: `docs/release/qa/ui-cutover/phase-0-p0-09-techniques/`.
- Screenshot state: manual-pending in this runtime (no screenshot tool available).
- Manual capture checklist added in evidence README.

## Verification results
- `git diff --check`
- `git diff --name-only`
- `npm run typecheck`
- `npm run build`
- `npm run ensure:vendor-links`
- `tsc --project tsconfig.tests.json`
- `npm run build:progression-fixtures`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/integration/release/layoutInteractionStabilityMatrix.test.ts`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/integration/release/surfaceTruthAudit.test.ts`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/contracts/releaseVocabularyAudit.test.ts tests/contracts/placeholderStringPurge.test.ts`

## Scope confirmation
- No new art created.
- No Manual Pavilion or Inventory redesign bundled.
- No balance/progression/system rewrite bundled.
- No full Phase 7 techniques-completion work included.
