export type PathId = 'heaven' | 'earth' | 'martial';
export type MajorRealmId = string;

export interface EconomyConfig {
  version?: string;
  generatedOn?: string;
  paths: PathId[];
  majorRealms: { id: MajorRealmId; name: string; index: number; stretch?: boolean }[];
  manualSystem?: unknown;
}

export interface CityDef {
  id: string;
  index: number;
  name: string;
  unlockMajorRealm: MajorRealmId;
  modules: string[];
  refs: Record<string, string>;
  themeTags?: string[];
}

export interface CitiesConfig {
  version?: string;
  cities: CityDef[];
}

export type CitiesPayload = CityDef[] | CitiesConfig;

export interface ItemDef {
  id: string;
  name: string;
  category: string;
  stackSize?: number;
  sellValue?: number;
  description?: string;
}

export interface ItemsConfig {
  version?: string;
  categories?: string[];
  items: ItemDef[];
}

export interface TechniqueDef {
  id: string;
  name: string;
  path: PathId;
  type: 'active' | 'passive' | 'ultimate' | string;
  role?: string;
  tags?: string[];
  cooldownSec?: number;
  resourceModel?: string;
  resourceCost?: number;
  effect?: unknown;
  secondaryAtMastery75?: unknown;
}

export interface TechniquesConfig {
  version?: string;
  generatedOn?: string;
  techniques: TechniqueDef[];
}

export interface PavilionDef {
  id: string;
  cityId: string;
  cityIndex: number;
  gradeSold?: string;
  currency?: Record<string, boolean>;
  poolByPath: Record<PathId, string[]>;
  featuredRules?: unknown;
}

export interface PavilionsConfig {
  version?: string;
  pavilions: PavilionDef[];
}

export interface OutskirtsDef {
  id: string;
  cityId: string;
  cityIndex: number;
  name?: string;
  killsToBoss: number;
  bossId: string;
  mobPool: { enemyId: string; weight: number }[];
  matPools?: Record<string, string[]>;
}

export interface OutskirtsConfig {
  version?: string;
  outskirts: OutskirtsDef[];
}

export interface EnemyTemplate {
  id: string;
  name: string;
  tags?: string[];
  role?: string;
  mechanics?: unknown;
}

export interface EnemiesConfig {
  version?: string;
  enemies: EnemyTemplate[];
}

export interface TrialDef {
  id: string;
  cityId: string;
  cityIndex: number;
  name?: string;
  bossId: string;
  gatesToMajorRealm: MajorRealmId;
  gateItemId: string;
  eligibilityRule?: unknown;
  failSafePurchase?: unknown;
  firstEligibleClearReward?: unknown;
  stretch?: boolean;
}

export interface TrialsConfig {
  version?: string;
  trials: TrialDef[];
}

export interface RuinDef {
  id: string;
  cityId: string;
  cityIndex: number;
  name?: string;
  roomCount: number;
  finalChestBonus?: unknown;
}

export interface RuinsConfig {
  version?: string;
  ruins: RuinDef[];
}

export interface AlchemyRecipesConfig {
  version?: string;
  recipes: Array<{
    id: string;
    unlocksAtCityId: string;
    station?: string;
    timeSec: number;
    inputs: Record<string, number>;
    outputs: Record<string, number>;
  }>;
}

export interface ForgeBlueprintsConfig {
  version?: string;
  blueprints: Array<{
    id: string;
    unlocksAtCityId: string;
    station?: string;
    timeSec: number;
    inputs?: Record<string, number>;
    outputs?: Record<string, number>;
    cost?: Record<string, number>;
    service?: string;
    effect?: unknown;
  }>;
}

export interface RunesConfig {
  version?: string;
  runes: Array<{ id: string; tier: number; socketRules?: unknown; effects?: unknown[] }>;
}

export interface TalismanRecipesConfig {
  version?: string;
  talismans: Array<{
    id: string;
    unlocksAtCityId: string;
    station?: string;
    timeSec: number;
    inputs?: Record<string, number>;
    outputs?: Record<string, number>;
    cost?: Record<string, number>;
    effect?: unknown;
  }>;
}

export interface ApothecaryShopsConfig {
  version?: string;
  shops: Array<{
    id: string;
    cityId: string;
    stock: Array<{ itemId: string; buy: Record<string, number>; dailyLimit: number | null }>;
  }>;
}

export interface ExpeditionsConfig {
  version?: string;
  durations: Array<{ id: string; minutes: number; efficiencyMult?: number }>;
  types: Array<{ id: string; name: string; yieldsTag: string }>;
  cityYields: Array<Record<string, unknown>>;
}

export interface BountiesConfig {
  version?: string;
  rules?: unknown;
  templates: Array<{ id: string; name: string; type: string; params?: unknown }>;
  rewardsByCityIndex?: unknown;
}

export interface HeartLawsConfig {
  version?: string;
  affinityRules?: unknown;
  heartLaws: Array<{
    id: string;
    name: string;
    tier?: string;
    archetype?: string;
    daoTags?: string[];
    spiritRootAffinities?: string[];
    signature?: unknown;
    chapters?: Array<{ chapter: number; effects: unknown }>;
  }>;
}

export interface PrestigeStoreConfig {
  version?: string;
  currency?: string;
  upgrades: Array<{
    id: string;
    name: string;
    type: string;
    costs: number[];
    prereq?: string[];
    levels?: number;
    stat?: string;
    effectPerLevel?: unknown;
    effect?: unknown;
    unlocks?: string[];
    capAt?: number;
    minMult?: number;
  }>;
}
