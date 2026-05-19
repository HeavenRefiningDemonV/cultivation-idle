# P4 Offline Catchup Trust Report

- Generated: 2026-05-19
- Scope: Offline catchup surface, one mutating pipeline, summary trust copy, modal priority, no offline combat.
- Status: PASS for targeted P4 offline checks. Legacy offline helpers are classified as compatibility wrappers/preview helpers, not fully removed.

## Evidence

| Area | Status | Evidence |
| --- | --- | --- |
| Single mutating pipeline | PASS | `OfflineCatchup.apply()` remains the mutating SaveService path; `src/systems/offline.ts` is documented as legacy wrapper/preview compatibility and must not be used as a second load mutation path. |
| Surface builder | PASS | `src/systems/offline/offlineCatchupSurface.ts`; `tests/contracts/offlineCatchupSurface.test.ts` |
| Modal integration | PASS | `src/components/modals/OfflineProgressModal.tsx`; browser capture `docs/release/qa/p4-offline-summary.png` |
| Modal priority | PASS | `src/components/GameLayout.tsx`; `src/components/modals/OfflineProgressModal.scss`; `tests/contracts/offlineModalPriority.test.ts`; browser capture `docs/release/qa/p4-offline-priority.png` |
| No offline combat | PASS | Surface blocked reason and focused offline tests preserve combat exclusion. |
| Readable trust rows | PASS | Trust rows use explicit label/value/detail columns; no concatenated strings such as `Base idle settlement50%` or `Combat excludedCombat never progresses while offline.` |

## Player-Facing Contract

- Time considered and cap are surfaced.
- Efficiency and its sources are surfaced.
- Qi, queued action, and expedition groups are surfaced when present.
- Zero/blocked categories can explain why nothing changed.
- Combat is explicitly excluded from offline progression.

## Blockers

- None in targeted P4 offline checks.

## Deferred

- `src/systems/offline.ts` still exists for compatibility and simulation-style helpers. P4 classifies and documents this split; it does not claim the legacy file was fully deleted.
- Any broader progression diagnostic warning about offline pipeline split should remain post-semester debt unless a future packet removes those helpers entirely.
