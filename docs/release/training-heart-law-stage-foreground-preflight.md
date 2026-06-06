# Training / Heart Law Stage Foreground Preflight

## Packet

Mega Prompt 0 - Canonical stage truth, contract tests, and implementation audit anchors.

## Purpose

Packet 0 locks canonical cultivation stage math before broader Training, Dao Heart, Heart Law parity, Spirit Root, Status, Prestige Reclaim, and UI/VFX packets.

## Stage Truth Owner

- Owner: `src/systems/progression/cultivationStageIndex.ts`
- Realm substage counts: `[9, 9, 9, 6, 6, 6]`
- Internal helper: `getCanonicalCultivationStageIndex(input)` returns the zero-based cumulative stage index.
- Display/helper: `getCanonicalCultivationStageNumber(input)` returns the one-based cumulative stage number.
- Strict helper: `getCanonicalCultivationStageIndexStrict(input)` throws on impossible authoring/content values.
- Runtime helper behavior: safe helper clamps malformed save/runtime values so old saves do not crash public surfaces.

## Boundary Table

| Realm | First internal index | Last internal index | First display number | Last display number |
| --- | ---: | ---: | ---: | ---: |
| Qi Condensation | 0 | 8 | 1 | 9 |
| Foundation Establishment | 9 | 17 | 10 | 18 |
| Core Formation | 18 | 26 | 19 | 27 |
| Nascent Soul | 27 | 32 | 28 | 33 |
| Soul Formation | 33 | 38 | 34 | 39 |
| Spirit Severing | 39 | 44 | 40 | 45 |

## Runtime Callsite Changes

- `src/stores/gameStore.ts`: breakthrough effective-stage helper now uses canonical one-based stage number.
- `src/stores/cultivationStore.ts`: cultivation effective-stage helper now uses canonical one-based stage number.
- `src/features/daoHeartSanctuary/DaoHeartSanctuaryView.tsx`: visible/current stage number now comes from canonical stage truth.
- `src/features/cultivation/exact/buildCultivationExactSurface.ts`: exact cultivation surface stage display now comes from canonical stage truth.

## Tests Added Or Updated

- Added `tests/contracts/cultivationStageIndexContract.test.ts`.
- The contract covers all current realm boundaries, including six-substage later realms.
- The contract contains a static runtime scan for active `realm.index * 9` and equivalent hardcoded nine-substage formulas.
- Foreground exclusivity remains Packet 1 scope; Packet 0 added two `test.todo` anchors for one-foreground cultivation/training/Dao behavior.

## Focused Evidence

- Initial red test: `npm exec tsc -- --project tsconfig.tests.json` failed with missing `../../src/systems/progression/cultivationStageIndex.js`.
- After implementation: `npm exec tsc -- --project tsconfig.tests.json` passed.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/cultivationStageIndexContract.test.js` passed: 3 pass, 2 todo.
- Focused related suite passed:
  - `tmp-tests/tests/contracts/cultivationStageIndexContract.test.js`
  - `tmp-tests/tests/contracts/trainingDaoHeartMp0Contract.test.js`
  - `tmp-tests/tests/contracts/daoHeartMp3RuntimeContract.test.js`
  - `tmp-tests/tests/contracts/CultivationExactLiveSurface.contract.test.js`
- Static self-audit found no active matches for:
  - `realm\.index\s*\*\s*9`
  - `\*\s*9\s*\+\s*substage`
  - `\*\s*9\s*\+\s*(?:state\.|game\.)?realm\.substage`

## Broad Verification Status

Baseline commands passed before the current broad contract blocker:

- `npm run typecheck`
- `npm run check:icons`
- `npm run validate:content`
- `npm run build`

`npm run test:contracts` is not green. The current blocker is outside Packet 0 stage truth:

```text
[runNodeTestFilesSequential] Failed: tmp-tests\tests\contracts\lifeSummarySurface.test.js
[runNodeTestFilesSequential] passed=201 total=479

life summary surface always returns the locked V2 memory block structure
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
10 !== 9

last-completed summary renders from normalized stored snapshot
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
10 !== 9
```

Current source evidence:

```json
{
  "count": 10,
  "titles": [
    "Life Arc",
    "Breakthrough Echoes",
    "Doctrine & Build",
    "World Progress",
    "Gate Trials",
    "Mandate Memory",
    "Ruins & Supply",
    "Economy Support",
    "Offline & Background",
    "Next Life Focus"
  ]
}
```

This is not a stage-index failure. It is a Prestige/Life Summary public-copy and block-structure contract mismatch. The next packet should decide whether to decommission/rename the visible `Mandate Memory` block under the Status V3 public Dao/Omen/Mandate guardrails, then update `tests/contracts/lifeSummarySurface.test.ts` and `tests/contracts/lifeSummaryMandateMemoryContract.test.ts` with the chosen public language.

`npm run release:gate:json` also remains `NO_GO` outside Packet 0. The final run reported `overallPass: false`, `releaseReady: false`, `unresolvedBlockerCount: 4`, `pendingManualCount: 1`, and `unresolvedWaiverCandidateCount: 5`. Visible blockers include `fresh_run_acceptance` manual coverage pending for fresh-run modes and `full_test_suite` failing because the broad test suite is not green.

## Deferred Packet 1 Foreground Targets

- Training active blocks full Qi: TODO anchor added.
- Dao Heart active blocks full Qi: TODO anchor added.
- Offline one-foreground catchup: deferred to Packet 1.
- Combat foreground blocks cultivation/training/Dao as full-power parallel activities: deferred to Packet 1.
- ActivityStore remains the foreground arbiter: unchanged in Packet 0.

## Notes

- Packet 0 did not implement Training Hall visuals, Dao Heart Sanctuary rebuilds, Spirit Root fit, Status rebuilds, Prestige Reclaim, or Gate Trial UI behavior.
- Broad contract verification exposed stale/non-Packet-0 contracts while pursuing the full command matrix. Those findings should stay separate from the Packet 0 stage-truth verdict.
