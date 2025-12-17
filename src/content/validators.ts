import type {
  AlchemyRecipesConfig,
  ApothecaryShopsConfig,
  BountiesConfig,
  CitiesPayload,
  CityDef,
  EconomyConfig,
  EnemiesConfig,
  ExpeditionsConfig,
  ForgeBlueprintsConfig,
  HeartLawsConfig,
  ItemsConfig,
  OutskirtsConfig,
  PavilionDef,
  PavilionsConfig,
  PrestigeStoreConfig,
  RunesConfig,
  RuinsConfig,
  TalismanRecipesConfig,
  TechniqueDef,
  TechniquesConfig,
  TrialsConfig,
} from './types';
import type { LoadedContentRaw } from './loaders';

export interface ValidatedContent {
  raw: LoadedContentRaw;
  economy: EconomyConfig;
  cities: CityDef[];
  items: ItemsConfig['items'];
  techniques: TechniquesConfig['techniques'];
  pavilions: PavilionDef[];
  outskirts: OutskirtsConfig['outskirts'];
  enemies: EnemiesConfig['enemies'];
  trials: TrialsConfig['trials'];
  ruins: RuinsConfig['ruins'];
  alchemy_recipes: AlchemyRecipesConfig['recipes'];
  forge_blueprints: ForgeBlueprintsConfig['blueprints'];
  runes: RunesConfig['runes'];
  talisman_recipes: TalismanRecipesConfig['talismans'];
  apothecary_shops: ApothecaryShopsConfig['shops'];
  expeditions: ExpeditionsConfig;
  bounties: BountiesConfig['templates'];
  heart_laws: HeartLawsConfig['heartLaws'];
  prestige_store: PrestigeStoreConfig['upgrades'];
}

type ErrorCollector = {
  errors: string[];
  addErr: (msg: string) => void;
};

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

const VALID_CURRENCY_KEYS = new Set([
  'gold',
  'spiritStones',
  'merit',
  // allow item-style currency ids too (future-proof)
  'cur_gold',
  'cur_spirit_stone',
  'cur_merit',
  'cur_ap',
]);

function isCurrencyKey(k: string): boolean {
  return VALID_CURRENCY_KEYS.has(k);
}

function assertCostOrItemRefsExist(
  refs: unknown,
  label: string,
  itemsById: Record<string, { id: string }>,
  addErr: ErrorCollector['addErr'],
) {
  if (refs == null) return;
  assertObject(refs, label);
  for (const [k, v] of Object.entries(refs as Record<string, unknown>)) {
    assert(typeof v === 'number' && Number.isFinite(v), `${label}.${k} must be a finite number`);

    if (isCurrencyKey(k)) continue;

    if (!itemsById[k]) {
      addErr(`${label} references missing item '${k}'`);
    }
  }
}

export function extractCities(root: CitiesPayload): CityDef[] {
  if (Array.isArray(root)) {
    assertArrayItemsHaveId(root as any[], 'cities.json cities');
    assertUniqueIds(root as any, 'cities.json cities');
    return root as CityDef[];
  }

  assert(isObject(root), 'cities.json must be an array of cities OR an object with { cities: [...] }');
  assertHasKey(root, 'cities', 'cities.json');
  const arr = (root as any).cities;
  assertArray(arr, 'cities.json.cities');
  assertArrayItemsHaveId(arr as any[], 'cities.json cities');
  assertUniqueIds(arr as any, 'cities.json cities');

  return arr as CityDef[];
}

function validateCities(config: CitiesPayload): CityDef[] {
  const cities = extractCities(config);
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
  return cities;
}

function validateTechniques(config: TechniquesConfig): TechniqueDef[] {
  assertObject(config, 'techniques.json root');
  assertHasKey(config, 'techniques', 'techniques.json');
  assertArray((config as any).techniques, 'techniques.json.techniques');
  const techniques = (config as any).techniques as TechniqueDef[];

  techniques.forEach((tech, idx) => {
    assertObject(tech, `techniques[${idx}]`);
    assert(typeof tech.id === 'string', `techniques[${idx}].id must be a string`);
    assert(typeof tech.path === 'string', `techniques[${idx}].path must be a string`);
    assert(typeof tech.type === 'string', `techniques[${idx}].type must be a string`);
  });

  assertUniqueIds(techniques, 'techniques.json.techniques');
  return techniques;
}

