import assert from 'node:assert/strict';
import test from 'node:test';

import type { CraftScript, ForgeStepResult } from '../src/systems/crafting/craftingTypes.js';
import { computeForgeOutcome } from '../src/systems/crafting/forgeOutcome.js';

const baseScript: CraftScript = {
  version: 1,
  station: 'forge',
  sourceId: 'forge_rune_ember_t1',
  steps: [
    {
      id: 'heat_material',
      type: 'HEAT_MATERIAL',
      targetMin: 520,
      targetMax: 760,
      holdMs: 4200,
      jitter: 30,
    },
    {
      id: 'hammer_pattern',
      type: 'HAMMER_PATTERN',
      hits: 7,
      shrinkMs: 820,
      tolerance: 0.18,
    },
    {
      id: 'quench',
      type: 'QUENCH',
      medium: 'water',
      mediumOptions: ['water', 'oil'],
      timingWindow: { goodMin: 1800, goodMax: 3200, perfectMin: 2300, perfectMax: 2700 },
    },
    { id: 'temper', type: 'TEMPER', targetHeat: 480, targetMin: 430, targetMax: 560, durationMs: 3600, holdMs: 3600 },
    { id: 'engrave', type: 'ENGRAVE_RUNE', optional: false, runeFamily: 'ember' },
  ],
  handsOnBonus: { qualityProcChancePct: 12, masteryMult: 1.1, timeReductionPct: 0.12, temperProcChancePct: 6 },
};

const strongPerformance: ForgeStepResult[] = [
  { stepId: 'heat_material', type: 'HEAT_MATERIAL', achievedMin: 540, achievedMax: 750, holdMs: 4100 },
  { stepId: 'hammer_pattern', type: 'HAMMER_PATTERN', hitsLanded: 7, hitsRequired: 7, timingScore: 0.85 },
  { stepId: 'quench', type: 'QUENCH', medium: 'water', timingMs: 2500 },
  { stepId: 'temper', type: 'TEMPER', achievedMin: 450, achievedMax: 545, holdMs: 3400 },
  { stepId: 'engrave', type: 'ENGRAVE_RUNE', success: true, precision: 0.82 },
];

const weakerPerformance: ForgeStepResult[] = [
  { stepId: 'heat_material', type: 'HEAT_MATERIAL', achievedMin: 500, achievedMax: 700, holdMs: 3000 },
  { stepId: 'hammer_pattern', type: 'HAMMER_PATTERN', hitsLanded: 5, hitsRequired: 7, timingScore: 0.6 },
  { stepId: 'quench', type: 'QUENCH', medium: 'water', timingMs: 3600 },
  { stepId: 'temper', type: 'TEMPER', achievedMin: 400, achievedMax: 560, holdMs: 2500 },
  { stepId: 'engrave', type: 'ENGRAVE_RUNE', success: false, precision: 0.5 },
];

test('forge outcome remains deterministic with seed', () => {
  const first = computeForgeOutcome({ script: baseScript, performances: strongPerformance, handsOnBonus: baseScript.handsOnBonus, seed: 99 });
  const second = computeForgeOutcome({
    script: baseScript,
    performances: strongPerformance,
    handsOnBonus: baseScript.handsOnBonus,
    seed: 99,
  });
  assert.deepEqual(first, second);
  assert.ok(first.scoreOverall > 0.7);
  assert.ok(first.qualityProcChanceBonusPct > 0);
});

test('better performance yields higher forge score than weaker run', () => {
  const strong = computeForgeOutcome({ script: baseScript, performances: strongPerformance, handsOnBonus: baseScript.handsOnBonus, seed: 42 });
  const weak = computeForgeOutcome({ script: baseScript, performances: weakerPerformance, handsOnBonus: baseScript.handsOnBonus, seed: 42 });
  assert.ok(strong.scoreOverall > weak.scoreOverall);
  assert.ok(strong.timeReductionPctApplied >= weak.timeReductionPctApplied);
});
