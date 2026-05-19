import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { FOCUS_MODE_MODIFIERS } from '../../src/constants/index.js';
import { BREATH_MODE_MULTIPLIERS } from '../../src/content/tuning/cultivationTuning.js';
import type { DoctrineSnapshot } from '../../src/systems/doctrine/doctrineTypes.js';
import * as doctrine from '../../src/systems/doctrine/index.js';
import type { BreathMode, FocusMode } from '../../src/types/index.js';

function makeSnapshot(overrides: Partial<DoctrineSnapshot> = {}): DoctrineSnapshot {
  return {
    path: null,
    focusMode: 'balanced',
    spiritRoot: null,
    heartLawId: null,
    heartLawChapter: 1,
    breathMode: 'balanced',
    selectedLoadoutId: null,
    aiProfile: 'balanced',
    castingPolicy: 'balanced',
    realmIndex: 0,
    majorRealmId: 'qi_condensation',
    cityId: null,
    ...overrides,
  };
}

function assertUniqueModes<T extends BreathMode | FocusMode>(modes: T[], expected: readonly T[]): void {
  assert.equal(modes.length, 3);
  assert.deepEqual([...new Set(modes)], expected);
}

test('focus semantics are locked exactly for all live focus modes', () => {
  assert.deepEqual(doctrine.getFocusModeSemantics('balanced'), {
    mode: 'balanced',
    label: 'Balanced',
    summary: 'Neutral posture. Keep Qi growth and combat stats on their baseline when you do not need a deliberate skew.',
    preferredFor: ['heaven', 'earth', 'martial'],
    cautions: ['It does not patch fragility or accelerate cultivation by itself.'],
  });

  assert.deepEqual(doctrine.getFocusModeSemantics('body'), {
    mode: 'body',
    label: 'Body',
    summary: 'Durability posture. Trade cultivation speed for a heavier body and firmer defense without changing attack.',
    preferredFor: ['earth', 'martial'],
    cautions: ['Use it to survive or stabilize; it is not the fast answer for raw Qi farming.'],
  });

  assert.deepEqual(doctrine.getFocusModeSemantics('spirit'), {
    mode: 'spirit',
    label: 'Spirit',
    summary: 'Qi-first posture. Push cultivation harder and accept a thinner body while you do it.',
    preferredFor: ['heaven'],
    cautions: ['Greed is punished here when your real problem is surviving, not cultivating faster.'],
  });
});

test('breath semantics are locked exactly for all live breath modes', () => {
  assert.deepEqual(doctrine.getBreathModeSemantics('balanced'), {
    mode: 'balanced',
    label: 'Balanced',
    summary: 'Neutral cycle. Steady Qi flow, steady comprehension, and steady stability.',
    preferredFor: ['cultivate', 'recover'],
    cautions: ['Good default, but it will not specialize verse progress or short burst farming.'],
  });

  assert.deepEqual(doctrine.getBreathModeSemantics('safe'), {
    mode: 'safe',
    label: 'Safe',
    summary: 'Controlled cycle. Slower Qi flow in exchange for better comprehension and better stability.',
    preferredFor: ['prepare_breakthrough', 'recover', 'cultivate'],
    cautions: ['Stay here when the foundation is shaky; leave it when raw progress is the real bottleneck.'],
  });

  assert.deepEqual(doctrine.getBreathModeSemantics('fast'), {
    mode: 'fast',
    label: 'Fast',
    summary: 'Aggressive cycle. Faster Qi flow in exchange for worse comprehension and worse stability.',
    preferredFor: ['push_fast', 'cultivate'],
    cautions: ['Greedy use is punished while your scripture still needs chapters or your foundation still wobbles.'],
  });
});

