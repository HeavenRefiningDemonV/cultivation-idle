# Phase 0 P0-10 — Apothecary recovery

## Purpose
Restore preparation-room ownership and pouch clarity without drifting into the later full Phase 8 Apothecary completion pass.

## Dependency state
- Checked mandatory governance/docs stack: `AGENTS.md`, `docs/codex/PROMPT_STYLE.md`, `docs/codex/UI_PACKET_SCHEMA.md`, `docs/codex/UI_SECTION_A_PACKET_TEMPLATE.md`, `docs/codex/SECTION_A_PACKET_QUEUE.md`, `docs/codex/SECTION_A_PROMPT_PRELUDE.md`.
- Checked Phase 0 docs: source lock, packet register, destructive migration audit/ledger, screenshot baseline/manifest.
- Checked Section A doctrine docs: global doctrine, destructive freeze, cutover gate, recovery order/sequencing, four-layer model, screen-family matrix, layout stability rules, truth surfacing rules, touchpoint registry (+ json), definition-of-done registry.
- Checked Apothecary/release docs: `docs/apothecary-pass0-map.md`, `docs/apothecary-medicine-pouch-modal-qa.md`, `docs/apothecary-pass3-meta-icons.md`, `docs/release/surface_truth_audit.md`, `docs/release/ui_cutover_red_flags.md`, `docs/release/performance_smoke_checklist.md`.
- Latest `.docx` redesign/implementation sources and explicit current design-state record were not present in this snapshot; packet executed against in-repo Phase 0 + Section A doctrine and current runtime source truth.

## Current snapshot findings
- Room ownership: **mostly preserved** (`ApothecaryPanel` remains the live owner inside `WorldBuildingModal`), with room-forward hierarchy already in place.
- Later-phase-adjacent truthful surfaces: **already present and preserved** (`RunCompassCompact`, recommended package, prep warnings, buy/brew/pouch tri-lane, pouch modal/object flow, source hints/read-model wiring).
- Generic flattening / blue-gradient residue: **partially present**, mostly via small readability regressions (blocked reasons hidden behind tooltip-only affordance; warning strip height not reserved).
- Package/warning/provenance quality: **useful but partially uneven** (recommended package had good counts + route intent, but lacked an explicit source-state line; blocked buy rows leaned on tooltip-only explanation).
- Pouch summary/modal behavior: **already functional and kept**; this packet focused on room-readiness hierarchy hardening around it instead of pouch architecture rewrites.

## What was already correct and preserved
- World → building modal → Apothecary entry chain remained intact.
- The preparation-room identity and room-first surface anatomy were already active and were preserved.
- Buy/Brew/Medicine Pouch stayed as the three primary lanes in one room.
- Embedded brew lane remained in-apothecary (no separate live Alchemy surface reintroduced).
- Existing prep/read-model + purpose/source + best-source integration remained authoritative for recommendations and warnings.
- Existing pouch modal flow (overlay close, ESC handling, anchor refocus, in-modal scroll) was preserved.

## Room-owner recovery changes
- Added a quiet top warning chip in the ribbon when warnings exist, reinforcing immediate room-readiness ownership above the fold.
- Added explicit visible blocked-state reason text on buy cards (`Blocked: ...`) so critical action truth is no longer tooltip-only.
- Preserved all existing room containers and avoided structural shell expansion.

## Recommended package / stock-warning outcome
- Recommended package rows now include explicit source-state + fastest-action line (`Source: ... • Fastest action: ...`) to reduce inference burden before tab switching.
- Warning strip now reserves stable vertical space (`min-height`) to reduce interaction-state reflow when warnings appear/disappear.
- Existing warning routing to Buy/Brew/Pouch tabs remains unchanged and truthful.

## Buy / brew / pouch stabilization outcome
- Buy lane kept as speed/convenience lane; bundle meta remained subordinate and no additional primary lane was introduced.
- Brew lane embedding via `ApothecaryBrewPanel`/`AlchemyPanel` was preserved (no separate live Alchemy route created).
- Pouch stayed a discrete room object + modal and retained existing interaction model.
- Local buy/readability hardening completed without changing pouch slot logic or brew queue semantics.

## Deferred full-phase-8-apothecary work
- Any full scenic counter dramatization/new art passes.
- Broad recipe/stock economy redesign.
- Deep counter service system expansion.
- Major cross-screen world-shell or crafting-family redesign.

## Files changed
- `src/components/screens/ApothecaryPanel.tsx`
- `src/components/screens/ApothecaryPanel.scss`
- `docs/ui/phase-0-p0-10-apothecary-recovery.md`
- `docs/release/qa/ui-cutover/phase-0-p0-10-apothecary/README.md`
- `docs/ui/phase-0-packet-register.md`

## Review evidence
- Evidence folder: `docs/release/qa/ui-cutover/phase-0-p0-10-apothecary/`
- Screenshot status: **MANUAL-PENDING** (runtime has no browser capture tooling in this execution path).
- Manual capture checklist provided in evidence README; baseline artifacts were not overwritten.

## Verification results
- `git diff --check`
- `git diff --name-only`
- `npm run typecheck`
- `npm run build`
- `npm run ensure:vendor-links`
- `tsc --project tsconfig.tests.json`
- `npm run build:progression-fixtures`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tmp-tests/tests/contracts/apothecaryBundles.test.js tmp-tests/tests/contracts/apothecaryBuyReadModel.test.js tmp-tests/tests/contracts/apothecaryLivePanelContract.test.js tmp-tests/tests/contracts/apothecaryLiveRoster.test.js tmp-tests/tests/contracts/apothecaryRecommendedPackage.test.js tmp-tests/tests/contracts/apothecaryStockWarningContract.test.js tmp-tests/tests/contracts/bestSourceIndex.test.js tmp-tests/tests/integration/apothecaryBundleSurfaceRuntime.test.js tmp-tests/tests/integration/apothecaryNoSeparateAlchemySurface.test.js tmp-tests/tests/integration/release/layoutInteractionStabilityMatrix.test.js tmp-tests/tests/integration/release/surfaceTruthAudit.test.js`

## Scope confirmation
- No new art created or required.
- No separate live Alchemy room surfaced.
- No broad economy rebalance bundled.
- No Forge/World broad redesign bundled.
- Final diff remains a recovery/hardening pass, not full Phase 8 completion work.
