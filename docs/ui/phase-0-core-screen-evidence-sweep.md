# Phase 0 core-screen evidence sweep (completion pass 03)

## Purpose
Publish an exact-screen evidence and signoff sweep for the mandatory 10-screen Phase 0 roster, now paired with a repo-native harness/capture pipeline (`uiAudit=phase-0`) and evidence validator.

## Dependency state
- `docs/ui/phase-0-source-lock.md`: present.
- `docs/ui/phase-0-packet-register.md`: present.
- `docs/ui/phase-0-p0-14-universal-cutover-gate.md`: present.
- `docs/release/ui_screen_signoff_sheet.md`: present and updated by this pass.
- Existing per-packet evidence READMEs for `phase-0-p0-04` through `phase-0-p0-13`: present.
- Phase 0 core harness + manifest + validator + capture command: present (`src/dev/phase0CoreAudit/*`, `scripts/release/validatePhase0CoreEvidence.ts`, `scripts/release/capturePhase0CoreEvidence.ts`).

## Existing evidence already present
- Existing repository coverage includes baseline/support folders and packet-specific `README.md` capture instructions.
- For the mandatory ten core targets, no complete six-slot image packs (`01`..`06`) are currently committed.
- Existing ritual/modal folders are retained as supporting evidence, but they do not satisfy the ten core target requirement on their own.
- Infrastructure blocker update: the repo now contains an approved automated capture route; remaining blockers are evidence completeness and review execution, not missing tooling.

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

## Per-screen evidence status table
| Screen | Evidence folder | Base | Interaction | Truth | High FX | Low FX | Reduced Motion | Signoff state | Blocker summary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Path / Life Start | `docs/release/qa/ui-cutover/phase-0-core-screens/01-path-life-start/` | missing | missing | missing (`N/A` allowed with reason) | missing | missing | missing | `DEFERRED` | No six-slot proof set in repo. |
| Cultivation | `docs/release/qa/ui-cutover/phase-0-core-screens/02-cultivation/` | missing | missing | missing | missing | missing | missing | `DEFERRED` | Missing exact-screen screenshot evidence. |
| Status | `docs/release/qa/ui-cutover/phase-0-core-screens/03-status/` | missing | missing | missing | missing | missing | missing | `DEFERRED` | Evidence-completeness gap persists. |
| World | `docs/release/qa/ui-cutover/phase-0-core-screens/04-world/` | missing | missing | missing | missing | missing | missing | `DEFERRED` | Required `01-06` files not present. |
| Manual Pavilion | `docs/release/qa/ui-cutover/phase-0-core-screens/05-manual-pavilion/` | missing | missing | missing | missing | missing | missing | `DEFERRED` | Manual instructions exist; canonical files missing. |
| Techniques | `docs/release/qa/ui-cutover/phase-0-core-screens/06-techniques/` | missing | missing | missing | missing | missing | missing | `DEFERRED` | No legal gate-ready screenshot pack. |
| Apothecary | `docs/release/qa/ui-cutover/phase-0-core-screens/07-apothecary/` | missing | missing | missing | missing | missing | missing | `DEFERRED` | Exact-screen proof not captured. |
| Forge | `docs/release/qa/ui-cutover/phase-0-core-screens/08-forge/` | missing | missing | missing | missing | missing | missing | `DEFERRED` | No complete six-slot artifacts. |
| Bounties / Expeditions | `docs/release/qa/ui-cutover/phase-0-core-screens/09-bounties-expeditions/` | missing | missing | missing | missing | missing | missing | `DEFERRED` | Evidence set absent for both board states. |
| Prestige | `docs/release/qa/ui-cutover/phase-0-core-screens/10-prestige/` | missing | missing | missing | missing | missing | missing | `DEFERRED` | Screenshot completeness blocker remains. |

## Signoff-sheet updates applied
- Added one normalized signoff block per core target under a dedicated completion-pass section.
- Each new block uses gate statuses consistent with available proof:
  - `G1`: `FAIL` (no complete screenshot set)
  - `G2`: `PASS` (no destructive cleanup performed in this packet)
  - `G3`..`G8`: `FAIL` due missing visual proof (not asserted as runtime regression)
- Final decision for each of the ten screens: `DEFERRED`.

## Proof gaps that still block approval
- Primary blocker: exact-screen evidence-completeness gap (`01-base.png` through `06-reduced-motion.png`) across all ten core targets.
- Because evidence does not exist, no `APPROVED FOR CLEANUP` state is legal in this packet.
- This packet intentionally stops at truthful blocker publication plus pipeline enablement instead of performing redesign/runtime-fix work.

## Supporting modal/ritual evidence retained
The following remain valid supporting references (not substitutes for the ten core targets):
- `docs/release/qa/ui-cutover/life-start-path/`
- `docs/release/qa/ui-cutover/life-start-heart-law/`
- `docs/release/qa/ui-cutover/life-start-breath-focus/`
- `docs/release/qa/ui-cutover/dao-heart-law/`
- `docs/release/qa/ui-cutover/dao-heart-study/`
- `docs/release/qa/ui-cutover/change-heart-law/`
- `docs/release/qa/ui-cutover/prestige-ritual/`
- `docs/release/qa/ui-cutover/current-chapter-exhausted/`
- `docs/release/qa/ui-cutover/life-summary/`

## Verification results
- `git diff --check`
- `git diff --name-only`
- `node -e "JSON.parse(require('fs').readFileSync('docs/ui/phase-0-core-screen-evidence-manifest.json','utf8')); console.log('json ok')"`
- `npm run release:phase0-core-evidence-audit`
- `find docs/release/qa/ui-cutover/phase-0-core-screens -maxdepth 2 -type f | sort`
- `rg -n "DEFERRED|APPROVED FOR CLEANUP|REJECTED — REMAIN ADDITIVE|REVIEW READY" docs/release/ui_screen_signoff_sheet.md`

## Scope confirmation
This packet is evidence-first/signoff-first documentation only. No runtime UI code changes, no asset generation, and no fake screenshot artifacts were introduced.
