import type { OutskirtsDef, RuinDef } from '../../content/types.js';
import type { ValidatedContent } from '../../content/validators.js';
import type { RewardBundle } from '../../services/rewards/types.js';
import {
  ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS,
  getActivityProbeDurationSeconds,
} from '../balance/activityThroughputTargets.js';
import { classifyActivityRewardItem, getCityRewardRoleProfile } from './activityRewardRoles.js';
import {
  buildOutskirtsRewardBundle,
  buildRuinsFinalChestBonusBundle,
  getOutskirtsDropsConfig,
  getRuinsDropsConfig,
  mergeRewardBundles,
  rollRuinDropTable,
  type RewardRandomSource,
} from './activityRewardRuntime.js';

class SeededRandom implements RewardRandomSource {
  constructor(private state: number) {}

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
}

type BucketSummary = {
  gold: number;
  common: number;
  targeted: number;
  anchor: number;
  support: number;
  other: number;
};

const createBucketSummary = (): BucketSummary => ({ gold: 0, common: 0, targeted: 0, anchor: 0, support: 0, other: 0 });

const summarizeBundle = (cityId: string, bundle: RewardBundle): BucketSummary => {
  const summary = createBucketSummary();
  summary.gold = Number(bundle.currencies?.gold ?? '0');
  bundle.items?.forEach((item) => {
    const bucket = classifyActivityRewardItem(cityId, item.itemId);
    if (bucket === 'common_field') summary.common += item.qty;
    else if (bucket === 'targeted_local') summary.targeted += item.qty;
    else if (bucket === 'anchor') summary.anchor += item.qty;
    else if (bucket === 'support') summary.support += item.qty;
    else summary.other += item.qty;
  });
  return summary;
};

const addSummary = (target: BucketSummary, source: BucketSummary) => {
  target.gold += source.gold;
  target.common += source.common;
  target.targeted += source.targeted;
  target.anchor += source.anchor;
  target.support += source.support;
  target.other += source.other;
};

const divideSummary = (summary: BucketSummary, denominator: number): BucketSummary => {
  const safe = Math.max(1, denominator);
  return {
    gold: summary.gold / safe,
    common: summary.common / safe,
    targeted: summary.targeted / safe,
    anchor: summary.anchor / safe,
    support: summary.support / safe,
    other: summary.other / safe,
  };
};

export type OutskirtsThroughputSnapshot = {
  cityId: string;
  cityIndex: number;
  activityType: 'outskirts';
  killsToBoss: number;
  cycleDurationSeconds: number;
  expectedMobGoldPerKill: number;
  expectedBossGoldPerKill: number;
  expectedCommonUnitsPerMob: number;
  expectedTargetedLeakagePerMob: number;
  expectedBossMaterialBundleUnits: number;
  expectedBossSpiritStoneContribution: number;
  cycleTotals: BucketSummary & { spiritStones: number };
  goldPerMinute: number;
  commonMaterialUnitsPerMinute: number;
  targetedMaterialUnitsPerMinute: number;
  anchorUnitsPerRun: number;
  bossSpiritStoneSupportPerHour: number;
  shortageRecoveryValue: number;
  roleShare: {
    commonShare: number;
    targetedAndAnchorShare: number;
  };
};

export type RuinsThroughputSnapshot = {
  cityId: string;
  cityIndex: number;
  activityType: 'ruins';
  roomCount: number;
  runDurationSeconds: number;
  guaranteedAnchorItemId: string;
  guaranteedAnchorUnits: number;
  expectedPerRoomDropComposition: BucketSummary;
  expectedFinalChestBonus: BucketSummary;
  rareCadenceSummary: {
    baseChance: number;
    pityIncrement: number;
    pityCap: number;
    manualGuaranteeRuns: number;
  };
  runTotals: BucketSummary;
  goldPerMinute: number;
  commonMaterialUnitsPerMinute: number;
  targetedMaterialUnitsPerMinute: number;
  anchorUnitsPerRun: number;
  spiritStoneSupportPerHour: number;
  shortageRecoveryValue: number;
  roleShare: {
    targetedAndAnchorShare: number;
    commonShare: number;
  };
};

