import { getLiveExpeditionRoutePurpose } from '../systems/world/expeditionRouteContract.js';
import type {
  AlchemyRecipesConfig,
  ApothecaryShopsConfig,
  ApothecaryShopDef,
  BountiesConfig,
  CitiesPayload,
  CityDef,
  CultivatorStatsConfig,
  CultivatorStatDef,
  CultivatorStatSurface,
  CurrencyKey,
  DaoHeartPracticesConfig,
  EconomyConfig,
  EnemiesConfig,
  ExpeditionsContent,
  ExpeditionCityYieldDef,
  ExpeditionDurationDef,
  ExpeditionTypeDef,
  ForgeBlueprintsConfig,
  HeartLawAffinityRules,
  HeartLawsConfig,
  ItemsConfig,
  OutskirtsConfig,
  PathMeridianDef,
  PathMeridiansConfig,
  PavilionDef,
  PavilionsConfig,
  PrestigeCostCurve,
  PrestigePrereq,
  PrestigeStoreConfig,
  PavilionRecordsConfig,
  PrestigeUpgradeDef,
  PrestigeUpgradeTier,
  ReadinessCategoriesConfig,
  RunesConfig,
  RuinsConfig,
  SpiritRootProgressionsConfig,
  TalismanRecipesConfig,
  TechniqueDef,
  TechniquesConfig,
  TrainingRegimensConfig,
  TrialsConfig,
} from './types.js';
import type {
  OnboardingCompletionDescriptor,
  OnboardingMilestoneContent,
  OnboardingMilestonesConfig,
  OnboardingRouteTarget,
} from '../systems/onboarding/onboardingTypes.js';
import {
  ONBOARDING_LIVE_WORLD_MODULE_KEYS,
  ONBOARDING_MILESTONE_IDS,
  ONBOARDING_PHASES,
  ONBOARDING_SCHEMA_VERSION,
  ONBOARDING_TAB_KEYS,
} from '../systems/onboarding/onboardingTypes.js';
import type { LoadedContentRaw } from './loaders.js';
import { validatePavilionRecordsManifest } from '../features/pavilion/pavilionContentTypes.js';
import { normalizeTrialFailSafeDefinition } from './trialFailSafe.js';
import { validateForgeBlueprintStepScript } from './validation/validateForgeBlueprints.js';
import {
  inspectLiveCitySchema,
  LIVE_CITY_MODULE_ORDER,
  REQUIRED_CITY_REFS_FOR_LIVE_SLICE,
} from '../systems/world/liveWorldSchema.js';
import {
  buildLiveCityPackageRegistry,
  formatCityPackageCoverageReport,
  formatLiveCityPackageCoverageIssue,
  inspectSemesterCityPackageCoverage,
} from '../systems/world/cityPackageRegistry.js';
import {
  TRAINING_STAT_UNLOCK_ORDER_BY_PATH,
  getTrainingStatUnlockRealmIndex,
} from '../systems/training/trainingUnlockPolicy.js';
import {
  buildActivityRewardAuditReport,
  buildRewardParityAuditReport,
  buildLiveEconomyCatalog,
  buildLiveEconomyAuditReport,
  buildTargetedMaterialSinkAudit,
  buildEconomicPhaseSnapshotFromState,
  buildEconomicStockFloorSnapshot,
  getAllPrepBudgetRegistryEntries,
  getAllSpendOrderPolicies,
  getDeferredModuleLeakKeysForModuleRoleRegistry,
  getEconomicModuleRoleEntries,
  getExpeditionPurposeConsistencySummary,
  getLiveEconomyItemAuditById,
  getLiveReagentPathAuditByBlueprintId,
  getPacket36AMaterialSinkStatus,
  hasVisibleLiveReagentPath,
  getSinklessLiveMaterials,
  listKnownLiveEconomyBlockers,
  buildBestSourceIndex,
  resolveMissingMaterialRoutes,
  getAllProblemDestinationPolicies,
  buildAllPrepPackageFitReports,
  buildAllSupportReservePacingReports,
  buildAllPrepVsBypassEconomyReports,
  ECONOMY_FACING_MODULE_KEYS,
} from '../systems/economy/index.js';
import { SEMESTER_SLICE_CONTRACT } from '../systems/progression/contract/semesterSlice.js';
import { getPrepEconomyTargets } from '../systems/balance/prepEconomyTargets.js';
import {
  buildForgeLadderAudit,
  buildLiveForgeCatalog,
  DEFERRED_FORGE_BLUEPRINT_IDS,
  LEGACY_RUNE_BLUEPRINT_IDS,
  getLiveForgeFamily as getForgeBlueprintFamily,
  LIVE_REFINE_LADDER_IDS,
  LIVE_RUNE_CITY_PAIRS,
  LIVE_TEMPER_LADDER_IDS,
} from '../systems/forge/index.js';
import { buildApothecaryCityBundle } from '../features/apothecary/apothecaryBundles.js';
import { evaluateGatePrepPackageCoverage } from '../features/apothecary/apothecaryPackageCoverage.js';
import { getGatePrepPackageForCity } from '../features/apothecary/gatePrepPackageCatalog.js';
import { buildMeritRoleAudit } from '../systems/economy/meritRoleAudit.js';
import { getAllGateFailureMeritPolicies } from '../systems/economy/gateFailureMeritPolicy.js';
import { getAllSupportBountyClaimExpectations, getAllSupportReserveTargets } from '../systems/economy/supportCurrencyTargets.js';
import { buildSupportEconomyReadModelFromState } from '../systems/economy/supportEconomyReadModel.js';
import {
  bountyKindToProgressRule,
  getExpeditionBountyCreditCityId,
  getLiveCraftBountyCountedSources,
  getLiveCraftBountyExcludedSources,
  resolveBountyDestination,
} from '../utils/bountyRouting.js';

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
  heart_law_affinity_rules: HeartLawAffinityRules | null;
  prestige_store: PrestigeStoreConfig;
  pavilion_records: PavilionRecordsConfig;
  onboarding_milestones: OnboardingMilestonesConfig;
  cultivator_stats: CultivatorStatsConfig;
  training_regimens: TrainingRegimensConfig;
  dao_heart_practices: DaoHeartPracticesConfig;
  spirit_roots: SpiritRootProgressionsConfig;
  readiness_categories: ReadinessCategoriesConfig;
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

const VALID_ONBOARDING_TABS = new Set<string>(ONBOARDING_TAB_KEYS);
const VALID_ONBOARDING_MODULES = new Set<string>(ONBOARDING_LIVE_WORLD_MODULE_KEYS);
const VALID_ONBOARDING_PHASES = new Set<string>(ONBOARDING_PHASES);
const ONBOARDING_SOURCE_SINK_REQUIRED_IDS = new Set([
  'M3_world_outskirts',
  'M4_pavilion_satchel',
  'M5_techniques_loadout',
  'M6_apothecary_expedition',
  'M7_forge',
  'M8_ruins_bounties',
  'M9_gate_trial',
]);

const CULTIVATOR_STAT_CATEGORIES = new Set(['foundation', 'path', 'doctrine', 'handling']);
const CULTIVATOR_PATH_IDS = new Set(['heaven', 'earth', 'martial', 'universal']);
const CULTIVATOR_STAT_TIERS = new Set(['core', 'support', 'advanced']);
const CULTIVATOR_STAT_SURFACES = new Set<CultivatorStatSurface>([
  'status',
  'trainingHall',
  'daoHeart',
  'gateReadiness',
  'techniqueTooltip',
  'breakthrough',
  'cultivation',
  'apothecary',
  'techniques',
  'equipment',
  'offline',
  'combatLog',
  'fatigue',
  'combat',
  'pouch',
  'ai',
]);
const TRAINING_PATH_IDS = new Set(['heaven', 'earth', 'martial']);
const TRAINING_INTENSITY_IDS = new Set(['quiet', 'steady', 'harsh', 'limit']);
const DAO_HEART_PRACTICE_IDS = new Set([
  'silent_sitting',
  'verse_recitation',
  'scripture_copying',
  'breath_harmonization',
  'inner_demon_debate',
  'doctrine_trial',
]);
const READINESS_CATEGORY_IDS = new Set([
  'realm_qi',
  'heart_law_stability',
  'techniques_loadout',
  'equipment_forge',
  'medicine_prep',
  'path_training',
  'safety_net_support',
]);
const SPIRIT_ROOT_ELEMENT_IDS = new Set([
  'wood',
  'fire',
  'earth',
  'metal',
  'water',
  'wind',
  'lightning',
  'ice',
  'light',
  'shadow',
  'soul',
  'void',
  'time',
  'astral',
]);
const SPIRIT_ROOT_AWAKENING_STATES = new Set(['dormant', 'stirring', 'open', 'radiant', 'transformed']);
const TRAINING_MASTERY_MILESTONES = [100, 260, 520, 900, 1450, 2200, 3200, 4500, 6200, 8400] as const;
const FORBIDDEN_BASE_PRACTICE_COST_KEYS = [
  'cost',
  'costs',
  'requiredItems',
  'requiredCurrencies',
  'materials',
  'goldCost',
  'spiritStoneCost',
  'itemCost',
  'herbCost',
  'oreCost',
  'pillCost',
  'gateItemCost',
] as const;

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

function validateOnboardingRoute(route: unknown, label: string, addErr: ErrorCollector['addErr']): void {
  if (!isObject(route)) {
    addErr(`${label} route must be an object`);
    return;
  }
  const kind = route.kind;
  if (kind === 'none' || kind === 'life_start') return;
  if (kind === 'tab') {
    if (typeof route.tab !== 'string' || !VALID_ONBOARDING_TABS.has(route.tab)) {
      addErr(`${label} route references invalid tab '${String(route.tab)}'`);
    }
    return;
  }
  if (kind === 'world_module') {
    if (typeof route.moduleKey !== 'string' || !VALID_ONBOARDING_MODULES.has(route.moduleKey)) {
      addErr(`${label} route references invalid world module '${String(route.moduleKey)}'`);
    }
    if ('cityId' in route && route.cityId !== null && route.cityId !== undefined && typeof route.cityId !== 'string') {
      addErr(`${label} route cityId must be a string or null`);
    }
    return;
  }
  if (kind === 'modal') {
    if (!['manualSatchel', 'medicinePouch', 'tutorialLedger'].includes(String(route.modalKey))) {
      addErr(`${label} route references invalid modal '${String(route.modalKey)}'`);
    }
    return;
  }
  addErr(`${label} route has invalid kind '${String(kind)}'`);
}

function validateOnboardingCompletion(completion: unknown, label: string, addErr: ErrorCollector['addErr']): void {
  if (!isObject(completion)) {
    addErr(`${label} completion must be an object`);
    return;
  }
  const kind = completion.kind;
  if (kind === 'store_fact') {
    if (typeof completion.fact !== 'string' || completion.fact.length === 0) {
      addErr(`${label} store_fact completion missing fact`);
    }
    return;
  }
  if (kind === 'event') {
    if (typeof completion.eventType !== 'string' || completion.eventType.length === 0) {
      addErr(`${label} event completion missing eventType`);
    }
    if ('match' in completion && completion.match !== undefined && !isObject(completion.match)) {
      addErr(`${label} event completion match must be an object when present`);
    }
    return;
  }
  if (kind === 'compound') {
    const all = completion.all;
    const any = completion.any;
    if (all !== undefined && !Array.isArray(all)) addErr(`${label} compound all must be an array`);
    if (any !== undefined && !Array.isArray(any)) addErr(`${label} compound any must be an array`);
    if (!Array.isArray(all) && !Array.isArray(any)) addErr(`${label} compound completion must define all or any`);
    if (Array.isArray(all)) {
      all.forEach((entry, idx) => validateOnboardingCompletion(entry, `${label}.all[${idx}]`, addErr));
    }
    if (Array.isArray(any)) {
      any.forEach((entry, idx) => validateOnboardingCompletion(entry, `${label}.any[${idx}]`, addErr));
    }
    return;
  }
  addErr(`${label} completion has invalid kind '${String(kind)}'`);
}

