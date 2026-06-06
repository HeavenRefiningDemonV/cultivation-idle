# Training / Dao Heart / Expanded Stats Preflight Handoff

Date: 2026-05-31
Branch: Latest
Repo root: C:\Users\abdul\Desktop\cultivation-idle
Prompt packet: Mega Prompt 0

## Summary

Implemented no-gameplay-change scaffolding for Training Hall, Dao Heart Sanctuary, expanded cultivator stats, spirit roots, technique scaling, breakthrough risk, readiness categories, and telemetry names. This packet adds contracts, content files, validators, neutral resolver stubs, and focused contract tests only.

No visible UI change, reward grant, combat mutation, Gate Trial rebalance, or second Heart Law truth was intended.

## Changed files

- `src/content/types.ts`
- `src/content/loaders.ts`
- `src/content/runtimeContentManifest.ts`
- `src/content/validators.ts`
- `public/cultivation_idle_content_bible_v1_config/stats.json`
- `public/cultivation_idle_content_bible_v1_config/training_regimens.json`
- `public/cultivation_idle_content_bible_v1_config/dao_heart_practices.json`
- `public/cultivation_idle_content_bible_v1_config/spirit_roots.json`
- `public/cultivation_idle_content_bible_v1_config/readiness_categories.json`
- `src/systems/cultivatorStats/*`
- `src/systems/training/*`
- `src/systems/daoHeart/*`
- `src/systems/spiritRoots/*`
- `src/systems/breakthrough/*`
- `src/systems/techniques/*`
- `src/systems/readiness/gateReadinessResolver.ts`
- `src/systems/readiness/index.ts`
- `tests/contracts/trainingDaoHeartMp0Contract.test.ts`
- `tests/contracts/runtimeContentManifest.test.ts`
- `docs/release/training-heart-law-implementation-preflight.md`

## Plugin availability and use

| Plugin | Available | Used | Result / reason |
|---|---:|---:|---|
| Browser | yes | no | Not used because MP0 has no UI surface or screenshot target. |
| Documents | yes | yes | Read the attached design/implementation docs to confirm MP0 names, formulas, content tables, and resolver targets. |
| Superpowers | yes | yes | Used startup and TDD guidance; kept scope to MP0 contracts. |
| GitHub | yes | no | No PR or issue operation requested for this local packet. |
| CodeRabbit | plugin listed | no | `coderabbit --version` failed and this Windows shell has no `sh` command for the documented installer. |
| Linear | listed | no | No issue lookup was needed. |
| Sentry | listed | no | No production event lookup was needed. |
| Codex Security | listed | no | Security scan was out of scope for MP0. |
| HyperFrames | listed | no | Intentionally unused for infrastructure-only packet. |

## Types added

- `CultivatorStatDef`, `CultivatorStatCategory`, `CultivatorStatGrade`, `CultivatorPathId`
- `TrainingRegimenDef`, `TrainingIntensityId`, `TrainingStateDraft`
- `DaoHeartPracticeDef`, `DaoHeartActivityId`
- `HeartLawProgressionDef`, `HeartLawProgressStateDraft`
- `SpiritRootProgressionDef`, `SpiritRootProgressStateDraft`
- `TechniqueScalingTag`
- `ReadinessCategoryId`, `ReadinessCategoryDef`
- `BreakthroughRiskCauseRow`, `BreakthroughRiskSnapshot`
- `TrainingHeartTelemetryEventName`

## Content anchors

- `stats.json`: 28 canonical stat definitions. `armor_harmony` is one Earth path stat with equipment/status handling surfaces, not a duplicate handling stat.
- `training_regimens.json`: 18 regimens, exactly 6 per path, canonical mastery milestones, and inert intensity constants.
- `dao_heart_practices.json`: 6 practice IDs, no base resource costs, milestone handling for `doctrine_trial`.
- `spirit_roots.json`: 14 future root contracts with no hard-lock mismatch routes.
- `readiness_categories.json`: 7 capped readiness categories totaling 100 points. No Gate Trial math was changed.

