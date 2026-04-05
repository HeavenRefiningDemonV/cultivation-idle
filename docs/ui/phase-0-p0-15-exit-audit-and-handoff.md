# Phase 0 P0-15 — Exit audit and handoff (completion pass 03)

## Purpose
Finalize the Phase 0 branch-safety decision using the current signoff/evidence state and only narrow blocker-remediation scope. This packet does not authorize destructive cleanup by implication.

## Dependency state
- Phase 0 governance docs are present (`phase-0-source-lock`, packet register, P0-14 cutover publication, destructive ledger, screenshot baseline/manifest).
- Core-screen evidence sweep docs are present (`phase-0-core-screen-evidence-sweep.md`, `phase-0-core-screen-evidence-manifest.json`).
- Deterministic core-screen evidence folders (`docs/release/qa/ui-cutover/phase-0-core-screens/01..10`) are present with explicit proof-gap instructions.
- `docs/release/ui_screen_signoff_sheet.md` contains normalized deferred states for the core-screen sweep.

## Audit basis
- Branch: `work`
- Commit: `d68f5c7` (audit-start snapshot)
- Working tree at audit start: clean
- Sources consumed:
  - `docs/ui/phase-0-*` packet docs and manifests
  - `docs/ui/section-a-cutover-gate.md`
  - `docs/ui/section-a-screenshot-approval-workflow.md`
  - `docs/ui/section-a-layout-stability-rules.md`
  - `docs/ui/section-a-truth-surfacing-rules.md`
  - `docs/release/ui_screen_signoff_sheet.md`
  - `docs/release/ui_cutover_red_flags.md`
  - `docs/release/qa/ui-cutover/phase-0-core-screens/*/README.md`
- Missing authority docs in this repository snapshot: latest implementation/redesign `.docx` and current design-state record.

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
| 1 | Path / Life Start | blocked | `phase-0-core-screens/01-path-life-start/README.md`, signoff block (`target screen id: path-life-start`) | Missing exact-screen `01..06` evidence blocks legal gate completion | Post-proof first-contact overlay polish | Shared frame/plaque labels for first-contact support | Keep shell overlays subordinate to local owner |
| 2 | Cultivation | blocked | `phase-0-core-screens/02-cultivation/README.md`, signoff block (`cultivation`) | Missing complete screenshot set for gate criteria G1/G3-G8 | Hero-center polish sequencing after proof completion | Overlay/mask support pack for additive emphasis | Preserve hero owner primacy in shell continuation |
| 3 | Status | blocked | `phase-0-core-screens/03-status/README.md`, signoff block (`status`) | No legal gate-ready screenshot set for diagnostics surface | Diagnostics readability polish after proof closure | Shared plaque/ribbon labels for diagnostics headers | Keep no-layout-shift guarantees on shared state primitives |
| 4 | World | blocked | `phase-0-core-screens/04-world/README.md`, signoff block (`world`) | Missing exact-screen evidence for map + routed panel states | Map-label routing polish after evidence closure | Reusable world/building label plaques | Enforce route/modal ownership boundaries |
| 5 | Manual Pavilion | blocked | `phase-0-core-screens/05-manual-pavilion/README.md`, signoff block (`manual-pavilion`) | Missing required `01..06` screenshots | Shelf/spine hierarchy polish once proof exists | Frame/plaque supports for shelf metadata | Shared shell remains subordinate to room owner |
| 6 | Techniques | blocked | `phase-0-core-screens/06-techniques/README.md`, signoff block (`techniques`) | Incomplete screenshot evidence prevents safe verdict | Altar detail rhythm polish after proof closure | Overlay/mask supports for altar emphasis | Preserve altar-owned hierarchy in shell follow-through |
| 7 | Apothecary | blocked | `phase-0-core-screens/07-apothecary/README.md`, signoff block (`apothecary`) | Missing exact-screen gate evidence | Queue/readiness polish after evidence completion | Shared route/readiness chips and framing supports | Maintain module-owner primacy under shared shell |
| 8 | Forge | blocked | `phase-0-core-screens/08-forge/README.md`, signoff block (`forge`) | Missing complete evidence set for forge states | Process/detail rhythm polish after proof closure | Requirement/source frame supports | Preserve forgewide/workshop scenic ownership |
| 9 | Bounties / Expeditions | blocked | `phase-0-core-screens/09-bounties-expeditions/README.md`, signoff block (`bounties-expeditions`) | Missing proof set across board pair states | Support-pair hierarchy polish after evidence completion | Route/order plaques + support tags | Keep support-board shell variants local/non-dominant |
| 10 | Prestige | blocked | `phase-0-core-screens/10-prestige/README.md`, signoff block (`prestige`) | Missing exact-screen screenshots for legal gate | Decree-family polish after proof closure | Shared decree/plaque frame roles | Keep ritual continuity without shell flattening |

