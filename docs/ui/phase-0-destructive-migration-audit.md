# P0-01 — Destructive-migration audit

## Purpose

This audit identifies destructive-migration deltas in the current snapshot and publishes a bounded rollback/quarantine ledger for P0-03 and P0-04..P0-13. It is docs-first and does not apply runtime rollback edits.

## Dependency state

- P0-00 docs present and used as canonical entrypoints:
  - `docs/ui/phase-0-source-lock.md`
  - `docs/ui/phase-0-packet-register.md`
- Section A doctrine stack used as detailed law base.

## Audit basis

- Current branch: `work`
- Current commit: `bc9be72`
- P0-00 docs present: `yes`
- Merge-base diff available: `no` (`origin/main` and `main` merge-bases unavailable in this snapshot)
- Method fallback: current-snapshot file inspection plus file-history/context checks.

## What counts as destructive migration in this audit

A finding is destructive only when the branch snapshot shows a delta that removes, demotes, duplicates, or obscures incumbent screen ownership before exact-screen additive completion/cutover approval. Ordinary unfinished polish (visual flatness, non-final icon polish, non-final FX mood) is not flagged by itself.

## Severity rubric

- **critical**: first-contact/core command ownership is actively broken, or a shared wrapper actively breaks multiple core screens.
- **high**: identity-bearing room/outer-loop surface is materially weakened, or dominant duplicate systems are live.
- **medium**: real destructive symptom exists but is localized or state-conditional.
- **low**: suspicious pattern exists but cannot be proven actively destructive in code-only audit.
- **stable**: no destructive-migration finding in the current snapshot.

## Disposition rubric

- **revert-now**: clearly destructive and sufficiently local to roll back directly.
- **quarantine-now**: shared-wrapper/cross-screen drift, primarily for P0-03.
- **leave-in-place-pending-proof**: suspicious but not yet proven destructive.
- **already-stable**: no destructive finding on the audited screen.

## Executive summary

### Counts by severity
- critical: 0
- high: 2
- medium: 2
- low: 0
- stable: 6

### Counts by disposition
- revert-now: 0
- quarantine-now: 3
- leave-in-place-pending-proof: 1
- already-stable: 6

### Counts by origin
- local: 0
- shared: 2
- mixed: 2

## Shared-wrapper / cross-screen findings

### P0-01-S001 — Split header/ribbon ownership channel (shared)
- **Pattern**: `mixed-old-new-framing`
- **Severity**: high
- **Disposition**: quarantine-now
- **Symptom**: screens continue to call `setHeaderTitles(...)` while visible ownership is provided by local/shared ribbon surfaces (`TopRibbon` and per-screen top ribbons), and the legacy `Header` component remains in repo but is not mounted by `GameLayout`.
- **Why destructive**: this keeps a half-migrated ownership channel alive and risks duplicate or conflicting title ownership as wrappers evolve.
- **Primary shared files**:
  - `src/components/GameLayout.tsx`
  - `src/components/Header.tsx`
  - `src/ui/shell/TopRibbon.tsx`
  - `src/stores/uiStore.ts`
- **Primary consumer screens**:
  - `src/components/screens/WorldScreen.tsx`
  - `src/components/screens/PrestigeScreen.tsx`
  - `src/components/screens/TechniqueLibraryScreen.tsx`
- **Next packet**: `P0-03`

### P0-01-S002 — Parallel paper/ink card-chip families active in world-support loop (mixed)
- **Pattern**: `mixed-old-new-framing`
- **Severity**: medium
- **Disposition**: quarantine-now
- **Symptom**: module boards use `src/ui/paper/*` card/chip primitives while adjacent surfaces and shared shell rely on `src/ui/ink/*` + shell wrappers.
- **Why destructive**: this is a live dual-system migration state that can produce cross-screen framing/semantics drift before explicit cutover law for that exact family.
- **Primary shared files**:
  - `src/ui/paper/PaperCard.tsx`
  - `src/ui/paper/PaperChip.tsx`
  - `src/ui/ink/PaperCard.tsx`
  - `src/ui/ink/PaperChip.tsx`
  - `src/ui/shell/FrameCard.tsx`
