import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  computeAffinityMultiplier,
  getAffinityStatus,
  getHeartLawBonuses,
} from '../../src/systems/heartLaw/heartLawLogic.js';
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
  return validateLoadedContent({
    economy: await readJson('economy.json'),
    cities: await readJson('cities.json'),
    items: await readJson('items.json'),
    techniques: await readJson('techniques.json'),
    pavilions: await readJson('pavilions.json'),
    outskirts: await readJson('outskirts.json'),
    enemies: await readJson('enemies.json'),
    trials: await readJson('trials.json'),
    ruins: await readJson('ruins.json'),
    alchemy_recipes: await readJson('alchemy_recipes.json'),
    forge_blueprints: await readJson('forge_blueprints.json'),
    runes: await readJson('runes.json'),
    talisman_recipes: await readJson('talisman_recipes.json'),
    apothecary_shops: await readJson('apothecary_shops.json'),
    expeditions: await readJson('expeditions.json'),
    bounties: await readJson('bounties.json'),
    heart_laws: await readJson('heart_laws.json'),
    prestige_store: await readJson('prestige_store.json'),
  } as never);
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

test('computeAffinityMultiplier now returns packet 4.4 resonance values', () => {
  const strongRoot: SpiritRoot = { grade: 3, element: 'fire', purity: 100 };
  const mismatchRoot: SpiritRoot = { grade: 3, element: 'earth', purity: 100 };
  const neutralRoot: SpiritRoot = { grade: 3, element: 'fire', purity: 100 };

  assert.equal(computeAffinityMultiplier(getHeartLawDef('heart_heaven_flame_manual'), strongRoot), 1.12);
  assert.equal(computeAffinityMultiplier(getHeartLawDef('heart_heaven_flame_manual'), mismatchRoot), 0.96);
  assert.equal(computeAffinityMultiplier(getHeartLawDef('heart_quiet_breath_method'), neutralRoot), 1);
});

test('getAffinityStatus maps resonance tiers back into the legacy compatibility surface', () => {
  const strongRoot: SpiritRoot = { grade: 3, element: 'fire', purity: 100 };
  const mismatchRoot: SpiritRoot = { grade: 3, element: 'earth', purity: 100 };
  const neutralRoot: SpiritRoot = { grade: 3, element: 'fire', purity: 100 };

  assert.deepEqual(getAffinityStatus(getHeartLawDef('heart_heaven_flame_manual'), strongRoot), {
    status: 'match',
    percent: 12,
  });
  assert.deepEqual(getAffinityStatus(getHeartLawDef('heart_heaven_flame_manual'), mismatchRoot), {
    status: 'mismatch',
    percent: 4,
  });
  assert.deepEqual(getAffinityStatus(getHeartLawDef('heart_quiet_breath_method'), neutralRoot), {
    status: 'none',
    percent: 0,
  });
});

test('getHeartLawBonuses uses packet 4.4 resonance for signature scaling only', () => {
  const law = getHeartLawDef('heart_heaven_flame_manual');

  const strongBonuses = getHeartLawBonuses({
    heartLawDef: law,
    chapter: 1,
    spiritRoot: { grade: 3, element: 'fire', purity: 100 },
  });
  approxEqual(strongBonuses.cultivateRateMult, 1.2544, 1e-6);

  const mismatchBonuses = getHeartLawBonuses({
    heartLawDef: law,
    chapter: 1,
    spiritRoot: { grade: 3, element: 'earth', purity: 100 },
  });
  approxEqual(mismatchBonuses.cultivateRateMult, 1.2352, 1e-6);
});

test('heartLawLogic source now depends on packet 4.4 doctrine resonance instead of the old tier-based path', async () => {
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/systems/heartLaw/heartLawLogic.ts'), 'utf8');

  assert.equal(source.includes('evaluateSpiritRootResonance'), true);
  assert.equal(source.includes('matchBonusByTier'), false);
  assert.equal(source.includes('mismatchPenalty'), false);
  assert.equal(source.includes('getResolvedAffinityCandidates'), false);
});

test('heartLawLogic source does not widen runtime spirit root application to qi or comprehension yet', async () => {
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/systems/heartLaw/heartLawLogic.ts'), 'utf8');

  assert.equal(source.includes('resonance.qiMult'), false);
  assert.equal(source.includes('resonance.comprehensionMult'), false);
});

test('gameStore source no longer uses legacy spirit root purity scaling or universal 5x multiplier path', async () => {
  const source = await fs.readFile(path.resolve(process.cwd(), 'src/stores/gameStore.ts'), 'utf8');

  assert.equal(source.includes('getSpiritRootRuntimeMultiplier'), true);
  assert.equal(source.includes('spiritRoot.purity / 100'), false);
  assert.equal(/\.getSpiritRootTotalMultiplier\s*\(/.test(source), false);
});

test('gameStore Spirit Root runtime delta remains bounded under the D.4 12% cap intent', () => {
  const evaluateSnapshot = (root: SpiritRoot) => {
    usePrestigeStore.setState({ spiritRoot: root });
    useGameStore.getState().calculateQiPerSecond();
    useGameStore.getState().calculatePlayerStats();
    const game = useGameStore.getState();
    return {
      qiPerSecond: Number(game.qiPerSecond),
      atk: Number(game.stats.atk),
      hp: Number(game.stats.maxHp),
      def: Number(game.stats.def),
      regen: Number(game.stats.regen),
    };
  };

  const weakWood = evaluateSnapshot({ grade: 1, element: 'wood', purity: 0 });
  const strongWood = evaluateSnapshot({ grade: 5, element: 'wood', purity: 100 });
  assert.equal(strongWood.qiPerSecond / weakWood.qiPerSecond <= 1.12, true);

  const weakFire = evaluateSnapshot({ grade: 1, element: 'fire', purity: 0 });
  const strongFire = evaluateSnapshot({ grade: 5, element: 'fire', purity: 100 });
  assert.equal(strongFire.atk / weakFire.atk <= 1.12, true);
  assert.equal(strongFire.hp / weakFire.hp <= 1.12, true);
  assert.equal(strongFire.def / weakFire.def <= 1.12, true);
  assert.equal(strongFire.regen / weakFire.regen <= 1.12, true);
});