function validateItems(config: ItemsConfig) {
  assertObject(config, 'items.json root');
  assertHasKey(config, 'items', 'items.json');
  assertArray((config as any).items, 'items.json.items');
  const items = (config as any).items as ItemsConfig['items'];

  items.forEach((item, idx) => {
    assertObject(item, `items[${idx}]`);
    assert(typeof item.id === 'string', `items[${idx}].id must be a string`);
    assert(typeof item.name === 'string', `items[${idx}].name must be a string`);
    assert(typeof item.category === 'string', `items[${idx}].category must be a string`);
  });

  assertUniqueIds(items, 'items.json.items');
  return items;
}

function validatePavilions(config: PavilionsConfig): PavilionDef[] {
  assertObject(config, 'pavilions.json root');
  assertHasKey(config, 'pavilions', 'pavilions.json');
  assertArray((config as any).pavilions, 'pavilions.json.pavilions');
  const pavilions = (config as any).pavilions as PavilionDef[];

  pavilions.forEach((pavilion, idx) => {
    assertObject(pavilion, `pavilions[${idx}]`);
    assert(typeof pavilion.id === 'string', `pavilions[${idx}].id must be a string`);
    assert(typeof pavilion.cityId === 'string', `pavilions[${idx}].cityId must be a string`);
    assertObject(pavilion.poolByPath, `pavilions[${idx}].poolByPath`);
  });

  assertUniqueIds(pavilions, 'pavilions.json.pavilions');
  return pavilions;
}

function validateOutskirts(config: OutskirtsConfig) {
  assertObject(config, 'outskirts.json root');
  assertHasKey(config, 'outskirts', 'outskirts.json');
  assertArray((config as any).outskirts, 'outskirts.json.outskirts');
  const outskirts = (config as any).outskirts as OutskirtsConfig['outskirts'];

  outskirts.forEach((outskirt, idx) => {
    assertObject(outskirt, `outskirts[${idx}]`);
    assert(typeof outskirt.id === 'string', `outskirts[${idx}].id must be a string`);
    assert(typeof outskirt.cityId === 'string', `outskirts[${idx}].cityId must be a string`);
    assert(typeof outskirt.killsToBoss === 'number', `outskirts[${idx}].killsToBoss must be a number`);
    assert(typeof outskirt.bossId === 'string', `outskirts[${idx}].bossId must be a string`);
    assertArray(outskirt.mobPool, `outskirts[${idx}].mobPool`);
  });

  assertUniqueIds(outskirts, 'outskirts.json.outskirts');
  return outskirts;
}

function validateEnemies(config: EnemiesConfig) {
  assertObject(config, 'enemies.json root');
  assertHasKey(config, 'enemies', 'enemies.json');
  assertArray((config as any).enemies, 'enemies.json.enemies');
  const enemies = (config as any).enemies as EnemiesConfig['enemies'];

  enemies.forEach((enemy, idx) => {
    assertObject(enemy, `enemies[${idx}]`);
    assert(typeof enemy.id === 'string', `enemies[${idx}].id must be a string`);
    assert(typeof enemy.name === 'string', `enemies[${idx}].name must be a string`);
  });

  assertUniqueIds(enemies, 'enemies.json.enemies');
  return enemies;
}

