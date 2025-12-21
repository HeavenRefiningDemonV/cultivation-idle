import type { RewardBundle } from '../systems/rewards';

export type PathId = 'heaven' | 'earth' | 'martial';
export type MajorRealmId = string;

export type OutskirtsDropsConfig = {
  mobGoldByCityIndex?: Record<number, [number, number]>;
  mobCommonMatChance?: number;
  mobDoubleMatChance?: number;
  mobRareMatChance?: number;

  bossGoldByCityIndex?: Record<number, [number, number]>;
  bossMatCountRangeByCityIndex?: Record<number, [number, number]>;
  bossRareMatChanceByCityIndex?: Record<number, number>;

  bossSpiritStoneChanceByCityIndex?: Record<number, number>;
  bossSpiritStoneRangeByCityIndex?: Record<number, [number, number]>;
};

export interface EconomyConfig {
  version?: string;
  generatedOn?: string;
  paths: PathId[];
  majorRealms: { id: MajorRealmId; name: string; index: number; stretch?: boolean }[];
  manualSystem?: unknown;

  drops?: {
    outskirts?: OutskirtsDropsConfig;
    // future modules: trials?: ..., ruins?: ...
  };
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
  rarity?: string;
  tier?: string;
}

export interface TechniquesConfig {
  version?: string;
  generatedOn?: string;
  techniques: TechniqueDef[];
}

export type PavilionPoolEntry =
  | string
  | {
      techId: string;
      weight?: number;
      rarity?: string;
      tier?: string;
      fragmentValue?: number;
    };

export interface PavilionDef {
  id: string;
  cityId: string;
  cityIndex: number;
  gradeSold?: string;
  currency?: Record<string, boolean>;
  poolByPath: Record<PathId, PavilionPoolEntry[]>;
  cost?: Partial<Record<'gold' | 'spiritStones' | 'merit', string | number>>;
  duplicateFragmentValue?: number;
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

export interface TrialFailSafeCost {
  gold?: string;
  spiritStones?: string;
  merit?: string;
}

export interface TrialFailSafe {
  thresholdAttempts?: number;
  cost?: TrialFailSafeCost;
}

export interface TrialDef {
  id: string;
  cityId: string;
  cityIndex?: number;
  name?: string;
  bossId: string;
  gateItemId: string;
  eligibilityRule?: string | unknown;
  failSafe?: TrialFailSafe;
  firstEligibleClearReward?: unknown;
  gatesToMajorRealm?: MajorRealmId;
  stretch?: boolean;
}

export interface TrialsConfig {
  version?: string;
  trials: TrialDef[];
}

export type RuinDropPoolEntry = {
  itemId: string;
  weight: number;
  qtyMin: number;
  qtyMax: number;
};

export type RuinDropTable = {
  goldMin?: number;
  goldMax?: number;
  rolls: number;
  pool: RuinDropPoolEntry[];
  guaranteed?: Array<{ itemId: string; qty: number }>;
};

export interface RuinDef {
  id: string;
  cityId: string;
  cityIndex?: number;
  name?: string;
  roomCount: number;
  roomPools: {
    mobs: string[];
    miniBoss?: string[];
    finalBoss?: string[];
  };
  dropsPerRoom: RuinDropTable;
  finalChestDrops: RuinDropTable;
}

export interface RuinsConfig {
  version?: string;
  ruins: RuinDef[];
}

export type CurrencyKey = 'gold' | 'spiritStones' | 'merit';
export type ApothecaryPrice = Partial<Record<CurrencyKey, string>>;

export interface ApothecaryStock {
  id: string;
  itemId: string;
  qty?: number;
  price: ApothecaryPrice;
  dailyLimit?: number | null;
}

export interface ApothecaryShopDef {
  id: string;
  cityId: string;
  name?: string;
  stock: ApothecaryStock[];
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
    name?: string;
    stock: Array<{
      id?: string;
      itemId: string;
      qty?: number;
      buy?: Record<string, number | string>;
      dailyLimit?: number | null;
    }>;
  }>;
}

export interface ExpeditionsConfig {
  version?: string | number;
  durations: ExpeditionDurationDef[];
  types: ExpeditionTypeDef[];
  cityYields: ExpeditionCityYieldDef[];
}

export interface ExpeditionDurationDef {
  id: string;
  label: string;
  seconds: number;
  efficiencyMult?: number;
}

export interface ExpeditionTypeDef {
  id: string;
  name: string;
  yieldTags: string[];
  description?: string;
}

export interface ExpeditionCityYieldDef {
  cityIndex: number;
  yieldsByTag: Record<string, RewardBundle>;
}

export interface ExpeditionsContent {
  durations: ExpeditionDurationDef[];
  types: ExpeditionTypeDef[];
  cityYields: ExpeditionCityYieldDef[];
}

export type BountyDifficulty = 'easy' | 'medium' | 'hard';

export type BountyRewardRange = [number, number];

export interface BountyRewardTier {
  gold: BountyRewardRange;
  merit: BountyRewardRange;
  spiritStones: BountyRewardRange;
}

export type BountyRewardTiersByDifficulty = Record<BountyDifficulty, BountyRewardTier>;

export type BountyRewardTiersByCityIndex = Record<string, BountyRewardTiersByDifficulty>;

export interface BountyTemplate {
  id: string;
  name: string;
  desc: string;
  kind: string;
  targets: Record<BountyDifficulty, number>;
  difficulties: BountyDifficulty[];
  minCityIndex: number;
}

export interface BountiesConfig {
  version?: number;
  refreshCooldownSeconds: number;
  difficulties: BountyDifficulty[];
  rewardTiersByCityIndex: BountyRewardTiersByCityIndex;
  templates: BountyTemplate[];
}

export interface HeartLawChapter {
  chapter: number;
  effects: unknown;
}

export interface HeartLawDef {
  id: string;
  name: string;
  tier?: string;
  archetype?: string;
  daoTags?: string[];
  spiritRootAffinities?: string[];
  signature?: unknown;
  chapters?: HeartLawChapter[];
  isStarter?: boolean;
}

export interface HeartLawsConfig {
  version?: string;
  affinityRules?: unknown;
  heartLaws: HeartLawDef[];
}

export interface PrestigeStoreConfig {
  version?: string;
  currency?: string;
  upgrades: PrestigeUpgradeDef[];
}

export interface PrestigePrereq {
  upgradeId: string;
  minLevel: number;
}

export type PrestigeEffect =
  | { type: 'multiplier'; stat: string; value?: number; valuePerLevel?: number }
  | { type: 'unlock'; stat?: string; [k: string]: any }
  | { type: string; [k: string]: any };

export interface PrestigeUpgradeTier {
  cost: number;
  effects?: unknown;
}

export interface PrestigeCostCurve {
  base: number;
  mult: number;
  round?: number;
}

export interface PrestigeUpgradeDef {
  id: string;
  name: string;
  description?: string;
  category?: string;
  type: string;
  maxLevel: number;
  costs?: number[];
  tiers?: PrestigeUpgradeTier[];
  costCurve?: PrestigeCostCurve;
  prereq?: PrestigePrereq[];
  stat?: string;
  effectPerLevel?: unknown;
  effect?: PrestigeEffect;
  unlocks?: string[];
  capAt?: number;
  minMult?: number;
  order?: number;
}
