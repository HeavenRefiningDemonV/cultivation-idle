# Phase 0 P0-12 — Bounties & Expeditions recovery

## Purpose
Restore paper-board / route-slip support identity without drifting into the full Phase 9 support-board completion pass.

## Dependency state
- Checked required governance and packet-contract docs (`AGENTS.md`, Prompt Style, UI packet schema/template, Section A queue/prelude).
- Checked Phase 0 governance docs (source lock, packet register, destructive audit/ledger, screenshot baseline/manifest).
- Checked release doctrine/QA docs (`docs/release/surface_truth_audit.md`, `docs/release/performance_smoke_checklist.md`, `docs/release/ui_cutover_red_flags.md`).
- Checked Bounties/Expeditions local docs (`docs/bounties-expeditions-pass0-recon.md`, `docs/bounties-expeditions-pass3-qa.md`).
- Latest redesign/implementation `.docx` source files and explicit current design-state record were not present in this snapshot; packet used in-repo doctrine + runtime source truth.

## Current snapshot findings
- Bounty Board paper-board owner: **already strong** (paper cards/pins/stamps, tracked strip, reserve summary, three-offer board contract).
- Expedition route-slip/dispatch owner: **partially strong** (route cards and slot board were present, but purpose/best-when and slot-state-at-a-glance signals were weaker than target).
- Later-phase-adjacent truthful support surfaces: **already present and preserved** (RunCompassCompact, reserve model, tracked state, claim flows, ceremony/modal flows, origin-city memory, route-purpose contracts).
- Merit reserve / tracked strip / support-route-challenge readability: reserve + tracked were useful; per-card role readability needed stronger at-card labels.
- One-slot strip / route-purpose mapping / origin-city memory: mapping and origin memory were already truthful; slot-state summary and purpose CTA readability needed hardening.
- Shared World modal shell impact: baseline scenic ownership was correct, but both support boards looked too similar because they shared identical shell treatment.

## What was already correct and preserved
- `World -> WorldBuildingModal -> BountyBoardPanel/ExpeditionBoardPanel` owner chain remained intact.
- Bounty three-offer structure and live support/route/challenge contract remained intact.
- Tracked bounty per-city state and claim/refresh behavior remained intact.
- Expedition one-slot model and origin-city run memory remained intact.
- Route purpose contract remained forage→Apothecary, mine→Forge, scout→Manual Pavilion.
- Existing detail modal + expedition ceremony behavior remained intact.

## Bounty Board recovery changes
- Added explicit per-paper slot role labels (`Support Order`, `Route Order`, `Challenge Order`) from live board slot contract so composition reads immediately.
- Added a stable route/status line on each paper that shows either direct destination CTA label or explicit blocked reason (`Blocked: ...`) without requiring modal open.
- Updated reserve summary copy to the required fail-safe language:
  - `Merit supports fail-safe gate access. Keep this reserve healthy.`
- Added style reservations (`min-height`) for slot and route lines so tracked/claim-ready/recommended transitions do not resize notes.

## Expedition Board recovery changes
- Strengthened route cards with purpose tags derived from live route-purpose contract (`Apothecary Support`, `Forge Support`, `Manual Pavilion Support`).
- Added per-route `Best when...` support guidance lines and persistent CTA-hint lines (Open Apothecary/Forge/Manual Pavilion).
- Added a slot summary strip (`Idle`, `Running`, `Claim-ready`) above slot cards for one-glance state read.
- Added explicit `Origin city` line in active slot cards and route-detail rare section guidance to preserve city-local claim/use-material context.
- Added style reservations for route purpose/CTA and slot origin lines to harden no-layout-shift behavior.

## Route / locality / detail-flow stabilization outcome
- Locality preserved:
  - Bounty tracked state remains city-local in `trackedByCityId`.
  - Expedition runs continue to hold `cityId`/`cityIndex`; claim/send-again/use-material flows stay origin-city-safe.
- Routing truth preserved:
  - Bounty destination labels stay module-based and surface blocked reasons in the card body.
  - Expedition route-purpose CTA mapping remains bound to live contract helpers.
- Detail/ceremony stability preserved:
  - Existing `DetailScrollModal` flows, focus/overlay/close behavior, and ceremony action hierarchy were retained.

## Deferred full-phase-9-support-board work
- Full scenic repaint/new support-board art families.
- Broad Merit/support-economy redesign.
- Broad bounty template generator redesign.
- Expedition multi-slot expansion or deeper management-layer mechanics.
- Large atmosphere/VFX expansion.

## Files changed
- `src/components/screens/BountyBoardPanel.tsx`
- `src/components/screens/BountyBoardPanel.scss`
- `src/components/screens/ExpeditionBoardPanel.tsx`
- `src/components/screens/ExpeditionBoardPanel.scss`
- `src/components/modals/WorldBuildingModal.tsx`
- `src/components/modals/WorldBuildingModal.scss`
- `docs/ui/phase-0-p0-12-bounties-expeditions-recovery.md`
- `docs/release/qa/ui-cutover/phase-0-p0-12-bounties-expeditions/README.md`
- `docs/ui/phase-0-packet-register.md`

## Review evidence
- Evidence folder: `docs/release/qa/ui-cutover/phase-0-p0-12-bounties-expeditions/`
- Screenshot status: **MANUAL-PENDING** (browser capture tooling unavailable in this runtime).
- Manual capture checklist is included in evidence README.

## Verification results
- `git diff --check`
- `git diff --name-only`
- `npm run typecheck`
- `npm run build`
- `npm run ensure:vendor-links`
- `tsc --project tsconfig.tests.json`
- `npm run build:progression-fixtures`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/contracts/bountyBoardContract.test.ts tests/contracts/bountySupportEconomyContract.test.ts tests/integration/bountyBoardComposition.test.ts tests/integration/bountyBoardSupportEconomySurface.test.tsx tests/integration/bountyExpeditionRoutingChips.test.ts tests/integration/bountyExpeditionThroughputRegression.test.ts tests/integration/bountyMeritFailSafePacing.test.ts tests/integration/bountyRoutingRuntime.test.ts tests/integration/expeditionOriginCity.test.ts tests/integration/expeditionRoutePurpose.test.ts tests/integration/release/layoutInteractionStabilityMatrix.test.ts tests/integration/release/surfaceTruthAudit.test.ts`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/contracts/releaseVocabularyAudit.test.ts tests/contracts/placeholderStringPurge.test.ts`

## Scope confirmation
- No new art created.
- No Prestige work bundled.
- No broad support economy rebalance bundled.
- No support-system expansion bundled.
- Diff remains a paired-screen recovery/hardening packet, not full Phase 9 completion.
