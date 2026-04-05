# Phase 0 P0-15 — Exit audit and handoff

## Purpose
This packet verifies whether the branch is visually safe for Phase 1 using existing Phase 0 doctrine and evidence. It does not grant destructive cleanup by implication.

## Dependency state
- Phase 0 doctrine/state docs (`phase-0-source-lock`, packet register, destructive audit/ledger, screenshot baseline/manifest) are present.
- P0-04 through P0-13 recovery reports are present.
- P0-14 operational publication is present.
- Per-packet review folders under `docs/release/qa/ui-cutover/phase-0-p0-*` are present.
- Snapshot is complete enough for an honest verdict, but screenshot completion remains manual-pending in multiple packets and blocks strict safety signoff.

## Audit basis
- Branch: `work`
- Commit: `c43646f` (audit-start snapshot)
- Working tree at audit start: clean
- Sources consumed:
  - Section A doctrine (`section-a-cutover-gate`, screenshot workflow, stability/truth, family/layer, DoD)
  - Release governance (`ui_screen_signoff_sheet`, `ui_cutover_red_flags`)
  - Phase 0 reports (`p0-04`..`p0-14`) and evidence readmes under `docs/release/qa/ui-cutover/phase-0-p0-*`
- Live verification commands run for this packet are listed in `Verification commands and results`.
- Missing authority docs: latest redesign/implementation `.docx` and explicit design-state record were not present in this snapshot.

## Fixed target roster
1. Path / Life Start
2. Cultivation
3. Status
4. World
5. Manual Pavilion
6. Techniques
7. Apothecary
8. Forge
9. Bounties / Expeditions
10. Prestige

## Per-screen exit matrix
| Recovery order | Screen | Status | Evidence used | Remaining blockers | Legitimate watchpoints | Phase 1 support-art asks justified now | Phase 2 shell watchpoints |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Path / Life Start | blocked | `docs/ui/phase-0-p0-04-path-life-start-recovery.md`; `docs/release/qa/ui-cutover/phase-0-p0-04-path-life-start/README.md`; `docs/ui/phase-0-screenshot-baseline.md` | Exact-screen screenshot gate incomplete (manual-pending), so cleanup safety cannot be proven | Layering polish for first-contact overlays after proof is complete | Shared frame/plaque family for consistent reviewer labels across hero flows | Keep routing-shell ownership local; prevent global shell takeover |
| 2 | Cultivation | blocked | `docs/ui/phase-0-p0-05-cultivation-recovery.md`; baseline docs | Screenshot completion gap blocks exact-screen safety proof | Hero polish sequencing only after full mode evidence | Overlay/mask support pack for reusable emphasis roles (not repaint) | Preserve hero owner in shell continuation |
| 3 | Status | blocked | `docs/ui/phase-0-p0-06-status-recovery.md`; `docs/release/qa/ui-cutover/phase-0-p0-06-status/README.md` | Manual-pending screenshot set blocks strict cutover-safe verdict | Diagnostics readability polish once proof set is complete | Shared plaque/ribbon labels for status diagnostics headers | Maintain no-shift guarantees across shared state primitives |
| 4 | World | blocked | `docs/ui/phase-0-p0-07-world-recovery.md`; `docs/release/qa/ui-cutover/phase-0-p0-07-world/README.md` | Missing exact-screen approval evidence for full gate pass | Routing readability and map label coherence | Reusable world/building label plaques | Shell routing continuity and modal ownership boundaries |
| 5 | Manual Pavilion | blocked | `docs/ui/phase-0-p0-08-manual-pavilion-recovery.md`; `docs/release/qa/ui-cutover/phase-0-p0-08-manual-pavilion/README.md` | Screenshot gate incomplete (manual-pending) | Shelf/spine polish after formal evidence completion | Frame/plaque support roles for shelf metadata grouping | Shared shell must remain subordinate to room owner |
| 6 | Techniques | blocked | `docs/ui/phase-0-p0-09-techniques-recovery.md`; `docs/release/qa/ui-cutover/phase-0-p0-09-techniques/README.md` | Missing complete screenshot approval prevents safe handoff verdict | Altar-detail polish after full gate evidence | Overlay/mask support parts for controlled emphasis only | Phase 2 shell should not flatten altar ownership |
| 7 | Apothecary | blocked | `docs/ui/phase-0-p0-10-apothecary-recovery.md`; `docs/release/qa/ui-cutover/phase-0-p0-10-apothecary/README.md` | Exact-screen gate evidence incomplete | Queue/readiness polish once evidence is complete | Shared chips/frames for route/readiness consistency | Maintain module-owner primacy in shell refinements |
| 8 | Forge | blocked | `docs/ui/phase-0-p0-11-forge-recovery.md`; `docs/release/qa/ui-cutover/phase-0-p0-11-forge/README.md` | Manual-pending screenshot set blocks strict safe verdict | Process/detail rhythm polish after full proof capture | Shared frame/plaque support for requirement/source rows | Preserve forgewide/workshop ownership in future shell passes |
| 9 | Bounties / Expeditions | blocked | `docs/ui/phase-0-p0-12-bounties-expeditions-recovery.md`; `docs/release/qa/ui-cutover/phase-0-p0-12-bounties-expeditions/README.md` | Manual-pending screenshots block legal signoff confidence | Support-pair polish after evidence completion only | Reusable route/order plaques and support tags | Keep support-board shell variants local and non-dominant |
| 10 | Prestige | blocked | `docs/ui/phase-0-p0-13-prestige-recovery.md`; `docs/release/qa/ui-cutover/phase-0-p0-13-prestige/README.md` | No complete screenshot set for exact-screen gate approval | Decree/polish tuning after full proof set | Shared decree/plaque frame support roles | Keep ritual family continuity while avoiding shell flattening |