test('focus and breath semantics are canonical and frozen', () => {
  const focusA = doctrine.getFocusModeSemantics('balanced');
  const focusB = doctrine.getFocusModeSemantics('balanced');
  assert.equal(focusA, focusB);
  assert.equal(Object.isFrozen(focusA), true);
  assert.equal(Object.isFrozen(focusA.preferredFor), true);
  assert.equal(Object.isFrozen(focusA.cautions), true);

  const breathA = doctrine.getBreathModeSemantics('balanced');
  const breathB = doctrine.getBreathModeSemantics('balanced');
  assert.equal(breathA, breathB);
  assert.equal(Object.isFrozen(breathA), true);
  assert.equal(Object.isFrozen(breathA.preferredFor), true);
  assert.equal(Object.isFrozen(breathA.cautions), true);
});

test('focus recommendations are path-only and locked to the exact authored orders', () => {
  assert.deepEqual(doctrine.getRecommendedFocusModes(makeSnapshot({ path: null })), ['balanced', 'body', 'spirit']);
  assert.deepEqual(doctrine.getRecommendedFocusModes(makeSnapshot({ path: 'heaven' })), ['spirit', 'balanced', 'body']);
  assert.deepEqual(doctrine.getRecommendedFocusModes(makeSnapshot({ path: 'earth' })), ['body', 'balanced', 'spirit']);
  assert.deepEqual(doctrine.getRecommendedFocusModes(makeSnapshot({ path: 'martial' })), ['balanced', 'body', 'spirit']);
});

test('focus recommendations ignore unrelated doctrine snapshot fields', () => {
  const baseline = makeSnapshot({ path: 'heaven', focusMode: 'balanced', heartLawId: null, heartLawChapter: 1 });
  const noisy = makeSnapshot({
    path: 'heaven',
    focusMode: 'body',
    breathMode: 'fast',
    heartLawId: 'heart_anything',
    heartLawChapter: 5,
    selectedLoadoutId: 'loadout_x',
    aiProfile: 'burst',
    castingPolicy: 'defensive',
    realmIndex: 4,
    majorRealmId: 'soul_formation',
    cityId: 'city_lotusford',
  });

  assert.deepEqual(doctrine.getRecommendedFocusModes(baseline), ['spirit', 'balanced', 'body']);
  assert.deepEqual(doctrine.getRecommendedFocusModes(noisy), ['spirit', 'balanced', 'body']);
});

test('breath recommendations follow the locked contextual rules', () => {
  assert.deepEqual(
    doctrine.getRecommendedBreathModes(makeSnapshot({ path: null, focusMode: 'balanced', heartLawId: null, heartLawChapter: 1 })),
    ['balanced', 'safe', 'fast'],
  );
  assert.deepEqual(
    doctrine.getRecommendedBreathModes(makeSnapshot({ path: 'heaven', focusMode: 'balanced', heartLawId: 'heart_anything', heartLawChapter: 1 })),
    ['balanced', 'safe', 'fast'],
  );
  assert.deepEqual(
    doctrine.getRecommendedBreathModes(makeSnapshot({ path: 'heaven', focusMode: 'spirit', heartLawId: 'heart_anything', heartLawChapter: 1 })),
    ['fast', 'balanced', 'safe'],
  );
  assert.deepEqual(
    doctrine.getRecommendedBreathModes(makeSnapshot({ path: 'earth', focusMode: 'body', heartLawId: 'heart_anything', heartLawChapter: 2 })),
    ['safe', 'balanced', 'fast'],
  );
  assert.deepEqual(
    doctrine.getRecommendedBreathModes(makeSnapshot({ path: 'martial', focusMode: 'balanced', heartLawId: 'heart_anything', heartLawChapter: 5 })),
    ['balanced', 'fast', 'safe'],
  );
  assert.deepEqual(
    doctrine.getRecommendedBreathModes(makeSnapshot({ path: null, focusMode: 'balanced', heartLawId: null, heartLawChapter: 5 })),
    ['balanced', 'safe', 'fast'],
  );
});