function validateOnboardingUnlocks(unlocks: unknown, label: string, addErr: ErrorCollector['addErr']): void {
  if (!isObject(unlocks)) {
    addErr(`${label} unlocks must be an object`);
    return;
  }
  const tabs = unlocks.tabs;
  const worldModules = unlocks.worldModules;
  const teaserWorldModules = unlocks.teaserWorldModules;
  if (!Array.isArray(tabs)) addErr(`${label} unlocks.tabs must be an array`);
  if (!Array.isArray(worldModules)) addErr(`${label} unlocks.worldModules must be an array`);
  if (!Array.isArray(teaserWorldModules)) addErr(`${label} unlocks.teaserWorldModules must be an array`);
  if (Array.isArray(tabs)) {
    tabs.forEach((tab, idx) => {
      if (typeof tab !== 'string' || !VALID_ONBOARDING_TABS.has(tab)) {
        addErr(`${label} unlocks.tabs[${idx}] invalid tab '${String(tab)}'`);
      }
    });
  }
  const validateModules = (values: unknown[], field: string) => {
    values.forEach((moduleKey, idx) => {
      if (typeof moduleKey !== 'string' || !VALID_ONBOARDING_MODULES.has(moduleKey)) {
        addErr(`${label} unlocks.${field}[${idx}] invalid world module '${String(moduleKey)}'`);
      }
    });
  };
  if (Array.isArray(worldModules)) validateModules(worldModules, 'worldModules');
  if (Array.isArray(teaserWorldModules)) validateModules(teaserWorldModules, 'teaserWorldModules');
  if ('flags' in unlocks && unlocks.flags !== undefined) {
    if (!Array.isArray(unlocks.flags) || !unlocks.flags.every((entry) => typeof entry === 'string')) {
      addErr(`${label} unlocks.flags must be a string array when present`);
    }
  }
}

function validateOnboardingMilestones(config: LoadedContentRaw['onboarding_milestones'], addErr: ErrorCollector['addErr']): OnboardingMilestonesConfig {
  assertObject(config, 'onboarding_milestones.json');
  if (config.version !== ONBOARDING_SCHEMA_VERSION) {
    addErr(`onboarding_milestones.json version must be '${ONBOARDING_SCHEMA_VERSION}'`);
  }
  assertArray(config.milestones, 'onboarding_milestones.json milestones');

  const milestones = config.milestones as unknown[];
  if (milestones.length !== ONBOARDING_MILESTONE_IDS.length) {
    addErr(`onboarding_milestones.json must define exactly ${ONBOARDING_MILESTONE_IDS.length} milestones`);
  }

  const seenIds = new Set<string>();
  const seenOrders = new Set<number>();
  milestones.forEach((rawMilestone, idx) => {
    if (!isObject(rawMilestone)) {
      addErr(`onboarding_milestones.json milestones[${idx}] must be an object`);
      return;
    }
    const expectedId = ONBOARDING_MILESTONE_IDS[idx];
    if (rawMilestone.id !== expectedId) {
      addErr(`onboarding_milestones.json milestones[${idx}] expected id '${expectedId}', found '${String(rawMilestone.id)}'`);
    }
    if (typeof rawMilestone.id === 'string') {
      if (seenIds.has(rawMilestone.id)) addErr(`onboarding_milestones.json duplicate id '${rawMilestone.id}'`);
      seenIds.add(rawMilestone.id);
    }
    if (rawMilestone.order !== idx) {
      addErr(`onboarding_milestones.json milestone '${String(rawMilestone.id)}' must have order ${idx}`);
    }
    if (typeof rawMilestone.order === 'number') {
      if (seenOrders.has(rawMilestone.order)) addErr(`onboarding_milestones.json duplicate order ${rawMilestone.order}`);
      seenOrders.add(rawMilestone.order);
    }
    if (typeof rawMilestone.label !== 'string' || rawMilestone.label.length === 0) addErr(`${String(rawMilestone.id)} missing label`);
    if (typeof rawMilestone.phase !== 'string' || !VALID_ONBOARDING_PHASES.has(rawMilestone.phase)) {
      addErr(`${String(rawMilestone.id)} invalid phase '${String(rawMilestone.phase)}'`);
    }
    if (rawMilestone.firstLifeOnly !== true) addErr(`${String(rawMilestone.id)} must be firstLifeOnly`);
    if (!isObject(rawMilestone.trigger)) addErr(`${String(rawMilestone.id)} trigger must be an object`);
    validateOnboardingUnlocks(rawMilestone.unlocks, String(rawMilestone.id), addErr);

    if (!isObject(rawMilestone.objective)) {
      addErr(`${String(rawMilestone.id)} objective must be an object`);
    } else {
      if (typeof rawMilestone.objective.title !== 'string' || rawMilestone.objective.title.length === 0) addErr(`${String(rawMilestone.id)} objective title missing`);
      if (typeof rawMilestone.objective.why !== 'string' || rawMilestone.objective.why.length === 0) addErr(`${String(rawMilestone.id)} objective why missing`);
      validateOnboardingRoute(rawMilestone.objective.route, `${String(rawMilestone.id)} objective`, addErr);
      validateOnboardingCompletion(rawMilestone.objective.completion, `${String(rawMilestone.id)} objective`, addErr);
    }

    const tutorialCard = rawMilestone.tutorialCard;
    if (!isObject(tutorialCard)) {
      addErr(`${String(rawMilestone.id)} tutorialCard must be an object`);
    } else {
      ['id', 'title', 'body', 'cta'].forEach((key) => {
        if (typeof tutorialCard[key] !== 'string' || String(tutorialCard[key]).length === 0) {
          addErr(`${String(rawMilestone.id)} tutorialCard.${key} missing`);
        }
      });
    }

    if (ONBOARDING_SOURCE_SINK_REQUIRED_IDS.has(String(rawMilestone.id))) {
      if (typeof rawMilestone.sourceSinkNote !== 'string' || rawMilestone.sourceSinkNote.length === 0) {
        addErr(`${String(rawMilestone.id)} must include sourceSinkNote`);
      }
    } else if (rawMilestone.sourceSinkNote !== null && typeof rawMilestone.sourceSinkNote !== 'string') {
      addErr(`${String(rawMilestone.id)} sourceSinkNote must be string or null`);
    }
    if (typeof rawMilestone.replayId !== 'string' || rawMilestone.replayId.length === 0) {
      addErr(`${String(rawMilestone.id)} replayId missing`);
    }
  });

  const byId = Object.fromEntries(
    milestones.filter(isObject).map((milestone) => [String(milestone.id), milestone]),
  );
  const m2 = byId.M2_status_unlock;
  const m3 = byId.M3_world_outskirts;
  const m6 = byId.M6_apothecary_expedition;
  const m8 = byId.M8_ruins_bounties;
  const m9 = byId.M9_gate_trial;
  const m10 = byId.M10_foundation_graduation;
  if (isObject(m2?.unlocks)) {
    const unlocks = m2.unlocks as { tabs?: unknown[]; worldModules?: unknown[] };
    if (!unlocks.tabs?.includes('status')) addErr('M2_status_unlock must unlock status');
    if (unlocks.tabs?.includes('adventure')) addErr('M2_status_unlock must not unlock adventure');
    if ((unlocks.worldModules ?? []).length > 0) addErr('M2_status_unlock must not unlock world modules');
  }
  if (isObject(m3?.unlocks) && !(m3.unlocks as { teaserWorldModules?: unknown[] }).teaserWorldModules?.includes('manualPavilion')) {
    addErr('M3_world_outskirts must teaser manualPavilion');
  }
  if (isObject(m6?.unlocks)) {
    const modules = (m6.unlocks as { worldModules?: unknown[] }).worldModules ?? [];
    if (!modules.includes('apothecary') || !modules.includes('expeditions')) addErr('M6_apothecary_expedition must unlock apothecary and expeditions together');
  }
  if (isObject(m8?.unlocks)) {
    const modules = (m8.unlocks as { worldModules?: unknown[]; teaserWorldModules?: unknown[] }).worldModules ?? [];
    if (!modules.includes('ruins') || !modules.includes('bounties')) addErr('M8_ruins_bounties must unlock ruins and bounties together');
    if (!((m8.unlocks as { teaserWorldModules?: unknown[] }).teaserWorldModules ?? []).includes('gateTrial')) addErr('M8_ruins_bounties must teaser gateTrial');
  }
  if (isObject(m9?.unlocks) && !((m9.unlocks as { worldModules?: unknown[] }).worldModules ?? []).includes('gateTrial')) {
    addErr('M9_gate_trial must unlock gateTrial');
  }
  if (isObject(m10?.unlocks) && !((m10.unlocks as { flags?: unknown[] }).flags ?? []).includes('first_life_onboarding_complete')) {
    addErr('M10_foundation_graduation must mark first_life_onboarding_complete');
  }

  return {
    version: ONBOARDING_SCHEMA_VERSION,
    designNotes: Array.isArray(config.designNotes) ? config.designNotes.filter((entry): entry is string => typeof entry === 'string') : [],
    milestones: milestones as OnboardingMilestoneContent[],
  };
}

function assertNoBasePracticeCosts(entity: Record<string, unknown>, label: string, addErr: ErrorCollector['addErr']): void {
  FORBIDDEN_BASE_PRACTICE_COST_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(entity, key)) {
      addErr(`${label} declares forbidden base cost field: ${key}`);
    }
  });
}

function hasExactNumberList(values: unknown, expected: readonly number[]): boolean {
  return Array.isArray(values)
    && values.length === expected.length
    && values.every((value, idx) => value === expected[idx]);
}

function validateCultivatorStats(
  config: LoadedContentRaw['cultivator_stats'] | undefined,
  addErr: ErrorCollector['addErr'],
): CultivatorStatsConfig {
  if (config === undefined) {
    return { version: 'legacy-test-raw-without-mp0-content', stats: [] };
  }

  assertObject(config, 'stats.json root');
  assertArray(config.stats, 'stats.json.stats');

  const stats = config.stats as CultivatorStatDef[];
  assertArrayItemsHaveId(stats as any[], 'stats.json.stats');
  assertUniqueIds(stats, 'stats.json.stats');
  if (stats.length !== 28) {
    addErr(`stats.json must define exactly 28 canonical cultivator stats, found ${stats.length}`);
  }

  stats.forEach((stat, idx) => {
    if (!CULTIVATOR_STAT_CATEGORIES.has(String(stat.category))) {
      addErr(`stats.json.stats[${idx}] has invalid category '${String(stat.category)}'`);
    }
    if (stat.path !== undefined && !CULTIVATOR_PATH_IDS.has(String(stat.path))) {
      addErr(`stats.json.stats[${idx}] has invalid path '${String(stat.path)}'`);
    }
    if (stat.category === 'foundation' && stat.path !== 'universal') {
      addErr(`stats.json.stats[${idx}] foundation stat '${stat.id}' must use path universal`);
    }
    if (stat.category === 'path' && (stat.path === undefined || stat.path === 'universal')) {
      addErr(`stats.json.stats[${idx}] path stat '${stat.id}' must use heaven, earth, or martial`);
    }
    if (stat.tier !== undefined && !CULTIVATOR_STAT_TIERS.has(String(stat.tier))) {
      addErr(`stats.json.stats[${idx}] has invalid tier '${String(stat.tier)}'`);
    }
    if (!Array.isArray(stat.surfaces) || stat.surfaces.length === 0) {
      addErr(`stats.json.stats[${idx}] must define at least one surface`);
    } else {
      stat.surfaces.forEach((surface, surfaceIdx) => {
        if (!CULTIVATOR_STAT_SURFACES.has(surface)) {
          addErr(`stats.json.stats[${idx}].surfaces[${surfaceIdx}] invalid surface '${String(surface)}'`);
        }
      });
    }
    if (stat.realmCapFormulaId !== undefined && stat.realmCapFormulaId !== 'training_stat_cap_v1') {
      addErr(`stats.json.stats[${idx}] uses unknown realmCapFormulaId '${String(stat.realmCapFormulaId)}'`);
    }
    if (stat.deferredEffect !== true) {
      addErr(`stats.json.stats[${idx}] must mark effect as deferred for Mega Prompt 0`);
    }
  });

  const armorHarmony = stats.filter((stat) => stat.id === 'armor_harmony');
  if (armorHarmony.length !== 1) {
    addErr(`stats.json must contain exactly one armor_harmony definition, found ${armorHarmony.length}`);
  } else if (armorHarmony[0].category !== 'path' || armorHarmony[0].path !== 'earth') {
    addErr('stats.json armor_harmony must remain the single Earth path definition with handling surfaces');
  }

  return config;
}

