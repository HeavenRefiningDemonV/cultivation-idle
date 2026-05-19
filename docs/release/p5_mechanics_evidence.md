# P5 Xianxia Mechanics Evidence

Generated: 2026-05-19T16:29:28+03:00

## Scope

- Dao Impressions
- Inner Demon Reflection
- Tribulation Pressure prototype
- Artifact/Treasure Imprints future gate
- City Recognition audit/classification
- P5 closeout reproducibility and browser evidence

## Preflight

| Check | Result | Notes |
| --- | --- | --- |
| required source directories/scripts | PASS | `public/`, `scripts/`, `docs/`, `src/`, `tests/`, package files, Vite, Playwright, and root script files are present in the live tree. |
| implementation baseline | PASS | `npm run release:implementation-baseline:json` passed before closeout edits. |
| runtime content manifest | PASS | `npm run release:runtime-content-manifest:json` passed before closeout edits. |
| typecheck | PASS | `npm run typecheck` passed before closeout edits. |
| icon check | PASS | `npm run check:icons` passed before closeout edits. |
| validate content | PASS | `npm run validate:content` passed before closeout edits. |
| test TypeScript compile | PASS | `npm exec tsc -- --project tsconfig.tests.json` passed before and during closeout. |

## Dao Impressions

- Event triggers implemented: first Outskirts boss clear, Gate Trial clear, close Gate Trial defeat, Ruins completion/boss-room completion, and breakthrough resonance.
- Deferred trigger: Technique/manual mastery remains DEFERRED. `techniques/rank_upgrade_success` no longer creates `manual_insight`; the definition is marked `future_stub_only` and cannot award.
- Removed dead live source: `ruins_boss_chest` was removed from live Dao Impression source unions because no stable live trigger/definition exists in P5.
- Source-key policy:
  - `outskirts_first_boss:<cityId>:<sourceId>`; enemy variants on the same route do not duplicate.
  - `gate_clear:<trialId>:<gateIndex>`; repeated clear events do not duplicate.
  - `gate_close_defeat:<trialId>:<gateIndex>:<diagnosisBucket>:<attemptId>`; distinct attempts are bounded by cooldown/cap.
  - `ruins_completion:<cityId>:<ruinId>:<runId>`.
  - `breakthrough:<fromRealmIndex>-><toRealmIndex>`.
- Award policy: source-event dedupe, `maxAwardsPerLife`, and `cooldownMs` are now enforced before `RewardService.grantRewards`.
- Reward/comprehension path: live awards call `RewardService.grantRewards({ comprehension }, "dao_impression:...")`; UI and stores do not directly mutate Heart Law comprehension.
- Event-loop guard: the bridge ignores `dao/impression_awarded` and reward events from `dao_impression:` reasons.
- Runtime guard: malformed combat, trial, breakthrough, and technique events are ignored without reward grants.
- UI/browser: Combat Aftermath rare signs, Heart Law recent seals, and Life Summary P5 memory are browser-proven through dev-only P5 fixtures.
- Tests: Dao contract, event bridge, reward bridge, life memory, Dao Heart surface, and Run Compass delta tests passed in focused runs.

## Inner Demon Reflection

- Trigger policy: two eligible repeated same-diagnosis Gate Trial defeats create one active reflection for the trial/gate.
- Live diagnosis path: CombatStore now builds the trial defeat summary, records it, reads the Section 5 failure diagnosis/top fix, and emits `diagnosisCode`, `topFixDestination`, and `topFixReason` on `trials/attempt_resolved`.
- Non-triggers: first ordinary failure, differing diagnoses, Outskirts deaths, Ruins deaths, and malformed trial events do not create reflections.
- Corrective route mapping: underprepared maps to Apothecary, underforged to Forge, underbuilt to Techniques/Manuals, undercultivated to Cultivation, close to Gate Trial, with Bounties/Expeditions route targets handled explicitly in Gate Trial routing.
- Resolution policy: Gate clear, Safety Net bypass, new life/prestige, and diagnosis change resolve/suppress stale reflections. Route-completed resolution remains DEFERRED because no single reliable cross-module completion signal exists yet.
- Stale reflection safety: Gate Trial Exact uses the actual live gate index, filters by current diagnosis when available, and suppresses mismatched unresolved reflections.
- Reward policy: Inner Demon Reflection grants no reward by default.
- UI/browser: repeated underprepared reflection is browser-proven through the P5 closeout fixture and covered by event bridge tests.