- **Primary consumer screens**:
  - `src/components/screens/BountyBoardPanel.tsx`
  - `src/components/screens/ExpeditionBoardPanel.tsx`
- **Next packet**: `P0-03` then `P0-12`

## Recovery-order ledger

1. **Path / Life Start**
   - Owner anchor: portrait-led triptych / ritual first-contact ownership
   - Owner-anchor state: `intact`
   - Severity: `stable`
   - Findings: none

2. **Cultivation**
   - Owner anchor: central cultivator / dantian / altar composition, Qi bar, breakthrough controls
   - Owner-anchor state: `intact`
   - Severity: `stable`
   - Findings: none

3. **Status**
   - Owner anchor: diagnostic summary ownership, next-action clarity, Spirit Root prominence
   - Owner-anchor state: `intact`
   - Severity: `stable`
   - Findings: none

4. **World**
   - Owner anchor: city/map ownership, overlays/labels, contextual inspector
   - Owner-anchor state: `unclear`
   - Severity: `high`
   - Finding: `P0-01-F001` (shared wrapper ownership-channel split; see S001)

5. **Manual Pavilion**
   - Owner anchor: shelf/spine room identity
   - Owner-anchor state: `intact`
   - Severity: `stable`
   - Findings: none

6. **Techniques**
   - Owner anchor: Inner Palace / altar ownership and stable slot behavior
   - Owner-anchor state: `unclear`
   - Severity: `medium`
   - Finding: `P0-01-F002` (header-channel split risk; pending visual proof)

7. **Apothecary**
   - Owner anchor: preparation-room identity and pouch clarity
   - Owner-anchor state: `intact`
   - Severity: `stable`
   - Findings: none

8. **Forge**
   - Owner anchor: workshop room ownership and side/detail coherence
   - Owner-anchor state: `intact`
   - Severity: `stable`
   - Findings: none

9. **Bounties / Expeditions**
   - Owner anchor: paper-board / route-slip support identity
   - Owner-anchor state: `duplicated`
   - Severity: `medium`
   - Finding: `P0-01-F003` (parallel paper/ink primitive families; see S002)

10. **Prestige**
    - Owner anchor: decree-like reincarnation surface
    - Owner-anchor state: `unclear`
    - Severity: `high`
    - Finding: `P0-01-F004` (shared top ribbon + detached legacy header channel; see S001)

## Secondary appendix-only findings

- Outskirts / Ruins / Gate Trial wrapper path (via `WorldBuildingModal`) currently appears additive and module-local in code inspection; no destructive finding recorded in this packet.

## Bounded revert-now list

- None in this snapshot. No finding met the `revert-now` locality/proof bar from code-only inspection.

## Bounded quarantine-now list for P0-03

1. `P0-01-S001` / `P0-01-F001` / `P0-01-F004`
   - Quarantine shared ownership-channel split across header/ribbon surfaces.
2. `P0-01-S002` / `P0-01-F003`
   - Quarantine parallel paper/ink primitive migration overlap on Bounties/Expeditions support surfaces.

## Leave-in-place-pending-proof list

1. `P0-01-F002` (Techniques)
   - Keep recorded as medium risk pending screenshot/manual confirmation of visible duplicate/ownership conflict.

## Screens already stable

- Path / Life Start
- Cultivation
- Status
- Manual Pavilion
- Apothecary
- Forge

## Open unknowns / manual confirmation needed

1. Visual confirmation is still needed for whether the header/ribbon split currently manifests as a visible duplicate owner on all breakpoints.
2. Visual confirmation is still needed for the practical impact of dual paper/ink primitive families in mixed route flows.
3. Merge-base branch unavailable in this snapshot, so historical “first-introduced-by” attribution remains partial.

## Next-packet handoff

- **P0-03 Shared-chrome regression rollback** should consume all `quarantine-now` findings (`P0-01-S001`, `P0-01-S002`, plus linked screen findings).
- **P0-04..P0-13** should consume per-screen entries from the ledger in strict recovery order.
- No runtime rollback is authorized by this packet; this packet is evidence and classification only.