function validateTrainingRegimens(
  config: LoadedContentRaw['training_regimens'] | undefined,
  statsById: Map<string, CultivatorStatDef>,
  addErr: ErrorCollector['addErr'],
): TrainingRegimensConfig {
  if (config === undefined) {
    return { version: 'legacy-test-raw-without-mp0-content', masteryMilestones: [], intensities: [], regimens: [] };
  }

  assertObject(config, 'training_regimens.json root');
  assertArray(config.intensities, 'training_regimens.json.intensities');
  assertArray(config.regimens, 'training_regimens.json.regimens');

  if (!hasExactNumberList(config.masteryMilestones, TRAINING_MASTERY_MILESTONES)) {
    addErr('training_regimens.json masteryMilestones drifted from canonical MP0 values');
  }

  const intensityIds = new Set<string>();
  config.intensities.forEach((intensity, idx) => {
    if (!TRAINING_INTENSITY_IDS.has(String(intensity.id))) {
      addErr(`training_regimens.json.intensities[${idx}] invalid id '${String(intensity.id)}'`);
    }
    if (intensityIds.has(intensity.id)) addErr(`training_regimens.json duplicate intensity id '${intensity.id}'`);
    intensityIds.add(intensity.id);
    if (typeof intensity.xpMultiplier !== 'number' || intensity.xpMultiplier <= 0) {
      addErr(`training_regimens.json.intensities[${idx}] xpMultiplier must be positive`);
    }
    if (typeof intensity.fatigueGainPerMin !== 'number' || intensity.fatigueGainPerMin < 0) {
      addErr(`training_regimens.json.intensities[${idx}] fatigueGainPerMin must be non-negative`);
    }
  });

  const regimens = config.regimens;
  assertArrayItemsHaveId(regimens as any[], 'training_regimens.json.regimens');
  assertUniqueIds(regimens, 'training_regimens.json.regimens');

  const byPath = new Map<string, number>();
  const unlockIndexesByPath = new Map<string, number[]>();
  const primaryStatsByPath = new Map<string, Map<string, string>>();
  regimens.forEach((regimen, idx) => {
    const label = `Training regimen ${regimen.id}`;
    assertNoBasePracticeCosts(regimen as unknown as Record<string, unknown>, label, addErr);
    if (!TRAINING_PATH_IDS.has(String(regimen.path))) {
      addErr(`training_regimens.json.regimens[${idx}] invalid path '${String(regimen.path)}'`);
    }
    if (typeof regimen.regimenRate !== 'number' || regimen.regimenRate < 0.8 || regimen.regimenRate > 1.1) {
      addErr(`Training regimen ${regimen.id} has out-of-band rate ${String(regimen.regimenRate)}`);
    }
    if (!hasExactNumberList(regimen.masteryMilestones, TRAINING_MASTERY_MILESTONES)) {
      addErr(`Training regimen ${regimen.id} mastery milestones drifted from canonical MP0 values`);
    }

    (['primaryStatId', 'secondaryStatId', 'foundationStatId'] as const).forEach((field) => {
      const statId = regimen[field];
      const stat = statsById.get(statId);
      if (!stat) {
        addErr(`Training regimen ${regimen.id} references missing stat ${statId}`);
        return;
      }
      if (field !== 'foundationStatId' && stat.path && stat.path !== 'universal' && stat.path !== regimen.path) {
        addErr(`Training regimen ${regimen.id} references ${stat.path} stat ${statId} from ${regimen.path}`);
      }
    });

    if (TRAINING_PATH_IDS.has(String(regimen.path))) {
      const pathId = regimen.path as keyof typeof TRAINING_STAT_UNLOCK_ORDER_BY_PATH;
      const policyIndex = getTrainingStatUnlockRealmIndex(pathId, regimen.primaryStatId);
      const unlockRealmIndex = regimen.unlockRealmIndex;
      if (typeof unlockRealmIndex !== 'number' || !Number.isInteger(unlockRealmIndex) || unlockRealmIndex < 0 || unlockRealmIndex > 5) {
        addErr(`Training regimen ${regimen.id} unlockRealmIndex must be an integer from 0 to 5`);
      }
      if (policyIndex === null) {
        addErr(`Training regimen ${regimen.id} primary stat ${regimen.primaryStatId} is not in the ${pathId} Training unlock policy`);
      } else if (unlockRealmIndex !== policyIndex) {
        addErr(
          `Training regimen ${regimen.id} unlockRealmIndex ${String(unlockRealmIndex)} must match ${regimen.primaryStatId} policy realm ${policyIndex}`,
        );
      }
      unlockIndexesByPath.set(pathId, [...(unlockIndexesByPath.get(pathId) ?? []), Number(unlockRealmIndex)]);
      const seenPrimary = primaryStatsByPath.get(pathId) ?? new Map<string, string>();
      if (seenPrimary.has(regimen.primaryStatId)) {
        addErr(
          `training_regimens.json ${pathId} primary stat ${regimen.primaryStatId} is used by both ${seenPrimary.get(regimen.primaryStatId)} and ${regimen.id}`,
        );
      }
      seenPrimary.set(regimen.primaryStatId, regimen.id);
      primaryStatsByPath.set(pathId, seenPrimary);
    }

    byPath.set(regimen.path, (byPath.get(regimen.path) ?? 0) + 1);
  });

  ['heaven', 'earth', 'martial'].forEach((pathId) => {
    const count = byPath.get(pathId) ?? 0;
    if (count !== 6) addErr(`Expected 6 training regimens for ${pathId}, found ${count}`);
    const unlockIndexes = unlockIndexesByPath.get(pathId) ?? [];
    if (unlockIndexes.length > 0 && unlockIndexes.every((index) => index === 0)) {
      addErr(`training_regimens.json ${pathId} unlockRealmIndex values are all 0; MP2 requires staged unlocks`);
    }
    const primaryStats = primaryStatsByPath.get(pathId) ?? new Map<string, string>();
    TRAINING_STAT_UNLOCK_ORDER_BY_PATH[pathId as keyof typeof TRAINING_STAT_UNLOCK_ORDER_BY_PATH].forEach((statId) => {
      if (!primaryStats.has(statId)) {
        addErr(`training_regimens.json ${pathId} is missing a primary regimen for staged stat ${statId}`);
      }
    });
  });

  return config;
}

function validateDaoHeartPractices(
  config: LoadedContentRaw['dao_heart_practices'] | undefined,
  addErr: ErrorCollector['addErr'],
): DaoHeartPracticesConfig {
  if (config === undefined) {
    return { version: 'legacy-test-raw-without-mp0-content', practices: [] };
  }

  assertObject(config, 'dao_heart_practices.json root');
  assertArray(config.practices, 'dao_heart_practices.json.practices');
  const practices = config.practices;
  assertArrayItemsHaveId(practices as any[], 'dao_heart_practices.json.practices');
  assertUniqueIds(practices, 'dao_heart_practices.json.practices');
  if (practices.length !== DAO_HEART_PRACTICE_IDS.size) {
    addErr(`dao_heart_practices.json must define exactly ${DAO_HEART_PRACTICE_IDS.size} practices, found ${practices.length}`);
  }

  practices.forEach((practice, idx) => {
    assertNoBasePracticeCosts(practice as unknown as Record<string, unknown>, `Dao Heart practice ${practice.id}`, addErr);
    if (!DAO_HEART_PRACTICE_IDS.has(String(practice.id))) {
      addErr(`dao_heart_practices.json.practices[${idx}] invalid id '${String(practice.id)}'`);
    }
    if (typeof practice.offlineAllowed !== 'boolean') {
      addErr(`dao_heart_practices.json.practices[${idx}] offlineAllowed must be boolean`);
    }
    (['heartLawXpMultiplier', 'clarityMultiplier', 'verseMultiplier', 'rootResonanceMultiplier'] as const).forEach((field) => {
      const value = practice[field];
      if (value !== 'milestone' && typeof value !== 'number') {
        addErr(`dao_heart_practices.json.practices[${idx}].${field} must be number or milestone`);
      }
    });
    if (practice.turbulencePerMinute !== 'variable' && typeof practice.turbulencePerMinute !== 'number') {
      addErr(`dao_heart_practices.json.practices[${idx}].turbulencePerMinute must be number or variable`);
    }
  });

  DAO_HEART_PRACTICE_IDS.forEach((id) => {
    if (!practices.some((practice) => practice.id === id)) {
      addErr(`dao_heart_practices.json missing practice ${id}`);
    }
  });

  return config;
}

function validateSpiritRoots(
  config: LoadedContentRaw['spirit_roots'] | undefined,
  statsById: Map<string, CultivatorStatDef>,
  heartLawIds: Set<string>,
  addErr: ErrorCollector['addErr'],
): SpiritRootProgressionsConfig {
  if (config === undefined) {
    return { version: 'legacy-test-raw-without-mp0-content', roots: [] };
  }

  assertObject(config, 'spirit_roots.json root');
  assertArray(config.roots, 'spirit_roots.json.roots');
  const seen = new Set<string>();
  config.roots.forEach((root, idx) => {
    if (typeof root.elementId !== 'string') {
      addErr(`spirit_roots.json.roots[${idx}] missing elementId`);
      return;
    }
    if (seen.has(root.elementId)) addErr(`spirit_roots.json duplicate elementId '${root.elementId}'`);
    seen.add(root.elementId);
    if (!SPIRIT_ROOT_ELEMENT_IDS.has(root.elementId)) {
      addErr(`spirit_roots.json.roots[${idx}] invalid elementId '${root.elementId}'`);
    }
    if (root.hardLocksMismatchRoutes === true) {
      addErr(`spirit_roots.json root '${root.elementId}' must not hard-lock mismatch routes`);
    }
    if (!Array.isArray(root.purityGrades) || root.purityGrades.length === 0 || root.purityGrades.some((grade) => typeof grade !== 'number')) {
      addErr(`spirit_roots.json root '${root.elementId}' must define numeric purityGrades`);
    }
    if (!Array.isArray(root.awakeningStates) || root.awakeningStates.length === 0) {
      addErr(`spirit_roots.json root '${root.elementId}' must define awakeningStates`);
    } else {
      root.awakeningStates.forEach((state) => {
        if (!SPIRIT_ROOT_AWAKENING_STATES.has(String(state))) {
          addErr(`spirit_roots.json root '${root.elementId}' invalid awakening state '${String(state)}'`);
        }
      });
    }
    if (typeof root.procChanceCapPct !== 'number' || root.procChanceCapPct < 0 || root.procChanceCapPct > 100) {
      addErr(`spirit_roots.json root '${root.elementId}' procChanceCapPct must be between 0 and 100`);
    }
    if (root.procChanceCapPct !== 18) {
      addErr(`spirit_roots.json root '${root.elementId}' procChanceCapPct must remain MP4 cap 18`);
    }
    if (root.internalCooldownSec !== 10) {
      addErr(`spirit_roots.json root '${root.elementId}' internalCooldownSec must remain MP4 default 10`);
    }
    if (typeof (root as { statusLine?: unknown }).statusLine !== 'string' || !(root as { statusLine?: string }).statusLine?.trim()) {
      addErr(`spirit_roots.json root '${root.elementId}' must define statusLine`);
    }
    if (typeof (root as { tooltipLine?: unknown }).tooltipLine !== 'string' || !(root as { tooltipLine?: string }).tooltipLine?.trim()) {
      addErr(`spirit_roots.json root '${root.elementId}' must define tooltipLine`);
    }
    (root.variants ?? []).forEach((variant) => {
      if (variant.requiredStatId && !statsById.has(variant.requiredStatId)) {
        addErr(`spirit_roots.json root '${root.elementId}' variant '${variant.id}' references missing stat ${variant.requiredStatId}`);
      }
      (variant.requiredStatRatings ?? []).forEach((requirement) => {
        if (!statsById.has(requirement.statId)) {
          addErr(`spirit_roots.json root '${root.elementId}' variant '${variant.id}' references missing stat ${requirement.statId}`);
        }
        if (typeof requirement.minRating !== 'number' || requirement.minRating < 0) {
          addErr(`spirit_roots.json root '${root.elementId}' variant '${variant.id}' has invalid minRating`);
        }
      });
      if (variant.requiredHeartLawId && !heartLawIds.has(variant.requiredHeartLawId)) {
        addErr(`spirit_roots.json root '${root.elementId}' variant '${variant.id}' references missing Heart Law ${variant.requiredHeartLawId}`);
      }
      if (variant.requiredRootResonance !== undefined && (variant.requiredRootResonance < 0 || variant.requiredRootResonance > 100)) {
        addErr(`spirit_roots.json root '${root.elementId}' variant '${variant.id}' requiredRootResonance must be 0-100`);
      }
      if (variant.requiredVerseMastery !== undefined && (variant.requiredVerseMastery < 0 || variant.requiredVerseMastery > 100)) {
        addErr(`spirit_roots.json root '${root.elementId}' variant '${variant.id}' requiredVerseMastery must be 0-100`);
      }
      if (variant.requiredDaoHeartClarity !== undefined && (variant.requiredDaoHeartClarity < 0 || variant.requiredDaoHeartClarity > 100)) {
        addErr(`spirit_roots.json root '${root.elementId}' variant '${variant.id}' requiredDaoHeartClarity must be 0-100`);
      }
    });
  });

  SPIRIT_ROOT_ELEMENT_IDS.forEach((elementId) => {
    if (!seen.has(elementId)) addErr(`spirit_roots.json missing root ${elementId}`);
  });

  return config;
}

