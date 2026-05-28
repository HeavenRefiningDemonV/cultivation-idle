# Critical Path Map

| Milestone | Verified? | How verified | Failure/notes | Severity |
|---|---:|---|---|---|
| Fresh save boots | Yes | Browser fresh context | Dev/content warnings, no page crash | Info |
| Intro/story appears | Yes | Browser screenshot `SS-002`, `SS-015` | Cultivation already visible below story | Medium |
| Choose path | Yes | Browser screenshot `SS-033`; `selectedPath` tests | Heaven selection updates Path and rate | Info |
| Choose Heart Law | Partially | Browser screenshots `SS-053` to `SS-056`; focused state after Finish | UX requires specific card/Next interactions | High |
| Choose breath/focus | Partially | Browser screenshots `SS-082` to `SS-088` | Finish can require scroll and exact interaction | Medium |
| Begin cultivation | Yes | Browser text shows Qi/sec and Start Cultivation | It begins effectively before identity is complete | High |
| Reach first substage | Not verified live | timing probes fail | Browser shows first cap exceeded quickly, but accepted timing unproven | Blocker |
| Open World/city hub | Partially | attempted screenshots/raw logs | automation repeatedly stayed on Status/ledger text in some captures | High |
| Use Outskirts | Not verified in browser pass | static/module evidence only | Needs dedicated screen smoke | Research |
| Acquire manual/technique | Not verified in browser pass | content/static evidence only | Needs dedicated runtime scenario | Research |
| Configure loadout/AI | Not verified in browser pass | Status warns loadout under-supported | Needs dedicated runtime scenario | Research |
| Configure medicine pouch | Not verified live | Status/pouch diagnostics visible | Needs dedicated runtime scenario | Research |
| Forge/equipment prep | Not verified live | Status recommends refine weapon | Needs dedicated runtime scenario | Research |
| Gate Trial locked/available | Static/focused tests only | lifecycle tests partially blocked by fixture | Live state not completed | High |
| Gate defeat/fail-safe | Static/focused tests only | P0 parity passed; lifecycle fixture failed | Needs browser/synthetic state QA | High |
| Gate clear/reward | Focused test verified | P0 clear grants consumed item passed | Full lifecycle suite not green | High |
| Breakthrough consumes item | Focused test/static verified | `gameStore.breakthrough()` resolver-derived item | Browser transition not completed | High |
| City 2 unlock | Focused test verified | `cityUnlockRuntime.test.js` passed | route timing/cap still blocked | High |
| Later cities | Partially | fresh-run unlocked five cities but missed cap | endpoint mismatch remains | Blocker |
| Offline catchup | Yes | offline route report and browser existing save summary | old helper surfaces remain | Medium |
| Save/load | Partially | tests and browser autosave keys | corrupt/active combat scenarios not fully tested | Research |
| Prestige | Focused reset verified | `prestigeResetRuntime.test.js`, prestige audit | natural route/reclaim timing failed | Blocker |
| Second life | Focused reset only | reset test | game-feel/timing unverified | Blocker |
| Content cap | No | fresh-run report | expected Spirit Severing not reached | Blocker |
