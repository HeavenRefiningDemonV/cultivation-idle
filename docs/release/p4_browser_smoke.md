# P4 Browser Smoke

- Generated: 2026-05-19
- Local dev URL: `http://127.0.0.1:5173/`
- Evidence manifest: `docs/release/qa/p4-browser-evidence.json`

## Results

| Scenario | Result | Evidence |
| --- | --- | --- |
| Prestige too early | PASS | Too Early state, +0 AP, disabled Reincarnation CTA, and scrollable 1280x720 Prestige surface. Screenshot: `docs/release/qa/p4-prestige-too-early.png` |
| Prestige viable after-ritual AP plan | PASS | First-prestige state with current AP 0 and projected +10 AP shows buy-now Root Memory and Combat Memory recommendations using post-ritual AP. Screenshot: `docs/release/qa/p4-prestige-recommended-after-ritual.png` |
| Prestige fixture / preview | PASS | Fixture route renders Prestige preview, not story cutscene. Screenshot: `docs/release/qa/p4-preview-prestige-fixture.png` |
| Life Summary current mode | PASS | Current Life Summary opens from Prestige and shows concrete block rows. Screenshot: `docs/release/qa/p4-life-summary-current.png` |
| Life Summary last-completed mode | PASS | Last Completed Life Summary opens from live Prestige when `lastLifeSummary` exists. Screenshot: `docs/release/qa/p4-life-summary-last-completed.png` |
| Post-reset reclaim objective | PASS | After prestige, the reclaim objective banner shows previous-life seal, retained advantages, first actions, route button, and dismiss action. Screenshot: `docs/release/qa/p4-post-reset-reclaim-objective.png` |
| Post-reset reclaim dismissed | PASS | Dismiss action removes the reclaim objective from Prestige. Screenshot: `docs/release/qa/p4-post-reset-reclaim-dismissed.png` |
| Offline summary modal | PASS | Offline modal shows time considered, efficiency, Qi gained, queue/expedition results, cap warning, and combat exclusion. Screenshot: `docs/release/qa/p4-offline-summary.png` |
| Offline modal priority | PASS | Offline modal remains topmost over Life Start/migration conditions. Screenshot: `docs/release/qa/p4-offline-priority.png` |

## Notes

- The Codex in-app Browser was used to diagnose the stale screenshot mismatch. Controlled evidence was regenerated with Playwright against the dev server because the in-app Browser evaluate path could not dynamically import Vite store modules for fixture setup.
- Automated readability probes at 1280x720 found 0 label/value overlaps in Prestige rows and no CTA overlap with the reset contract.
- Browser console errors during the final controlled capture: 0.
