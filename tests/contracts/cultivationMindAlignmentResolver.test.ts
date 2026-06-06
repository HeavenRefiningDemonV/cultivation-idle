import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveCultivationMindAlignment,
} from '../../src/systems/cultivation/cultivationMindAlignmentResolver.js';
import { getCanonicalCultivationStageNumber } from '../../src/systems/progression/cultivationStageIndex.js';

const BASE_INPUT = {
  cultivationStageIndex: 20,
  clarity: 60,
  turbulence: 10,
};

test('MP3 mind alignment resolver applies the locked parity table', () => {
  const cases = [
    {
      delta: 2,
      qi: 0.94,
      risk: -8,
      xp: 0.65,
      innerDemon: true,
      capState: 'overexpressed',
      text: 'Doctrine exceeds vessel: cultivation speed -6%, breakthrough risk -8. Heart Law XP is inefficient until cultivation catches up.',
    },
    {
      delta: 1,
      qi: 1.06,
      risk: -12,
      xp: 1,
      innerDemon: true,
      capState: 'aligned',
      text: 'Heart Law leads cultivation by 1 stage: cultivation speed +6%, breakthrough risk -12.',
    },
    {
      delta: 0,
      qi: 1.03,
      risk: -10,
      xp: 1,
      innerDemon: true,
      capState: 'aligned',
      text: 'Heart Law and realm are aligned: cultivation speed +3%, breakthrough risk -10.',
    },
    {
      delta: -1,
      qi: 0.96,
      risk: -4,
      xp: 1.05,
      innerDemon: true,
      capState: 'slightly_lagging',
      text: 'Heart Law trails cultivation by 1 stage: cultivation speed -4%, breakthrough risk -4.',
    },
    {
      delta: -2,
      qi: 0.88,
      risk: 8,
      xp: 1.1,
      innerDemon: true,
      capState: 'lagging',
      text: 'Heart Law trails cultivation by 2 stages: cultivation speed -12%, breakthrough risk +8.',
    },
    {
      delta: -3,
      qi: 0.74,
      risk: 18,
      xp: 0.85,
      innerDemon: false,
      capState: 'severe_lag',
      text: 'Heart Law lags badly: cultivation speed -26%, breakthrough risk +18. Inner Demon Debate unavailable.',
    },
    {
      delta: -4,
      qi: 0.6,
      risk: 30,
      xp: 0.75,
      innerDemon: false,
      capState: 'reckless_lag',
      text: 'Heart Law lags catastrophically: cultivation speed -40%, breakthrough risk +30. Reckless confirmation required.',
    },
  ] as const;

  for (const row of cases) {
    const result = resolveCultivationMindAlignment({
      ...BASE_INPUT,
      heartLawLevel: BASE_INPUT.cultivationStageIndex + row.delta,
    });

    assert.equal(result.parityDelta, row.delta);
    assert.equal(result.qiRateMultiplier, row.qi);
    assert.equal(result.breakthroughRiskDelta, row.risk);
    assert.equal(result.heartLawXpMultiplier, row.xp);
    assert.equal(result.innerDemonDebateAvailable, row.innerDemon);
    assert.equal(result.capState, row.capState);
    assert.equal(result.summaryText, row.text);
    assert.equal(result.causeRows[0]?.id, 'heart_law_mind_alignment');
    assert.equal(result.causeRows[0]?.value, row.risk);
    assert.equal(result.causeRows[0]?.displayText, row.text);
  }
});

test('MP3 mind alignment resolver sanitizes unsafe inputs without poisoning live Qi math', () => {
  const result = resolveCultivationMindAlignment({
    cultivationStageIndex: Number.NaN,
    heartLawLevel: Number.POSITIVE_INFINITY,
    clarity: Number.NaN,
    turbulence: Number.NEGATIVE_INFINITY,
  });

  assert.equal(Number.isFinite(result.cultivationStageIndex), true);
  assert.equal(Number.isFinite(result.heartLawLevel), true);
  assert.equal(Number.isFinite(result.qiRateMultiplier), true);
  assert.equal(Number.isFinite(result.breakthroughRiskDelta), true);
  assert.equal(result.cultivationStageIndex, 1);
  assert.equal(result.heartLawLevel, 1);
  assert.equal(result.parityDelta, 0);
});

test('MP3 mind alignment uses canonical later-realm stage numbers instead of nine-substage math', () => {
  const nascentSoulOne = getCanonicalCultivationStageNumber({ realmIndex: 3, substage: 1 });
  const soulFormationOne = getCanonicalCultivationStageNumber({ realmIndex: 4, substage: 1 });
  const spiritSeveringOne = getCanonicalCultivationStageNumber({ realmIndex: 5, substage: 1 });

  assert.equal(nascentSoulOne, 28);
  assert.equal(soulFormationOne, 34);
  assert.equal(spiritSeveringOne, 40);

  const lagging = resolveCultivationMindAlignment({
    ...BASE_INPUT,
    cultivationStageIndex: nascentSoulOne,
    heartLawLevel: nascentSoulOne - 2,
  });

  assert.equal(lagging.parityDelta, -2);
  assert.equal(lagging.qiRateMultiplier, 0.88);
  assert.equal(lagging.breakthroughRiskDelta, 8);
});
