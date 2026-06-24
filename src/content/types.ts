import type { RewardBundle } from '../services/rewards/types.js';
import type { ForgeHandsOnBonus, ForgeStepDef, PromptDef } from '../systems/crafting/craftingTypes.js';
import type { PavilionRecordsManifest } from '../features/pavilion/pavilionContentTypes.js';

export type PathId = 'heaven' | 'earth' | 'martial';
export type CultivatorPathId = PathId | 'universal';
export type MajorRealmId = string;

export type CultivatorStatCategory = 'foundation' | 'path' | 'doctrine' | 'handling';
export type CultivatorStatTier = 'core' | 'support' | 'advanced';
export type CultivatorStatGrade =
  | 'absent'
  | 'unformed'
  | 'formed'
  | 'refined'
  | 'tempered'
  | 'perfected'
  | 'transcendent';
export type CultivatorStatSurface =
  | 'status'
  | 'trainingHall'
  | 'daoHeart'
  | 'gateReadiness'
  | 'techniqueTooltip'
  | 'breakthrough'
  | 'cultivation'
  | 'apothecary'
  | 'techniques'
  | 'equipment'
  | 'offline'
  | 'combatLog'
  | 'fatigue'
  | 'combat'
  | 'pouch'
  | 'ai';

export interface CultivatorStatDef {
  id: string;
  displayName: string;
  category: CultivatorStatCategory;
  path?: CultivatorPathId;
  tier?: CultivatorStatTier;
  description?: string;
  fantasyMeaning?: string;
  maxEffectId?: string;
  maxEffectSummary?: string;
  realmCapFormulaId?: 'training_stat_cap_v1' | string;
  surfaces: CultivatorStatSurface[];
  mustNotAffect?: string[];
  deferredEffect?: boolean;
  notes?: string;
}

export interface CultivatorStatsConfig {
  version?: string | number;
  realmCapFormulaId?: 'training_stat_cap_v1' | string;
  stats: CultivatorStatDef[];
}

export type TrainingIntensityId = 'quiet' | 'steady' | 'harsh' | 'limit';

export interface TrainingIntensityDef {
  id: TrainingIntensityId;
  displayName: string;
  xpMultiplier: number;
  fatigueGainPerMin: number;
  mp0Behavior: string;
}

export interface TrainingRegimenDef {
  id: string;
  path: PathId;
  displayName: string;
  roomLabel?: string;
  primaryStatId: string;
  secondaryStatId: string;
  foundationStatId: string;
  regimenRate: number;
  masteryMilestones: number[];
  vfxProfileId?: string;
  unlockRealmIndex: number;
  lockedGameplayTrait?: string;
  cost?: never;
  costs?: never;
  requiredItems?: never;
  requiredCurrencies?: never;
}

export interface TrainingRegimensConfig {
  version?: string | number;
  masteryMilestones: number[];
  intensities: TrainingIntensityDef[];
  regimens: TrainingRegimenDef[];
}

export interface TrainingStateDraft {
  ratingsByStatId: Record<string, number>;
  regimenMasteryById: Record<string, number>;
  activeRegimenId: string | null;
  fatigue: number;
}

export type DaoHeartActivityId =
  | 'silent_sitting'
  | 'verse_recitation'
  | 'scripture_copying'
  | 'breath_harmonization'
  | 'inner_demon_debate'
  | 'doctrine_trial';

export interface DaoHeartPracticeDef {
  id: DaoHeartActivityId;
  displayName: string;
  description: string;
  heartLawXpMultiplier: number | 'milestone';
  clarityMultiplier: number | 'milestone';
  verseMultiplier: number | 'milestone';
  rootResonanceMultiplier: number | 'milestone';
  turbulencePerMinute: number | 'variable';
  offlineAllowed: boolean;
  unlockRule?: string;
  futureUse?: string;
  cost?: never;
  costs?: never;
  requiredItems?: never;
  requiredCurrencies?: never;
}

export interface DaoHeartPracticesConfig {
  version?: string | number;
  practices: DaoHeartPracticeDef[];
}

