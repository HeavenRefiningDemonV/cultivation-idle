import type {
  CitiesConfig,
  CityDef,
  EnemiesConfig,
  HeartLawsConfig,
  ItemsConfig,
  OutskirtsConfig,
  PavilionDef,
  PavilionsConfig,
  PrestigeStoreConfig,
  RunesConfig,
  RuinsConfig,
  TechniqueDef,
  TechniquesConfig,
  TrialsConfig,
} from './types';
import type { LoadedContentRaw } from './loaders';

export interface ValidatedContent extends LoadedContentRaw {}

export function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[ContentValidation] ${message}`);
  }
}

export function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export function assertObject(x: unknown, label: string): asserts x is Record<string, unknown> {
  assert(isObject(x), `${label} must be an object`);
}

export function assertArray(x: unknown, label: string): asserts x is unknown[] {
  assert(Array.isArray(x), `${label} must be an array`);
}

export function assertHasKey(obj: any, key: string, label: string) {
  assert(obj && key in obj, `${label} missing required key '${key}'`);
}

export function assertArrayItemsHaveId(arr: any[], label: string) {
  arr.forEach((item, idx) => {
    assertObject(item, `${label}[${idx}]`);
    assert('id' in item && typeof item.id === 'string', `${label}[${idx}] missing string id`);
  });
}

export function assertUniqueIds(arr: { id: string }[], label: string) {
  const seen = new Map<string, number>();
  const dups: string[] = [];

  arr.forEach((item, idx) => {
    if (seen.has(item.id)) {
      dups.push(item.id);
    } else {
      seen.set(item.id, idx);
    }
  });

  if (dups.length > 0) {
    const preview = dups.slice(0, 5).join(', ');
    assert(false, `${label} contains duplicate ids: ${preview}`);
  }
}

function validateCities(config: CitiesConfig): CityDef[] {
  assertObject(config, 'cities');
  assertArray((config as any).cities, 'cities.cities');

  const cities = (config as any).cities as CityDef[];
  cities.forEach((city, idx) => {
    assertObject(city, `cities[${idx}]`);
    assert(typeof city.id === 'string', `cities[${idx}].id must be a string`);
    assert(typeof city.index === 'number', `cities[${idx}].index must be a number`);
    assert(typeof city.name === 'string', `cities[${idx}].name must be a string`);
    assert(
      typeof city.unlockMajorRealm === 'string',
      `cities[${idx}].unlockMajorRealm must be a string`,
    );
    assert(Array.isArray(city.modules), `cities[${idx}].modules must be an array`);
    assertObject(city.refs, `cities[${idx}].refs`);
    ['outskirtsId', 'gateTrialId', 'ruinId', 'pavilionId', 'apothecaryId'].forEach((key) =>
      assertHasKey(city.refs, key, `cities[${idx}].refs`),
    );
  });

  assertUniqueIds(cities, 'cities');
  return cities;
}

function validateTechniques(config: TechniquesConfig): TechniqueDef[] {
  assertObject(config, 'techniques');
  assertArray((config as any).techniques, 'techniques.techniques');
  const techniques = (config as any).techniques as TechniqueDef[];

  techniques.forEach((tech, idx) => {
    assertObject(tech, `techniques[${idx}]`);
    assert(typeof tech.id === 'string', `techniques[${idx}].id must be a string`);
    assert(typeof tech.path === 'string', `techniques[${idx}].path must be a string`);
    assert(typeof tech.type === 'string', `techniques[${idx}].type must be a string`);
  });

  assertUniqueIds(techniques, 'techniques.techniques');
  return techniques;
}

function validateItems(config: ItemsConfig) {
  assertObject(config, 'items');
  assertArray((config as any).items, 'items.items');
  const items = (config as any).items as ItemsConfig['items'];

  items.forEach((item, idx) => {
    assertObject(item, `items[${idx}]`);
    assert(typeof item.id === 'string', `items[${idx}].id must be a string`);
    assert(typeof item.name === 'string', `items[${idx}].name must be a string`);
    assert(typeof item.category === 'string', `items[${idx}].category must be a string`);
  });

  assertUniqueIds(items, 'items.items');
  return items;
}

function validatePavilions(config: PavilionsConfig): PavilionDef[] {
  assertObject(config, 'pavilions');
  assertArray((config as any).pavilions, 'pavilions.pavilions');
  const pavilions = (config as any).pavilions as PavilionDef[];

  pavilions.forEach((pavilion, idx) => {
    assertObject(pavilion, `pavilions[${idx}]`);
    assert(typeof pavilion.id === 'string', `pavilions[${idx}].id must be a string`);
    assert(typeof pavilion.cityId === 'string', `pavilions[${idx}].cityId must be a string`);
    assertObject(pavilion.poolByPath, `pavilions[${idx}].poolByPath`);
  });

  assertUniqueIds(pavilions, 'pavilions.pavilions');
  return pavilions;
}

function validateOutskirts(config: OutskirtsConfig) {
  assertObject(config, 'outskirts');
  assertArray((config as any).outskirts, 'outskirts.outskirts');
  const outskirts = (config as any).outskirts as OutskirtsConfig['outskirts'];

  outskirts.forEach((outskirt, idx) => {
    assertObject(outskirt, `outskirts[${idx}]`);
    assert(typeof outskirt.id === 'string', `outskirts[${idx}].id must be a string`);
    assert(typeof outskirt.cityId === 'string', `outskirts[${idx}].cityId must be a string`);
    assert(typeof outskirt.killsToBoss === 'number', `outskirts[${idx}].killsToBoss must be a number`);
    assert(typeof outskirt.bossId === 'string', `outskirts[${idx}].bossId must be a string`);
    assertArray(outskirt.mobPool, `outskirts[${idx}].mobPool`);
  });

  assertUniqueIds(outskirts, 'outskirts.outskirts');
  return outskirts;
}

function validateEnemies(config: EnemiesConfig) {
  assertObject(config, 'enemies');
  assertArray((config as any).enemies, 'enemies.enemies');
  const enemies = (config as any).enemies as EnemiesConfig['enemies'];

  enemies.forEach((enemy, idx) => {
    assertObject(enemy, `enemies[${idx}]`);
    assert(typeof enemy.id === 'string', `enemies[${idx}].id must be a string`);
    assert(typeof enemy.name === 'string', `enemies[${idx}].name must be a string`);
  });

  assertUniqueIds(enemies, 'enemies.enemies');
  return enemies;
}

function validateTrials(config: TrialsConfig) {
  assertObject(config, 'trials');
  assertArray((config as any).trials, 'trials.trials');
  const trials = (config as any).trials as TrialsConfig['trials'];

  trials.forEach((trial, idx) => {
    assertObject(trial, `trials[${idx}]`);
    assert(typeof trial.id === 'string', `trials[${idx}].id must be a string`);
    assert(typeof trial.cityId === 'string', `trials[${idx}].cityId must be a string`);
    assert(typeof trial.bossId === 'string', `trials[${idx}].bossId must be a string`);
    assert(typeof trial.gateItemId === 'string', `trials[${idx}].gateItemId must be a string`);
  });

  assertUniqueIds(trials, 'trials.trials');
  return trials;
}

function validateRuins(config: RuinsConfig) {
  assertObject(config, 'ruins');
  assertArray((config as any).ruins, 'ruins.ruins');
  const ruins = (config as any).ruins as RuinsConfig['ruins'];

  ruins.forEach((ruin, idx) => {
    assertObject(ruin, `ruins[${idx}]`);
    assert(typeof ruin.id === 'string', `ruins[${idx}].id must be a string`);
    assert(typeof ruin.cityId === 'string', `ruins[${idx}].cityId must be a string`);
  });

  assertUniqueIds(ruins, 'ruins.ruins');
  return ruins;
}

function validateRunes(config: RunesConfig) {
  assertObject(config, 'runes');
  assertArray((config as any).runes, 'runes.runes');
  const runes = (config as any).runes as RunesConfig['runes'];

  runes.forEach((rune, idx) => {
    assertObject(rune, `runes[${idx}]`);
    assert(typeof rune.id === 'string', `runes[${idx}].id must be a string`);
  });

  assertUniqueIds(runes, 'runes.runes');
  return runes;
}

function validateHeartLaws(config: HeartLawsConfig) {
  assertObject(config, 'heart_laws');
  assertArray((config as any).heartLaws, 'heart_laws.heartLaws');
  const laws = (config as any).heartLaws as HeartLawsConfig['heartLaws'];
  assertUniqueIds(laws, 'heart_laws.heartLaws');
  return laws;
}

function validatePrestige(config: PrestigeStoreConfig) {
  assertObject(config, 'prestige_store');
  assertArray((config as any).upgrades, 'prestige_store.upgrades');
  const upgrades = (config as any).upgrades as PrestigeStoreConfig['upgrades'];
  assertUniqueIds(upgrades, 'prestige_store.upgrades');
  return upgrades;
}

function validateOtherRequiredArrays(raw: LoadedContentRaw) {
  const requiredArrays: Array<[unknown, string]> = [
    [raw.alchemy_recipes?.recipes, 'alchemy_recipes.recipes'],
    [raw.forge_blueprints?.blueprints, 'forge_blueprints.blueprints'],
    [raw.talisman_recipes?.talismans, 'talisman_recipes.talismans'],
    [raw.apothecary_shops?.shops, 'apothecary_shops.shops'],
    [raw.expeditions?.durations, 'expeditions.durations'],
    [raw.expeditions?.types, 'expeditions.types'],
    [raw.expeditions?.cityYields, 'expeditions.cityYields'],
    [raw.bounties?.templates, 'bounties.templates'],
  ];

  requiredArrays.forEach(([value, label]) => assertArray(value, label));
}

function buildIdMap<T extends { id: string }>(items: T[]): Record<string, T> {
  return items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function validateRecipeItems(record: Record<string, number> | undefined, items: Record<string, unknown>, label: string) {
  if (!record) return;
  Object.keys(record).forEach((itemId) => {
    assert(itemId in items, `${label} references missing item '${itemId}'`);
  });
}

export function validateLoadedContent(raw: LoadedContentRaw): ValidatedContent {
  // Basic shape validation
  validateOtherRequiredArrays(raw);

  const cities = validateCities(raw.cities);
  const techniques = validateTechniques(raw.techniques);
  const items = validateItems(raw.items);
  const pavilions = validatePavilions(raw.pavilions);
  const outskirts = validateOutskirts(raw.outskirts);
  const enemies = validateEnemies(raw.enemies);
  const trials = validateTrials(raw.trials);
  const ruins = validateRuins(raw.ruins);
  const runes = validateRunes(raw.runes);
  const heartLaws = validateHeartLaws(raw.heart_laws);
  const prestige = validatePrestige(raw.prestige_store);

  // Build maps for cross references
  const cityMap = buildIdMap(cities);
  const itemMap = buildIdMap(items);
  const pavilionMap = buildIdMap(pavilions);
  const outskirtsMap = buildIdMap(outskirts);
  const enemyMap = buildIdMap(enemies);
  const trialMap = buildIdMap(trials);
  const ruinMap = buildIdMap(ruins);
  const runeMap = buildIdMap(runes);
  const techniqueMap = buildIdMap(techniques);
  const apothecaryMap = buildIdMap(raw.apothecary_shops.shops);
  const lawMap = buildIdMap(heartLaws);
  const prestigeMap = buildIdMap(prestige);

  // Cross references on cities
  cities.forEach((city) => {
    const { refs } = city;
    assert(refs.outskirtsId in outskirtsMap, `City ${city.id} refs.outskirtsId missing in outskirts`);
    assert(refs.gateTrialId in trialMap, `City ${city.id} refs.gateTrialId missing in trials`);
    assert(refs.ruinId in ruinMap, `City ${city.id} refs.ruinId missing in ruins`);
    assert(refs.pavilionId in pavilionMap, `City ${city.id} refs.pavilionId missing in pavilions`);
    assert(refs.apothecaryId in apothecaryMap, `City ${city.id} refs.apothecaryId missing in apothecary shops`);
  });

  raw.apothecary_shops.shops.forEach((shop, idx) => {
    assert(shop.cityId in cityMap, `apothecary_shops.shops[${idx}] cityId does not exist`);
    shop.stock.forEach((stockItem, stockIdx) => {
      assert(stockItem.itemId in itemMap, `apothecary_shops.shops[${idx}].stock[${stockIdx}] missing item`);
    });
  });

  pavilions.forEach((pavilion, idx) => {
    assert(pavilion.cityId in cityMap, `pavilions[${idx}].cityId does not exist in cities`);
    (['heaven', 'earth', 'martial'] as const).forEach((path) => {
      assertArray(pavilion.poolByPath[path], `pavilions[${idx}].poolByPath.${path}`);
      pavilion.poolByPath[path].forEach((techId, poolIdx) => {
        assert(techId in techniqueMap, `pavilions[${idx}].poolByPath.${path}[${poolIdx}] missing technique`);
      });
    });
  });

  outskirts.forEach((outskirt, idx) => {
    assert(outskirt.cityId in cityMap, `outskirts[${idx}].cityId missing in cities`);
    assert(outskirt.bossId in enemyMap, `outskirts[${idx}].bossId missing in enemies`);
    outskirt.mobPool.forEach((mob, mobIdx) => {
      assert(typeof mob.enemyId === 'string', `outskirts[${idx}].mobPool[${mobIdx}].enemyId must be string`);
      assert(mob.enemyId in enemyMap, `outskirts[${idx}].mobPool[${mobIdx}].enemyId missing in enemies`);
    });
  });

  trials.forEach((trial, idx) => {
    assert(trial.cityId in cityMap, `trials[${idx}].cityId missing in cities`);
    assert(trial.bossId in enemyMap, `trials[${idx}].bossId missing in enemies`);
    assert(trial.gateItemId in itemMap, `trials[${idx}].gateItemId missing in items`);
  });

  ruins.forEach((ruin, idx) => {
    assert(ruin.cityId in cityMap, `ruins[${idx}].cityId missing in cities`);
  });

  raw.alchemy_recipes.recipes.forEach((recipe, idx) => {
    assert(recipe.unlocksAtCityId in cityMap, `alchemy_recipes.recipes[${idx}].unlocksAtCityId missing in cities`);
    validateRecipeItems(recipe.inputs, itemMap, `alchemy_recipes.recipes[${idx}].inputs`);
    validateRecipeItems(recipe.outputs, itemMap, `alchemy_recipes.recipes[${idx}].outputs`);
  });

  raw.forge_blueprints.blueprints.forEach((blueprint, idx) => {
    assert(blueprint.unlocksAtCityId in cityMap, `forge_blueprints.blueprints[${idx}].unlocksAtCityId missing in cities`);
    validateRecipeItems(blueprint.inputs, itemMap, `forge_blueprints.blueprints[${idx}].inputs`);
    validateRecipeItems(blueprint.outputs, { ...itemMap, ...runeMap }, `forge_blueprints.blueprints[${idx}].outputs`);
    validateRecipeItems(blueprint.cost, itemMap, `forge_blueprints.blueprints[${idx}].cost`);
  });

  raw.talisman_recipes.talismans.forEach((talisman, idx) => {
    assert(talisman.unlocksAtCityId in cityMap, `talisman_recipes.talismans[${idx}].unlocksAtCityId missing in cities`);
    validateRecipeItems(talisman.inputs, itemMap, `talisman_recipes.talismans[${idx}].inputs`);
    validateRecipeItems(talisman.outputs, itemMap, `talisman_recipes.talismans[${idx}].outputs`);
    validateRecipeItems(talisman.cost, itemMap, `talisman_recipes.talismans[${idx}].cost`);
  });

  // City pavilion sanity for first 5 cities
  cities
    .filter((city) => city.index <= 4)
    .forEach((city) => {
      const pavilion = pavilionMap[city.refs.pavilionId];
      assert(pavilion, `City ${city.id} missing pavilion ${city.refs.pavilionId}`);
      (['heaven', 'earth', 'martial'] as const).forEach((path) => {
        assert(path in pavilion.poolByPath, `Pavilion ${pavilion.id} missing path ${path}`);
        assert(
          Array.isArray(pavilion.poolByPath[path]) && pavilion.poolByPath[path].length > 0,
          `Pavilion ${pavilion.id} path ${path} pool is empty`,
        );
      });
    });

  const techniquesByPath: Record<string, number> = { heaven: 0, earth: 0, martial: 0 };
  techniques.forEach((tech) => {
    if (tech.path in techniquesByPath) {
      techniquesByPath[tech.path] += 1;
    }
  });

  console.warn(
    '[ContentValidation] Technique counts by path:',
    `Heaven=${techniquesByPath.heaven}, Earth=${techniquesByPath.earth}, Martial=${techniquesByPath.martial}`,
  );

  cities
    .filter((city) => city.index <= 4)
    .forEach((city) => {
      const pavilion = pavilionMap[city.refs.pavilionId];
      if (!pavilion) return;
      (['heaven', 'earth', 'martial'] as const).forEach((path) => {
        const size = pavilion.poolByPath?.[path]?.length ?? 0;
        console.warn(
          `[ContentValidation] Pavilion pool size city=${city.index} (${city.id}) path=${path}: ${size}`,
        );
      });
    });

  // Additional references for runes and heart laws to ensure maps used
  Object.keys(lawMap);
  Object.keys(prestigeMap);

  return raw;
}
