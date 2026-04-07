# P2-05 — Canonical material primitive convergence (`ui/ink` vs `ui/paper`)

## Objective
Make `src/ui/ink/*` the canonical material primitive family for live and future shell work, and keep `src/ui/paper/*` as explicit compatibility-only wrappers.

## Why now
After P2-04 token hardening, the largest remaining drift risk is a dual primitive language (`ui/ink` and `ui/paper`) both appearing live. P2-05 converges primitive ownership without redesigning board/modal proof surfaces.

## Dependency chain
- Uses packet guidance from:
  - `docs/ui/phase-2-p2-04-token-sheet.md`
- `docs/ui/phase-2-p2-03-shared-motion-token-normalization.md` is not present in current repo; fallback guidance used from:
  - `docs/ui/renderer-stack-foundation.md`
  - `docs/ui/phase-1-phase2-handoff.md`
  - `docs/ui/phase-1-exit-audit.md`
  - `docs/ui/section-a-touchpoint-registry.md`
  - `docs/ui/section-a-layout-stability-rules.md`
  - `docs/ui/section-a-screen-family-matrix.md`
  - `docs/ui/section-a-screenshot-approval-workflow.md`

## Current repo truth (before packet)
- `ui/ink` already had richer card/chip APIs and was the practical canonical family.
- `ui/paper` still had independent card/chip implementations and old class conventions.
- Live board/modal consumers still imported `ui/paper/index.js`.
- `ui/paper/PaperStamp.tsx` was already a shell re-export shim.

## Canonical vs compatibility decision
- **Canonical:** `src/ui/ink/*`
- **Compatibility-only:** `src/ui/paper/*`

`ui/paper` wrappers remain for legacy import paths and class-hook continuity but are no longer a second independent material implementation.

## Live consumers before/after
| Surface | Before | After |
| --- | --- | --- |
| `BountyBoardPanel.tsx` | `ui/paper/index.js` card/chip/stamp | `ui/ink` card/chip + `ui/shell` stamp |
| `ExpeditionBoardPanel.tsx` | `ui/paper/index.js` card/chip/stamp | `ui/ink` card/chip + `ui/shell` stamp |
| `DetailScrollModal.tsx` | `ui/paper` card | `ui/ink` card |

## Wrapper policy
- `ui/paper/PaperCard.tsx`: thin wrapper over canonical `ui/ink/PaperCard`.
- `ui/paper/PaperChip.tsx`: thin wrapper over canonical `ui/ink/PaperChip`.
- `ui/paper/PaperStamp.tsx`: compatibility re-export from `ui/shell/PaperStamp`.
- `ui/paper/paper.scss`: compatibility hook layer only; not a design-language owner.

## Legacy prop/class shim policy
- Keep compatibility props/classes where needed by legacy selectors:
  - `PaperCard`: `complete`, `claimed`, and old `paperCard*`/`is*` hooks.
  - `PaperChip`: legacy root/tone/tag/clickable hooks and icon/text hooks.
- Keep chips compact in migrated live consumers by setting `reserveEndSpace={false}` through local compact wrappers.

## PaperStamp status
`PaperStamp` was already converged pre-packet and remains a thin compatibility re-export to the shell implementation.

## Non-goals
- No Bounty/Expedition redesign.
- No DetailScrollModal redesign.
- No P2-04 token retuning.
- No P2-03 motion retiming.
- No shell API freeze work (P2-06).

## QA commands
- `npm run typecheck`
- `npm run build`
- `npm run test:contracts`

## Manual QA checklist
1. World → current city → Bounty Board: card states and chip widths remain stable.
2. World → current city → Expedition Board: route cards, duration chips, and slot-strip stamps remain stable.
3. DetailScrollModal remains coherent where used.
4. High FX / Low FX / Reduced Motion do not expose missing class/token fallbacks on board surfaces.
5. Confirm no thematic redesign occurred in this packet.

## Acceptance gate
Packet passes when:
- `ui/ink` is explicit canonical primitive family,
- `ui/paper` is explicit compatibility-only,
- no live current-semester consumer imports `ui/paper/index.js`,
- wrappers are thin and intentional,
- board/modal proof surfaces remain behaviorally and visually stable.