export type ActivityThroughputCitySnapshot = {
  cityId: string;
  cityIndex: number;
  outskirts: OutskirtsThroughputSnapshot;
  ruins: RuinsThroughputSnapshot;
  roleChecks: {
    outskirtsGoldDominance: boolean;
    outskirtsCommonDominance: boolean;
    ruinsTargetedDominance: boolean;
    ruinsAnchorGuaranteed: boolean;
    outskirtsSupportSecondary: boolean;
  };
};

function valueByIndex<T>(source: Record<number, T> | T[] | undefined, index: number, fallback: T): T {
  if (Array.isArray(source)) return source[index] ?? source[source.length - 1] ?? fallback;
  if (source && typeof source === 'object') return source[index] ?? Object.values(source).at(-1) ?? fallback;
  return fallback;
}

const averageRange = (range: [number, number] | undefined): number => {
  if (!range) return 0;
  return (Number(range[0] ?? 0) + Number(range[1] ?? 0)) / 2;
};

export function buildOutskirtsThroughputSnapshot(content: Pick<ValidatedContent, 'economy' | 'outskirts'>, cityId: string): OutskirtsThroughputSnapshot {
  const outskirts = content.outskirts.find((entry) => entry.cityId === cityId);
  if (!outskirts) throw new Error(`[ActivityThroughputReadModel] Missing outskirts for ${cityId}`);
  const cityIndex = outskirts.cityIndex ?? getCityRewardRoleProfile(cityId).cityIndex;
  const drops = getOutskirtsDropsConfig(content.economy);

  const expectedMobGoldPerKill = averageRange(valueByIndex(drops?.mobGoldByCityIndex, cityIndex, [2, 6]));
  const expectedBossGoldPerKill = averageRange(valueByIndex(drops?.bossGoldByCityIndex, cityIndex, [20, 40]));
  const mobCommonChance = drops?.mobCommonMatChance ?? 0.35;
  const mobDoubleChance = drops?.mobDoubleMatChance ?? 0.1;
  const mobRareChance = drops?.mobRareMatChance ?? 0.02;
  const expectedCommonUnitsPerMob = mobCommonChance * (1 + mobDoubleChance);
  const expectedTargetedLeakagePerMob = mobRareChance;
  const expectedBossMaterialBundleUnits = averageRange(valueByIndex(drops?.bossMatCountRangeByCityIndex, cityIndex, [2, 4]));
  const expectedBossSpiritStoneContribution =
    valueByIndex(drops?.bossSpiritStoneChanceByCityIndex, cityIndex, 0) *
    averageRange(valueByIndex(drops?.bossSpiritStoneRangeByCityIndex, cityIndex, [0, 0]));

  const sampleRuns = 500;
  const random = new SeededRandom(7_700 + cityIndex);
  const aggregated = createBucketSummary();
  let spiritStones = 0;

  for (let cycle = 0; cycle < sampleRuns; cycle += 1) {
    for (let kill = 0; kill < outskirts.killsToBoss; kill += 1) {
      addSummary(aggregated, summarizeBundle(cityId, buildOutskirtsRewardBundle(outskirts, drops, cityIndex, false, random)));
    }
    const bossBundle = buildOutskirtsRewardBundle(outskirts, drops, cityIndex, true, random);
    addSummary(aggregated, summarizeBundle(cityId, bossBundle));
    spiritStones += Number(bossBundle.currencies?.spiritStones ?? '0');
  }

  const cycleTotals = divideSummary(aggregated, sampleRuns);
  const cycleDurationSeconds = getActivityProbeDurationSeconds('outskirts', cityIndex);
  const minutesPerCycle = cycleDurationSeconds / 60;

  return {
    cityId,
    cityIndex,
    activityType: 'outskirts',
    killsToBoss: outskirts.killsToBoss,
    cycleDurationSeconds,
    expectedMobGoldPerKill,
    expectedBossGoldPerKill,
    expectedCommonUnitsPerMob,
    expectedTargetedLeakagePerMob,
    expectedBossMaterialBundleUnits,
    expectedBossSpiritStoneContribution,
    cycleTotals: {
      ...cycleTotals,
      spiritStones: spiritStones / sampleRuns,
    },
    goldPerMinute: cycleTotals.gold / Math.max(0.001, minutesPerCycle),
    commonMaterialUnitsPerMinute: cycleTotals.common / Math.max(0.001, minutesPerCycle),
    targetedMaterialUnitsPerMinute: (cycleTotals.targeted + cycleTotals.anchor) / Math.max(0.001, minutesPerCycle),
    anchorUnitsPerRun: cycleTotals.anchor,
    bossSpiritStoneSupportPerHour: (spiritStones / sampleRuns) * (3600 / Math.max(1, cycleDurationSeconds)),
    shortageRecoveryValue: cycleTotals.common * 0.6 / Math.max(0.001, minutesPerCycle),
    roleShare: {
      commonShare: cycleTotals.common / Math.max(1, cycleTotals.common + cycleTotals.targeted + cycleTotals.anchor + cycleTotals.support + cycleTotals.other),
      targetedAndAnchorShare: (cycleTotals.targeted + cycleTotals.anchor) / Math.max(1, cycleTotals.common + cycleTotals.targeted + cycleTotals.anchor + cycleTotals.support + cycleTotals.other),
    },
  };
}

