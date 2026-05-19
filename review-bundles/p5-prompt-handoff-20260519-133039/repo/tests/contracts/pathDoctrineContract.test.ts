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
      'Fast cultivation and technique-led pressure. Heaven converts qi tempo into precise offensive windows, but its survival floor is thinner and greed is punished.',
    coreIdentity: 'precision_pressure',
    prepBias: ['qi-floor', 'medicine-floor', 'survival-backstop', 'resource-plan'],
    forgeBias: ['weapon-first', 'offense-runes', 'survival-patch-before-push'],
    buildBias: ['technique-pressure', 'utility-setup', 'guard-backstop'],
    recommendedAiByPhase: {
      early: ['balanced', 'farmer'],
      boss: ['burst', 'balanced'],
    },
    commonFailureModes: ['greedy-without-backstop', 'underdefended-for-gate', 'resource-starved-rotation'],
  },
  earth: {
    label: 'Earth',
    summary:
      'Durability-first cultivation with steady inevitability. Earth wins by surviving long fights and holding formation, but it stalls when weapon floor and finishers lag.',
    coreIdentity: 'durable_inevitability',
    prepBias: ['forge-floor', 'sustain-floor', 'medicine-floor'],
    forgeBias: ['armor-first', 'balanced-refine', 'defense-runes'],
    buildBias: ['durable-rotation', 'guard-backstop', 'single-target-finisher'],
    recommendedAiByPhase: {
      early: ['balanced', 'survivor'],
      boss: ['survivor', 'balanced'],
    },
    commonFailureModes: ['stalling-without-finisher', 'underforged-weapon', 'overdefended-no-pressure'],
  },
  martial: {
    label: 'Martial',
    summary:
      'Aggressive tempo with the strongest kill-window feel. Martial wins by chaining pressure and crit-driven bursts, but it falls off quickly when sustain and discipline are ignored.',
    coreIdentity: 'tempo_kill_window',
    prepBias: ['forge-floor', 'medicine-floor', 'tempo-preservation', 'resource-plan'],
    forgeBias: ['weapon-first', 'offense-runes', 'survival-patch-before-push'],
    buildBias: ['tempo-chain', 'single-target-finisher', 'minimum-sustain'],
    recommendedAiByPhase: {
      early: ['farmer', 'burst'],
      boss: ['burst', 'balanced'],
    },
    commonFailureModes: ['overextending-burst-window', 'resource-starved-rotation', 'greedy-without-backstop'],
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
    assert.deepEqual(profile.prepBias, expected.prepBias);
    assert.deepEqual(profile.forgeBias, expected.forgeBias);
    assert.deepEqual(profile.buildBias, expected.buildBias);
    assert.deepEqual(profile.recommendedAiByPhase.early, expected.recommendedAiByPhase.early);
    assert.deepEqual(profile.recommendedAiByPhase.boss, expected.recommendedAiByPhase.boss);
    assert.deepEqual(profile.commonFailureModes, expected.commonFailureModes);
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
    assert.equal(profile.recommendedAiByPhase.boss.includes('farmer'), false);
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
    assert.equal(Object.isFrozen(profile.prepBias), true);
    assert.equal(Object.isFrozen(profile.forgeBias), true);
    assert.equal(Object.isFrozen(profile.buildBias), true);
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
