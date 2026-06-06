# MP1 Route Truth Report

Generated: 2026-05-28T21:51:27+03:00
Packet: MP1 - First-Life, Route, Gate, Save/Prestige Truth
Branch: Latest
Commit: 969de0ab4602a37ba3edf6ed6233419328f21924
Result: PARTIAL

## Summary

MP1 repaired the core first-life route truth:

- Fresh saves no longer accrue real Qi or complete breakthroughs before life identity is committed.
- Route and timing harnesses now complete path, Heart Law, and breath/focus before measuring real cultivation.
- Fresh-run acceptance reaches the documented Spirit Severing cap and the five-city chain.
- `foundation_entry` is emitted by actual route state, and Stonecrag/city2 handoff is visible in route proof.
- Focused tests cover first-gate lifecycle, catalyst parity, city handoff, save/reload, offline no-combat/no-trial progress, prestige reset, manual-to-technique proof, and forced defeat diagnosis.

MP1 is not a full release pass:

- `npm run balance:report:json` still fails locked timing bands after Foundation is measurable.
- `release:gate` remains `NO_GO` with `balance_regression` blocker, `fresh_run_acceptance` pending manual coverage, unaccepted waiver candidates, and skipped/timed-out full-suite debt.
- Browser proof is partial: early route states and first-gate locked are captured, but full browser matrix capture remains MP2 handoff work.

## Route/cap decision

Spirit Severing remains the current content cap. The Soul Formation stop was a harness truth issue, not an intended cap change. See `artifacts/mp1/implementation/content-cap-decision.md`.

## Key artifacts

- Previous packet verification: `artifacts/mp1/preflight/previous-packet-verification.md`
- Content cap decision: `artifacts/mp1/implementation/content-cap-decision.md`
- Final fresh-run report: `artifacts/mp1/reports/fresh-run/final.log`
- Final balance report: `artifacts/mp1/reports/balance/final.log`
- Final route report: `artifacts/mp1/reports/route/final.log`
- Final reclaim report: `artifacts/mp1/reports/reclaim/final.log`
- Final release gate: `artifacts/mp1/reports/release-gate/final.log`
- Browser screenshots/DOM/console: `artifacts/mp1/browser/`
- MP1 final report: `artifacts/mp1/final/MP1_FINAL_REPORT.md`
- MP1 blocker status: `artifacts/mp1/final/MP1_BLOCKER_STATUS.json`

## Remaining release blockers

- Balance/timing bands are now measurable but out of target ranges. This is MP4 measurement/tuning work, not a missing `foundation_entry` bug.
- Fresh-run acceptance still flags manual coverage as pending/manual despite the minimal manual-to-technique bridge test passing.
- Full `npm run test:contracts` still times out in broad contract debt; targeted MP1 compiled tests pass.
- Build and progression warning candidates remain unaccepted/untracked in the release gate.

## Readiness recommendations

- Story tutorial may begin: No.
- Final menu polish may begin: No.
- Final number tuning may begin: No, except MP4 can now use the repaired route/timing evidence to tune timing bands.
- Next packet: MP2 for route-facing UI/screenshot matrix and exact-screen repair, while MP4 owns numeric timing bands.