## Cross-screen blocker audit
- **Primary blocker:** Evidence-completeness gap across all ten core targets (no full `01-base`..`06-reduced-motion` packs).
- **Secondary blocker:** Gate criteria G3-G8 cannot be truthfully validated without exact-screen visual artifacts.
- **Runtime blocker remediation scope in this pass:** none applied; blocker count exceeds the safe narrow-remediation stop condition and is dominated by proof gaps rather than tiny runtime defects.

## Fresh-save and migrated-save smoke coverage
- Fresh-save smoke command executed: `npm run release:fresh-run-report` (pass; manual coverage warnings remain expected).
- Migrated-save matrix command executed: `npm run release:migration-matrix` (pass).
- These runtime checks pass, but they do not substitute for missing exact-screen evidence packs.

## Verification commands and results
- `git diff --check` — pass
- `git diff --name-only` — pass
- `npm run typecheck` — pass
- `npm run build` — pass
- `npm run check:icons` — pass
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/integration/release/layoutInteractionStabilityMatrix.test.ts` — pass
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/integration/release/surfaceTruthAudit.test.ts` — pass
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/contracts/releaseVocabularyAudit.test.ts tests/contracts/placeholderStringPurge.test.ts` — pass
- `npm run release:fresh-run-report` — pass (manual-route coverage warnings expected)
- `npm run release:migration-matrix` — pass

## Final verdict
**NOT SAFE FOR PHASE 1**

Rationale: despite passing runtime verification checks, branch-level exact-screen proof remains incomplete for all mandatory core screens, so legal cutover safety cannot be proven.

## Phase 1 handoff conditions
- Phase 1 work stays support-art-only; no scenic repaint or owner replacement asks.
- Before any cleanup-capable packet, complete exact-screen `01..06` evidence and re-run signoff per core target.
- Do not treat this packet’s watchpoints as cleanup authorization.

## Phase 2 handoff conditions
- Phase 2 shared-shell continuation must remain non-destructive and owner-preserving.
- No base-owner/legacy-layer removal without exact-screen gate pass and recorded approval.
- Preserve no-layout-shift and truth-in-DOM obligations under any shell harmonization.

## Open watchpoints that are legitimate later-phase work
### Phase 1 support art
- Shared frame/plaque/ribbon family for cross-screen support labels.
- Reusable overlay/mask pack for additive legibility emphasis.
- World/building label plaque kit for map/readability support.
- Shared restrained FX atlas with coherent quality-tier behavior.

### Phase 2 shell/chrome follow-through
- Ownership-safe shell primitive consolidation.
- Route/modal shell consistency with fixed local-owner precedence.
- Cross-screen no-layout-shift guardrails on shared interaction states.

### Later screen-local polish
- Per-screen copy/spacing refinements after screenshot-complete signoff.
- Support-vs-hero tone tightening only where post-proof evidence justifies it.

## Scope confirmation
This packet is a narrow branch-safety audit/handoff publication. Runtime UI code, assets, and styles were not changed.
