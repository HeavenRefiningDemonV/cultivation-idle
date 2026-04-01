import assert from 'node:assert/strict';
import test from 'node:test';

import { PATH_MODIFIERS } from '../../src/constants/index.js';
import { AI_PROFILE_OPTIONS } from '../../src/systems/combat/aiProfiles.js';
import {
  PATH_DOCTRINE_ORDER,
  PATH_DOCTRINE_REGISTRY,
  PATH_DOCTRINE_REGISTRY_BY_ID,
  getAllPathDoctrineProfiles,
  getPathDoctrineProfile,
  getPathDoctrineSummary,
} from '../../src/systems/doctrine/index.js';
import type { CultivationPath } from '../../src/types/index.js';

const EXPECTED_ORDER: CultivationPath[] = ['heaven', 'earth', 'martial'];
const VALID_AI_VALUES = new Set(AI_PROFILE_OPTIONS.map((option) => option.value));

const EXPECTED_PROFILES = {
  heaven: {
    label: 'Heaven',
    summary:
      'Refined technique-forward cultivation with strong burst windows and qi tempo, but lower forgiveness when survival prep is greedy.',
    coreIdentity: 'precision_pressure',
    playIdentityKeywords: ['scripture', 'flow', 'precision', 'timed-burst-setup', 'calm-control'],
    doctrineBudget: [
      { label: 'Damage / Burst', weight: 35 },
      { label: 'Setup / Control', weight: 25 },
      { label: 'Cultivation / Cycle', weight: 25 },
      { label: 'Survivability', weight: 15 },
    ],
    prepBias: ['qi-elixir', 'focus', 'quiet-breath', 'windstep'],
    forgeBias: ['weapon-refine-first', 'precision-offense-temper', 'survival-patch-before-push'],
    buildBiasSummary: [
      '2 damage actives',
      '1 setup/control slot',
      '1 mobility/tempo or defensive flex',
      'Passives favor cycle/crit/control/technique efficiency',
    ],
    recommendedAiByPhase: {
      early: ['balanced', 'farmer'],
      boss: ['burst', 'balanced'],
    },
    commonFailureModes: ['underprepared-floor', 'offense-greed-without-backstop', 'missing-defensive-tempo-backstop'],
    objectiveLine: 'Build precise burst windows while protecting a thin survival floor.',
  },
  earth: {
    label: 'Earth',
    summary:
      'Stable body-centered doctrine that converts durability into steady pressure; forgiving overall, but can stall without a finisher.',
    coreIdentity: 'durable_inevitability',
    playIdentityKeywords: ['body-cultivation', 'guard', 'steadiness', 'attrition', 'patient-inevitability'],
    doctrineBudget: [
      { label: 'Durability / Sustain', weight: 40 },
      { label: 'Counter / Control', weight: 20 },
      { label: 'Raw Damage', weight: 20 },
      { label: 'Cultivation / Tempo', weight: 20 },
    ],
    prepBias: ['ironblood', 'ward-salt', 'meridian-warmth'],
    forgeBias: [
      'weapon-floor-first-then-defense-floor',
      'defensive-temper-early',
      'balanced-refine-over-glass-cannon',
    ],
    buildBiasSummary: [
      '1 strike slot',
      '1 guard/shield/counter backstop',
      '1 sustain or single-target finisher',
      'Passives favor HP/DEF/regen/stability',
    ],
    recommendedAiByPhase: {
      early: ['balanced', 'survivor'],
      boss: ['survivor', 'balanced'],
    },
    commonFailureModes: ['stalling-without-finisher', 'underforged-floor', 'overdefended-no-pressure'],
    objectiveLine: 'Turn durability into inevitability and avoid stalling without a finisher.',
  },
  martial: {
    label: 'Martial',
    summary:
      'Aggressive combat-shaped doctrine with the strongest kill-window feel; wins through tempo chains, loses when sustain discipline breaks.',
    coreIdentity: 'tempo_kill_window',
    playIdentityKeywords: ['will', 'conflict', 'edge', 'execution', 'pressure'],
    doctrineBudget: [
      { label: 'Burst / Kill Window', weight: 45 },
      { label: 'Tempo / Mobility', weight: 20 },
      { label: 'Setup / Opener', weight: 15 },
      { label: 'Survivability', weight: 20 },
    ],
    prepBias: ['windstep', 'focus', 'mastery-tonic', 'ironblood-fallback'],
    forgeBias: ['weapon-refine-first', 'offense-temper-first', 'survival-patch-if-sustain-collapses'],
    buildBiasSummary: [
      'opener/setup slot',
      'core strike slot',
      'execute/finisher slot',
      'mobility/tempo flex and passives favor ATK/crit/cooldown/tempo',
    ],
    recommendedAiByPhase: {
      early: ['farmer', 'balanced'],
      boss: ['burst', 'balanced'],
    },
    commonFailureModes: ['underdefended-burst-greed', 'sustain-collapse', 'wrong-ai-posture-for-boss'],
    objectiveLine: 'Chain tempo into kill windows without letting sustain collapse.',
  },
} as const;

