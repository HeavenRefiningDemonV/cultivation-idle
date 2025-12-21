import type {
  AlchemyRecipesConfig,
  ApothecaryShopsConfig,
  ApothecaryShopDef,
  BountiesConfig,
  CitiesPayload,
  CityDef,
  CurrencyKey,
  EconomyConfig,
  EnemiesConfig,
  ExpeditionsContent,
  ExpeditionCityYieldDef,
  ExpeditionDurationDef,
  ExpeditionTypeDef,
  ForgeBlueprintsConfig,
  HeartLawsConfig,
  ItemsConfig,
  OutskirtsConfig,
  PavilionDef,
  PavilionsConfig,
  PrestigeCostCurve,
  PrestigePrereq,
  PrestigeStoreConfig,
  PrestigeUpgradeDef,
  PrestigeUpgradeTier,
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
  apothecary_shops: ApothecaryShopDef[];
  expeditions: ExpeditionsContent;
  bounties: BountiesConfig;
  heart_laws: HeartLawsConfig['heartLaws'];
  prestige_store: PrestigeStoreConfig;
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

    (['heaven', 'earth', 'martial'] as const).forEach((path) => {
      const pool = pavilion.poolByPath?.[path] ?? [];
      assertArray(pool, `pavilions[${idx}].poolByPath.${path}`);
      pool.forEach((entry, poolIdx) => {
        const isString = typeof entry === 'string';
        const isObj = entry && typeof entry === 'object';
        const techId = isObj ? (entry as { techId?: unknown }).techId : undefined;
        assert(
          isString || (isObj && typeof techId === 'string'),
          `pavilions[${idx}].poolByPath.${path}[${poolIdx}] must be string or {techId}`,
        );
      });
    });
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

  const scrubGateItems = (items: any[], label: string) => {
    return items.filter((entry) => {
      if (typeof entry?.itemId !== 'string') return false;
      if (entry.itemId.startsWith('gate_')) {
        console.warn(`[ContentValidation] ${label} removed gate item ${entry.itemId}`);
        return false;
      }
      return true;
    });
  };

  ruins.forEach((ruin, idx) => {
    assertObject(ruin, `ruins[${idx}]`);
    assert(typeof ruin.id === 'string', `ruins[${idx}].id must be a string`);
    assert(typeof ruin.cityId === 'string', `ruins[${idx}].cityId must be a string`);
    assert(typeof ruin.roomCount === 'number', `ruins[${idx}].roomCount must be a number`);

    assertObject((ruin as any).roomPools, `ruins[${idx}].roomPools`);
    assertArray((ruin as any).roomPools.mobs, `ruins[${idx}].roomPools.mobs`);
    if ((ruin as any).roomPools.miniBoss) {
      assertArray((ruin as any).roomPools.miniBoss, `ruins[${idx}].roomPools.miniBoss`);
    }
    if ((ruin as any).roomPools.finalBoss) {
      assertArray((ruin as any).roomPools.finalBoss, `ruins[${idx}].roomPools.finalBoss`);
    }

    const validateDropTable = (table: any, label: string) => {
      assertObject(table, label);
      assert('rolls' in table && typeof table.rolls === 'number', `${label}.rolls must be a number`);
      assertArray(table.pool, `${label}.pool`);
      const poolList = Array.isArray(table.pool) ? table.pool : [];
      table.pool = scrubGateItems(poolList, `${label}.pool`);
      (table.pool as any[]).forEach((entry: any, poolIdx: number) => {
        assert(typeof entry.itemId === 'string', `${label}.pool[${poolIdx}].itemId must be a string`);
        assert(typeof entry.weight === 'number', `${label}.pool[${poolIdx}].weight must be a number`);
        assert(typeof entry.qtyMin === 'number', `${label}.pool[${poolIdx}].qtyMin must be a number`);
        assert(typeof entry.qtyMax === 'number', `${label}.pool[${poolIdx}].qtyMax must be a number`);
      });

      const guaranteedList = Array.isArray(table.guaranteed) ? table.guaranteed : [];
      table.guaranteed = scrubGateItems(guaranteedList, `${label}.guaranteed`);
      (table.guaranteed as any[]).forEach((entry: any, gIdx: number) => {
        assert(typeof entry.itemId === 'string', `${label}.guaranteed[${gIdx}].itemId must be a string`);
        assert(typeof entry.qty === 'number', `${label}.guaranteed[${gIdx}].qty must be a number`);
      });
    };

    assertObject((ruin as any).dropsPerRoom, `ruins[${idx}].dropsPerRoom`);
    validateDropTable((ruin as any).dropsPerRoom, `ruins[${idx}].dropsPerRoom`);

    assertObject((ruin as any).finalChestDrops, `ruins[${idx}].finalChestDrops`);
    validateDropTable((ruin as any).finalChestDrops, `ruins[${idx}].finalChestDrops`);
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

function normalizePrereqs(raw: unknown, validIds: Set<string>, label: string): PrestigePrereq[] {
  if (!raw) return [];
  const entries = Array.isArray(raw) ? raw : [];
  const prereqs: PrestigePrereq[] = [];

  entries.forEach((entry, idx) => {
    if (typeof entry === 'string') {
      if (!validIds.has(entry)) {
        throw new Error(`[ContentValidation] ${label}.prereq[${idx}] references unknown upgrade '${entry}'`);
      }
      prereqs.push({ upgradeId: entry, minLevel: 1 });
      return;
    }

    if (!entry || typeof entry !== 'object') {
      throw new Error(`[ContentValidation] ${label}.prereq[${idx}] must be a string or object`);
    }

    const record = entry as Record<string, unknown>;
    const upgradeId = record.upgradeId;
    const minLevel = record.minLevel;
    if (typeof upgradeId !== 'string' || !upgradeId) {
      throw new Error(`[ContentValidation] ${label}.prereq[${idx}].upgradeId must be a string`);
    }
    if (!validIds.has(upgradeId)) {
      throw new Error(`[ContentValidation] ${label}.prereq[${idx}] references unknown upgrade '${upgradeId}'`);
    }
    if (typeof minLevel !== 'number' || minLevel < 1) {
      throw new Error(`[ContentValidation] ${label}.prereq[${idx}].minLevel must be >= 1`);
    }
    prereqs.push({ upgradeId, minLevel });
  });

  return prereqs;
}

function normalizeCostCurve(raw: unknown, label: string): PrestigeCostCurve | undefined {
  if (!raw) return undefined;
  if (!isObject(raw)) {
    throw new Error(`[ContentValidation] ${label}.costCurve must be an object`);
  }
  const base = (raw as Record<string, unknown>).base;
  const mult = (raw as Record<string, unknown>).mult;
  const round = (raw as Record<string, unknown>).round;
  if (typeof base !== 'number' || base <= 0) {
    throw new Error(`[ContentValidation] ${label}.costCurve.base must be > 0`);
  }
  if (typeof mult !== 'number' || mult < 1) {
    throw new Error(`[ContentValidation] ${label}.costCurve.mult must be >= 1`);
  }
  if (round !== undefined && typeof round !== 'number') {
    throw new Error(`[ContentValidation] ${label}.costCurve.round must be a number`);
  }
  return { base, mult, round };
}

function normalizeTiers(raw: unknown, label: string): PrestigeUpgradeTier[] | undefined {
  if (!raw) return undefined;
  assertArray(raw, `${label}.tiers`);
  return (raw as PrestigeUpgradeTier[]).map((tier, idx) => {
    if (!tier || typeof tier !== 'object') {
      throw new Error(`[ContentValidation] ${label}.tiers[${idx}] must be an object`);
    }
    if (typeof tier.cost !== 'number') {
      throw new Error(`[ContentValidation] ${label}.tiers[${idx}].cost must be a number`);
    }
    return { cost: tier.cost, effects: tier.effects };
  });
}

function resolveMaxLevel(raw: Record<string, unknown>, label: string): number {
  const maxLevel =
    typeof raw.maxLevel === 'number'
      ? raw.maxLevel
      : typeof raw.levels === 'number'
        ? raw.levels
        : undefined;
  if (maxLevel === undefined) {
    throw new Error(`[ContentValidation] ${label} missing maxLevel/levels`);
  }
  if (maxLevel < 1) {
    throw new Error(`[ContentValidation] ${label}.maxLevel must be >= 1`);
  }
  return maxLevel;
}

function validatePrestige(config: PrestigeStoreConfig) {
  assertObject(config, 'prestige_store.json root');
  assertHasKey(config, 'upgrades', 'prestige_store.json');
  assertArray((config as any).upgrades, 'prestige_store.json.upgrades');
  const upgrades = (config as any).upgrades as Array<Record<string, unknown>>;
  assertUniqueIds(upgrades as Array<{ id: string }>, 'prestige_store.json.upgrades');

  const idSet = new Set<string>(upgrades.map((upgrade) => String(upgrade.id)));

  const normalized: PrestigeUpgradeDef[] = upgrades.map((upgrade, idx) => {
    assertObject(upgrade, `prestige_store.upgrades[${idx}]`);
    const label = `prestige_store.upgrades[${idx}]`;
    const id = upgrade.id;
    if (typeof id !== 'string' || !id) {
      throw new Error(`[ContentValidation] ${label}.id must be a string`);
    }
    if (typeof upgrade.name !== 'string') {
      throw new Error(`[ContentValidation] ${label}.name must be a string`);
    }
    if (typeof upgrade.type !== 'string') {
      throw new Error(`[ContentValidation] ${label}.type must be a string`);
    }

    const labelWithId = `${label} (id=${id})`;
    const maxLevel = resolveMaxLevel(upgrade, labelWithId);

    const costs = Array.isArray(upgrade.costs) ? (upgrade.costs as number[]) : undefined;
    if (costs && costs.length < maxLevel) {
      throw new Error(`[ContentValidation] ${label}.costs must have >= maxLevel entries`);
    }

    const tiers = normalizeTiers(upgrade.tiers, label);
    if (tiers && tiers.length < maxLevel) {
      throw new Error(`[ContentValidation] ${label}.tiers must have >= maxLevel entries`);
    }

    const costCurve = normalizeCostCurve(upgrade.costCurve, label);
    if (!costs && !tiers && !costCurve) {
      throw new Error(`[ContentValidation] ${label} must define costs, tiers, or costCurve`);
    }

    const prereq = normalizePrereqs(upgrade.prereq, idSet, label);

    const effect = upgrade.effect;
    if (effect !== undefined && !isObject(effect)) {
      throw new Error(`[ContentValidation] ${label}.effect must be an object if present`);
    }

    return {
      id,
      name: upgrade.name as string,
      description: upgrade.description as string | undefined,
      category: upgrade.category as string | undefined,
      type: upgrade.type as string,
      maxLevel,
      costs,
      tiers,
      costCurve,
      prereq,
      stat: upgrade.stat as string | undefined,
      effectPerLevel: upgrade.effectPerLevel,
      effect: effect as PrestigeUpgradeDef['effect'],
      unlocks: Array.isArray(upgrade.unlocks) ? (upgrade.unlocks as string[]) : undefined,
      capAt: typeof upgrade.capAt === 'number' ? upgrade.capAt : undefined,
      minMult: typeof upgrade.minMult === 'number' ? upgrade.minMult : undefined,
      order: typeof upgrade.order === 'number' ? upgrade.order : undefined,
    };
  });

  return {
    version: config.version,
    currency: config.currency,
    upgrades: normalized,
  };
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

function normalizePrice(
  buy: unknown,
  label: string,
  addErr: ErrorCollector['addErr'],
): Partial<Record<CurrencyKey, string>> {
  if (!isObject(buy)) return {};
  const price: Partial<Record<CurrencyKey, string>> = {};
  Object.entries(buy as Record<string, unknown>).forEach(([key, value]) => {
    if (!isCurrencyKey(key)) {
      addErr(`${label} contains unknown currency '${key}'`);
      return;
    }
    if (typeof value !== 'number' && typeof value !== 'string') {
      addErr(`${label}.${key} must be a number or string`);
      return;
    }
    price[key as CurrencyKey] = value.toString();
  });
  return price;
}

function validateApothecary(
  config: LoadedContentRaw['apothecary_shops'],
  addErr: ErrorCollector['addErr'],
): ApothecaryShopDef[] {
  assertObject(config, 'apothecary_shops.json root');
  assertHasKey(config, 'shops', 'apothecary_shops.json');
  assertArray(config.shops, 'apothecary_shops.json.shops');

  const normalized: ApothecaryShopDef[] = (config.shops as ApothecaryShopsConfig['shops']).map(
    (shop, idx) => {
      assertObject(shop, `apothecary_shops.shops[${idx}]`);
      assert(typeof shop.id === 'string', `apothecary_shops.shops[${idx}].id must be a string`);
      assert(typeof shop.cityId === 'string', `apothecary_shops.shops[${idx}].cityId must be a string`);
      assertArray(shop.stock, `apothecary_shops.shops[${idx}].stock`);

      const stock = shop.stock.map((entry, stockIdx) => {
        assertObject(entry, `apothecary_shops.shops[${idx}].stock[${stockIdx}]`);
        assert(
          typeof entry.itemId === 'string',
          `apothecary_shops.shops[${idx}].stock[${stockIdx}].itemId must be a string`,
        );

        const itemId = entry.itemId as string;
        const stockId =
          typeof entry.id === 'string' && entry.id.trim().length > 0
            ? entry.id
            : `${shop.id}:${itemId}`;

        const dailyLimit =
          entry.dailyLimit === null
            ? null
            : typeof entry.dailyLimit === 'number'
              ? entry.dailyLimit
              : undefined;

        const qty = typeof entry.qty === 'number' && Number.isFinite(entry.qty) ? entry.qty : undefined;
        const price = normalizePrice(
          entry.buy,
          `apothecary_shops.shops[${idx}].stock[${stockIdx}].buy`,
          addErr,
        );

        return {
          id: stockId,
          itemId,
          qty,
          price,
          dailyLimit,
        };
      });

      assertUniqueIds(stock, `apothecary_shops.shops[${idx}].stock`);

      return {
        id: shop.id,
        cityId: shop.cityId,
        name: shop.name,
        stock,
      };
    },
  );

  assertUniqueIds(normalized, 'apothecary_shops.shops');
  return normalized;
}

const EMPTY_EXPEDITIONS: ExpeditionsContent = {
  durations: [],
  types: [],
  cityYields: [],
};

function validateExpeditions(config: LoadedContentRaw['expeditions']): ExpeditionsContent {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    console.warn('[ContentValidation] expeditions.json missing or invalid root.');
    return EMPTY_EXPEDITIONS;
  }

  const durations = Array.isArray(config.durations) ? (config.durations as ExpeditionDurationDef[]) : null;
  const types = Array.isArray(config.types) ? (config.types as ExpeditionTypeDef[]) : null;
  const cityYields = Array.isArray(config.cityYields) ? (config.cityYields as ExpeditionCityYieldDef[]) : null;

  if (!durations) errors.push('expeditions.json.durations must be an array');
  if (!types) errors.push('expeditions.json.types must be an array');
  if (!cityYields) errors.push('expeditions.json.cityYields must be an array');

  if (durations) {
    const ids = new Set<string>();
    durations.forEach((duration, idx) => {
      if (!duration || typeof duration !== 'object') {
        errors.push(`durations[${idx}] must be an object`);
        return;
      }
      if (typeof duration.id !== 'string' || !duration.id.trim()) {
        errors.push(`durations[${idx}].id must be a string`);
      } else if (ids.has(duration.id)) {
        errors.push(`durations contains duplicate id ${duration.id}`);
      } else {
        ids.add(duration.id);
      }
      if (typeof duration.seconds !== 'number' || duration.seconds <= 0) {
        errors.push(`durations[${idx}].seconds must be > 0`);
      }
      if (!duration.label || typeof duration.label !== 'string') {
        duration.label = duration.id ?? `Duration ${idx + 1}`;
      }
    });
  }

  if (types) {
    const ids = new Set<string>();
    types.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object') {
        errors.push(`types[${idx}] must be an object`);
        return;
      }
      if (typeof entry.id !== 'string' || !entry.id.trim()) {
        errors.push(`types[${idx}].id must be a string`);
      } else if (ids.has(entry.id)) {
        errors.push(`types contains duplicate id ${entry.id}`);
      } else {
        ids.add(entry.id);
      }
      if (!Array.isArray(entry.yieldTags) || entry.yieldTags.length === 0) {
        errors.push(`types[${idx}].yieldTags must be a non-empty array`);
      }
    });
  }

  if (cityYields) {
    cityYields.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object') {
        errors.push(`cityYields[${idx}] must be an object`);
        return;
      }
      if (typeof entry.cityIndex !== 'number' || entry.cityIndex < 0) {
        errors.push(`cityYields[${idx}].cityIndex must be a non-negative number`);
      }
      if (!entry.yieldsByTag || typeof entry.yieldsByTag !== 'object') {
        errors.push(`cityYields[${idx}].yieldsByTag must be an object`);
      } else {
        Object.entries(entry.yieldsByTag).forEach(([tag, bundle]) => {
          if (!bundle || typeof bundle !== 'object') {
            errors.push(`cityYields[${idx}].yieldsByTag.${tag} must be an object`);
            return;
          }
          const items = (bundle as { items?: unknown }).items;
          if (items !== undefined && !Array.isArray(items)) {
            if (items && typeof items === 'object') {
              errors.push(
                `cityYields[${idx}].yieldsByTag.${tag}.items expected array but got map. Use Object.entries conversion.`,
              );
            } else {
              errors.push(`cityYields[${idx}].yieldsByTag.${tag}.items must be an array`);
            }
          }
        });
      }
    });
  }

  if (errors.length > 0) {
    console.warn('[ContentValidation] Expeditions content invalid:', errors.join('; '));
    return EMPTY_EXPEDITIONS;
  }

  return {
    durations: durations ?? [],
    types: types ?? [],
    cityYields: cityYields ?? [],
  };
}

