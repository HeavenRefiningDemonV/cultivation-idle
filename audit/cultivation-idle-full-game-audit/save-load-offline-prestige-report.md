# Save, Load, Offline, and Prestige Report

## Save/Load

Verified:
- Fresh Playwright context starts with no localStorage keys.
- Autosave creates `cultivation-idle-save-v3` after interaction.
- Existing in-app save loaded with migration warning dialog rather than crashing.

Not fully verified:
- corrupted JSON parse failure
- missing content ID recovery
- active combat reload
- active crafting reload
- after trial defeat reload
- after trial clear before breakthrough reload
- after prestige reload

Risk:
- Migration warnings in the existing local save included partial reset residue and offline timestamp split. This is useful diagnostically, but it should not be treated as clean player-facing proof.

## Offline

Verified:
- Existing in-app save showed offline summary capped at 12 hours.
- Summary explicitly stated combat never progresses offline.
- `npm run release:offline-route-report` passed: offline combat/trial progress stayed zero and offline Qi was non-dominant vs active theoretical route.
- `src/services/time/OfflineCatchup.ts` is the live mutating path.
- `src/systems/offline.ts` states legacy wrappers must delegate and not mutate queues, expeditions, combat, or Qi themselves.

Remaining risk:
- Release gate still flags offline split surfaces as warning candidates.

## Prestige / Reincarnation

Verified:
- `src/services/prestige/PrestigeResetService.ts` centralizes reset orchestration.
- Focused `prestigeResetRuntime.test.js` passed.
- Prestige runtime audit found 27 upgrades: 11 visible live, 5 deferred, 11 hidden unsupported, with no blockers.

Not verified:
- natural first prestige timing
- browser prestige confirmation
- AP calculation in live UI
- second-life game feel
- second-life reclaim speed

Blocker:
- `npm run release:reclaim-route-report` failed before Foundation entry, so second-life timing cannot be trusted yet.

## Reset Classification Snapshot

| Store/state | Reset every life | Permanent | Hybrid/rederived | Current behavior | Correct? | Evidence |
|---|---:|---:|---:|---|---|---|
| game realm/Qi/path/focus | Yes | No | focus default/reselected | reset through `resetGameRun` and life-start | likely | focused reset tests |
| Heart Law | Yes | unlock tiers permanent | selection re-picked | reset then reselected | likely | LifeStart wizard/PrestigeReset |
| inventory | Yes | No | No | `resetInventory()` | likely | PrestigeResetService |
| equipment | Yes | No | No | `hardResetEquipment()` | likely | PrestigeResetService |
| city | Yes | No | reinitialized city 1 | `hardResetCity()` then initialize content | likely | PrestigeResetService |
| trials | Yes | No | No | `hardResetTrials()` | likely | PrestigeResetService |
| ruins | Yes | No | No | `hardResetRuins()` | likely | PrestigeResetService |
| bounties | Yes | No | No | `hardResetBounties()` | likely | PrestigeResetService |
| expeditions | active reset | slot effects may be permanent | slots rederived | active cleared | needs deeper audit | PrestigeResetService |
| manual/technique | Yes | prestige retention hybrid | mastery carryover | hard reset plus retention apply | likely | PrestigeResetService |
| combat/activity | Yes | No | No | combat reset and activity hard reset | likely | PrestigeResetService |
| prestige AP/upgrades | No | Yes | effects rederived | preserved in prestige store | likely | prestige runtime audit |