export interface HeartLawProgressionDef {
  id: string;
  tier: 'starter' | 'tier1' | 'tier2' | 'tier3';
  archetype: 'steady' | 'burst' | 'artisan' | 'mystic' | 'risk';
  xpTierMultiplier: number;
  rootAffinityIds: string[];
  chapters: Array<{
    id: string;
    displayName: string;
    levelStart: number;
    levelEnd: number;
    sealId: string;
  }>;
  branchSlots: Array<{
    level: number;
    choices: Array<{
      id: string;
      displayName: string;
      effectId: string;
    }>;
  }>;
}

export interface HeartLawProgressStateDraft {
  levelByHeartLawId: Record<string, number>;
  verseMasteryByHeartLawId: Record<string, number>;
  chapterSealIds: string[];
}

export type SpiritRootAwakeningState = 'dormant' | 'stirring' | 'open' | 'radiant' | 'transformed';

export type SpiritRootShape = 'single' | 'dual' | 'triple' | 'mixed' | 'mutated';

export interface SpiritRootProgressionDef {
  elementId: string;
  displayName: string;
  procName: string;
  description: string;
  purityGrades: number[];
  awakeningStates: SpiritRootAwakeningState[];
  effectId: string;
  procChanceCapPct: number;
  internalCooldownSec: number;
  hardLocksMismatchRoutes?: boolean;
  statusLine?: string;
  tooltipLine?: string;
  variants?: Array<{
    id: string;
    displayName: string;
    requiredHeartLawId?: string;
    requiredRootResonance?: number;
    requiredStatId?: string;
    requiredVerseMastery?: number;
    requiredDaoHeartClarity?: number;
    requiredStatRatings?: Array<{ statId: string; minRating: number }>;
    effectId: string;
    description?: string;
  }>;
}

export interface SpiritRootProgressionsConfig {
  version?: string | number;
  roots: SpiritRootProgressionDef[];
}

export interface SpiritRootProgressStateDraft {
  resonanceByElementId: Record<string, number>;
  awakeningByElementId: Partial<Record<string, SpiritRootAwakeningState>>;
  variantByElementId: Partial<Record<string, string>>;
}

// ===== The Tempering Court — Tier-2 Path Meridians (Three Treasures engine, W2) =====
// 7 per path, drip-revealed one per breakthrough (signature unlockRealm=1, capstone=7).
// Aptitude (spirit-root grade) + per-meridian rating live in save state, not here.
export type MeridianPathId = PathId;

export type MeridianEffectTone = 'atk' | 'def' | 'util' | '';

/** A derived-stat the meridian feeds, as previewed by the Court codex chips (§2.10). */
export interface MeridianCombatEffect {
  tone: MeridianEffectTone;
  label: string;
}

export interface PathMeridianDef {
  id: string;
  path: MeridianPathId;
  name: string;
  zi: string;
  exercise: string;
  room: string;
  /** 1..7 — the realm whose breakthrough reveals this meridian (signature=1, capstone Dao=7). */
  unlockRealm: number;
  /** combat passive trigger phrase that hones this meridian (§2.9). */
  trigger: string;
  eff: MeridianCombatEffect[];
  pathEffect: string;
  trait: string;
  traitRank: number;
  // The Court trains at no resource cost (engine-enforced); meridian data never declares costs.
  cost?: never;
  costs?: never;
  requiredItems?: never;
  requiredCurrencies?: never;
}

export interface PathMeridiansConfig {
  version?: string | number;
  meridians: PathMeridianDef[];
}

export type TechniqueScalingTag = string;

export type ReadinessCategoryId =
  | 'realm_qi'
  | 'heart_law_stability'
  | 'techniques_loadout'
  | 'equipment_forge'
  | 'medicine_prep'
  | 'path_training'
  | 'safety_net_support';

export interface ReadinessCategoryDef {
  id: ReadinessCategoryId;
  displayName: string;
  maxScore: number;
  description: string;
  sourceSystems: string[];
}

export interface ReadinessCategoriesConfig {
  version?: string | number;
  categories: ReadinessCategoryDef[];
}

export type TrainingHeartTelemetryEventName =
  | 'training_started'
  | 'training_grade_changed'
  | 'training_cap_hit'
  | 'dao_heart_started'
  | 'heart_law_level_changed'
  | 'breakthrough_attempted'
  | 'gate_attempted'
  | 'prestige_started'
  | 'offline_training_applied'
  | 'offline_dao_heart_applied'
  | 'prestige_memory_applied'
  | 'reset_bucket_applied';

