import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type { HeartLawDef, HeartLawsConfig } from '../../src/content/index.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { computeAffinityMultiplier, getAffinityStatus } from '../../src/systems/heartLaw/heartLawLogic.js';
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

function approxEqual(actual: number, expected: number, epsilon = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

function primeMinimalHeartLawContent(config: HeartLawsConfig): void {
  useContentStore.setState({
    isLoaded: true,
    isLoading: false,
    error: null,
    raw: {
      heart_laws: config.heartLaws,
      heart_law_affinity_rules: config.affinityRules ?? null,
    } as never,
    maps: {
      ...useContentStore.getState().maps,
      heartLawsById: Object.fromEntries(config.heartLaws.map((law) => [law.id, law])) as never,
    },
  });
}

function getLaw(config: HeartLawsConfig, id: string): HeartLawDef {
  const law = config.heartLaws.find((entry) => entry.id === id);
  assert.ok(law, `expected heart law ${id}`);
  return law;
}

const FIRE_ROOT: SpiritRoot = { grade: 3, element: 'fire', purity: 100 };
const WATER_ROOT: SpiritRoot = { grade: 3, element: 'water', purity: 100 };
const EARTH_ROOT: SpiritRoot = { grade: 3, element: 'earth', purity: 100 };

let config: HeartLawsConfig;

test.before(async () => {
  config = await readHeartLawsConfig();
});

test.beforeEach(() => {
  primeMinimalHeartLawContent(config);
});

test('any affinity is neutral', () => {
  const law = getLaw(config, 'heart_quiet_breath_method');

  assert.equal(computeAffinityMultiplier(law, FIRE_ROOT), 1);
  assert.deepEqual(getAffinityStatus(law, FIRE_ROOT), { status: 'none', percent: 0 });
});

test('explicit live matches use normalized content rules', () => {
  const heavenFlame = getLaw(config, 'heart_heaven_flame_manual');
  approxEqual(computeAffinityMultiplier(heavenFlame, FIRE_ROOT), 1.12);
  assert.deepEqual(getAffinityStatus(heavenFlame, FIRE_ROOT), { status: 'match', percent: 12 });

  const soulLantern = getLaw(config, 'heart_soul_lantern_sutra');
  approxEqual(computeAffinityMultiplier(soulLantern, WATER_ROOT), 1.12);
  assert.deepEqual(getAffinityStatus(soulLantern, WATER_ROOT), { status: 'match', percent: 12 });
});

test('explicit live mismatches use the normalized mismatch rule only', () => {
  const heavenFlame = getLaw(config, 'heart_heaven_flame_manual');

  approxEqual(computeAffinityMultiplier(heavenFlame, EARTH_ROOT), 0.96);
  assert.deepEqual(getAffinityStatus(heavenFlame, EARTH_ROOT), { status: 'mismatch', percent: 4 });
});

test('non-live-only affinities are neutral instead of mismatches', () => {
  const starCore = getLaw(config, 'heart_star_core_refinement_law');

  assert.equal(computeAffinityMultiplier(starCore, EARTH_ROOT), 1);
  assert.deepEqual(getAffinityStatus(starCore, EARTH_ROOT), { status: 'none', percent: 0 });
});

test('null law or null root is neutral', () => {
  const heavenFlame = getLaw(config, 'heart_heaven_flame_manual');

  assert.equal(computeAffinityMultiplier(null, FIRE_ROOT), 1);
  assert.deepEqual(getAffinityStatus(null, FIRE_ROOT), { status: 'none', percent: 0 });

  assert.equal(computeAffinityMultiplier(heavenFlame, null), 1);
  assert.deepEqual(getAffinityStatus(heavenFlame, null), { status: 'none', percent: 0 });
});