## Tribulation Pressure

- Default flag state: disabled by default through `isTribulationPressurePreviewEnabled()`.
- Default UI state: no visible tribulation pressure card or route is rendered in normal player flow.
- Determinism evidence: fixed inputs produce fixed scores/states; no `Math.random` appears in `src/systems/tribulationPressure`.
- Mutation safety: the builder is read-only and does not alter breakthrough, combat, prestige, rewards, or store state.
- Browser: default disabled/no-wall state is browser-proven through the dev-only fixture.

## Artifact/Treasure Imprints

- Live drops: none.
- Runtime status: type-only `future_stub_only` specs only.
- Future gate docs: `docs/design/artifact_treasure_imprints.md` defines source, sink, role, attunement, and memory requirements before future treasures can ship.
- Tests/audit: artifact future-gate contract passed and verifies no live award event or unsupported runtime drop path is present.

## City Recognition

- Closeout classification: STATIC-ONLY/NOTICE-STUB in live P5. `CityRecognitionSurfaceV1` remains a typed notice read model and test audit surface; it is not a live benefit system.
- Browser evidence: dev-only fixture explicitly shows the stub/notice classification and no live discounts, stock unlocks, NPC ranks, or reputation currency.
- Tests: bounty route city recognition contract remains green and proves no social-sim benefit promise is exposed by the read model.

## Browser Evidence

| Scenario | Status | Screenshot |
| --- | --- | --- |
| Gate Clear Dao Impression | BROWSER-PROVEN | `docs/release/qa/p5-dao-gate-clear-after-math.png` |
| Close Gate Defeat Dao Impression | BROWSER-PROVEN | `docs/release/qa/p5-close-defeat-dao-impression.png` |
| Repeated Failure Inner Demon | BROWSER-PROVEN | `docs/release/qa/p5-inner-demon-gate-trial.png` |
| Heart Law recent Dao seals | BROWSER-PROVEN | `docs/release/qa/p5-heart-law-recent-dao-seals.png` |
| Life Summary memory | BROWSER-PROVEN | `docs/release/qa/p5-life-summary-memory-lines.png` |
| City Recognition notice/stub | BROWSER-PROVEN | `docs/release/qa/p5-city-recognition-notice-or-stub.png` |
| Tribulation disabled default | BROWSER-PROVEN | `docs/release/qa/p5-tribulation-disabled-cultivation.png` |

## Known Blockers/Deferred

- Route-completed Inner Demon resolution is DEFERRED and not claimed as implemented.
- Technique/manual mastery Dao Impression trigger is DEFERRED until a stable mastery event exists.
- `ruins_boss_chest` is not live in P5; Ruin Echo remains tied to Ruins completion/boss-room completion.
- Broad release-gate debt, if still present after final command ladder, must be classified separately from focused P5 behavior.

## Final Command Results

| Command | Result | Notes |
| --- | --- | --- |
| `npm run release:implementation-baseline:json` | PASS | Live tree contains required package scripts and runtime content. |
| `npm run release:runtime-content-manifest:json` | PASS | 19 required runtime content files present; no missing/empty files. |
| `npm run typecheck` | PASS | `tsc --noEmit` completed. |
| `npm run check:icons` | PASS | No emoji icon usage found. |
| `npm run validate:content` | PASS | Content validation passed. |
| `npm exec tsc -- --project tsconfig.tests.json` | PASS | Focused and broad test TypeScript compiled. |
| focused P5 tests | PASS | Dao, Failure Reflection, Tribulation, Artifact, City Recognition, Heart Law, and route-mapping focused tests passed. |
| `npm run build` | PASS | Build completed with existing warnings: Browserslist data age, unresolved `InsideDungeon.png`, and chunk size advisory. |
| `npm run test:contracts` | FAIL | Broad non-P5 contract failures remain, including Apothecary live-source and World inspector proof surface expectations. |
| `npm run release:gate -- --json` | FAIL | NO_GO from existing broad blockers/manual coverage/runtime diagnostics/full-suite TS5033, not focused P5 tests. |