## Validator hooks

- Unique IDs, valid categories, valid path ownership, known stat surfaces, deferred stat effects, and single `armor_harmony` definition.
- Training regimen stat references, path-owned primary/secondary stat checks, exact six-per-path counts, bounded rates, canonical milestones, and forbidden base cost fields.
- Dao Heart practice IDs, multiplier shapes, offline flags, and forbidden base cost fields.
- Spirit-root element IDs, awakening states, proc caps, missing stat/Heart Law references, and no hard-lock mismatch routes.
- Readiness category IDs, non-empty source systems, positive caps, exact count, and total cap of 100.

## Resolver stubs

All new resolver modules are current-neutral. They do not import stores, call `RewardService.grantRewards`, mutate combat, start fights, or create a duplicate Heart Law state owner.

Pure formulas exported for later packets:

- `TRAINING_REALM_BAND_MAX`
- `xpToNextTrainingRating`
- `trainingStatCap`
- `fatigueDampening`
- `capDampening`
- `heartLawXpToNextLevel`

## Tests

- `tests/contracts/trainingDaoHeartMp0Contract.test.ts`
- Updated `tests/contracts/runtimeContentManifest.test.ts`

The focused MP0 contract covers manifest keys, content counts, canonical milestones, invalid stat refs, cross-path refs, forbidden base costs, neutral resolver returns, and no RewardService/CombatStore/Heart Law ownership bypass in new scaffold modules.

## Commands run

- `git status --short` before edits: dirty tree already contained many unrelated packet files.
- `npm run typecheck` before edits: pass.
- `npm run check:icons` before edits: pass.
- `npm run validate:content` before edits: pass with existing content warnings.
- `npm run test:contracts` before edits: fail on pre-existing broad contract debt unrelated to MP0.
- `npm run build` before edits: pass with existing Vite chunk-size warning.
- `npm run release:gate:json` before edits: timed out after about 304 seconds.
- `npm run ensure:vendor-links`: pass.
- `npx tsc --project tsconfig.tests.json` after RED test: failed on missing MP0 modules/fields as expected.
- `npx tsc --project tsconfig.tests.json` after implementation: pass.
- `node --loader=./scripts/relativeJsLoader.mjs --test tmp-tests/tests/contracts/trainingDaoHeartMp0Contract.test.js`: pass, 5 tests.
- `npm run typecheck` after implementation: pass.
- `npm run check:icons` after implementation: pass.
- `npm run validate:content` after implementation: pass with existing technique/pavilion warning output.
- `npm run build` after implementation: pass with existing Vite chunk-size warning.
- MP0 no-bypass audits for RewardService, CombatStore, duplicate Heart Law ownership, accidental UI routes, and forbidden base cost fields: no matches in the new scaffold/content files.
- Broad `npm run test:contracts` after implementation: fail on the same unrelated generated fixture/source-path issues and existing assertions seen in preflight, including missing `tmp-tests` source files, `scenicLabelCityMapHubContract`, and `statusToneUtils`.
- `npm run release:gate:json` after implementation: timed out after about 364 seconds.

## Known blockers and deferred items

- Broad `npm run test:contracts` was already failing before MP0 on unrelated generated fixture/source-path issues and unrelated assertions. Treat focused MP0 contract status separately from broad repo readiness.
- `npm run release:gate:json` was already timing out before MP0 and is not evidence that MP0 failed.
- CodeRabbit review could not be started in this Windows shell because the CLI is not installed and the documented installer requires `sh`.

## Deferred by future Mega Prompt

- Mega Prompt 1: Training runtime, store wiring, and stat gain behavior.
- Mega Prompt 2: Training Hall screen and read-only integration.
- Mega Prompt 3: Dao Heart Sanctuary and Heart Law progression integration through the existing Heart Law owner.
- Mega Prompt 4: spirit root, technique scaling, breakthrough, and readiness integration.
- Mega Prompt 5: prestige/reset/telemetry/simulation/release hardening.
- Mega Prompt 6: additive UI, VFX, accessibility, and cutover polish.