export interface BreakthroughRiskCauseRow {
  id: string;
  label: string;
  value: number;
  severity: 'good' | 'neutral' | 'warning' | 'danger';
  explanation: string;
  route?: {
    label: string;
    target:
      | 'daoHeart'
      | 'trainingHall'
      | 'cultivation'
      | 'gateTrial'
      | 'apothecary'
      | 'forge'
      | 'rest';
  };
  sourceSystem:
    | 'realm'
    | 'qi'
    | 'heartLaw'
    | 'daoHeart'
    | 'root'
    | 'training'
    | 'injury'
    | 'trial'
    | 'prep';
}

export interface BreakthroughRiskSnapshot {
  fromRealmId: string;
  toRealmId: string;
  riskPercent: number;
  band: 'serene' | 'stable' | 'tense' | 'unstable' | 'dangerous' | 'reckless';
  minRisk: number;
  maxRisk: number;
  rows: BreakthroughRiskCauseRow[];
  topFixes: BreakthroughRiskCauseRow[];
  failureOutcomePreview: string;
}

export type OutskirtsDropsConfig = {
  mobGoldByCityIndex?: Record<number, [number, number]>;
  mobCommonMatChance?: number;
  mobDoubleMatChance?: number;
  mobRareMatChance?: number;
  mobManualScrapsChanceByCityIndex?: Record<number, number> | number[];
  mobManualScrapsRangeByCityIndex?: Record<number, [number, number]> | Array<[number, number]>;
  mobGearDropChanceByCityIndex?: Record<number, number> | number[];

  bossGoldByCityIndex?: Record<number, [number, number]>;
  bossMatCountRangeByCityIndex?: Record<number, [number, number]>;
  bossRareMatChanceByCityIndex?: Record<number, number>;

  bossSpiritStoneChanceByCityIndex?: Record<number, number>;
  bossSpiritStoneRangeByCityIndex?: Record<number, [number, number]>;
  bossTechniqueFragmentsRangeByCityIndex?: Record<number, [number, number]> | Array<[number, number]>;
  bossManualDropChanceByCityIndex?: Record<number, number> | number[];
  bossManualRarityWeights?: Record<string, number>;
  bossManualLegendaryChanceOverrideByCityIndex?: Record<number, number> | number[];
  bossManualPity?: {
    killsNoManualGuarantee?: number;
    killsNoRarePlusGuarantee?: number;
  };
};

export type RuinsDropsConfig = {
  finalChestTechniqueFragmentsRangeByCityIndex?: Record<number, [number, number]> | Array<[number, number]>;
  finalChestRuneDustRangeByCityIndex?: Record<number, [number, number]> | Array<[number, number]>;
  finalChestArtifactShardsRangeByCityIndex?: Record<number, [number, number]> | Array<[number, number]>;
  manualDropChance?: number;
  manualPityRunGuarantee?: number;
};

export interface TtmuBudgets {
  microGoalMinutes?: [number, number];
  minorGoalMinutes?: [number, number];
  mediumGoalMinutes?: [number, number];
  majorGoalHours?: [number, number];
  aspirationalGoalHours?: [number, number];
}

export interface PityRuleConfig {
  baseChance?: number;
  pityIncrement?: number;
  pityCap?: number;
}

export interface PityDefaultsConfig {
  expeditionsRare?: PityRuleConfig;
  ruinsBossChestRare?: PityRuleConfig;
  [key: string]: PityRuleConfig | undefined;
}

export interface EconomyLedgerConfig {
  notes?: string;
  currencies?: Record<string, { role?: string; expectedSinks?: string[] }>;
  faucets?: unknown[];
  sinks?: unknown[];
}

export interface EconomyTuningConfig {
  ttmuBudgets?: TtmuBudgets;
  pityDefaults?: PityDefaultsConfig;
  ledger?: EconomyLedgerConfig;
}

export interface EconomyConfig {
  version?: string;
  generatedOn?: string;
  paths: PathId[];
  majorRealms: { id: MajorRealmId; name: string; index: number; stretch?: boolean }[];
  manualSystem?: {
    drops?: {
      outskirts?: OutskirtsDropsConfig;
      ruins?: RuinsDropsConfig;
    };
    [key: string]: unknown;
  };
  tuning?: EconomyTuningConfig;