function validateReadinessCategories(
  config: LoadedContentRaw['readiness_categories'] | undefined,
  addErr: ErrorCollector['addErr'],
): ReadinessCategoriesConfig {
  if (config === undefined) {
    return { version: 'legacy-test-raw-without-mp0-content', categories: [] };
  }

  assertObject(config, 'readiness_categories.json root');
  assertArray(config.categories, 'readiness_categories.json.categories');
  const categories = config.categories;
  assertArrayItemsHaveId(categories as any[], 'readiness_categories.json.categories');
  assertUniqueIds(categories, 'readiness_categories.json.categories');
  if (categories.length !== READINESS_CATEGORY_IDS.size) {
    addErr(`readiness_categories.json must define exactly ${READINESS_CATEGORY_IDS.size} categories, found ${categories.length}`);
  }
  const totalMaxScore = categories.reduce((sum, category) => sum + (typeof category.maxScore === 'number' ? category.maxScore : 0), 0);
  if (totalMaxScore !== 100) {
    addErr(`readiness_categories.json maxScore total must remain 100, found ${totalMaxScore}`);
  }
  categories.forEach((category, idx) => {
    if (!READINESS_CATEGORY_IDS.has(String(category.id))) {
      addErr(`readiness_categories.json.categories[${idx}] invalid id '${String(category.id)}'`);
    }
    if (typeof category.maxScore !== 'number' || category.maxScore <= 0) {
      addErr(`readiness_categories.json category '${category.id}' maxScore must be positive`);
    }
    if (!Array.isArray(category.sourceSystems) || category.sourceSystems.length === 0) {
      addErr(`readiness_categories.json category '${category.id}' sourceSystems must be non-empty`);
    }
  });

  READINESS_CATEGORY_IDS.forEach((id) => {
    if (!categories.some((category) => category.id === id)) {
      addErr(`readiness_categories.json missing category ${id}`);
    }
  });

  return config;
}

const MERIDIAN_EFFECT_TONES = new Set(['atk', 'def', 'util', '']);

function validatePathMeridians(
  config: LoadedContentRaw['path_meridians'] | undefined,
  addErr: ErrorCollector['addErr'],
): PathMeridiansConfig {
  if (config === undefined) {
    return { version: 'legacy-test-raw-without-court-content', meridians: [] };
  }

  assertObject(config, 'path_meridians.json root');
  assertArray(config.meridians, 'path_meridians.json.meridians');
  const meridians = config.meridians as PathMeridianDef[];
  assertArrayItemsHaveId(meridians as any[], 'path_meridians.json.meridians');
  assertUniqueIds(meridians, 'path_meridians.json.meridians');
  if (meridians.length !== 21) {
    addErr(`path_meridians.json must define exactly 21 path meridians (7 per path), found ${meridians.length}`);
  }

  const byPath = new Map<string, PathMeridianDef[]>();
  meridians.forEach((meridian, idx) => {
    const label = `path_meridians.json.meridians[${idx}] (${meridian.id})`;
    assertNoBasePracticeCosts(meridian as unknown as Record<string, unknown>, label, addErr);
    if (!TRAINING_PATH_IDS.has(String(meridian.path))) {
      addErr(`${label} invalid path '${String(meridian.path)}'`);
    }
    (['name', 'zi', 'exercise', 'room', 'trigger', 'pathEffect', 'trait'] as const).forEach((field) => {
      if (typeof meridian[field] !== 'string' || (meridian[field] as string).length === 0) {
        addErr(`${label} missing required string field '${field}'`);
      }
    });
    if (
      typeof meridian.unlockRealm !== 'number'
      || !Number.isInteger(meridian.unlockRealm)
      || meridian.unlockRealm < 1
      || meridian.unlockRealm > 7
    ) {
      addErr(`${label} unlockRealm must be an integer 1..7`);
    }
    if (
      typeof meridian.traitRank !== 'number'
      || !Number.isInteger(meridian.traitRank)
      || meridian.traitRank < 1
      || meridian.traitRank > 10
    ) {
      addErr(`${label} traitRank must be an integer 1..10`);
    }
    if (!Array.isArray(meridian.eff) || meridian.eff.length === 0) {
      addErr(`${label} must define at least one combat effect`);
    } else {
      meridian.eff.forEach((effect, effIdx) => {
        if (!isObject(effect) || !MERIDIAN_EFFECT_TONES.has(String((effect as { tone?: unknown }).tone))) {
          addErr(`${label}.eff[${effIdx}] has invalid tone`);
        }
        if (typeof (effect as { label?: unknown }).label !== 'string' || String((effect as { label?: unknown }).label).length === 0) {
          addErr(`${label}.eff[${effIdx}] missing label`);
        }
      });
    }
    const list = byPath.get(meridian.path) ?? [];
    list.push(meridian);
    byPath.set(meridian.path, list);
  });

  ['heaven', 'earth', 'martial'].forEach((pathId) => {
    const list = byPath.get(pathId) ?? [];
    if (list.length !== 7) {
      addErr(`path_meridians.json must define exactly 7 meridians for ${pathId}, found ${list.length}`);
      return;
    }
    // Drip cadence: exactly one meridian per realm 1..7 (signature=1, capstone Dao=7).
    const realms = list.map((meridian) => meridian.unlockRealm).sort((a, b) => a - b);
    for (let realm = 1; realm <= 7; realm += 1) {
      if (realms[realm - 1] !== realm) {
        addErr(`path_meridians.json ${pathId} must reveal one meridian per realm 1..7 (drip cadence); found ${realms.join(', ')}`);
        break;
      }
    }
  });

  return config;
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
    city.modules.forEach((moduleKey, moduleIdx) => {
      assert(typeof moduleKey === 'string', `cities[${idx}].modules[${moduleIdx}] must be a string`);
    });
    assertObject(city.refs, `cities[${idx}].refs`);
    REQUIRED_CITY_REFS_FOR_LIVE_SLICE.forEach((key) =>
      assertHasKey(city.refs, key, `cities[${idx}].refs`),
    );

    const drift = inspectLiveCitySchema(city);
    assert(
      drift.duplicateModules.length === 0,
      `cities[${idx}] (${city.id}) has duplicate modules: ${drift.duplicateModules.join(', ')}`,
    );
    assert(
      drift.missingLiveModules.length === 0,
      `cities[${idx}] (${city.id}) is missing live modules: ${drift.missingLiveModules.join(', ')}`,
    );
    assert(
      drift.deferredModulesPresent.length === 0,
      `cities[${idx}] (${city.id}) includes deferred modules for this slice: ${drift.deferredModulesPresent.join(', ')}`,
    );
    assert(
      drift.unknownModulesPresent.length === 0,
      `cities[${idx}] (${city.id}) includes unknown modules: ${drift.unknownModulesPresent.join(', ')}`,
    );
    assert(
      drift.actualOrderMatchesCanonical,
      `cities[${idx}] (${city.id}) modules must exactly match live order: ${LIVE_CITY_MODULE_ORDER.join(', ')}`,
    );
    assert(
      drift.missingRequiredRefs.length === 0,
      `cities[${idx}] (${city.id}) is missing required live refs: ${drift.missingRequiredRefs.join(', ')}`,
    );
  });
  return cities;
}

function validateTechniques(
  config: TechniquesConfig,
  statsById: Map<string, CultivatorStatDef>,
  addErr: ErrorCollector['addErr'],
): TechniqueDef[] {
  assertObject(config, 'techniques.json root');
  assertHasKey(config, 'techniques', 'techniques.json');
  assertArray((config as any).techniques, 'techniques.json.techniques');
  const techniques = (config as any).techniques as TechniqueDef[];

  let mp4ScalingCount = 0;
  techniques.forEach((tech, idx) => {
    assertObject(tech, `techniques[${idx}]`);
    assert(typeof tech.id === 'string', `techniques[${idx}].id must be a string`);
    assert(typeof tech.path === 'string', `techniques[${idx}].path must be a string`);
    assert(typeof tech.type === 'string', `techniques[${idx}].type must be a string`);

    if (tech.scalingVersion === 'mp4_v1') {
      mp4ScalingCount += 1;
      if (!tech.primaryScalingStatId || !statsById.has(tech.primaryScalingStatId)) {
        addErr(`techniques.json technique '${tech.id}' references missing primaryScalingStatId '${String(tech.primaryScalingStatId)}'`);
      }
      if (!tech.secondaryScalingStatId || !statsById.has(tech.secondaryScalingStatId)) {
        addErr(`techniques.json technique '${tech.id}' references missing secondaryScalingStatId '${String(tech.secondaryScalingStatId)}'`);
      }
      if (typeof tech.primaryScalingCoef !== 'number' || tech.primaryScalingCoef < 0) {
        addErr(`techniques.json technique '${tech.id}' must define non-negative primaryScalingCoef`);
      }
      if (typeof tech.secondaryScalingCoef !== 'number' || tech.secondaryScalingCoef < 0) {
        addErr(`techniques.json technique '${tech.id}' must define non-negative secondaryScalingCoef`);
      }
      if (!['offense', 'defense', 'utility', 'control', 'support', 'ultimate'].includes(String(tech.scalingRole))) {
        addErr(`techniques.json technique '${tech.id}' has invalid scalingRole '${String(tech.scalingRole)}'`);
      }
      if (!['offense', 'defense', 'utility', 'control', 'support', 'ultimate'].includes(String(tech.scalingCapId))) {
        addErr(`techniques.json technique '${tech.id}' has invalid scalingCapId '${String(tech.scalingCapId)}'`);
      }
      if (!Array.isArray(tech.rootAffinityIds)) {
        addErr(`techniques.json technique '${tech.id}' must define rootAffinityIds`);
      } else {
        tech.rootAffinityIds.forEach((elementId) => {
          if (!SPIRIT_ROOT_ELEMENT_IDS.has(elementId)) {
            addErr(`techniques.json technique '${tech.id}' rootAffinityIds references invalid root '${elementId}'`);
          }
        });
      }
      if (!Array.isArray(tech.heartLawTagIds)) {
        addErr(`techniques.json technique '${tech.id}' must define heartLawTagIds`);
      }
    }
  });

  assertUniqueIds(techniques, 'techniques.json.techniques');
  if (techniques.length === 60 && mp4ScalingCount !== 60) {
    addErr(`techniques.json must define MP4 scaling metadata for all 60 techniques, found ${mp4ScalingCount}`);
  }
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

    if (trial.failSafePurchase) {
      assertObject(trial.failSafePurchase, `trials[${idx}].failSafePurchase`);
      if (trial.failSafePurchase.afterEligibleFails !== undefined) {
        assert(
          typeof trial.failSafePurchase.afterEligibleFails === 'number',
          `trials[${idx}].failSafePurchase.afterEligibleFails must be a number if provided`,
        );
      }
      if (trial.failSafePurchase.costRef !== undefined) {
        assert(
          typeof trial.failSafePurchase.costRef === 'string',
          `trials[${idx}].failSafePurchase.costRef must be a string if provided`,
        );
      }
      if (trial.failSafePurchase.enabled !== undefined) {
        assert(
          typeof trial.failSafePurchase.enabled === 'boolean',
          `trials[${idx}].failSafePurchase.enabled must be a boolean if provided`,
        );
      }
    }
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

function normalizeHeartLawAffinityRules(raw: unknown): HeartLawAffinityRules | null {
  if (raw == null) {
    return null;
  }

  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const record = raw as Record<string, unknown>;
  const normalized: HeartLawAffinityRules = {};

  if (record.matchBonusByTier && typeof record.matchBonusByTier === 'object' && !Array.isArray(record.matchBonusByTier)) {
    const normalizedMatchBonusByTier: Record<string, number> = {};
    Object.entries(record.matchBonusByTier as Record<string, unknown>).forEach(([key, value]) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        normalizedMatchBonusByTier[key] = value;
      }
    });
    if (Object.keys(normalizedMatchBonusByTier).length > 0) {
      normalized.matchBonusByTier = normalizedMatchBonusByTier;
    }
  }

  if (typeof record.mismatchPenalty === 'number' && Number.isFinite(record.mismatchPenalty)) {
    normalized.mismatchPenalty = record.mismatchPenalty;
  }

  if (typeof record.appliesTo === 'string') {
    const appliesTo = record.appliesTo.trim();
    if (appliesTo.length > 0) {
      normalized.appliesTo = appliesTo;
    }
  }

  return normalized;
}

