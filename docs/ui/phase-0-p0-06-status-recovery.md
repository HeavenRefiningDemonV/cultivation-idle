# P0-06 — Status recovery

## Purpose

Restore Status as a stable, trustworthy troubleshooting chamber with one clear owner and faster one-pass diagnosis, without expanding into full Phase 4 completion work.

## Dependency state

- Phase 0 and Section A doctrine docs are present and were consumed.
- Existing baseline/cutover docs for Status are present (`docs/release/qa/ui-cutover/status/`, `section-d-baseline-index`, `section-d-hero-screen-signoff`).
- Requested `.docx` design files are absent in this snapshot; this packet used in-repo doctrine and current-state artifacts as source-of-truth.

## Current snapshot findings

- Status was already **functionally truthful but visually weak/plain**.
- Spirit Root was **present but under-emphasized** in first-pass summary hierarchy.
- Biggest shortfall was visible in text, but top-fix routing was not directly actionable from the summary header.
- Six-card family coverage was **complete** (Identity, Readiness, Permanent Floor, Preparation, Build, Safety Net).
- Orb/ring anchor was **already present** and structurally stable.
- Local residue found (`fix-now`): stale legacy `setHeaderTitles` write in `StatusScreen` despite local screen ownership.

## What was already correct and preserved

- Status diagnostic role and full troubleshooting surface.
- Existing Run Compass content and card-family truth model.
- Existing orb/ring chamber anchor.
- Existing six-card coverage and underlying diagnosis data model.
- Existing FX layer posture (no heavy atmosphere expansion).

## Recovery changes

- Removed legacy global header-title write (`setHeaderTitles`) from `StatusScreen`.
- Wired full `RunCompass` actions on Status to `performRunCompassAction` so best-next-fix entries are directly actionable.
- Strengthened summary hierarchy with explicit Spirit Root line in header identity block.
- Added direct “Open best fix” CTA in biggest-shortfall panel when an actionable next step exists.
- Strengthened Identity mini-card truth by adding explicit Spirit Root and Root Multiplier lines.

## Spirit Root emphasis outcome

- Spirit Root is now surfaced in both top summary and identity troubleshooting card rather than only implicit/decorative placement.
- Emphasis increased without replacing existing components or introducing new art.

## Routing / diagnosis outcome

- Status now supports one-click routing from full Run Compass action rows.
- Biggest-shortfall summary now exposes a direct “Open best fix” action when available.
- Routing still reuses existing run-compass action bridge and stays aligned with current diagnosis truth.

## Deferred full-status-pass work

- Full Phase 4 compositional/art polish pass.
- Broader shared-shell/plaque-family redesign.
- Heavy atmosphere pass and new art/icon family requests.
- Any cross-screen command architecture refactor.

## Files changed

- `src/components/screens/StatusScreen.tsx`
- `src/ui/status/StatusSummaryHeader.tsx`
- `src/ui/status/StatusSummaryHeader.scss`
- `docs/ui/phase-0-p0-06-status-recovery.md`
- `docs/release/qa/ui-cutover/phase-0-p0-06-status/README.md`
- `docs/ui/phase-0-packet-register.md`

## Review evidence

- Added packet evidence folder: `docs/release/qa/ui-cutover/phase-0-p0-06-status/`.
- Screenshot status: **manual-pending** (no approved automated browser/image capture available in this runtime).
- README includes after-state slots and manual QA capture checklist.

## Verification results

Commands run:
- `git diff --check`
- `git diff --name-only`
- `npm run typecheck`
- `npm run build`
- `npm run ensure:vendor-links`
- `tsc --project tsconfig.tests.json`
- `npm run build:progression-fixtures`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tmp-tests/tests/contracts/statusTroubleshootingSurfaceContract.test.js tmp-tests/tests/integration/statusTroubleshootingSurfaceRuntime.test.js tmp-tests/tests/integration/trialPostFailurePanelFlow.test.js`

## Scope confirmation

- Recovery/hardening only.
- No new art created.
- No Phase 4 full completion work included.
- No shared-shell expansion packet work.
- No cross-screen broad redesign work included.