export function buildRuinsThroughputSnapshot(content: Pick<ValidatedContent, 'economy' | 'ruins'>, cityId: string): RuinsThroughputSnapshot {
  const ruin = content.ruins.find((entry) => entry.cityId === cityId);
  if (!ruin) throw new Error(`[ActivityThroughputReadModel] Missing ruins for ${cityId}`);
  const cityIndex = ruin.cityIndex ?? getCityRewardRoleProfile(cityId).cityIndex;
  const drops = getRuinsDropsConfig(content.economy);

  const sampleRuns = 500;
  const random = new SeededRandom(9_900 + cityIndex);
  const aggregated = createBucketSummary();
  const aggregatedRoom = createBucketSummary();
  const aggregatedBonus = createBucketSummary();

  for (let run = 0; run < sampleRuns; run += 1) {
    const roomBundles = Array.from({ length: ruin.roomCount }, () => rollRuinDropTable(ruin.dropsPerRoom, `${ruin.id}-room`, random));
    roomBundles.forEach((bundle) => {
      const summary = summarizeBundle(cityId, bundle);
      addSummary(aggregatedRoom, summary);
      addSummary(aggregated, summary);
    });

    const chest = rollRuinDropTable(ruin.finalChestDrops, `${ruin.id}-chest`, random);
    const bonus = buildRuinsFinalChestBonusBundle(cityIndex, drops, random);
    const finalBundle = mergeRewardBundles(chest, bonus);
    addSummary(aggregated, summarizeBundle(cityId, finalBundle));
    addSummary(aggregatedBonus, summarizeBundle(cityId, bonus));
  }

  const runTotals = divideSummary(aggregated, sampleRuns);
  const expectedPerRoomDropComposition = divideSummary(aggregatedRoom, sampleRuns * Math.max(1, ruin.roomCount));
  const expectedFinalChestBonus = divideSummary(aggregatedBonus, sampleRuns);
  const runDurationSeconds = getActivityProbeDurationSeconds('ruins', cityIndex);
  const minutesPerRun = runDurationSeconds / 60;

  const pity = content.economy.tuning?.pityDefaults?.ruinsBossChestRare;
  const guaranteedAnchorUnits = (ruin.finalChestDrops.guaranteed ?? [])
    .filter((entry) => classifyActivityRewardItem(cityId, entry.itemId) === 'anchor')
    .reduce((sum, entry) => sum + entry.qty, 0);

  return {
    cityId,
    cityIndex,
    activityType: 'ruins',
    roomCount: ruin.roomCount,
    runDurationSeconds,
    guaranteedAnchorItemId: getCityRewardRoleProfile(cityId).deterministicAnchorItemId,
    guaranteedAnchorUnits,
    expectedPerRoomDropComposition,
    expectedFinalChestBonus,
    rareCadenceSummary: {
      baseChance: pity?.baseChance ?? 0,
      pityIncrement: pity?.pityIncrement ?? 0,
      pityCap: pity?.pityCap ?? 0,
      manualGuaranteeRuns: drops?.manualPityRunGuarantee ?? 0,
    },
    runTotals,
    goldPerMinute: runTotals.gold / Math.max(0.001, minutesPerRun),
    commonMaterialUnitsPerMinute: runTotals.common / Math.max(0.001, minutesPerRun),
    targetedMaterialUnitsPerMinute: (runTotals.targeted + runTotals.anchor) / Math.max(0.001, minutesPerRun),
    anchorUnitsPerRun: runTotals.anchor,
    spiritStoneSupportPerHour: 0,
    shortageRecoveryValue: ((runTotals.targeted + runTotals.anchor) / Math.max(0.001, minutesPerRun)) + runTotals.anchor * 2,
    roleShare: {
      targetedAndAnchorShare:
        (runTotals.targeted + runTotals.anchor) /
        Math.max(1, runTotals.common + runTotals.targeted + runTotals.anchor + runTotals.support + runTotals.other),
      commonShare: runTotals.common / Math.max(1, runTotals.common + runTotals.targeted + runTotals.anchor + runTotals.support + runTotals.other),
    },
  };
}