  drops?: {
    outskirts?: OutskirtsDropsConfig;
    ruins?: RuinsDropsConfig;
  };
}

export type LiveWorldModuleKey =
  | 'outskirts'
  | 'ruins'
  | 'gateTrial'
  | 'trainingHall'
  | 'manualPavilion'
  | 'apothecary'
  | 'forge'
  | 'bounties'
  | 'expeditions';

export type DeferredWorldModuleKey = 'alchemy' | 'talismanStudio';
export type CityModuleKey = LiveWorldModuleKey | DeferredWorldModuleKey;

export type RequiredLiveCityRefKey =
  | 'outskirtsId'
  | 'gateTrialId'
  | 'ruinId'
  | 'pavilionId'
  | 'apothecaryId';

export type OptionalCityRefKey = string;
export type CityRefKey = RequiredLiveCityRefKey | OptionalCityRefKey;
export type CityRefs = Record<string, string> & Record<RequiredLiveCityRefKey, string>;

export interface CityDef {
  id: string;
  index: number;
  name: string;
  unlockMajorRealm: MajorRealmId;
  modules: string[];
  refs: CityRefs;
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
  usage?: 'combat_only' | 'combat_or_world' | 'cultivate_only';
  note?: string;
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
  scalingVersion?: 'mp4_v1' | string;
  scalingRole?: 'offense' | 'defense' | 'utility' | 'control' | 'support' | 'ultimate' | string;
  primaryScalingStatId?: string;
  secondaryScalingStatId?: string;
  primaryScalingCoef?: number;
  secondaryScalingCoef?: number;
  rootAffinityIds?: string[];
  heartLawTagIds?: string[];
  scalingCapId?: string;
  cooldownSec?: number;
  resourceModel?: string;
  resourceCost?: number;
  effect?: unknown;
  secondaryAtMastery75?: unknown;
  rarity?: string;
  tier?: string;
  /** D7 §G — the legendary apex art's named unique-mechanic edge (apex catalog only). The SHAPE is fixed;
   *  any magnitude inside `body` is illustrative `[tune]` → D15. Absent on non-legendary techniques. */
  signature?: { name: string; body: string };
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

export interface TrialFailSafePurchase {
  enabled?: boolean;
  afterEligibleFails?: number;
  costRef?: string;
}

export interface TrialDef {
  id: string;
  cityId: string;
  cityIndex?: number;
  name?: string;
  bossId: string;
  gateItemId: string;
  requiredItemId?: string;
  minRealm?: number;
  realmRequirement?: number;
  suggestedDPS?: number;
  suggestedHP?: number;
  suggestedDps?: number;
  suggestedHp?: number;
  eligibilityRule?: string | unknown;
  failSafe?: TrialFailSafe;
  failSafePurchase?: TrialFailSafePurchase;
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
    assistedPrompts?: PromptDef[];
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
    assistedPrompts?: PromptDef[];
    stepScript?: ForgeStepDef[];
    handsOnBonus?: ForgeHandsOnBonus;
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
  variancePct?: number;
  rareChance?: number;
}

export interface ExpeditionTypeDef {
  id: string;
  name: string;
  yieldTags: string[];
  description?: string;
  recommendedModuleKey?: 'apothecary' | 'forge' | 'manualPavilion';
  rareDrops?: Array<{ itemId: string; qty: number; weight?: number }>;
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

export interface HeartLawAffinityRules {
  matchBonusByTier?: Record<string, number>;
  mismatchPenalty?: number;
  appliesTo?: string;
}

export type HeartLawEffectPayload = Record<string, unknown>;

export interface HeartLawChapter {
  chapter: number;
  effects: HeartLawEffectPayload;
}

export interface HeartLawDef {
  id: string;
  name: string;
  tier?: string;
  archetype?: string;
  daoTags?: string[];
  spiritRootAffinities?: string[];
  signature?: HeartLawEffectPayload;
  chapters?: HeartLawChapter[];
  isStarter?: boolean;
}

export interface HeartLawsConfig {
  version?: string;
  affinityRules?: HeartLawAffinityRules;
  heartLaws: HeartLawDef[];
}

export interface PrestigeStoreConfig {
  version?: string;
  currency?: string;
  upgrades: PrestigeUpgradeDef[];
}

export type PavilionRecordsConfig = PavilionRecordsManifest;

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
