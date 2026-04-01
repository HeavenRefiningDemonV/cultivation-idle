import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  SPIRIT_ROOT_RESONANCE_TABLE,
  buildHeartLawCatalogFromDefinitions,
  evaluateSpiritRootResonance,
} from '../../src/systems/doctrine/index.js';
import type { HeartLawProfile } from '../../src/systems/doctrine/index.js';
import type { HeartLawsConfig } from '../../src/content/index.js';
import type { SpiritRoot } from '../../src/types/index.js';

const HEART_LAWS_PATH = path.resolve(
  process.cwd(),
  'public',
  'cultivation_idle_content_bible_v1_config',
  'heart_laws.json',
);

async function readHeartLawsConfig(): Promise<HeartLawsConfig> {
  return JSON.parse(await fs.readFile(HEART_LAWS_PATH, 'utf8')) as HeartLawsConfig;
}

function createSyntheticProfile(): HeartLawProfile {
  return {
    id: 'synthetic_partial_fallback',
    name: 'Synthetic Partial Fallback',
    tier: 'starter',
    family: 'circulation',
    archetype: 'steady',
    playerFacingFamilyLabel: 'Circulation',
    daoTags: ['wood', 'growth'],
    spiritRootAffinities: [],
    liveSpiritRootAffinities: [],
    affinityRules: {
      matchBonusByTier: {
        starter: 0.1,
        tier1: 0.14,
        tier2: 0.18,
        tier3: 0.22,
      },
      mismatchPenalty: 0.05,
      appliesTo: 'signatureOnly',
    },
    chapterThresholds: [0, 80, 220, 500, 1000],
    chapterValueDistribution: [
      { chapter: 1, weightPct: 32 },
      { chapter: 2, weightPct: 18 },
      { chapter: 3, weightPct: 18 },
      { chapter: 4, weightPct: 17 },
      { chapter: 5, weightPct: 15 },
    ],
    signatureEffects: [],
    chapterEffectsByChapter: {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    },
    normalizedEffects: [],
    notes: [],
    spilloverBudgetPct: 0,
    combatBudgetPct: 0,
  };
}

let catalog: Record<string, HeartLawProfile>;

test.before(async () => {
  const config = await readHeartLawsConfig();
  catalog = buildHeartLawCatalogFromDefinitions(config.heartLaws, config.affinityRules);
});

test('strong resonance is locked for explicit live affinity matches', () => {
  const law = catalog.heart_heaven_flame_manual;
  const root: SpiritRoot = { grade: 3, element: 'fire', purity: 100 };

  assert.deepEqual(evaluateSpiritRootResonance(root, law), {
    tier: 'strong',
    heartLawEffectMult: 1.12,
    comprehensionMult: 1.08,
    qiMult: 1.05,
  });
});

test('mismatch resonance is locked for explicit live affinity misses and remains survivable', () => {
  const law = catalog.heart_heaven_flame_manual;
  const root: SpiritRoot = { grade: 3, element: 'earth', purity: 100 };

  assert.deepEqual(evaluateSpiritRootResonance(root, law), {
    tier: 'mismatch',
    heartLawEffectMult: 0.96,
    comprehensionMult: 0.97,
    qiMult: 1,
  });
});

test('any affinity remains neutral', () => {
  const law = catalog.heart_quiet_breath_method;
  const root: SpiritRoot = { grade: 3, element: 'fire', purity: 100 };

  assert.deepEqual(evaluateSpiritRootResonance(root, law), {
    tier: 'neutral',
    heartLawEffectMult: 1,
    comprehensionMult: 1,
    qiMult: 1,
  });
});

test('non-live-only affinities remain neutral instead of mismatch', () => {
  const law = catalog.heart_star_core_refinement_law;
  const root: SpiritRoot = { grade: 3, element: 'earth', purity: 100 };

  assert.deepEqual(evaluateSpiritRootResonance(root, law), {
    tier: 'neutral',
    heartLawEffectMult: 1,
    comprehensionMult: 1,
    qiMult: 1,
  });
});

test('fallback daoTags can create partial resonance but never mismatch', () => {
  const law = createSyntheticProfile();

  assert.deepEqual(
    evaluateSpiritRootResonance({ grade: 2, element: 'wood', purity: 50 }, law),
    {
      tier: 'partial',
      heartLawEffectMult: 1.06,
      comprehensionMult: 1.04,
      qiMult: 1.02,
    },
  );

  assert.deepEqual(
    evaluateSpiritRootResonance({ grade: 2, element: 'fire', purity: 50 }, law),
    {
      tier: 'neutral',
      heartLawEffectMult: 1,
      comprehensionMult: 1,
      qiMult: 1,
    },
  );
});

test('null root or null law remains neutral', () => {
  const law = catalog.heart_heaven_flame_manual;
  const root: SpiritRoot = { grade: 3, element: 'fire', purity: 100 };

  assert.deepEqual(evaluateSpiritRootResonance(null, law), SPIRIT_ROOT_RESONANCE_TABLE.neutral);
  assert.deepEqual(evaluateSpiritRootResonance(root, null), SPIRIT_ROOT_RESONANCE_TABLE.neutral);
});

test('resonance table stays bounded to the packet 4.4 lock', () => {
  assert.deepEqual(SPIRIT_ROOT_RESONANCE_TABLE, {
    strong: {
      tier: 'strong',
      heartLawEffectMult: 1.12,
      comprehensionMult: 1.08,
      qiMult: 1.05,
    },
    partial: {
      tier: 'partial',
      heartLawEffectMult: 1.06,
      comprehensionMult: 1.04,
      qiMult: 1.02,
    },
    neutral: {
      tier: 'neutral',
      heartLawEffectMult: 1,
      comprehensionMult: 1,
      qiMult: 1,
    },
    mismatch: {
      tier: 'mismatch',
      heartLawEffectMult: 0.96,
      comprehensionMult: 0.97,
      qiMult: 1,
    },
  });

  Object.values(SPIRIT_ROOT_RESONANCE_TABLE).forEach((entry) => {
    assert.equal(entry.heartLawEffectMult <= 1.12, true);
    assert.equal(entry.heartLawEffectMult >= 0.96, true);
  });
  assert.equal(SPIRIT_ROOT_RESONANCE_TABLE.mismatch.qiMult, 1);
});