function validateBounties(config: LoadedContentRaw['bounties']) {
  assertObject(config, 'bounties.json root');
  assertHasKey(config, 'version', 'bounties.json');
  assertHasKey(config, 'templates', 'bounties.json');
  assertArray(config.templates, 'bounties.json.templates');
  assertHasKey(config, 'rewardTiersByCityIndex', 'bounties.json');
  return config as BountiesConfig;
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
  const apothecaryShops = validateApothecary(raw.apothecary_shops, addErr);
  const expeditions = validateExpeditions(raw.expeditions);
  const bountyConfig = validateBounties(raw.bounties);

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
  const prestigeMap = buildIdMap(prestige.upgrades);
  const bountyTemplateMap = buildIdMap(bountyConfig.templates);

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
    });
  });

  pavilions.forEach((pavilion, idx) => {
    if (!(pavilion.cityId in cityMap)) {
      addErr(`pavilions[${idx}].cityId does not exist in cities`);
    }
    (['heaven', 'earth', 'martial'] as const).forEach((path) => {
      const pool = pavilion.poolByPath?.[path] ?? [];
      assertArray(pool, `pavilions[${idx}].poolByPath.${path}`);
      pool.forEach((entry, poolIdx) => {
        const techId =
          typeof entry === 'string'
            ? entry
            : entry && typeof entry === 'object'
              ? (entry as { techId?: string }).techId
              : undefined;
        if (techId && !(techId in techniqueMap)) {
          console.warn(
            `[ContentValidation] pavilions[${idx}].poolByPath.${path}[${poolIdx}] references unknown technique ${techId}. Will attempt to resolve dynamically.`,
          );
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

    const pools = ruin.roomPools;
    pools.mobs.forEach((mobId, mobIdx) => {
      if (!(mobId in enemyMap)) {
        addErr(`ruins[${idx}].roomPools.mobs[${mobIdx}] missing in enemies`);
      }
    });
    (pools.miniBoss ?? []).forEach((mobId, mobIdx) => {
      if (!(mobId in enemyMap)) {
        addErr(`ruins[${idx}].roomPools.miniBoss[${mobIdx}] missing in enemies`);
      }
    });
    (pools.finalBoss ?? []).forEach((mobId, mobIdx) => {
      if (!(mobId in enemyMap)) {
        addErr(`ruins[${idx}].roomPools.finalBoss[${mobIdx}] missing in enemies`);
      }
    });

    const validateDropTableItems = (table: any, label: string) => {
      table.pool.forEach((entry: any, poolIdx: number) => {
        if (!(entry.itemId in itemMap)) {
          addErr(`${label}.pool[${poolIdx}] missing item in items`);
        }
      });
      (table.guaranteed ?? []).forEach((entry: any, gIdx: number) => {
        if (!(entry.itemId in itemMap)) {
          addErr(`${label}.guaranteed[${gIdx}] missing item in items`);
        }
      });
    };

    validateDropTableItems(ruin.dropsPerRoom as any, `ruins[${idx}].dropsPerRoom`);
    validateDropTableItems(ruin.finalChestDrops as any, `ruins[${idx}].finalChestDrops`);
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

  bountyConfig.templates.forEach((template, idx) => {
    assert(typeof template.id === 'string', `bounties.templates[${idx}].id must be a string`);
  });

  const rewardTierKeys = Object.keys(bountyConfig.rewardTiersByCityIndex ?? {});
  const rewardTierIndices = rewardTierKeys
    .map((key) => Number(key))
    .filter((idx) => Number.isFinite(idx));
  const maxCityIndex = Math.max(0, ...cities.map((city) => city.index));
  for (let idx = 0; idx <= maxCityIndex; idx += 1) {
    if (!rewardTierIndices.includes(idx)) {
      console.warn(`[ContentValidation] bounties.rewardTiersByCityIndex missing city index ${idx}`);
    }
  }

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
    expeditions,
    bounties: bountyConfig,
    heart_laws: heartLaws,
    prestige_store: prestige,
  };
}
