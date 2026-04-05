# P0-15 Phase 0 exit audit — evidence index

## Purpose
This folder indexes the evidence sources used by P0-15 to determine whether the branch is visually safe for Phase 1.

## Evidence sources reviewed
- Phase 0 baseline docs:
  - `docs/ui/phase-0-screenshot-baseline.md`
  - `docs/ui/phase-0-screenshot-manifest.json`
- Phase 0 packet reports:
  - `docs/ui/phase-0-p0-04-path-life-start-recovery.md` … `docs/ui/phase-0-p0-13-prestige-recovery.md`
- Phase 0 packet evidence folders:
  - `docs/release/qa/ui-cutover/phase-0-p0-04-path-life-start/`
  - `docs/release/qa/ui-cutover/phase-0-p0-05-cultivation/`
  - `docs/release/qa/ui-cutover/phase-0-p0-06-status/`
  - `docs/release/qa/ui-cutover/phase-0-p0-07-world/`
  - `docs/release/qa/ui-cutover/phase-0-p0-08-manual-pavilion/`
  - `docs/release/qa/ui-cutover/phase-0-p0-09-techniques/`
  - `docs/release/qa/ui-cutover/phase-0-p0-10-apothecary/`
  - `docs/release/qa/ui-cutover/phase-0-p0-11-forge/`
  - `docs/release/qa/ui-cutover/phase-0-p0-12-bounties-expeditions/`
  - `docs/release/qa/ui-cutover/phase-0-p0-13-prestige/`
- Gate/signoff doctrine:
  - `docs/ui/phase-0-p0-14-universal-cutover-gate.md`
  - `docs/release/ui_screen_signoff_sheet.md`
  - `docs/release/ui_cutover_red_flags.md`

## Commands run
- `git diff --check`
- `git diff --name-only`
- `npm run typecheck`
- `npm run build`
- `npm run check:icons`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/integration/release/layoutInteractionStabilityMatrix.test.ts`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/integration/release/surfaceTruthAudit.test.ts`
- `NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs' node --test tests/contracts/releaseVocabularyAudit.test.ts tests/contracts/placeholderStringPurge.test.ts`
- `npm run release:fresh-run-report`
- `npm run release:migration-matrix`

## Final verdict
`NOT SAFE FOR PHASE 1`

## Blockers and watchpoints summary
- Blockers: exact-screen screenshot completion gaps remain across mandatory Phase 0 roster, preventing legal gate closure.
- Watchpoints: support-role art families and shell harmonization opportunities are documented in `docs/ui/phase-0-phase1-phase2-handoff-watchpoints.md`.

## New screenshots created in P0-15
None. This packet is evidence-indexing and audit publication only.
