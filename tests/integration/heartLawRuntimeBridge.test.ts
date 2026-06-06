import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { RUNTIME_CONTENT_FILE_BY_KEY, validateLoadedContent } from '../../src/content/index.js';
import { getOfflineEfficiency } from '../../src/systems/offline.js';
import { getHeartLawBonuses } from '../../src/systems/heartLaw/heartLawLogic.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import { useGameStore, setPrestigeStoreGetter } from '../../src/stores/gameStore.js';
import { usePrestigeStore } from '../../src/stores/prestigeStore.js';
import type { HeartLawDef } from '../../src/content/index.js';
import type { SpiritRoot } from '../../src/types/index.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

async function readJson(fileName: string) {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8'));
}

async function loadValidatedContent() {
  const entries = await Promise.all(
    Object.entries(RUNTIME_CONTENT_FILE_BY_KEY).map(async ([key, fileName]) => [key, await readJson(fileName)] as const),
  );
  return validateLoadedContent(Object.fromEntries(entries) as never);
}

function primeContentStore(content: Awaited<ReturnType<typeof loadValidatedContent>>) {
  useContentStore.setState({
    raw: content,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted: [...content.cities].sort((a, b) => a.index - b.index),
    maps: {
      ...useContentStore.getState().maps,
      citiesById: Object.fromEntries(content.cities.map((entry) => [entry.id, entry])) as never,
      itemsById: Object.fromEntries(content.items.map((entry) => [entry.id, entry])) as never,
      heartLawsById: Object.fromEntries(content.heart_laws.map((entry) => [entry.id, entry])) as never,
    },
  });
}

function resetStores() {
  useCultivationStore.getState().resetForNewLife();
  useGameStore.getState().hardResetGameState();
  usePrestigeStore.getState().hardResetPrestige();
  setPrestigeStoreGetter(() => ({
    updateHighestRealm: () => {},
    getQiMultiplier: () => usePrestigeStore.getState().getQiMultiplier(),
    getCombatMultiplier: () => usePrestigeStore.getState().getCombatMultiplier(),
    getSpiritRootTotalMultiplier: () => usePrestigeStore.getState().getSpiritRootTotalMultiplier(),
    spiritRoot: usePrestigeStore.getState().spiritRoot,
  }));
}

function setSelectedHeartLaw(lawId: string | null, chapter: number): void {
  useCultivationStore.setState({
    selectedHeartLawId: lawId,
    chapter,
    unlockedHeartLawIds: lawId ? [lawId] : [],
  });
}

function getHeartLawDef(id: string): HeartLawDef {
  const law = useContentStore.getState().maps.heartLawsById[id] ?? null;
  assert.ok(law, `expected heart law ${id}`);
  return law;
}

function approxEqual(actual: number, expected: number, epsilon = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

let content: Awaited<ReturnType<typeof loadValidatedContent>>;

test.before(async () => {
  content = await loadValidatedContent();
});

test.beforeEach(() => {
  resetStores();
  primeContentStore(content);
});

test('getHeartLawBonuses is content-driven for Quiet Breath at chapter 5', () => {
  setSelectedHeartLaw('heart_quiet_breath_method', 5);

  const bonuses = getHeartLawBonuses({
    heartLawDef: getHeartLawDef('heart_quiet_breath_method'),
    chapter: 5,
    spiritRoot: null,
  });

  assert.equal(bonuses.cultivateRateMult, 1.2);
  assert.equal(bonuses.combatDamageMult, 1.04);
  assert.equal(bonuses.offlineEfficiencyAdd, 0.1);
  assert.equal(bonuses.stabilityCostMult, 0.97);
  assert.equal(bonuses.maxQiMult, 1.06);
  assert.equal(bonuses.techniqueMasteryGainMult, 1.06);
  assert.equal(bonuses.affinityMultiplier, 1);
  assert.equal(bonuses.affinityStatus, 'none');
});

test('offline efficiency bridge applies authored Heart Law additive bonus', () => {
  setSelectedHeartLaw('heart_quiet_breath_method', 1);

  assert.equal(getOfflineEfficiency(), 0.55);
});

test('breakthrough requirement bridge applies authored Heart Law multiplier', () => {
  useGameStore.setState({ qi: '999999999', realm: { index: 0, substage: 1, name: 'Qi Condensation' } });

  setSelectedHeartLaw(null, 1);
  const neutralRequirement = Number(useGameStore.getState().getBreakthroughRequirement());

  setSelectedHeartLaw('heart_nine_heavens_scripture', 1);
  const discountedRequirement = Number(useGameStore.getState().getBreakthroughRequirement());

  approxEqual(discountedRequirement / neutralRequirement, 0.94);
});

test('explicit live affinity changes signature potency only', () => {
  const fireRoot: SpiritRoot = { grade: 3, element: 'fire', purity: 100 };
  setSelectedHeartLaw('heart_heaven_flame_manual', 1);
  usePrestigeStore.setState({ spiritRoot: fireRoot });

  const bonuses = getHeartLawBonuses({
    heartLawDef: getHeartLawDef('heart_heaven_flame_manual'),
    chapter: 1,
    spiritRoot: fireRoot,
  });

  approxEqual(bonuses.affinityMultiplier, 1.12);
  assert.equal(bonuses.affinityStatus, 'match');
  approxEqual(bonuses.cultivateRateMult, 1.2544, 1e-6);
});

test('expanded live affinities apply mismatch at runtime', () => {
  const earthRoot: SpiritRoot = { grade: 3, element: 'earth', purity: 100 };

  const bonuses = getHeartLawBonuses({
    heartLawDef: getHeartLawDef('heart_star_core_refinement_law'),
    chapter: 1,
    spiritRoot: earthRoot,
  });

  assert.equal(bonuses.affinityMultiplier, 0.96);
  assert.equal(bonuses.affinityStatus, 'mismatch');
});

test('heartLawLogic source no longer contains archetype fallback switch cases', async () => {
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/systems/heartLaw/heartLawLogic.ts'), 'utf8');

  assert.equal(source.includes('switch (heartLawDef.archetype)'), false);
  assert.equal(source.includes("case 'steady'"), false);
  assert.equal(source.includes("case 'burst'"), false);
  assert.equal(source.includes("case 'artisan'"), false);
  assert.equal(source.includes("case 'mystic'"), false);
  assert.equal(source.includes("case 'risk'"), false);
});