export function buildActivityThroughputCitySnapshot(
  content: Pick<ValidatedContent, 'economy' | 'outskirts' | 'ruins'>,
  cityId: string,
): ActivityThroughputCitySnapshot {
  const outskirts = buildOutskirtsThroughputSnapshot(content, cityId);
  const ruins = buildRuinsThroughputSnapshot(content, cityId);
  return {
    cityId,
    cityIndex: outskirts.cityIndex,
    outskirts,
    ruins,
    roleChecks: {
      outskirtsGoldDominance:
        outskirts.goldPerMinute >= ruins.goldPerMinute * ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS.outskirtsGoldPerMinuteDominanceMinRatio,
      outskirtsCommonDominance:
        outskirts.commonMaterialUnitsPerMinute >=
        ruins.commonMaterialUnitsPerMinute * ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS.outskirtsCommonPerMinuteDominanceMinRatio,
      ruinsTargetedDominance:
        ruins.targetedMaterialUnitsPerMinute >=
        outskirts.targetedMaterialUnitsPerMinute * ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS.ruinsTargetedPerMinuteDominanceMinRatio,
      ruinsAnchorGuaranteed: ruins.guaranteedAnchorUnits >= ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS.ruinsAnchorUnitsPerRunMinimum,
      outskirtsSupportSecondary:
        outskirts.bossSpiritStoneSupportPerHour <= outskirts.goldPerMinute * ACTIVITY_THROUGHPUT_VALIDATION_THRESHOLDS.outskirtsSupportVsPrimaryGoldMaxShare,
    },
  };
}

export function buildAllActivityThroughputSnapshots(
  content: Pick<ValidatedContent, 'economy' | 'outskirts' | 'ruins'>,
): ActivityThroughputCitySnapshot[] {
  return content.outskirts
    .map((entry) => entry.cityId)
    .filter((cityId, index, all) => all.indexOf(cityId) === index)
    .map((cityId) => buildActivityThroughputCitySnapshot(content, cityId))
    .sort((a, b) => a.cityIndex - b.cityIndex);
}
