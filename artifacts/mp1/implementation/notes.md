# MP1 Implementation Notes

## Preflight findings

- MP0 baseline evidence is present and matches expected handoff facts.
- Repo-local `reference-docs/downloads/*`, `MP1_START_HERE.md`, and `GIT_CONTEXT.md` are absent; Downloads reference docs were read as substitutions.
- The live tree is dirty before MP1 because MP0 source/docs/artifacts are not committed in this checkout. Preserve those changes.
- MP1 starts with the following reproduced route blockers:
  - fresh-run cap mismatch: `soul_formation` vs `spirit_severing`;
  - balance/route/reclaim reports fail before `foundation_entry`;
  - full `release:gate:json` hangs in broad test-suite debt, while skip-full-test release gate remains structured `NO_GO`.

## Source edit log

- Added a pure life identity predicate in `src/systems/lifeStart/lifeIdentity.ts`.
- Guarded `gameStore.tick`, `flushCultivationAccumulation`, and `breakthrough` so real Qi mutation and breakthrough attempts do not run before a committed path, Heart Law, and breath/focus are present.
- Updated timing and fresh-save route harnesses to commit life identity before simulating real cultivation.
- Updated simulated route loops to flush accumulated Qi after synthetic ticks; this made route reports deterministic instead of wall-clock dependent.
- Added focused predicate, mechanical pause, fresh-save route harness, and Playwright proof tests.
- Preserved existing gate, reward, combat, activity, prestige, and offline ownership; MP1 did not add direct UI reward grants, combat resolution, activity bypass, or prestige reset logic.

## Final implementation result

- First-life mechanical pause: fixed and covered by focused tests.
- Fresh-run content cap: Spirit Severing remains the current cap; the fresh route now reaches it.
- Foundation timing marker: restored; `foundation_entry` is emitted from actual route state.
- First gate/catalyst/city/prestige/offline/manual/defeat proof: covered by focused compiled tests and reports.
- Browser proof: partial; Playwright captured fresh pre-life, partial identity, completed identity, and first-gate locked state. Deeper browser-state captures remain MP2 handoff work.
- Release gate: still `NO_GO`. Remaining blockers are balance timing bands, pending manual coverage in fresh-run acceptance, unaccepted waiver candidates, and broad full contract suite timeout debt.