function validateTrials(config: TrialsConfig) {
  assertObject(config, 'trials.json root');
  assertHasKey(config, 'trials', 'trials.json');
  assertArray((config as any).trials, 'trials.json.trials');
  const trials = (config as any).trials as TrialsConfig['trials'];

  trials.forEach((trial, idx) => {
    assertObject(trial, `trials[${idx}]`);
    assert(typeof trial.id === 'string', `trials[${idx}].id must be a string`);
    assert(typeof trial.cityId === 'string', `trials[${idx}].cityId must be a string`);
    assert(typeof trial.bossId === 'string', `trials[${idx}].bossId must be a string`);
    assert(typeof trial.gateItemId === 'string', `trials[${idx}].gateItemId must be a string`);

    if (trial.cityIndex !== undefined) {
      assert(typeof trial.cityIndex === 'number', `trials[${idx}].cityIndex must be a number if provided`);
    }

    if (trial.eligibilityRule && typeof trial.eligibilityRule !== 'string') {
      try {
        // Coerce to string for UI display only
        (trial as any).eligibilityRule = JSON.stringify(trial.eligibilityRule);
      } catch (error) {
        console.warn('[ContentValidation] Unable to stringify eligibilityRule', error);
      }
    }

    if (trial.failSafe) {
      assertObject(trial.failSafe, `trials[${idx}].failSafe`);
      if (trial.failSafe.cost) {
        assertObject(trial.failSafe.cost, `trials[${idx}].failSafe.cost`);
        for (const [k, v] of Object.entries(trial.failSafe.cost)) {
          if (v == null) continue;
          assert(typeof v === 'string' || typeof v === 'number', `trials[${idx}].failSafe.cost.${k} must be string or number`);
          if (!isCurrencyKey(k)) {
            console.warn(`[ContentValidation] trials[${idx}].failSafe.cost.${k} is not a recognized currency key`);
          }
          if (typeof v === 'number') {
            (trial.failSafe.cost as any)[k] = v.toString();
          }
        }
      }
      if (trial.failSafe.thresholdAttempts !== undefined) {
        assert(
          typeof trial.failSafe.thresholdAttempts === 'number',
          `trials[${idx}].failSafe.thresholdAttempts must be a number if provided`,
        );
      }
    }

    const normalizedThreshold = trial.failSafe?.thresholdAttempts ?? 3;
    (trial as any).failSafe = {
      thresholdAttempts: normalizedThreshold,
      ...trial.failSafe,
    };
  });

  assertUniqueIds(trials, 'trials.json.trials');
  return trials;
}

function validateRuins(config: RuinsConfig) {
  assertObject(config, 'ruins.json root');
  assertHasKey(config, 'ruins', 'ruins.json');
  assertArray((config as any).ruins, 'ruins.json.ruins');
  const ruins = (config as any).ruins as RuinsConfig['ruins'];

  ruins.forEach((ruin, idx) => {
    assertObject(ruin, `ruins[${idx}]`);
    assert(typeof ruin.id === 'string', `ruins[${idx}].id must be a string`);
    assert(typeof ruin.cityId === 'string', `ruins[${idx}].cityId must be a string`);
  });

  assertUniqueIds(ruins, 'ruins.json.ruins');
  return ruins;
}

function validateRunes(config: RunesConfig) {
  assertObject(config, 'runes.json root');
  assertHasKey(config, 'runes', 'runes.json');
  assertArray((config as any).runes, 'runes.json.runes');
  const runes = (config as any).runes as RunesConfig['runes'];

  runes.forEach((rune, idx) => {
    assertObject(rune, `runes[${idx}]`);
    assert(typeof rune.id === 'string', `runes[${idx}].id must be a string`);
  });

  assertUniqueIds(runes, 'runes.json.runes');
  return runes;
}

function validateHeartLaws(config: HeartLawsConfig) {
  assertObject(config, 'heart_laws.json root');
  assertHasKey(config, 'heartLaws', 'heart_laws.json');
  assertArray((config as any).heartLaws, 'heart_laws.json.heartLaws');
  const laws = (config as any).heartLaws as HeartLawsConfig['heartLaws'];
  assertUniqueIds(laws, 'heart_laws.json.heartLaws');
  return laws;
}

function validatePrestige(config: PrestigeStoreConfig) {
  assertObject(config, 'prestige_store.json root');
  assertHasKey(config, 'upgrades', 'prestige_store.json');
  assertArray((config as any).upgrades, 'prestige_store.json.upgrades');
  const upgrades = (config as any).upgrades as PrestigeStoreConfig['upgrades'];
  assertUniqueIds(upgrades, 'prestige_store.json.upgrades');
  return upgrades;
}

function validateAlchemy(config: LoadedContentRaw['alchemy_recipes']) {
  assertObject(config, 'alchemy_recipes.json root');
  assertHasKey(config, 'recipes', 'alchemy_recipes.json');
  assertArray(config.recipes, 'alchemy_recipes.json.recipes');
  return config.recipes;
}

function validateForge(config: LoadedContentRaw['forge_blueprints']) {
  assertObject(config, 'forge_blueprints.json root');
  assertHasKey(config, 'blueprints', 'forge_blueprints.json');
  assertArray(config.blueprints, 'forge_blueprints.json.blueprints');
  return config.blueprints;
}

function validateTalismans(config: LoadedContentRaw['talisman_recipes']) {
  assertObject(config, 'talisman_recipes.json root');
  assertHasKey(config, 'talismans', 'talisman_recipes.json');
  assertArray(config.talismans, 'talisman_recipes.json.talismans');
  return config.talismans;
}