function validateHeartLaws(config: HeartLawsConfig) {
  assertObject(config, 'heart_laws.json root');
  assertHasKey(config, 'heartLaws', 'heart_laws.json');
  assertArray((config as any).heartLaws, 'heart_laws.json.heartLaws');
  const laws = (config as any).heartLaws as HeartLawsConfig['heartLaws'];
  assertUniqueIds(laws, 'heart_laws.json.heartLaws');
  return {
    laws,
    affinityRules: normalizeHeartLawAffinityRules((config as { affinityRules?: unknown }).affinityRules),
  };
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
      if (duration.variancePct !== undefined) {
        if (
          typeof duration.variancePct !== 'number' ||
          !Number.isFinite(duration.variancePct) ||
          duration.variancePct < 0 ||
          duration.variancePct > 0.5
        ) {
          errors.push(`durations[${idx}].variancePct must be between 0 and 0.5`);
        }
      }
      if (duration.rareChance !== undefined) {
        if (
          typeof duration.rareChance !== 'number' ||
          !Number.isFinite(duration.rareChance) ||
          duration.rareChance < 0 ||
          duration.rareChance > 1
        ) {
          errors.push(`durations[${idx}].rareChance must be between 0 and 1`);
        }
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
      if (entry.recommendedModuleKey !== undefined) {
        const allowed = ['apothecary', 'forge', 'manualPavilion'];
        if (!allowed.includes(entry.recommendedModuleKey)) {
          errors.push(`types[${idx}].recommendedModuleKey must be one of ${allowed.join(', ')}`);
        }
      }
      const liveRoutePurpose = typeof entry.id === 'string' ? getLiveExpeditionRoutePurpose(entry.id) : null;
      if (liveRoutePurpose && entry.recommendedModuleKey !== liveRoutePurpose.moduleKey) {
        errors.push(
          `types[${idx}].recommendedModuleKey semester route-purpose drift for ${entry.id}: expected ${liveRoutePurpose.moduleKey}`,
        );
      }
      if (entry.rareDrops !== undefined) {
        if (!Array.isArray(entry.rareDrops)) {
          errors.push(`types[${idx}].rareDrops must be an array if provided`);
        } else {
          entry.rareDrops.forEach((drop, dropIdx) => {
            if (!drop || typeof drop !== 'object') {
              errors.push(`types[${idx}].rareDrops[${dropIdx}] must be an object`);
              return;
            }
            if (typeof drop.itemId !== 'string' || !drop.itemId.trim()) {
              errors.push(`types[${idx}].rareDrops[${dropIdx}].itemId must be a string`);
            }
            if (typeof drop.qty !== 'number' || !Number.isFinite(drop.qty) || drop.qty <= 0) {
              errors.push(`types[${idx}].rareDrops[${dropIdx}].qty must be a positive number`);
            }
            if (drop.weight !== undefined) {
              if (typeof drop.weight !== 'number' || !Number.isFinite(drop.weight) || drop.weight < 0) {
                errors.push(`types[${idx}].rareDrops[${dropIdx}].weight must be a non-negative number`);
              }
            }
          });
        }
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
    throw new Error(`[ContentValidation] Expeditions content invalid: ${errors.join('; ')}`);
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


function validateApothecaryGatePrepPackages(options: {
  content: ValidatedContent;
  addErr: (msg: string) => void;
}) {
  const { content, addErr } = options;
  content.apothecary_shops.forEach((shop) => {
    const packageDef = getGatePrepPackageForCity(shop.cityId);
    if (!packageDef) return;

    const bundle = buildApothecaryCityBundle({
      content,
      shop,
      inventoryItems: {},
      purchasedTodayByStockId: {},
    });
    const coverage = evaluateGatePrepPackageCoverage({ content, shop, bundle, packageDef });
    if (!coverage) {
      addErr(`apothecary gate-prep package missing coverage for ${shop.cityId}`);
      return;
    }

    coverage.lineCoverage.forEach((line) => {
      if (!(line.itemId in buildIdMap(content.items))) {
        addErr(`gate prep package ${packageDef.transitionId} references missing item ${line.itemId}`);
      }
      if (!line.soldDirectly) {
        addErr(`gate prep package ${packageDef.transitionId} direct-core line ${line.itemId} is not sold by ${shop.id}`);
      }
      if (line.dailyLimitCapped && !line.visibleLiveBrew) {
        addErr(`gate prep package ${packageDef.transitionId} line ${line.itemId} exceeds live daily stock without brew support`);
      }
      if (line.exceedsSafeConvenienceShare && !line.visibleLiveBrew) {
        addErr(`gate prep package ${packageDef.transitionId} line ${line.itemId} exceeds 70% of daily limit without brew support`);
      }
    });

    coverage.supplementCoverage.forEach((lane) => {
      if (!lane.honest) {
        addErr(`gate prep package ${packageDef.transitionId} supplement lane ${lane.key} has no visible live support`);
      }
    });

    if (!coverage.honest) {
      addErr(`gate prep package ${packageDef.transitionId} is not economically honest for ${shop.cityId}`);
    }
  });
}


function validateSupportEconomyRuntimeTruth(options: {
  content: ValidatedContent;
  addErr: (msg: string) => void;
}) {
  const { content, addErr } = options;

  const reserveTargets = getAllSupportReserveTargets();
  const expectedReserveTargets = [
    { gateIndex: 1, meritIdealReserve: 10, spiritStoneMinimumReserve: 0, spiritStoneIdealReserve: 0 },
    { gateIndex: 2, meritIdealReserve: 15, spiritStoneMinimumReserve: 3, spiritStoneIdealReserve: 5 },
    { gateIndex: 3, meritIdealReserve: 20, spiritStoneMinimumReserve: 8, spiritStoneIdealReserve: 15 },
    { gateIndex: 4, meritIdealReserve: 25, spiritStoneMinimumReserve: 20, spiritStoneIdealReserve: 40 },
    { gateIndex: 5, meritIdealReserve: 35, spiritStoneMinimumReserve: 50, spiritStoneIdealReserve: 100 },
  ];
  if (JSON.stringify(reserveTargets) != JSON.stringify(expectedReserveTargets)) {
    addErr('support reserve targets drifted away from Packet 3.8A');
  }

  const claimExpectations = getAllSupportBountyClaimExpectations();
  if (claimExpectations.length !== 5) {
    addErr(`support bounty claim expectations must cover all five city phases; found ${claimExpectations.length}`);
  }

  const failurePolicies = getAllGateFailureMeritPolicies();
  const expectedFailurePolicies = [
    { gateIndex: 1, eligibleDefeatMerit: 2, minimumMeritReserveLow: 4, minimumMeritReserveHigh: 6 },
    { gateIndex: 2, eligibleDefeatMerit: 3, minimumMeritReserveLow: 6, minimumMeritReserveHigh: 8 },
    { gateIndex: 3, eligibleDefeatMerit: 4, minimumMeritReserveLow: 8, minimumMeritReserveHigh: 10 },
    { gateIndex: 4, eligibleDefeatMerit: 5, minimumMeritReserveLow: 10, minimumMeritReserveHigh: 12 },
    { gateIndex: 5, eligibleDefeatMerit: 7, minimumMeritReserveLow: 14, minimumMeritReserveHigh: 16 },
  ];
  if (JSON.stringify(failurePolicies) !== JSON.stringify(expectedFailurePolicies)) {
    addErr('eligible gate-failure Merit policy drifted away from Packet 3.8A');
  }

  const meritAudit = buildMeritRoleAudit(content);
  if (meritAudit.violations.length > 0) {
    addErr(`visible live Merit sinks must be fail-safe only; found ${meritAudit.violations.map((entry) => entry.id).join(', ')}`);
  }

  const countedSources = getLiveCraftBountyCountedSources().slice().sort().join(',');
  if (countedSources !== ['apothecary_brew_claim', 'forge_claim'].sort().join(',')) {
    addErr(`CRAFT_COMPLETE counted sources drifted: ${countedSources}`);
  }

  const excludedSources = getLiveCraftBountyExcludedSources();
  ['talisman_claim', 'shop_buy', 'deferred_craft'].forEach((source) => {
    if (!excludedSources.includes(source as (typeof excludedSources)[number])) {
      addErr(`CRAFT_COMPLETE must exclude ${source}`);
    }
  });

  if (!/forge or Apothecary Brew/i.test(bountyKindToProgressRule('CRAFT_COMPLETE'))) {
    addErr('CRAFT_COMPLETE progress rule must explicitly mention forge or Apothecary Brew claims');
  }

  const liveTemplateKinds = new Set(content.bounties.templates.map((template) => template.kind));
  if (liveTemplateKinds.has('TRIAL_CLEAR')) {
    addErr('live bounty templates must not include TRIAL_CLEAR');
  }

  const craftDestination = resolveBountyDestination({
    cityId: 'city_pinewind_hamlet',
    bountyKind: 'CRAFT_COMPLETE',
    cityModules: ['apothecary'],
    craftRouteSupportState: {
      apothecaryBelowFloor: true,
      forgeBelowFloor: false,
      apothecaryQueueOrStockGap: true,
    },
  });
  if (craftDestination.kind !== 'module' || craftDestination.moduleKey !== 'apothecary') {
    addErr('CRAFT_COMPLETE must remain routable through live Apothecary Brew support when Forge is absent');
  }

  const forgeDestination = resolveBountyDestination({
    cityId: 'city_stonecrag_town',
    bountyKind: 'CRAFT_COMPLETE',
    cityModules: ['apothecary', 'forge'],
    craftRouteSupportState: {
      apothecaryBelowFloor: false,
      forgeBelowFloor: true,
      apothecaryQueueOrStockGap: false,
    },
  });
  if (forgeDestination.kind !== 'module' || forgeDestination.moduleKey !== 'forge') {
    addErr('CRAFT_COMPLETE must remain routable through the live Forge floor when forge support is the honest need');
  }

  if (getExpeditionBountyCreditCityId({ cityId: 'city_stonecrag_town' }) !== 'city_stonecrag_town') {
    addErr('EXPEDITION_COMPLETE credit must remain pinned to expedition origin city');
  }

  const supportModel = buildSupportEconomyReadModelFromState({
    content,
    cityId: 'city_stonecrag_town',
    currencies: { merit: '7', spiritStones: '2', gold: '1000000' },
  });
  if (supportModel.meritMinimumReserveLow !== '6' || supportModel.meritMinimumReserveHigh !== '8') {
    addErr('support economy read model drifted away from the locked minimum Merit reserve band');
  }
  if (supportModel.expectedMeritAfterThreeEligibleDefeats !== '16') {
    addErr('support economy read model drifted away from the locked eligible-failure Merit projection');
  }
}

function validateEconomicRecommendationRuntimeTruth(options: {
  content: ValidatedContent;
  addErr: (msg: string) => void;
}) {
  const { content, addErr } = options;
  const prepBudgets = getAllPrepBudgetRegistryEntries();
  if (prepBudgets.length !== 5) {
    addErr(`prep-budget registry must cover all five live transitions; found ${prepBudgets.length}`);
  }

  const expectedTransitions = [
    'qi_condensation_to_foundation',
    'foundation_to_core_formation',
    'core_formation_to_nascent_soul',
    'nascent_soul_to_soul_formation',
    'soul_formation_to_spirit_severing',
  ];
  if (prepBudgets.map((entry) => entry.transitionId).join(',') !== expectedTransitions.join(',')) {
    addErr('prep-budget registry drifted away from the canonical semester transition order');
  }

  const spendPolicies = getAllSpendOrderPolicies();
  if (spendPolicies.length !== 5) {
    addErr(`spend-order policy must expose five gate snapshots; found ${spendPolicies.length}`);
  }
  if (spendPolicies.some((entry) => entry.priorities.length !== 7)) {
    addErr('spend-order policy must preserve all seven priorities');
  }
  if (spendPolicies.some((entry) => entry.pavilionSpendCeilingBeforeResolve <= 0)) {
    addErr('spend-order policy must expose a pavilion spend ceiling for every gate');
  }
  if (spendPolicies.some((entry) => entry.spiritRootRerollSpendCeilingBeforeResolve <= 0)) {
    addErr('spend-order policy must expose a spirit-root reroll spend ceiling for every gate');
  }

  const moduleRoles = getEconomicModuleRoleEntries();
  if (moduleRoles.length !== ECONOMY_FACING_MODULE_KEYS.length) {
    addErr(`module-role registry must cover ${ECONOMY_FACING_MODULE_KEYS.length} live economy-facing modules; found ${moduleRoles.length}`);
  }

  const deferredLeaks = getDeferredModuleLeakKeysForModuleRoleRegistry();
  if (deferredLeaks.length > 0) {
    addErr(`module-role registry must not include deferred modules: ${deferredLeaks.join(', ')}`);
  }

  const missingModuleRoles = ECONOMY_FACING_MODULE_KEYS
    .filter((moduleKey) => !moduleRoles.some((entry) => entry.moduleKey === moduleKey));
  if (missingModuleRoles.length > 0) {
    addErr(`module-role registry missing economy-facing modules: ${missingModuleRoles.join(', ')}`);
  }

  const expeditionConsistency = getExpeditionPurposeConsistencySummary();
  if (expeditionConsistency.missingModuleRoles.length > 0) {
    addErr(`module-role registry drifted away from expedition route purposes: ${expeditionConsistency.missingModuleRoles.join(', ')}`);
  }

  for (const cityId of SEMESTER_SLICE_CONTRACT.liveCityIds) {
    const city = content.cities.find((entry) => entry.id === cityId);
    if (!city) continue;
    const floorSnapshot = buildEconomicStockFloorSnapshot({ gateIndex: city.index + 1, cityId });
    if (!floorSnapshot.cultivationPrepItemId) {
      addErr(`economic stock-floor adapter must resolve a cultivation prep item for ${cityId}`);
    }
  }

  const prepTargets = getPrepEconomyTargets();
  if (prepTargets.isolatedRecoveryCategories.length !== 3) {
    addErr('prep-economy targets must expose all three isolated recovery categories');
  }
  if (Object.keys(prepTargets.recoveryWindowsByGate).length !== 5) {
    addErr('prep-economy recovery windows must cover all five gates');
  }

  const prepFit = buildAllPrepPackageFitReports(content);
  if (prepFit.some((entry) => !entry.honest)) {
    addErr(`prep package fit audit found non-honest packages: ${prepFit.filter((entry) => !entry.honest).map((entry) => entry.transitionId).join(', ')}`);
  }

  const bypassRatios = buildAllPrepVsBypassEconomyReports(content);
  if (bypassRatios.some((entry) => !entry.minimumRatioWithinBand || !entry.recommendedRatioWithinBand || !entry.emergencyOnly)) {
    addErr('prep-vs-bypass economics drifted outside the locked ratio bands or emergency-only policy');
  }

  const reservePacing = buildAllSupportReservePacingReports(content, { merit: 0, spiritStones: 0 });
  if (reservePacing.some((entry) => entry.failSafeThreshold !== 3)) {
    addErr('fail-safe threshold must remain locked at 3 eligible defeats');
  }
  if (reservePacing.some((entry) => !entry.verdicts.reserveGapRoutesToBountiesFirst)) {
    addErr('support reserve-gap routing must keep Bounties as the primary destination');
  }
  if (reservePacing.some((entry) => entry.blockers.length > 0)) {
    addErr(`support reserve pacing blockers detected: ${reservePacing.filter((entry) => entry.blockers.length > 0).map((entry) => `gate_${entry.gateIndex}`).join(', ')}`);
  }

  const phaseSnapshot = buildEconomicPhaseSnapshotFromState({
    content,
    currentCityId: 'city_stonecrag_town',
    unlockedCityIds: ['city_pinewind_hamlet', 'city_stonecrag_town'],
    currentRealmIndex: 1,
    selectedPath: 'earth',
    trialProgressById: {},
  });
  if (phaseSnapshot.currentGateIndex !== 2) {
    addErr('economic phase resolver drifted away from the canonical Stonecrag gate index');
  }
  if (phaseSnapshot.nextUnresolvedGateTransition?.toRealmId === 'spirit_severing' && phaseSnapshot.currentGateIndex > 5) {
    addErr('economic phase resolver must not invent a fake gate 6 transition');
  }
}


function validateEconomicSourceRoutingTruth(options: {
  content: ValidatedContent;
  addErr: (msg: string) => void;
}) {
  const { content, addErr } = options;
  const index = buildBestSourceIndex(content);
  if (index.scopeTargetIds.length === 0) {
    addErr('best-source index must cover a non-empty live-critical scope');
    return;
  }

  const missingPrimary = index.entries.filter((entry) => !entry.primarySource);
  if (missingPrimary.length > 0) {
    addErr(`best-source index missing primary source for: ${missingPrimary.map((entry) => entry.targetId).join(', ')}`);
  }

  const invalidRoutes = index.entries.flatMap((entry) => entry.sourceOptions.filter((option) => option.moduleKey === 'alchemy' as never));
  if (invalidRoutes.length > 0) {
    addErr('best-source index must not point at a separate live Alchemy room');
  }

  const deferredLeaks = index.entries.flatMap((entry) =>
    entry.sourceOptions.filter((option) => !['outskirts', 'ruins', 'apothecary', 'forge', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'].includes(option.moduleKey)),
  );
  if (deferredLeaks.length > 0) {
    addErr(`best-source index leaked non-live modules: ${deferredLeaks.map((entry) => entry.moduleKey).join(', ')}`);
  }

  const commonField = index.entriesByTargetId['mat_common_herb_bundle'];
  if (commonField?.primarySource?.sourceKind !== 'outskirts') {
    addErr('common shortages must route to Outskirts first');
  }

  const targeted = index.entriesByTargetId['mat_spirit_leaf'];
  if (targeted?.primarySource?.sourceKind !== 'ruins') {
    addErr('targeted local shortages must route to Ruins first');
  }

  const merit = index.entriesByTargetId['merit'];
  if (merit?.primarySource?.sourceKind !== 'bounties') {
    addErr('Merit reserve gaps must route to Bounties first');
  }

  const spiritStones = index.entriesByTargetId['spiritStones'];
  if (spiritStones?.primarySource?.sourceKind !== 'bounties') {
    addErr('Spirit-stone reserve gaps must route to Bounties first');
  }

  const expeditionMismatch = index.entries.flatMap((entry) =>
    entry.sourceOptions.filter((option) => option.sourceKind === 'expeditions' && option.moduleKey !== 'expeditions'),
  );
  if (expeditionMismatch.length > 0) {
    addErr('expedition-derived best-source entries must preserve expeditionRouteContract module truth');
  }

  const multiFallback = index.entries.flatMap((entry) =>
    entry.sourceOptions.filter((option) => option.locality === 'one_prior_fallback' && option.cityId && content.cities.find((city) => city.id === option.cityId)?.index! < 0),
  );
  if (multiFallback.length > 0) {
    addErr('best-source index emitted an invalid backward fallback');
  }

  const sampleRoutes = [
    resolveMissingMaterialRoutes({
      content,
      targetId: 'cons_healing_pellet_t1',
      currentCityId: 'city_pinewind_hamlet',
      unlockedCityIds: ['city_pinewind_hamlet'],
      availableModuleKeys: ['apothecary', 'forge', 'outskirts', 'ruins', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'],
      shortageQty: 1,
    }),
    resolveMissingMaterialRoutes({
      content,
      targetId: 'mat_spirit_steel_ore',
      currentCityId: 'city_ironpeak_bastion',
      unlockedCityIds: content.cities.map((city) => city.id),
      availableModuleKeys: ['apothecary', 'forge', 'outskirts', 'ruins', 'bounties', 'expeditions', 'manualPavilion', 'gateTrial'],
    }),
  ];

  if (sampleRoutes.some((routes) => routes.some((route) => route.destinationModuleKey === 'alchemy' as never))) {
    addErr('route resolver must not point to a separate live Alchemy room');
  }
  if (sampleRoutes.some((routes) => routes.some((route) => (route.blockedReason ?? '').includes('multiple older cities')))) {
    addErr('route resolver must not require multiple prior-city fallback hops');
  }

  const missingPolicies = getAllProblemDestinationPolicies().filter((policy) => policy.primaryDestinations.length === 0 || policy.primaryModuleKeys.length === 0);
  if (missingPolicies.length > 0) {
    addErr(`problem destination policy missing primary destinations for: ${missingPolicies.map((policy) => policy.problemKind).join(', ')}`);
  }
}

export function validateLoadedContent(raw: LoadedContentRaw): ValidatedContent {
  const errors: string[] = [];
  const addErr = (msg: string) => errors.push(`[ContentValidation] ${msg}`);

  // Basic shape validation
  const cities = validateCities(raw.cities);
  const cultivatorStats = validateCultivatorStats(raw.cultivator_stats, addErr);
  const cultivatorStatsById = buildIdMap(cultivatorStats.stats);
  const cultivatorStatsMap = new Map(cultivatorStats.stats.map((stat) => [stat.id, stat]));
  const techniques = validateTechniques(raw.techniques, cultivatorStatsMap, addErr);
  const items = validateItems(raw.items);
  const pavilions = validatePavilions(raw.pavilions);
  const outskirts = validateOutskirts(raw.outskirts);
  const enemies = validateEnemies(raw.enemies);
  const trials = validateTrials(raw.trials);
  const ruins = validateRuins(raw.ruins);
  const runes = validateRunes(raw.runes);
  const { laws: heartLaws, affinityRules: heartLawAffinityRules } = validateHeartLaws(raw.heart_laws);
  const prestige = validatePrestige(raw.prestige_store);
  const alchemyRecipes = validateAlchemy(raw.alchemy_recipes);
  const forgeBlueprints = validateForge(raw.forge_blueprints);
  const talismanRecipes = validateTalismans(raw.talisman_recipes);
  const apothecaryShops = validateApothecary(raw.apothecary_shops, addErr);
  const expeditions = validateExpeditions(raw.expeditions);
  const bountyConfig = validateBounties(raw.bounties);
  const pavilionRecords = validatePavilionRecordsManifest(raw.pavilion_records);
  const onboardingMilestones = validateOnboardingMilestones(raw.onboarding_milestones, addErr);
  const trainingRegimens = validateTrainingRegimens(raw.training_regimens, cultivatorStatsMap, addErr);
  const daoHeartPractices = validateDaoHeartPractices(raw.dao_heart_practices, addErr);
  const spiritRoots = validateSpiritRoots(
    raw.spirit_roots,
    new Map(cultivatorStats.stats.map((stat) => [stat.id, stat])),
    new Set(heartLaws.map((law) => law.id)),
    addErr,
  );
  const readinessCategories = validateReadinessCategories(raw.readiness_categories, addErr);
  // Tier-2 path meridians (Three Treasures, W2). Validated for its own correctness;
  // not yet surfaced on ValidatedContent (the W6 surface builder will consume it).
  validatePathMeridians(raw.path_meridians, addErr);
  const normalizedTrials = trials.map((trial) => normalizeTrialFailSafeDefinition(trial, raw.economy));

  // Build maps for cross references
  const cityMap = buildIdMap(cities);
  const itemMap = buildIdMap(items);
  const pavilionMap = buildIdMap(pavilions);
  const outskirtsMap = buildIdMap(outskirts);
  const enemyMap = buildIdMap(enemies);
  const trialMap = buildIdMap(normalizedTrials);
  const ruinMap = buildIdMap(ruins);
  const runeMap = buildIdMap(runes);
  const techniqueMap = buildIdMap(techniques);
  const apothecaryMap = buildIdMap(apothecaryShops);
  const lawMap = buildIdMap(heartLaws);
  const prestigeMap = buildIdMap(prestige.upgrades);
  const bountyTemplateMap = buildIdMap(bountyConfig.templates);
  Object.keys(cultivatorStatsById);

  buildLiveCityPackageRegistry({
    cities,
    outskirtsById: outskirtsMap,
    trialsById: trialMap,
    ruinsById: ruinMap,
    pavilionsById: pavilionMap,
    apothecaryById: apothecaryMap,
  }).coverageIssues.forEach((issue) => addErr(formatLiveCityPackageCoverageIssue(issue)));

  inspectSemesterCityPackageCoverage({
    cities,
    outskirtsById: outskirtsMap,
    trialsById: trialMap,
    ruinsById: ruinMap,
    pavilionsById: pavilionMap,
    apothecaryById: apothecaryMap,
    bounties: bountyConfig,
    expeditions,
  }).forEach((report) => {
    formatCityPackageCoverageReport(report).forEach(addErr);
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

  validateApothecaryGatePrepPackages({
    content: {
      raw,
      economy: raw.economy,
      cities,
      items,
      techniques,
      pavilions,
      outskirts,
      enemies,
      trials: normalizedTrials,
      ruins,
      runes,
      talisman_recipes: talismanRecipes,
      alchemy_recipes: alchemyRecipes,
      forge_blueprints: forgeBlueprints,
      apothecary_shops: apothecaryShops,
      expeditions,
      bounties: bountyConfig,
      heart_laws: heartLaws,
      heart_law_affinity_rules: heartLawAffinityRules,
      prestige_store: prestige,
      pavilion_records: pavilionRecords,
      onboarding_milestones: onboardingMilestones,
      cultivator_stats: cultivatorStats,
      training_regimens: trainingRegimens,
      dao_heart_practices: daoHeartPractices,
      spirit_roots: spiritRoots,
      readiness_categories: readinessCategories,
    },
    addErr,
  });

  validateSupportEconomyRuntimeTruth({
    content: {
      raw,
      economy: raw.economy,
      cities,
      items,
      techniques,
      pavilions,
      outskirts,
      enemies,
      trials: normalizedTrials,
      ruins,
      runes,
      talisman_recipes: talismanRecipes,
      alchemy_recipes: alchemyRecipes,
      forge_blueprints: forgeBlueprints,
      apothecary_shops: apothecaryShops,
      expeditions,
      bounties: bountyConfig,
      heart_laws: heartLaws,
      heart_law_affinity_rules: heartLawAffinityRules,
      prestige_store: prestige,
      pavilion_records: pavilionRecords,
      onboarding_milestones: onboardingMilestones,
      cultivator_stats: cultivatorStats,
      training_regimens: trainingRegimens,
      dao_heart_practices: daoHeartPractices,
      spirit_roots: spiritRoots,
      readiness_categories: readinessCategories,
    },
    addErr,
  });
  validateEconomicRecommendationRuntimeTruth({
    content: {
      raw,
      economy: raw.economy,
      cities,
      items,
      techniques,
      pavilions,
      outskirts,
      enemies,
      trials: normalizedTrials,
      ruins,
      runes,
      talisman_recipes: talismanRecipes,
      alchemy_recipes: alchemyRecipes,
      forge_blueprints: forgeBlueprints,
      apothecary_shops: apothecaryShops,
      expeditions,
      bounties: bountyConfig,
      heart_laws: heartLaws,
      heart_law_affinity_rules: heartLawAffinityRules,
      prestige_store: prestige,
      pavilion_records: pavilionRecords,
      onboarding_milestones: onboardingMilestones,
      cultivator_stats: cultivatorStats,
      training_regimens: trainingRegimens,
      dao_heart_practices: daoHeartPractices,
      spirit_roots: spiritRoots,
      readiness_categories: readinessCategories,
    },
    addErr,
  });
  validateEconomicSourceRoutingTruth({
    content: {
      raw,
      economy: raw.economy,
      cities,
      items,
      techniques,
      pavilions,
      outskirts,
      enemies,
      trials: normalizedTrials,
      ruins,
      runes,
      talisman_recipes: talismanRecipes,
      alchemy_recipes: alchemyRecipes,
      forge_blueprints: forgeBlueprints,
      apothecary_shops: apothecaryShops,
      expeditions,
      bounties: bountyConfig,
      heart_laws: heartLaws,
      heart_law_affinity_rules: heartLawAffinityRules,
      prestige_store: prestige,
      pavilion_records: pavilionRecords,
      onboarding_milestones: onboardingMilestones,
      cultivator_stats: cultivatorStats,
      training_regimens: trainingRegimens,
      dao_heart_practices: daoHeartPractices,
      spirit_roots: spiritRoots,
      readiness_categories: readinessCategories,
    },
    addErr,
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

  normalizedTrials.forEach((trial, idx) => {
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
    validateForgeBlueprintStepScript(blueprint, `forge_blueprints.blueprints[${idx}]`, addErr);
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

  const liveEconomyCatalog = buildLiveEconomyCatalog({ items, alchemy_recipes: alchemyRecipes, forge_blueprints: forgeBlueprints, cities });
  const liveForgeCatalog = buildLiveForgeCatalog({ forge_blueprints: forgeBlueprints, cities });
  const forgeLadderAudit = buildForgeLadderAudit({ forge_blueprints: forgeBlueprints, cities });

  alchemyRecipes.forEach((recipe, idx) => {
    const status = liveEconomyCatalog.alchemyRecipeStatusById[recipe.id] ?? 'unknown';
    if (status !== 'visible_live') return;
    Object.keys(recipe.outputs ?? {}).forEach((itemId) => {
      const itemStatus = liveEconomyCatalog.itemStatusById[itemId] ?? 'unknown';
      if (itemStatus !== 'visible_live') {
        addErr(`alchemy_recipes.recipes[${idx}] visible live recipe outputs non-live item '${itemId}' (${itemStatus})`);
      }
    });
  });

  const visibleRuneOutputToBlueprintIds = new Map<string, string[]>();
  forgeBlueprints.forEach((blueprint, idx) => {
    const status = liveEconomyCatalog.forgeBlueprintStatusById[blueprint.id] ?? 'unknown';
    if (status !== 'visible_live') return;
    Object.keys(blueprint.outputs ?? {}).forEach((itemId) => {
      const itemStatus = liveEconomyCatalog.itemStatusById[itemId] ?? 'unknown';
      if (itemStatus !== 'visible_live') {
        addErr(`forge_blueprints.blueprints[${idx}] visible live blueprint outputs non-live item '${itemId}' (${itemStatus})`);
      }
      if (itemId.startsWith('rune_')) {
        const list = visibleRuneOutputToBlueprintIds.get(itemId) ?? [];
        list.push(blueprint.id);
        visibleRuneOutputToBlueprintIds.set(itemId, list);
      }
    });
  });

  visibleRuneOutputToBlueprintIds.forEach((blueprintIds, itemId) => {
    const canonical = blueprintIds.filter((id) => id.startsWith('forge_rune_'));
    const legacy = blueprintIds.filter((id) => id.startsWith('rune_inscription_'));
    if (canonical.length > 0 && legacy.length > 0) {
      addErr(`visible rune family drift remains for '${itemId}': canonical=${canonical.join(', ')} legacy=${legacy.join(', ')}`);
    }
  });

  LIVE_REFINE_LADDER_IDS.forEach((id) => {
    if (!liveForgeCatalog.entriesById[id] || liveForgeCatalog.entriesById[id].status !== 'visible_live') {
      addErr(`live forge refine ladder missing visible tier '${id}'`);
    }
  });

  LIVE_TEMPER_LADDER_IDS.forEach((id) => {
    if (!liveForgeCatalog.entriesById[id] || liveForgeCatalog.entriesById[id].status !== 'visible_live') {
      addErr(`live forge temper ladder missing visible tier '${id}'`);
    }
  });

  Object.entries(LIVE_RUNE_CITY_PAIRS).forEach(([cityId, ids]) => {
    ids.forEach((id) => {
      if (!liveForgeCatalog.entriesById[id] || liveForgeCatalog.entriesById[id].status !== 'visible_live') {
        addErr(`live forge rune ladder missing '${id}' for city '${cityId}'`);
      }
    });
  });

  const visibleForgeFamilies = Array.from(new Set(
    Object.values(liveForgeCatalog.entriesById)
      .filter((entry) => entry.status === 'visible_live')
      .map((entry) => entry.familyLabel),
  ));
  if (visibleForgeFamilies.some((label) => !['Refine', 'Temper', 'Runes'].includes(label))) {
    addErr(`live forge visibility leaked non-semester family: ${visibleForgeFamilies.join(', ')}`);
  }

  DEFERRED_FORGE_BLUEPRINT_IDS.forEach((id) => {
    if (liveForgeCatalog.entriesById[id]?.status === 'visible_live') {
      addErr(`deferred forge blueprint '${id}' leaked into live visibility`);
    }
  });

  LEGACY_RUNE_BLUEPRINT_IDS.forEach((id) => {
    if (liveForgeCatalog.entriesById[id]?.status === 'visible_live') {
      addErr(`legacy rune blueprint '${id}' leaked into live forge visibility`);
    }
  });

  if (!forgeLadderAudit.spiritDewSinkIds.includes('forge_temper_accessory_t1')) {
    addErr('spirit_dew no longer resolves to visible accessory temper t1 sink');
  }

  ['forge_temper_weapon_t2', 'forge_temper_accessory_t2', 'forge_temper_weapon_t3', 'forge_temper_accessory_t3'].forEach((id) => {
    if (!forgeLadderAudit.artifactShardSinkIds.includes(id)) {
      addErr(`artifact_shard missing visible temper sink '${id}'`);
    }
  });

  if (forgeLadderAudit.lateRefineArtifactShardCounts.forge_refine_uncommon_t3 !== 1) addErr('forge_refine_uncommon_t3 must consume 1 mat_artifact_shard');
  if (forgeLadderAudit.lateRefineArtifactShardCounts.forge_refine_rare_t4 !== 2) addErr('forge_refine_rare_t4 must consume 2 mat_artifact_shard');
  if (forgeLadderAudit.lateRefineArtifactShardCounts.forge_refine_legendary_t5 !== 4) addErr('forge_refine_legendary_t5 must consume 4 mat_artifact_shard');

  const visibleForgeByCity = cities.map((city) => ({
    cityId: city.id,
    count: Object.values(liveForgeCatalog.entriesById).filter((entry) => entry.cityId === city.id && entry.status === 'visible_live').length,
  }));
  visibleForgeByCity.forEach((entry) => {
    if (entry.count === 0) addErr(`city '${entry.cityId}' has no visible live forge pressure`);
  });

  const visibleForgeOutputToBlueprintIds = new Map<string, string[]>();
  Object.values(liveForgeCatalog.entriesById).forEach((entry) => {
    if (entry.status !== 'visible_live') return;
    Object.keys(entry.blueprint.outputs ?? {}).forEach((itemId) => {
      const ids = visibleForgeOutputToBlueprintIds.get(itemId) ?? [];
      ids.push(entry.blueprintId);
      visibleForgeOutputToBlueprintIds.set(itemId, ids);
    });
  });
  visibleForgeOutputToBlueprintIds.forEach((ids, outputId) => {
    if (ids.length > 1) addErr(`visible forge output '${outputId}' is duplicated across blueprints: ${ids.join(', ')}`);
  });

  const liveEconomyReport = buildLiveEconomyAuditReport({
    raw,
    economy: raw.economy,
    cities,
    items,
    techniques,
    pavilions,
    outskirts,
    enemies,
    trials: normalizedTrials,
    ruins,
    alchemy_recipes: alchemyRecipes,
    forge_blueprints: forgeBlueprints,
    runes,
    talisman_recipes: talismanRecipes,
    apothecary_shops: apothecaryShops,
    expeditions,
    bounties: bountyConfig,
    heart_laws: heartLaws,
    heart_law_affinity_rules: heartLawAffinityRules,
    prestige_store: prestige,
    pavilion_records: pavilionRecords,
    onboarding_milestones: onboardingMilestones,
    cultivator_stats: cultivatorStats,
    training_regimens: trainingRegimens,
    dao_heart_practices: daoHeartPractices,
    spirit_roots: spiritRoots,
    readiness_categories: readinessCategories,
  });
  const targetedMaterialAudit = buildTargetedMaterialSinkAudit({
    raw,
    economy: raw.economy,
    cities,
    items,
    techniques,
    pavilions,
    outskirts,
    enemies,
    trials: normalizedTrials,
    ruins,
    alchemy_recipes: alchemyRecipes,
    forge_blueprints: forgeBlueprints,
    runes,
    talisman_recipes: talismanRecipes,
    apothecary_shops: apothecaryShops,
    expeditions,
    bounties: bountyConfig,
    heart_laws: heartLaws,
    heart_law_affinity_rules: heartLawAffinityRules,
    prestige_store: prestige,
    pavilion_records: pavilionRecords,
    onboarding_milestones: onboardingMilestones,
    cultivator_stats: cultivatorStats,
    training_regimens: trainingRegimens,
    dao_heart_practices: daoHeartPractices,
    spirit_roots: spiritRoots,
    readiness_categories: readinessCategories,
  });

  const expectedBlockerIds = listKnownLiveEconomyBlockers().map((entry) => entry.id).sort();
  const actualBlockerIds = liveEconomyReport.activeBlockerIds.slice().sort();
  if (expectedBlockerIds.length > 0 || actualBlockerIds.length > 0) {
    addErr(`Packet 3.1 blocker registry must be empty: expected=${expectedBlockerIds.join(', ')} actual=${actualBlockerIds.join(', ')}`);
  }

  const packet36AMaterialSinkStatus = getPacket36AMaterialSinkStatus(liveEconomyReport);
  if (!packet36AMaterialSinkStatus.mat_spirit_dew.hasVisibleLiveSink) {
    addErr('Packet 3.6A named blocker unresolved: mat_spirit_dew has no visible live sink');
  }
  if (!packet36AMaterialSinkStatus.mat_artifact_shard.hasVisibleLiveSink) {
    addErr('Packet 3.6A named blocker unresolved: mat_artifact_shard has no visible live sink');
  }

  getSinklessLiveMaterials(liveEconomyReport).forEach((entry) => {
    addErr(`live material '${entry.itemId}' has no visible live sink`);
  });

  liveEconomyReport.reagentPathAudits.forEach((entry) => {
    if (entry.missingDependencyIds.length === 0) return;
    addErr(`visible live reagent path missing for '${entry.blueprintId}': ${entry.missingDependencyIds.join(', ')}`);
  });

  const spiritDewAudit = getLiveEconomyItemAuditById(liveEconomyReport, 'mat_spirit_dew');
  if ((spiritDewAudit?.liveSinks.length ?? 0) === 0) {
    addErr('Packet 3.6A named blocker unresolved: mat_spirit_dew does not route into any visible live sink');
  }

  const artifactShardAudit = getLiveEconomyItemAuditById(liveEconomyReport, 'mat_artifact_shard');
  if ((artifactShardAudit?.liveSinks.length ?? 0) === 0) {
    addErr('Packet 3.6A named blocker unresolved: mat_artifact_shard does not route into any visible live sink');
  }

  const quenchingOilRecipe = alchemyRecipes.filter((recipe) => recipe.id === 'alc_reagent_quenching_oil_t2');
  if (quenchingOilRecipe.length !== 1) {
    addErr(`Packet 3.6A requires exactly one alc_reagent_quenching_oil_t2 recipe, found ${quenchingOilRecipe.length}`);
  } else {
    const [recipe] = quenchingOilRecipe;
    if ((liveEconomyCatalog.alchemyRecipeStatusById[recipe.id] ?? 'unknown') !== 'visible_live') {
      addErr('Packet 3.6A requires alc_reagent_quenching_oil_t2 to remain visible_live');
    }
    if ((recipe.timeSec ?? 0) !== 240) {
      addErr('Packet 3.6A requires alc_reagent_quenching_oil_t2 to run at 240 seconds');
    }
    const inputIds = Object.keys(recipe.inputs ?? {}).sort();
    if (inputIds.join(',') !== ['mat_furnace_cinder', 'mat_thunder_sand'].join(',')) {
      addErr(`Packet 3.6A requires alc_reagent_quenching_oil_t2 to use only mat_furnace_cinder and mat_thunder_sand; found ${inputIds.join(', ')}`);
    }
  }

  if (!hasVisibleLiveReagentPath(liveEconomyReport, 'forge_refine_legendary_t5', 'reagent_quenching_oil_t2')) {
    addErr('Packet 3.6A named blocker unresolved: forge_refine_legendary_t5 lacks a visible live reagent_quenching_oil_t2 path');
  }

  const legendaryPathAudit = getLiveReagentPathAuditByBlueprintId(liveEconomyReport, 'forge_refine_legendary_t5');
  if ((legendaryPathAudit?.missingDependencyIds ?? []).includes('reagent_quenching_oil_t2')) {
    addErr('Packet 3.6A named blocker unresolved: forge_refine_legendary_t5 still reports missing reagent_quenching_oil_t2');
  }

  targetedMaterialAudit.entries.forEach((entry) => {
    if (!entry.hasVisibleLiveSink) {
      addErr(`Packet 3.6 targeted material '${entry.materialId}' has no visible live sink`);
    }
    if (entry.onlyHiddenOrDeferred) {
      addErr(`Packet 3.6 targeted material '${entry.materialId}' resolves only to hidden/deferred sink paths: ${entry.hiddenOrDeferredSinkIds.join(', ')}`);
    }
    if (entry.onlyDuplicateNoisy) {
      addErr(`Packet 3.6 targeted material '${entry.materialId}' resolves only to duplicate-noisy visible outputs`);
    }
  });

  forgeBlueprints.forEach((blueprint) => {
    const family = getForgeBlueprintFamily(blueprint);
    const status = liveEconomyCatalog.forgeBlueprintStatusById[blueprint.id] ?? 'unknown';
    if (family === 'hidden-other' && LEGACY_RUNE_BLUEPRINT_IDS.includes(blueprint.id as (typeof LEGACY_RUNE_BLUEPRINT_IDS)[number]) && status === 'visible_live') {
      addErr(`legacy rune blueprint '${blueprint.id}' is still visible live`);
    }
  });

  const activityRewardAudit = buildActivityRewardAuditReport({
    economy: raw.economy,
    outskirts,
    ruins,
  });

  activityRewardAudit.cities.forEach((cityAudit) => {
    if (cityAudit.outskirts.goldPosture !== 'primary') {
      addErr(`outskirts '${cityAudit.outskirts.cityId}' lost its gold-engine posture`);
    }
    if (cityAudit.outskirts.commonFieldHits.length < Math.min(3, cityAudit.outskirts.commonPool.length)) {
      addErr(`outskirts '${cityAudit.outskirts.cityId}' no longer reads as common-field-first`);
    }
    if (cityAudit.outskirts.targetedLeakageInCommon.length > 0) {
      addErr(
        `outskirts '${cityAudit.outskirts.cityId}' common pool leaks targeted/anchor materials: ${cityAudit.outskirts.targetedLeakageInCommon.join(', ')}`,
      );
    }
    if (cityAudit.outskirts.anchorLeakage.length > 0) {
      addErr(`outskirts '${cityAudit.outskirts.cityId}' includes deterministic ruin anchor items: ${cityAudit.outskirts.anchorLeakage.join(', ')}`);
    }
    if (cityAudit.outskirts.targetedRareSpikes.length === 0) {
      addErr(`outskirts '${cityAudit.outskirts.cityId}' lost all intentional local rare spikes`);
    }
    if (cityAudit.ruins.goldPosture !== 'secondary') {
      addErr(`ruins '${cityAudit.ruins.cityId}' lost its secondary gold posture`);
    }
    if (!cityAudit.ruins.hasDeterministicAnchor) {
      addErr(`ruins '${cityAudit.ruins.cityId}' missing deterministic anchor '${cityAudit.ruins.deterministicAnchorItemId}'`);
    }
    if (cityAudit.ruins.leadMaterialsInRooms.length === 0) {
      addErr(`ruins '${cityAudit.ruins.cityId}' room drops lost local targeted-material identity`);
    }
    if (cityAudit.ruins.targetedMaterialsInChest.length === 0) {
      addErr(`ruins '${cityAudit.ruins.cityId}' final chest lost targeted-material identity`);
    }
    if (!cityAudit.ruins.rarePityConfigured) {
      addErr(`ruins '${cityAudit.ruins.cityId}' boss chest pity is not configured`);
    }
  });

  const rewardParityAudit = buildRewardParityAuditReport({
    economy: raw.economy,
    outskirts,
    ruins,
  });

  rewardParityAudit.cities.forEach((cityAudit) => {
    cityAudit.rules.forEach((rule) => {
      if (!rule.passed) {
        addErr(`reward parity drift for '${cityAudit.cityId}' (${rule.ruleId}): ${rule.detail}`);
      }
    });
  });

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
    trials: normalizedTrials,
    ruins,
    alchemy_recipes: alchemyRecipes,
    forge_blueprints: forgeBlueprints,
    runes,
    talisman_recipes: talismanRecipes,
    apothecary_shops: apothecaryShops,
    expeditions,
    bounties: bountyConfig,
    heart_laws: heartLaws,
    heart_law_affinity_rules: heartLawAffinityRules,
    prestige_store: prestige,
    pavilion_records: pavilionRecords,
    onboarding_milestones: onboardingMilestones,
    cultivator_stats: cultivatorStats,
    training_regimens: trainingRegimens,
    dao_heart_practices: daoHeartPractices,
    spirit_roots: spiritRoots,
    readiness_categories: readinessCategories,
  };
}