test('breath recommendations ignore unrelated doctrine snapshot fields', () => {
  const snapshotA = makeSnapshot({ path: 'earth', focusMode: 'body', heartLawId: 'heart_anything', heartLawChapter: 2 });
  const snapshotB = makeSnapshot({
    path: 'earth',
    focusMode: 'body',
    heartLawId: 'heart_anything',
    heartLawChapter: 2,
    breathMode: 'fast',
    selectedLoadoutId: 'loadout_2',
    aiProfile: 'survivor',
    castingPolicy: 'aggressive',
    realmIndex: 4,
    majorRealmId: 'soul_formation',
    cityId: 'city_lotusford',
  });

  assert.deepEqual(doctrine.getRecommendedBreathModes(snapshotA), ['safe', 'balanced', 'fast']);
  assert.deepEqual(doctrine.getRecommendedBreathModes(snapshotB), ['safe', 'balanced', 'fast']);
});

test('recommendation arrays are complete, valid, unique, and fresh', () => {
  const focusA = doctrine.getRecommendedFocusModes(makeSnapshot({ path: 'earth' }));
  const focusB = doctrine.getRecommendedFocusModes(makeSnapshot({ path: 'earth' }));
  assert.notEqual(focusA, focusB);
  assertUniqueModes(focusA, ['body', 'balanced', 'spirit']);
  assertUniqueModes(focusB, ['body', 'balanced', 'spirit']);

  const breathA = doctrine.getRecommendedBreathModes(
    makeSnapshot({ path: 'earth', focusMode: 'body', heartLawId: 'heart_anything', heartLawChapter: 2 }),
  );
  const breathB = doctrine.getRecommendedBreathModes(
    makeSnapshot({ path: 'earth', focusMode: 'body', heartLawId: 'heart_anything', heartLawChapter: 2 }),
  );
  assert.notEqual(breathA, breathB);
  assertUniqueModes(breathA, ['safe', 'balanced', 'fast']);
  assertUniqueModes(breathB, ['safe', 'balanced', 'fast']);
});

test('packet 4.5 did not rebalance focus or breath numeric truth', () => {
  assert.deepEqual(FOCUS_MODE_MODIFIERS, {
    balanced: {
      qiMultiplier: 1.0,
      hpMultiplier: 1.0,
      atkMultiplier: 1.0,
      defMultiplier: 1.0,
    },
    body: {
      qiMultiplier: 0.8,
      hpMultiplier: 1.5,
      atkMultiplier: 1.0,
      defMultiplier: 1.5,
    },
    spirit: {
      qiMultiplier: 1.5,
      hpMultiplier: 0.8,
      atkMultiplier: 1.0,
      defMultiplier: 1.0,
    },
  });

  assert.deepEqual(BREATH_MODE_MULTIPLIERS, {
    balanced: { qiRateMult: 1, comprehensionMult: 1, stabilityMult: 1 },
    safe: { qiRateMult: 0.85, comprehensionMult: 1.1, stabilityMult: 1.15 },
    fast: { qiRateMult: 1.15, comprehensionMult: 0.9, stabilityMult: 0.85 },
  });
});

test('packet 4.5 doctrine semantic modules are store-free source files', async () => {
  const focusSource = await fs.readFile(path.resolve(process.cwd(), 'src/systems/doctrine/focusSemantics.ts'), 'utf8');
  const breathSource = await fs.readFile(path.resolve(process.cwd(), 'src/systems/doctrine/breathSemantics.ts'), 'utf8');
  const bannedSnippets = [
    'useGameStore',
    'useCultivationStore',
    'useHeartLawStore',
    'usePrestigeStore',
    'useTechniqueStore',
    'zustand',
    '.setState(',
    "from '../../stores/",
    "from '../stores/",
  ];

  bannedSnippets.forEach((snippet) => {
    assert.equal(focusSource.includes(snippet), false, `focusSemantics.ts should not contain ${snippet}`);
    assert.equal(breathSource.includes(snippet), false, `breathSemantics.ts should not contain ${snippet}`);
  });
});

test('doctrine index re-exports the packet 4.5 focus and breath helpers', () => {
  assert.equal(typeof doctrine.getFocusModeSemantics, 'function');
  assert.equal(typeof doctrine.getRecommendedFocusModes, 'function');
  assert.equal(typeof doctrine.getBreathModeSemantics, 'function');
  assert.equal(typeof doctrine.getRecommendedBreathModes, 'function');
});
