import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  RUNTIME_CONTENT_FILE_BY_KEY,
  validateLoadedContent,
  type LoadedContentRaw,
  type TechniqueDef,
  type ValidatedContent,
} from '../../src/content/index.js';
import {
  buildTrainingReadOnlySnapshot,
  createDefaultTrainingSaveState,
  createTrainingRuntimeContent,
  type TrainingRuntimeContent,
} from '../../src/systems/training/index.js';
import { resolveGateReadinessRows } from '../../src/systems/readiness/gateReadinessResolver.js';
import { buildTechniqueScalingTooltipRows } from '../../src/systems/techniques/techniqueScalingTooltipAdapter.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;
}

async function loadRuntimeRawContent(): Promise<LoadedContentRaw> {
  const entries = await Promise.all(
    Object.entries(RUNTIME_CONTENT_FILE_BY_KEY).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  return Object.fromEntries(entries) as unknown as LoadedContentRaw;
}

let content: ValidatedContent;
let trainingContent: TrainingRuntimeContent;

test.before(async () => {
  content = validateLoadedContent(await loadRuntimeRawContent());
  trainingContent = createTrainingRuntimeContent(content);
});

test('read-only training snapshot derives unlocked-only path foundation and future silhouettes without store mutation hooks', () => {
  const state = createDefaultTrainingSaveState();
  state.statRatingsById.qi_control = 12;
  state.statRatingsById.dao_resonance = 3;
  state.statRatingsById.divine_sense = 99;

  const snapshot = buildTrainingReadOnlySnapshot({
    content: trainingContent,
    state,
    selectedPath: 'heaven',
    realmIndex: 0,
    substageIndex: 0,
  });

  assert.equal(snapshot.path, 'heaven');
  assert.equal(snapshot.realmCap, 16);
  assert.deepEqual(snapshot.pathStats.map((row) => row.statId), ['qi_control']);
  assert.deepEqual(snapshot.futureStats.map((row) => row.statId), [
    'dao_resonance',
    'divine_sense',
    'law_weaving',
    'tribulation_insight',
    'star_rhythm',
  ]);
  assert.equal(snapshot.pathFoundation.label, 'Path Foundation');
  assert.equal(snapshot.pathFoundation.averageRating, 12);
  assert.match(snapshot.pathFoundation.valueLabel, /12 \/ 16 average/i);
  assert.equal(snapshot.currentBottleneck?.statId, 'qi_control');

  const foundationRealm = buildTrainingReadOnlySnapshot({
    content: trainingContent,
    state,
    selectedPath: 'heaven',
    realmIndex: 1,
    substageIndex: 0,
  });

  assert.deepEqual(foundationRealm.pathStats.map((row) => row.statId), ['qi_control', 'dao_resonance']);
  assert.equal(foundationRealm.pathFoundation.averageRating, 7.5);
});

test('gate and technique hooks consume training snapshot as read-only presentation data', () => {
  const state = createDefaultTrainingSaveState();
  state.statRatingsById.qi_control = 16;
  state.statRatingsById.dao_resonance = 8;
  state.regimenMasteryXpById.still_star_breathing = 120;
  const snapshot = buildTrainingReadOnlySnapshot({
    content: trainingContent,
    state,
    selectedPath: 'heaven',
    realmIndex: 0,
    substageIndex: 0,
  });

  const readinessRows = resolveGateReadinessRows(content.readiness_categories.categories, {
    trainingSnapshot: snapshot,
  });
  const pathTraining = readinessRows.find((row) => row.categoryId === 'path_training');

  assert.ok(pathTraining);
  assert.ok(pathTraining.score > 0);
  assert.ok(pathTraining.score <= pathTraining.maxScore);
  assert.equal(pathTraining.debug.mode, 'read_only_training_snapshot');
  assert.equal(readinessRows.filter((row) => row.categoryId !== 'path_training').every((row) => row.score === 0), true);

  const heavenTechnique = content.techniques.find(
    (tech): tech is TechniqueDef => tech.path === 'heaven' && tech.primaryScalingStatId === 'qi_control',
  );
  assert.ok(heavenTechnique, 'expected at least one Heaven technique fixture using Qi Control');
  const rows = buildTechniqueScalingTooltipRows({ technique: heavenTechnique, trainingSnapshot: snapshot });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.label, 'Training Hall');
  assert.match(rows[0]?.value ?? '', /Power/i);
  assert.match(rows[0]?.detail ?? '', /Primary Stat/i);
  assert.equal(rows[0]?.combatEffectActive, true);
});
