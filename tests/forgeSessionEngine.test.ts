import assert from 'node:assert/strict';
import test from 'node:test';

import type { ForgeStepDef } from '../src/systems/crafting/craftingTypes.js';
import { validateForgeStepScript } from '../src/content/validation/forgeStepScript.js';
import {
  applyForgeStepResult,
  createForgeSession,
  resolveBaselineStep,
} from '../src/features/forge/forgeSessionEngine.js';

const baseScript: ForgeStepDef[] = [
  { id: 'heat_1', type: 'HEAT_TO', targetHeat: 620, tolerance: 18 },
  { id: 'strike_1', type: 'HAMMER_PATTERN', hits: 4, shrinkMs: 600, tolerance: 0.18, patternId: 'ring_alpha' },
  { id: 'heat_2', type: 'HEAT_TO', targetHeat: 640, tolerance: 16 },
  { id: 'strike_2', type: 'HAMMER_PATTERN', hits: 5, shrinkMs: 620, tolerance: 0.16, patternId: 'ring_beta' },
  { id: 'heat_3', type: 'HEAT_TO', targetHeat: 660, tolerance: 14 },
  { id: 'engrave', type: 'ENGRAVE_RUNE', hits: 3, difficulty: 0.4, patternId: 'rune_arc' },
  { id: 'finish', type: 'FINISH' },
];

test('forge session progression stays deterministic with the same seed', () => {
  const blueprint = { id: 'forge_test', stepScript: baseScript };
  const seed = 1337;
  const first = createForgeSession(blueprint, 'IDLE', 1000, seed);
  const second = createForgeSession(blueprint, 'IDLE', 1000, seed);

  assert.deepEqual(first.patternSeedsByStepId, second.patternSeedsByStepId);

  let progressA = first;
  let progressB = second;
  for (let i = 0; i < blueprint.stepScript.length; i += 1) {
    progressA = resolveBaselineStep(progressA, blueprint);
    progressB = resolveBaselineStep(progressB, blueprint);
  }

  assert.deepEqual(progressA, progressB);
  assert.equal(progressA.status, 'COMPLETED');
});

test('forge loop validator rejects invalid sequences', () => {
  const invalidScript: ForgeStepDef[] = [
    { id: 'strike_first', type: 'HAMMER_PATTERN', hits: 3, shrinkMs: 520, tolerance: 0.2 },
    { id: 'heat_only', type: 'HEAT_TO', targetHeat: 600, tolerance: 15 },
    { id: 'finish', type: 'FINISH' },
  ];

  const result = validateForgeStepScript(invalidScript);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
});

test('forge session applies hands-on ring results without forcing perfection', () => {
  const blueprint = { id: 'forge_test', stepScript: baseScript };
  let session = createForgeSession(blueprint, 'HANDS_ON', 1000, 7);

  session = applyForgeStepResult(session, blueprint, { type: 'HEAT', stepId: 'heat_1', score: 68 });
  session = applyForgeStepResult(session, blueprint, {
    type: 'RING_QTE',
    stepId: 'strike_1',
    stage: 'STRIKE',
    hitsLanded: 3,
    hitsRequired: 4,
    timingScore: 0.62,
  });

  assert.ok(session.scoring.strikeScore > 0);
  assert.ok(session.scoring.heatScore > 0);
});