## Cross-screen blocker audit
- **Primary blocker:** exact-screen screenshot completion gap across P0-04..P0-13 (manual-pending evidence), which prevents trustworthy legal cutover safety proof branch-wide.
- **Secondary blocker:** no single completed Phase 0 signoff record that marks all ten target screens as gate-satisfied.
- No new runtime blocker was introduced by this packet (docs-only).

## Fresh-save and migrated-save smoke coverage
- Fresh-save/release smoke evidence was consumed from existing release scripts and test suites (see command results below).
- Migrated-save/seeded-state coverage was run via `release:migration-matrix`.
- Coverage exists, but screenshot-proof completeness still blocks overall visual-safe signoff.

## Verification commands and results
- `git diff --check` — pass
- `git diff --name-only` — pass
- `npm run typecheck` — pass
- `npm run build` — pass
- `npm run check:icons` — pass
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/integration/release/layoutInteractionStabilityMatrix.test.ts` — pass
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/integration/release/surfaceTruthAudit.test.ts` — pass
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/contracts/releaseVocabularyAudit.test.ts tests/contracts/placeholderStringPurge.test.ts` — pass
- `npm run release:fresh-run-report` — pass
- `npm run release:migration-matrix` — pass

## Final verdict
**NOT SAFE FOR PHASE 1**

Rationale: the branch still lacks completed exact-screen screenshot evidence across the mandatory Phase 0 target roster, so branch-level visual safety cannot be proven under the legal cutover gate despite passing runtime verification commands.

## Phase 1 handoff conditions
- Phase 1 support-art preparation must stay in support-role asks only (frames, plaques, overlays, label supports, reusable FX atlas) and must not begin repaint-style replacement asks.
- Before any cleanup-capable Phase 1 packet, complete exact-screen screenshot sets for the target screen and record signoff against the legal gate.
- No destructive cleanup is legal by default.

## Phase 2 handoff conditions
- Phase 2 shared-shell continuation may proceed only as non-destructive, owner-preserving integration.
- Phase 2 does not inherit permission to remove base owners or legacy layers without exact-screen gate pass and recorded approval.
- Shell improvements must remain subordinate to screen-family ownership and no-layout-shift law.

## Open watchpoints that are legitimate later-phase work
### Phase 1 support art
- Shared frame/plaque/ribbon family for consistent labels across recovered screens.
- Reusable overlay/mask pack for controlled emphasis without repainting scenic owners.
- World/building label plaque kit for map/readability alignment.
- Shared restrained FX atlas for coherent high/low/reduced quality tiers.

### Phase 2 shell/chrome follow-through
- Ownership-safe shell primitive consolidation (no owner takeover).
- Route/modal shell consistency with fixed local-owner precedence.
- Cross-screen no-layout-shift guardrails on shared interactive states.

### Later screen-local polish
- Per-screen copy/spacing refinements after screenshot-complete signoff.
- Final tightening of support-vs-hero tone differences where evidence proves need.

## Scope confirmation
This packet is signoff/handoff only. Runtime UI code, assets, and styles were not changed.