function validateApothecary(config: LoadedContentRaw['apothecary_shops']) {
  assertObject(config, 'apothecary_shops.json root');
  assertHasKey(config, 'shops', 'apothecary_shops.json');
  assertArray(config.shops, 'apothecary_shops.json.shops');
  return config.shops;
}

function validateExpeditions(config: LoadedContentRaw['expeditions']) {
  assertObject(config, 'expeditions.json root');
  assertHasKey(config, 'durations', 'expeditions.json');
  assertHasKey(config, 'types', 'expeditions.json');
  assertHasKey(config, 'cityYields', 'expeditions.json');
  assertArray(config.durations, 'expeditions.json.durations');
  assertArray(config.types, 'expeditions.json.types');
  assertArray(config.cityYields, 'expeditions.json.cityYields');
  return config;
}

function validateBounties(config: LoadedContentRaw['bounties']) {
  assertObject(config, 'bounties.json root');
  assertHasKey(config, 'templates', 'bounties.json');
  assertArray(config.templates, 'bounties.json.templates');
  return config.templates;
}

function buildIdMap<T extends { id: string }>(items: T[]): Record<string, T> {
  return items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function validateRecipeItems(
  record: Record<string, number> | undefined,
  items: Record<string, unknown>,
  label: string,
  addErr: ErrorCollector['addErr'],
) {
  if (!record) return;
  Object.keys(record).forEach((itemId) => {
    if (!(itemId in items)) {
      addErr(`${label} references missing item '${itemId}'`);
    }
  });
}

export function validateLoadedContent(raw: LoadedContentRaw): ValidatedContent {
  const errors: string[] = [];
  const addErr = (msg: string) => errors.push(`[ContentValidation] ${msg}`);

  // Basic shape validation
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
  const alchemyRecipes = validateAlchemy(raw.alchemy_recipes);
  const forgeBlueprints = validateForge(raw.forge_blueprints);
  const talismanRecipes = validateTalismans(raw.talisman_recipes);
  const apothecaryShops = validateApothecary(raw.apothecary_shops);
  validateExpeditions(raw.expeditions);
  const bountyTemplates = validateBounties(raw.bounties);

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
  const apothecaryMap = buildIdMap(apothecaryShops);
  const lawMap = buildIdMap(heartLaws);
  const prestigeMap = buildIdMap(prestige);
  const bountyTemplateMap = buildIdMap(bountyTemplates);

  // Cross references on cities
  cities.forEach((city) => {
    const { refs } = city;
    if (!(refs.outskirtsId in outskirtsMap)) {
      addErr(`City ${city.id} refs.outskirtsId missing in outskirts`);
    }
    if (!(refs.gateTrialId in trialMap)) {
      addErr(`City ${city.id} refs.gateTrialId missing in trials`);
    }
    if (!(refs.ruinId in ruinMap)) {
      addErr(`City ${city.id} refs.ruinId missing in ruins`);
    }
    if (!(refs.pavilionId in pavilionMap)) {
      addErr(`City ${city.id} refs.pavilionId missing in pavilions`);
    }
    if (!(refs.apothecaryId in apothecaryMap)) {
      addErr(`City ${city.id} refs.apothecaryId missing in apothecary shops`);
    }
  });

  apothecaryShops.forEach((shop, idx) => {
    if (!(shop.cityId in cityMap)) {
      addErr(`apothecary_shops.shops[${idx}] cityId does not exist`);
    }
    shop.stock.forEach((stockItem, stockIdx) => {
      if (!(stockItem.itemId in itemMap)) {
        addErr(`apothecary_shops.shops[${idx}].stock[${stockIdx}] missing item`);
      }
      assertCostOrItemRefsExist(
        stockItem.buy,
        `apothecary_shops.shops[${idx}].stock[${stockIdx}].buy`,
        itemMap,
        addErr,
      );
    });
  });

  pavilions.forEach((pavilion, idx) => {
    if (!(pavilion.cityId in cityMap)) {
      addErr(`pavilions[${idx}].cityId does not exist in cities`);
    }
    (['heaven', 'earth', 'martial'] as const).forEach((path) => {
      assertArray(pavilion.poolByPath[path], `pavilions[${idx}].poolByPath.${path}`);
      pavilion.poolByPath[path].forEach((techId, poolIdx) => {
        if (!(techId in techniqueMap)) {
          addErr(`pavilions[${idx}].poolByPath.${path}[${poolIdx}] missing technique`);
        }
      });
    });
  });

  outskirts.forEach((outskirt, idx) => {
    if (!(outskirt.cityId in cityMap)) {
      addErr(`outskirts[${idx}].cityId missing in cities`);
    }
    if (!(outskirt.bossId in enemyMap)) {
      addErr(`outskirts[${idx}].bossId missing in enemies`);
    }
    outskirt.mobPool.forEach((mob, mobIdx) => {
      assert(typeof mob.enemyId === 'string', `outskirts[${idx}].mobPool[${mobIdx}].enemyId must be string`);
      if (!(mob.enemyId in enemyMap)) {
        addErr(`outskirts[${idx}].mobPool[${mobIdx}].enemyId missing in enemies`);
      }
    });
  });

  trials.forEach((trial, idx) => {
    if (!(trial.cityId in cityMap)) {
      addErr(`trials[${idx}].cityId missing in cities`);
    }
    if (!(trial.bossId in enemyMap)) {
      addErr(`trials[${idx}].bossId missing in enemies`);
    }
    if (!(trial.gateItemId in itemMap)) {
      addErr(`trials[${idx}].gateItemId missing in items`);
    }
  });

  ruins.forEach((ruin, idx) => {
    if (!(ruin.cityId in cityMap)) {
      addErr(`ruins[${idx}].cityId missing in cities`);
    }
  });

  alchemyRecipes.forEach((recipe, idx) => {
    if (!(recipe.unlocksAtCityId in cityMap)) {
      addErr(`alchemy_recipes.recipes[${idx}].unlocksAtCityId missing in cities`);
    }
    validateRecipeItems(recipe.inputs, itemMap, `alchemy_recipes.recipes[${idx}].inputs`, addErr);
    validateRecipeItems(recipe.outputs, itemMap, `alchemy_recipes.recipes[${idx}].outputs`, addErr);
  });

  forgeBlueprints.forEach((blueprint, idx) => {
    if (!(blueprint.unlocksAtCityId in cityMap)) {
      addErr(`forge_blueprints.blueprints[${idx}].unlocksAtCityId missing in cities`);
    }
    validateRecipeItems(blueprint.inputs, itemMap, `forge_blueprints.blueprints[${idx}].inputs`, addErr);
    validateRecipeItems(
      blueprint.outputs,
      { ...itemMap, ...runeMap },
      `forge_blueprints.blueprints[${idx}].outputs`,
      addErr,
    );
    assertCostOrItemRefsExist(
      blueprint.cost,
      `forge_blueprints.blueprints[${idx}].cost`,
      itemMap,
      addErr,
    );
  });

  talismanRecipes.forEach((talisman, idx) => {
    if (!(talisman.unlocksAtCityId in cityMap)) {
      addErr(`talisman_recipes.talismans[${idx}].unlocksAtCityId missing in cities`);
    }
    validateRecipeItems(talisman.inputs, itemMap, `talisman_recipes.talismans[${idx}].inputs`, addErr);
    validateRecipeItems(talisman.outputs, itemMap, `talisman_recipes.talismans[${idx}].outputs`, addErr);
    assertCostOrItemRefsExist(
      talisman.cost,
      `talisman_recipes.talismans[${idx}].cost`,
      itemMap,
      addErr,
    );
  });

  bountyTemplates.forEach((template, idx) => {
    assert(typeof template.id === 'string', `bounties.templates[${idx}].id must be a string`);
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
  Object.keys(bountyTemplateMap);

  if (errors.length > 0) {
    const body = errors
      .slice(0, 100)
      .map((e) => `- ${e}`)
      .join('\n');
    throw new Error(`[ContentValidation] ${errors.length} issue(s) found:\n${body}`);
  }

  return {
    raw,
    economy: raw.economy,
    cities,
    items,
    techniques,
    pavilions,
    outskirts,
    enemies,
    trials,
    ruins,
    alchemy_recipes: alchemyRecipes,
    forge_blueprints: forgeBlueprints,
    runes,
    talisman_recipes: talismanRecipes,
    apothecary_shops: apothecaryShops,
    expeditions: raw.expeditions,
    bounties: bountyTemplates,
    heart_laws: heartLaws,
    prestige_store: prestige,
  };
}
