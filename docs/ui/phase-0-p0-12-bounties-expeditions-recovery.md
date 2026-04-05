# Phase 0 P0-12 — Bounties & Expeditions recovery

## Purpose
Restore paper-board / route-slip support identity for Bounties and Expeditions with recovery-first hardening only, without drifting into the full Phase 9 support-board completion pass.

## Dependency state
- Checked mandatory governance/docs stack (`AGENTS.md`, codex prompt/schema/template/queue/prelude files).
- Checked Phase 0 files (`phase-0-source-lock`, packet register, destructive migration audit/ledger, screenshot baseline/manifest).
- Checked Section A doctrine files (global doctrine, destructive freeze, cutover gate, recovery order/sequencing, four-layer model, family matrix, layout stability/truth surfacing, touchpoint registry, definition-of-done, screenshot workflow).
- Checked support docs (`docs/bounties-expeditions-pass0-recon.md`, `docs/bounties-expeditions-pass3-qa.md`, `docs/release/surface_truth_audit.md`, `docs/release/performance_smoke_checklist.md`, `docs/release/ui_cutover_red_flags.md`).
- Latest redesign/implementation `.docx` files and explicit “current design-state record” were not present in this snapshot; implementation used in-repo doctrine and current runtime source truth.

## Current snapshot findings
- Bounty Board paper-board owner: **strong and live** (paper primitives, fixed three-note staging, detail modal, tracked state, route controls).
- Expedition Board route-slip/dispatch owner: **mostly strong** but needed hierarchy reinforcement (one-slot behavior is truthful, but active slot emphasis sat too low in the flow).
- Later-phase-adjacent truthful surfaces already present and preserved: Merit reserve card, tracked strip, three-slot bounty contract surfaces, one-slot expedition behavior, route-purpose contract mapping, origin-city-safe claim flows, detail/ceremony modals.
- Merit reserve / tracked strip / support-route-challenge composition: **useful**, but role composition needed clearer in-card labels.
- One-slot expedition strip / route-purpose mapping / origin-city memory: **useful**, but slot state needed top-of-screen emphasis and route-purpose copy needed stronger “best when” language.
- Shared `WorldBuildingModal` shell: generally helpful, but overlay/close chrome was slightly dominant for support-board reads and benefited from local calming.

## What was already correct and preserved
- World → `WorldBuildingModal` → Bounties/Expeditions owner chain.
- Bounty: compact run compass, city-local tracked bounty state, reserve summary, claim/refresh logic, three-offer board behavior, detail modal flow.
- Expedition: compact run compass, one global slot model, duration + rare chance flow, route-purpose contract mapping (forage/apothecary, mine/forge, scout/manualPavilion), origin-city-safe claim behavior, ceremony flow.
- Existing `bountyboard.png` scenic base for both support boards.

## Bounty Board recovery changes
- Moved the tracked/ready action strip into top-of-board hierarchy (`bountyQueueStrip--top`) so tracked status is directly above the three posted offers.
- Added explicit paper-note role tags (`Support Order`, `Route Order`, `Challenge Order`) derived from live board slot contract position, so support/route/challenge composition is visible at a glance.
- Added matching role context into bounty detail subtitle for structural continuity.
- Preserved existing reserve messaging and safety-net line (`Merit supports Safety Net gate access. Keep this reserve healthy.`) and existing claim/route/tracking behaviors.

## Expedition Board recovery changes
- Added a new high-priority `expActiveSlotStrip` directly under the run compass so idle/running/claim-ready slot state is visible in one glance.
- Added route-purpose tag labels per route card using live route-purpose contract module labels.
- Added explicit per-route “best when…” support line tied to route purpose (`Apothecary`, `Forge`, `Manual Pavilion`).
- Strengthened origin-city wording in unavailable follow-up routing message inside ceremony flow.
- Preserved calm, dispatch-style interaction model and existing route/detail/ceremony mechanics.

## Route / locality / detail-flow stabilization outcome
- Bounty tracked locality remains per-city through existing `trackedByCityId` behavior (no store contract changes needed).
- Bounty and expedition route actions still target only surfaced live modules.
- Expedition origin-city memory and claim routing remain intact (UI changes are presentational, not store-logic rewrites).
- Detail/ceremony flows remain `DetailScrollModal`-owned with existing focus/close semantics unchanged.

## Deferred full-phase-9-support-board work
- Broad support-board scenic repaint / new prop art.
- Support economy redesign and Merit sink rebalance.
- Bounty template generation redesign.
- Expedition multi-slot expansion or deeper manager-game loop.
- World-shell architectural redesign beyond local support-board shell calming.

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
- Evidence folder: `docs/release/qa/ui-cutover/phase-0-p0-12-bounties-expeditions/`.
- Screenshot capture status: **MANUAL-PENDING** (browser capture tooling unavailable in this runtime).
- Manual checklist includes required Bounties/Expeditions/shared after-state captures, no-layout-shift proof, and locality/origin-city proof.

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
- No broad economy or support-system expansion performed.
- No prestige/world architecture redesign bundled.
- No multi-slot expedition redesign introduced.
- Final diff remains recovery/hardening for the support pair rather than full Phase 9 completion.
