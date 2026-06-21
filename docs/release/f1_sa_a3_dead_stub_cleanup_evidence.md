# F1 / SA-A3 — Remove the dead stat-effect stubs (evidence)

**Packet:** F1 sub-packet — `SA-A3` · class `cleanup` (dead code, zero-caller) · risk I · **off the critical path**
**Landed:** 2026-06-21 · **Cutover statement:** cleanup of confirmed zero-caller dead code only; no live layer removed; no sibling-file cleanup.

The **only** deletion in the entire F1 set — and it deletes *dead code*, not a live layer.

## 1 · The zero-caller proof (recon, BEFORE removal — Appendix H)

```
grep -rn "resolveCultivatorStatEffectSnapshot|CultivatorStatEffectSnapshot" src tests
  → ONLY src/systems/cultivatorStats/statEffectResolver.ts (the definition). No consuming caller.
grep -rn "resolveStatProgressionPreview|StatProgressionPreview" src tests
  → ONLY src/systems/cultivatorStats/statProgressionResolver.ts (the definition). No consuming caller.
```

The KEEP modules have live callers and were **not** touched: `statDefinitions` (courtSharedStats),
`statGrade` (trainingReadOnlySnapshot), `statSelectors`.

## 2 · Removed

- `src/systems/cultivatorStats/statEffectResolver.ts` — `resolveCultivatorStatEffectSnapshot` (returned `{ mode: 'stub_no_gameplay_effect' }`).
- `src/systems/cultivatorStats/statProgressionResolver.ts` — `resolveStatProgressionPreview` (stub).
- `src/systems/cultivatorStats/index.ts` — dropped the two `export *` re-exports of the removed modules.

## 3 · One in-packet test revision (the iron rule: revise, never leave failing)

`tests/contracts/trainingDaoHeartMp0Contract.test.ts` had a meta-guard that **reads the two stub
files from disk** (in its `checkedFiles` list) to assert they don't bypass RewardService/CombatStore.
This is not a runtime caller (the symbols have zero callers) — it is an inertness guard that the
removal makes obsolete (the files being *gone* is a stronger guarantee than "inert"). Per Part 5.2's
iron rule, the test was **revised in-packet**: the two deleted files were dropped from `checkedFiles`,
with a comment recording why. The other 11 scaffold modules stay guarded.

## 4 · Verification (the green battery IS the proof the code was dead)

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ pass (a dangling import would fail here — none) |
| `npm run test:contracts` | ✅ **532 / 532** (after the one in-packet guard revision) |
| `npm run build` | ✅ built ~8s |

No screenshot (no surface touched). Removing zero-caller code changed no behavior — the green
battery confirms the stubs were dead.

## 5 · Note

The first `test:contracts` after removal surfaced the meta-guard's disk read of the deleted files
(a false-negative in the symbol-only recon grep — the test referenced the files by *path string*,
not by importing the symbols). This is exactly the SA-A3 discipline working: the contract surfaced
the obsolete reference, and it was revised (not silently deleted, not left red) in the same packet.
