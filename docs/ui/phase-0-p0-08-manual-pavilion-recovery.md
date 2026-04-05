# Phase 0 P0-08 — Manual Pavilion recovery

## Purpose
Restore shelf/spine ownership and interaction stability in Manual Pavilion without drifting into the full Phase 7 library completion pass.

## Dependency state
- Checked and used Phase 0 governance docs (`phase-0-source-lock`, packet register, destructive audit/ledger, screenshot baseline/manifest).
- Checked Section A doctrine and packet-contract docs.
- Checked `docs/manual-detail-modal-qa.md` for detail-flow QA baseline.
- The requested `.docx` redesign/implementation artifacts are not present in this repository snapshot, so this packet relies on in-repo Section A + Phase 0 documentation as authoritative.

## Current snapshot findings
- Shelf owner status: **already mostly correct** — Manual Pavilion was still rendered as shelf/spine room owner and used painted spine assets.
- Generic flattening/duplicate shell residue: **minor risk remained** from neutral generic wrappers around shelf context and inconsistent tag-space rhythm.
- Later-phase-adjacent truthful surfaces: **already present and preserved** (`RunCompassCompact`, `ManualBuildGapSummary`, `ManualOfferTags`, `ManualDetailModal`).
- Build-gap context: **present and useful**; preserved.
- Spine stability/icon anchoring: **mostly stable**, but tag reserve-space stability needed hardening to avoid crowded spine bottoms.

## What was already correct and preserved
- `ManualPavilionPanel` remained the live owner for Manual Pavilion route.
- Shelf-first browsing and spine presentation remained active.
- `manualpavilion.png` room/backdrop identity stayed in the world modal shell.
- Truthful detail-flow via `ManualDetailModal` remained intact.
- Existing build-correction context, tags, and compact run-compass were retained.

## Shelf/spine recovery changes
- Added a dedicated owner frame (`manualPavilionOwnerFrame`) around the summary + shelf wall to keep the shelf room visually dominant over generic shell residue.
- Hardened tag layout by reserving tag-space height and preventing long tag text from stretching/crowding spine internals.
- Kept all spine geometry stable (no width/height changes for interaction states).

## Build-gap / detail-flow stabilization outcome
- Preserved build-gap summary and compact run-compass in the owner chain without converting to a separate generic inspector pattern.
- Preserved current manual detail modal flow and purchase/study sequencing.
- No stock/economy redesign; no modal architecture redesign.

## Deferred phase-7-manual-pavilion work
- Full manual store economy/refresh/reputation fantasy redesign.
- Deep inspector architecture pass and expanded purpose/source art treatments.
- New support art roles (selected underlays, shelf labels, medallion pass) beyond current asset base.

## Files changed
- `src/components/screens/ManualPavilionPanel.tsx`
- `src/components/screens/ManualPavilionPanel.scss`
- `src/ui/manuals/ManualOfferTags.tsx`
- `docs/ui/phase-0-p0-08-manual-pavilion-recovery.md`
- `docs/release/qa/ui-cutover/phase-0-p0-08-manual-pavilion/README.md`
- `docs/ui/phase-0-packet-register.md`

## Review evidence
- Evidence folder: `docs/release/qa/ui-cutover/phase-0-p0-08-manual-pavilion/`.
- Screenshot capture is manual-pending in this runtime (no browser screenshot tooling available).
- Manual capture checklist is included in the evidence README.

## Verification results
- `git diff --check`
- `git diff --name-only`
- `npm run typecheck`
- `npm run build`
- `npm run ensure:vendor-links`
- `tsc --project tsconfig.tests.json`
- `npm run build:progression-fixtures`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tmp-tests/tests/contracts/manualOfferAnalysis.test.js tmp-tests/tests/contracts/manualOfferTagSurface.test.js tmp-tests/tests/contracts/manualPavilionDistribution.test.js tmp-tests/tests/contracts/manualPavilionDriftGuard.test.js tmp-tests/tests/contracts/manualStudyContract.test.js tmp-tests/tests/integration/manualPavilionBridge.test.js tmp-tests/tests/integration/techniquesManualBuildGapRuntime.test.js tmp-tests/tests/integration/release/layoutInteractionStabilityMatrix.test.js`

## Scope confirmation
- No new art created.
- No full Phase 7 manual-pavilion completion work.
- No stock-system rewrite.
- No Techniques redesign.
- No broad shared-shell expansion.