test('path doctrine registry coverage and order are exact', () => {
  assert.deepEqual(PATH_DOCTRINE_ORDER, EXPECTED_ORDER);
  assert.deepEqual(PATH_DOCTRINE_REGISTRY.map((entry) => entry.id), EXPECTED_ORDER);
  assert.equal(PATH_DOCTRINE_REGISTRY.length, 3);
});

test('each path resolves to the exact authored semantic profile', () => {
  for (const path of EXPECTED_ORDER) {
    const profile = getPathDoctrineProfile(path);
    const expected = EXPECTED_PROFILES[path];

    assert.ok(profile);
    assert.equal(profile.id, path);
    assert.equal(profile.label, expected.label);
    assert.equal(profile.summary, expected.summary);
    assert.equal(profile.coreIdentity, expected.coreIdentity);
    assert.deepEqual(profile.playIdentityKeywords, expected.playIdentityKeywords);
    assert.deepEqual(profile.doctrineBudget, expected.doctrineBudget);
    assert.deepEqual(profile.prepBias, expected.prepBias);
    assert.deepEqual(profile.forgeBias, expected.forgeBias);
    assert.deepEqual(profile.buildBiasSummary, expected.buildBiasSummary);
    assert.deepEqual(profile.recommendedAiByPhase.early, expected.recommendedAiByPhase.early);
    assert.deepEqual(profile.recommendedAiByPhase.boss, expected.recommendedAiByPhase.boss);
    assert.deepEqual(profile.commonFailureModes, expected.commonFailureModes);
    assert.equal(profile.objectiveLine, expected.objectiveLine);
  }
});

test('doctrine budget always has 4 lines and sums to 100', () => {
  for (const profile of PATH_DOCTRINE_REGISTRY) {
    assert.equal(profile.doctrineBudget.length, 4);
    assert.equal(profile.doctrineBudget.reduce((sum, entry) => sum + entry.weight, 0), 100);
  }
});

test('null path behavior is safe and exact', () => {
  assert.equal(getPathDoctrineProfile(null), null);
  assert.equal(getPathDoctrineSummary(null), 'No path selected.');
});

test('recommended AI arrays are valid and boss-safe', () => {
  for (const profile of PATH_DOCTRINE_REGISTRY) {
    assert.equal(profile.recommendedAiByPhase.early.length, 2);
    assert.equal(profile.recommendedAiByPhase.boss.length, 2);

    profile.recommendedAiByPhase.early.forEach((aiProfile) => {
      assert.equal(VALID_AI_VALUES.has(aiProfile), true);
    });
    profile.recommendedAiByPhase.boss.forEach((aiProfile) => {
      assert.equal(VALID_AI_VALUES.has(aiProfile), true);
    });
    assert.notEqual(profile.recommendedAiByPhase.boss[0], 'farmer');
  }
});

test('modifier signatures are anchored to live path math without aliasing', () => {
  for (const path of EXPECTED_ORDER) {
    const profile = getPathDoctrineProfile(path);
    assert.ok(profile);
    assert.deepEqual(profile.modifierSignature, PATH_MODIFIERS[path]);
    assert.notEqual(profile.modifierSignature, PATH_MODIFIERS[path]);
  }
});

test('registry and doctrine profiles are frozen enough to trust', () => {
  assert.equal(Object.isFrozen(PATH_DOCTRINE_REGISTRY), true);
  assert.equal(Object.isFrozen(PATH_DOCTRINE_REGISTRY_BY_ID), true);

  for (const profile of PATH_DOCTRINE_REGISTRY) {
    assert.equal(Object.isFrozen(profile), true);
    assert.equal(Object.isFrozen(profile.modifierSignature), true);
    assert.equal(Object.isFrozen(profile.playIdentityKeywords), true);
    assert.equal(Object.isFrozen(profile.doctrineBudget), true);
    assert.equal(Object.isFrozen(profile.doctrineBudget[0]), true);
    assert.equal(Object.isFrozen(profile.prepBias), true);
    assert.equal(Object.isFrozen(profile.forgeBias), true);
    assert.equal(Object.isFrozen(profile.buildBiasSummary), true);
    assert.equal(Object.isFrozen(profile.recommendedAiByPhase), true);
    assert.equal(Object.isFrozen(profile.recommendedAiByPhase.early), true);
    assert.equal(Object.isFrozen(profile.recommendedAiByPhase.boss), true);
    assert.equal(Object.isFrozen(profile.commonFailureModes), true);
  }
});

test('getAllPathDoctrineProfiles is deterministic and isolated from the exported registry array', () => {
  const a = getAllPathDoctrineProfiles();
  const b = getAllPathDoctrineProfiles();

  assert.notEqual(a, PATH_DOCTRINE_REGISTRY);
  assert.notEqual(a, b);
  assert.equal(a.length, 3);
  assert.equal(b.length, 3);
  assert.deepEqual(a.map((profile) => profile.id), EXPECTED_ORDER);
  assert.deepEqual(b.map((profile) => profile.id), EXPECTED_ORDER);
});
