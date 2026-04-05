# Phase 0 P0-13 — Prestige recovery

## Purpose
Restore Prestige as a decree-like reincarnation owner surface with recovery/hardening only, preserving live AP/reset truth and runtime-backed node honesty without drifting into full Phase 9 prestige completion.

## Dependency state
- Checked mandatory governance/docs stack (`AGENTS.md`, codex prompt/schema/template/queue/prelude files).
- Checked Phase 0 files (`phase-0-source-lock`, packet register, destructive migration audit/ledger, screenshot baseline/manifest).
- Checked Section A doctrine files (global doctrine, destructive freeze, cutover gate, recovery order/sequencing, four-layer model, family matrix, layout stability/truth surfacing, touchpoint registry, definition-of-done, screenshot workflow).
- Checked Prestige/support docs (`docs/prestige-ritual-qa.md`, `docs/release/surface_truth_audit.md`, `docs/release/performance_smoke_checklist.md`, `docs/release/ui_cutover_red_flags.md`).
- Latest redesign/implementation `.docx` files and an explicit current design-state record were not present in this snapshot; implementation stayed grounded in in-repo runtime truth and Section A doctrine.

## Current snapshot findings
- Prestige already had a structurally strong outer-loop surface with advisor/AP/reset-contract/ritual and life-summary entry points.
- Generic blue/gradient dashboard residue: low but still present via shared/generic panel carry-over and weak decree-owner framing hierarchy.
- Later-phase-adjacent truthful surfaces already present and preserved: `Too Early/Viable/Recommended`, AP forecast + breakdown, reset/keep/rebuild contract, hold-to-confirm ritual modal, chapter-exhausted modal, life-summary modal, and visible-upgrade filtering.
- Live-node filtering was already truthful through `getVisiblePrestigeUpgrades()` and remained unchanged.
- Ritual modal / chapter-end / life-summary continuity was already functional; needed light consistency hardening for no-shift hold/status affordances and clearer ritual consequence guidance.
- Packet need classification: primarily material/hierarchy hardening, not structural rescue.

## What was already correct and preserved
- `PrestigeScreen` owner chain with `TopRibbon`, `RunCompassCompact`, advisor badge, AP forecast, reset contract, ritual action block, and life-summary actions.
- Ritual hold-to-confirm flow with focus/ESC/scroll-lock behavior and clear reset contract buckets.
- `Current Chapter Exhausted` and `LifeSummaryModal` family continuity.
- Runtime-backed visible decree filtering path and AP/readiness label truth.

## Decree-owner recovery changes
- Added a top `Reincarnation Decree` owner strip under the run compass to anchor screen intent before upgrade browsing.
- Added realm-context line to the advisor card to reinforce chapter-position read at glance.
- Added explicit `Reset Contract` header above the three reset/keep/rebuild columns for faster contract scanning.
- Removed generic shared panel class coupling from decree list container (`worldScreenPanel`) and replaced with local parchment framing so Prestige remains the owner.
- Hardened altar action area with stable consequence hint and reserved summary-button space to avoid layout movement when last-life summary is unavailable.

## Node honesty / AP / reset-contract stabilization outcome
- Preserved visible-live-node filtering authority (`getVisiblePrestigeUpgrades`) and did not surface hidden/deferred nodes.
- Preserved AP forecast and breakdown semantics while improving above-the-fold hierarchy around AP and reset-contract blocks.
- Kept canonical state labels (`Too Early`, `Viable`, `Recommended`) and reset headings unchanged.
- No read-model/store/runtime contract rewrites were required.

## Ritual modal / chapter-end / life-summary stabilization outcome
- Reinforced ritual footer guidance to make hold/release behavior explicit without changing the underlying hold contract.
- Added stable min-width/min-height reservations for hold button and status line to prevent jitter/no-shift regressions during hold progress and status updates.
- Added a calm final-warning hint to improve chapter-end/reincarnation intent continuity.
- Preserved `CurrentChapterExhaustedModal` and `LifeSummaryModal` behavior and routing; no structural modal-family rewrites were needed.

## Deferred full-phase-9-prestige work
- Broad prestige economy/AP/reclaim tuning.
- Deeper decree/node-family art or VFX expansion.
- New post-cap/deferred node families.
- Life-summary data-model redesign.
- Broad shared-shell redesign.

## Files changed
- `src/components/screens/PrestigeScreen.tsx`
- `src/components/screens/PrestigeScreen.scss`
- `src/components/modals/PrestigeRitualModal.tsx`
- `src/components/modals/PrestigeRitualModal.scss`
- `docs/ui/phase-0-p0-13-prestige-recovery.md`
- `docs/release/qa/ui-cutover/phase-0-p0-13-prestige/README.md`
- `docs/ui/phase-0-packet-register.md`

## Review evidence
- Evidence folder: `docs/release/qa/ui-cutover/phase-0-p0-13-prestige/`.
- Screenshot capture status: **MANUAL-PENDING** (browser capture tooling unavailable in this runtime).
- Manual checklist includes required Prestige main-screen and ritual-family captures, no-layout-shift proof, and visible-live-node proof.

## Verification results
- `git diff --check`
- `git diff --name-only`
- `npm run typecheck`
- `npm run build`
- `npm run ensure:vendor-links`
- `tsc --project tsconfig.tests.json`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/contracts/prestigeScreenHonesty.test.ts tests/contracts/prestigeAdvisorSurface.test.ts tests/contracts/lifeSummarySurface.test.ts tests/contracts/prestigeStarterSpendPlanner.test.ts tests/contracts/prestigeTargets.test.ts tests/integration/prestigeAdvisorRuntime.test.ts tests/integration/prestigeAdvisorUiBridge.test.ts tests/integration/prestigeRuntimeCatalog.test.ts tests/integration/lifeSummaryPrestigeFlow.test.ts tests/integration/prestigeReset.test.ts tests/integration/prestigeResetRuntime.test.ts tests/integration/prestigeAPHourRegression.test.ts tests/integration/release/layoutInteractionStabilityMatrix.test.ts tests/integration/release/surfaceTruthAudit.test.ts`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/contracts/releaseVocabularyAudit.test.ts tests/contracts/placeholderStringPurge.test.ts`

## Scope confirmation
- No new art created.
- No broad prestige-economy/system redesign bundled.
- No deferred node families surfaced.
- No broad reset-contract rewrite bundled.
- Final diff remains recovery/hardening for Prestige, not full Phase 9 completion.
