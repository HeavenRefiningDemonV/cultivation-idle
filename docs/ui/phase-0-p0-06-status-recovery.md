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

## 2026-05-12 status dashboard truth pass

This pass promotes Status from a mockup-shaped troubleshooting page into a live dashboard surface.

Changes:
- Added `StatusDashboardSurfaceV1` as the single read model for Status dashboard content.
- Added `useStatusDashboardSurface()` so the screen updates from live store slices without assembling rows in JSX.
- Replaced hardcoded milestone rail labels with live milestone nodes.
- Replaced index-based requirement icons/actions with row-owned typed icon and route action fields.
- Added a Current Work region sourced from `ActivityStore`, combat, bounty, expedition, and queue state.
- Removed visible placeholder actions and filler rows from the Status dashboard path.
- Refit the Status dashboard layout so the canvas fills the available shell height above the bottom nav on desktop.
- Promoted the Status bottom nav treatment into the canonical `bottomNavDock--inkPlaque` variant for all primary tabs, including Records.

Evidence:
- `output/playwright/status-dashboard-1366x768.png`
- `output/playwright/status-dashboard-1536x864.png`
- `output/playwright/status-dashboard-1920x1080.png`
- `output/playwright/status-dashboard-2048x1152.png`
- `output/playwright/status-dashboard-2560x1440.png`
- `output/playwright/status-dashboard-viewport-audit.json`

Viewport audit summary:
- 1536x864, 1920x1080, 2048x1152, and 2560x1440 have no page scroll and a panel-to-nav gap of about 22-28px.
- 1366x768 uses controlled shell scrolling, with the canvas still ending 10.5px above the nav.
- All audited tab switches kept `bottomNavDock--inkPlaque`, exactly one `aria-current="page"`, and stable nav dimensions.

Focused verification:
- `npm run typecheck`
- `npm run check:icons`
- `npm run build`
- `npx eslint` on touched implementation and contract files
- `node --test tmp-tests/tests/contracts/statusDashboardSurface.test.js tmp-tests/tests/contracts/CultivationExactVisualAlignment.contract.test.js`
