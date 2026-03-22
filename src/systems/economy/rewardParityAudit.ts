import type { OutskirtsDef, RuinDef } from '../../content/types.js';
import type { ValidatedContent } from '../../content/validators.js';
import {
  buildAllCityActivityRewardReadModels,
  type CityActivityRewardReadModel,
} from './activityRewardReadModel.js';
import {
  classifyActivityRewardItem,
  getCityRewardRoleProfile,
  getDeterministicRuinAnchorItemId,
  getTargetedCityMaterialIds,
} from './activityRewardRoles.js';
import { getOutskirtsDropsConfig, getRuinsDropsConfig } from './activityRewardRuntime.js';

export interface RewardParityMetrics {
  goldPerLoop: number;
  itemUnitsPerLoop: number;
  commonUnitsPerLoop: number;
  targetedUnitsPerLoop: number;
  anchorUnitsPerLoop: number;
  supportUnitsPerLoop: number;
  otherUnitsPerLoop: number;
  goldPerItemUnit: number;
  commonShare: number;
  targetedShare: number;
  anchorShare: number;
  supportShare: number;
  targetedAndAnchorShare: number;
}

export interface RewardParityRuleCheck {
  ruleId:
    | 'outskirts_primary_gold_loop'
    | 'outskirts_common_material_strength'
    | 'outskirts_targeted_leakage_secondary'
    | 'ruins_deterministic_anchor_present'
    | 'ruins_targeted_material_strength'
    | 'ruins_gold_secondary'
    | 'pair_distinct_lessons';
  passed: boolean;
  detail: string;
}

export interface CityRewardParityAudit {
  cityId: string;
  cityIndex: number;
  readModel: CityActivityRewardReadModel;
  deterministicAnchorItemId: string;
  outskirtsHeadlineRole: string;
  ruinsHeadlineRole: string;
  outskirtsGoldPosture: 'primary';
  ruinsGoldPosture: 'secondary';
  outskirtsCommonPosture: 'primary' | 'weak';
  ruinsTargetedPosture: 'primary' | 'weak';
  localOverlapRisks: string[];
  driftDetected: boolean;
  driftReasons: string[];
  metrics: {
    outskirts: RewardParityMetrics;
    ruins: RewardParityMetrics;
  };
  rules: RewardParityRuleCheck[];
}

export interface RewardParityAuditReport {
  cities: CityRewardParityAudit[];
}

const average = (range: [number, number] | undefined, fallback = 0): number => {
  if (!range) return fallback;
  return (Number(range[0] ?? fallback) + Number(range[1] ?? fallback)) / 2;
};

const valueByIndex = <T>(source: Record<number, T> | T[] | undefined, index: number, fallback: T): T => {
  if (Array.isArray(source)) return source[index] ?? source[source.length - 1] ?? fallback;
  if (source && typeof source === 'object') {
    const direct = source[index];
    if (direct !== undefined) return direct;
    const values = Object.values(source);
    if (values.length > 0) return values[values.length - 1] ?? fallback;
  }
  return fallback;
};

function summarizeUnits(cityId: string, entries: Array<{ itemId: string; expectedQty: number }>): Omit<RewardParityMetrics, 'goldPerLoop' | 'goldPerItemUnit'> {
  const summary = {
    itemUnitsPerLoop: 0,
    commonUnitsPerLoop: 0,
    targetedUnitsPerLoop: 0,
    anchorUnitsPerLoop: 0,
    supportUnitsPerLoop: 0,
    otherUnitsPerLoop: 0,
    commonShare: 0,
    targetedShare: 0,
    anchorShare: 0,
    supportShare: 0,
    targetedAndAnchorShare: 0,
  };

  entries.forEach((entry) => {
    if (!(entry.expectedQty > 0)) return;
    summary.itemUnitsPerLoop += entry.expectedQty;
    const bucket = classifyActivityRewardItem(cityId, entry.itemId);
    if (bucket === 'common_field') summary.commonUnitsPerLoop += entry.expectedQty;
    else if (bucket === 'targeted_local') summary.targetedUnitsPerLoop += entry.expectedQty;
    else if (bucket === 'anchor') summary.anchorUnitsPerLoop += entry.expectedQty;
    else if (bucket === 'support') summary.supportUnitsPerLoop += entry.expectedQty;
    else summary.otherUnitsPerLoop += entry.expectedQty;
  });

  const denominator = Math.max(1, summary.itemUnitsPerLoop);
  summary.commonShare = summary.commonUnitsPerLoop / denominator;
  summary.targetedShare = summary.targetedUnitsPerLoop / denominator;
  summary.anchorShare = summary.anchorUnitsPerLoop / denominator;
  summary.supportShare = summary.supportUnitsPerLoop / denominator;
  summary.targetedAndAnchorShare = (summary.targetedUnitsPerLoop + summary.anchorUnitsPerLoop) / denominator;
  return summary;
}

function buildOutskirtsMetrics(outskirts: OutskirtsDef, economy: ValidatedContent['economy']): RewardParityMetrics {
  const cityIndex = outskirts.cityIndex ?? getCityRewardRoleProfile(outskirts.cityId).cityIndex;
  const drops = getOutskirtsDropsConfig(economy) ?? {};
  const mobGold = average(valueByIndex(drops.mobGoldByCityIndex, cityIndex, [2, 6]));
  const bossGold = average(valueByIndex(drops.bossGoldByCityIndex, cityIndex, [20, 40]));
  const mobCommonChance = drops.mobCommonMatChance ?? 0.35;
  const mobDoubleChance = drops.mobDoubleMatChance ?? 0.1;
  const mobRareChance = drops.mobRareMatChance ?? 0.02;
  const bossMatCount = average(valueByIndex(drops.bossMatCountRangeByCityIndex, cityIndex, [2, 4]));
  const bossRareChance = valueByIndex(drops.bossRareMatChanceByCityIndex, cityIndex, 0.1);
  const killsToBoss = Math.max(1, outskirts.killsToBoss ?? 1);

  const commonPool = outskirts.matPools?.common ?? [];
  const rarePool = outskirts.matPools?.rare ?? [];
  const commonWeight = commonPool.length > 0 ? 1 / commonPool.length : 0;
  const rareWeight = rarePool.length > 0 ? 1 / rarePool.length : 0;
  const expectedEntries: Array<{ itemId: string; expectedQty: number }> = [];

  commonPool.forEach((itemId) => {
    expectedEntries.push({
      itemId,
      expectedQty: killsToBoss * mobCommonChance * (1 + mobDoubleChance) * commonWeight + bossMatCount * commonWeight,
    });
  });
  rarePool.forEach((itemId) => {
    expectedEntries.push({
      itemId,
      expectedQty: killsToBoss * mobRareChance * rareWeight + bossRareChance * rareWeight,
    });
  });

  const units = summarizeUnits(outskirts.cityId, expectedEntries);
  const goldPerLoop = killsToBoss * mobGold + bossGold;
  return {
    goldPerLoop,
    goldPerItemUnit: goldPerLoop / Math.max(1, units.itemUnitsPerLoop),
    ...units,
  };
}

function expectedDropTableEntries(table: RuinDef['dropsPerRoom']): Array<{ itemId: string; expectedQty: number }> {
  const totalWeight = table.pool.reduce((sum, entry) => sum + Math.max(0, entry.weight ?? 0), 0);
  const entries = table.pool.map((entry) => ({
    itemId: entry.itemId,
    expectedQty: totalWeight > 0 ? (table.rolls ?? 0) * ((entry.weight ?? 0) / totalWeight) * average([entry.qtyMin, entry.qtyMax]) : 0,
  }));
  (table.guaranteed ?? []).forEach((entry) => {
    entries.push({ itemId: entry.itemId, expectedQty: entry.qty });
  });
  return entries;
}

function buildRuinsMetrics(ruin: RuinDef, economy: ValidatedContent['economy']): RewardParityMetrics {
  const cityIndex = ruin.cityIndex ?? getCityRewardRoleProfile(ruin.cityId).cityIndex;
  const roomGold = average([ruin.dropsPerRoom.goldMin ?? 0, ruin.dropsPerRoom.goldMax ?? 0]);
  const chestGold = average([ruin.finalChestDrops.goldMin ?? 0, ruin.finalChestDrops.goldMax ?? 0]);
  const ruinsDrops = getRuinsDropsConfig(economy);
  const roomEntries = expectedDropTableEntries(ruin.dropsPerRoom).map((entry) => ({
    itemId: entry.itemId,
    expectedQty: entry.expectedQty * Math.max(1, ruin.roomCount),
  }));
  const chestEntries = expectedDropTableEntries(ruin.finalChestDrops);
  const bonusEntries = [
    { itemId: 'mat_rune_dust', expectedQty: average(valueByIndex(ruinsDrops?.finalChestRuneDustRangeByCityIndex, cityIndex, undefined)) },
    { itemId: 'mat_artifact_shard', expectedQty: average(valueByIndex(ruinsDrops?.finalChestArtifactShardsRangeByCityIndex, cityIndex, undefined)) },
  ].filter((entry) => entry.expectedQty > 0);

  const units = summarizeUnits(ruin.cityId, [...roomEntries, ...chestEntries, ...bonusEntries]);
  const goldPerLoop = Math.max(1, ruin.roomCount) * roomGold + chestGold;
  return {
    goldPerLoop,
    goldPerItemUnit: goldPerLoop / Math.max(1, units.itemUnitsPerLoop),
    ...units,
  };
}

export function inspectCityRewardParity(
  content: Pick<ValidatedContent, 'economy' | 'outskirts' | 'ruins'>,
  cityId: string,
): CityRewardParityAudit {
  const profile = getCityRewardRoleProfile(cityId);
  const outskirts = content.outskirts.find((entry) => entry.cityId === cityId);
  const ruin = content.ruins.find((entry) => entry.cityId === cityId);
  if (!outskirts || !ruin) {
    throw new Error(`[RewardParityAudit] Missing activity pair for city ${cityId}`);
  }

  const readModel = buildAllCityActivityRewardReadModels(content).find((entry) => entry.cityId === cityId);
  if (!readModel) {
    throw new Error(`[RewardParityAudit] Missing read-model for city ${cityId}`);
  }

  const outskirtsMetrics = buildOutskirtsMetrics(outskirts, content.economy);
  const ruinsMetrics = buildRuinsMetrics(ruin, content.economy);
  const targetedIds = new Set(getTargetedCityMaterialIds(cityId));
  const commonPool = new Set(outskirts.matPools?.common ?? []);
  const rarePool = new Set(outskirts.matPools?.rare ?? []);
  const overlapRisks: string[] = [];

  targetedIds.forEach((itemId) => {
    if (commonPool.has(itemId)) overlapRisks.push(`Outskirts common pool leaks targeted item ${itemId}`);
  });
  const anchor = getDeterministicRuinAnchorItemId(cityId);
  if (commonPool.has(anchor) || rarePool.has(anchor)) overlapRisks.push(`Outskirts overlaps the ruin anchor ${anchor}`);

  const rules: RewardParityRuleCheck[] = [
    {
      ruleId: 'outskirts_primary_gold_loop',
      passed: outskirtsMetrics.goldPerItemUnit > ruinsMetrics.goldPerItemUnit,
      detail: `gold/item outskirts=${outskirtsMetrics.goldPerItemUnit.toFixed(2)} ruins=${ruinsMetrics.goldPerItemUnit.toFixed(2)}`,
    },
    {
      ruleId: 'outskirts_common_material_strength',
      passed: outskirtsMetrics.commonShare >= 0.55 && outskirtsMetrics.commonUnitsPerLoop > outskirtsMetrics.targetedUnitsPerLoop + outskirtsMetrics.anchorUnitsPerLoop,
      detail: `outskirts commonShare=${outskirtsMetrics.commonShare.toFixed(3)} targeted+anchor=${(outskirtsMetrics.targetedUnitsPerLoop + outskirtsMetrics.anchorUnitsPerLoop).toFixed(3)}`,
    },
    {
      ruleId: 'outskirts_targeted_leakage_secondary',
      passed: outskirtsMetrics.targetedAndAnchorShare <= 0.35,
      detail: `outskirts targeted+anchor share=${outskirtsMetrics.targetedAndAnchorShare.toFixed(3)}`,
    },
    {
      ruleId: 'ruins_deterministic_anchor_present',
      passed: (ruin.finalChestDrops.guaranteed ?? []).some((entry) => entry.itemId === anchor),
      detail: `expected anchor=${anchor}`,
    },
    {
      ruleId: 'ruins_targeted_material_strength',
      passed:
        ruinsMetrics.targetedAndAnchorShare >= 0.2 &&
        ruinsMetrics.targetedUnitsPerLoop + ruinsMetrics.anchorUnitsPerLoop > outskirtsMetrics.targetedUnitsPerLoop + outskirtsMetrics.anchorUnitsPerLoop,
      detail: `ruins targeted+anchor share=${ruinsMetrics.targetedAndAnchorShare.toFixed(3)} outskirts targeted+anchor=${(outskirtsMetrics.targetedUnitsPerLoop + outskirtsMetrics.anchorUnitsPerLoop).toFixed(3)} ruins targeted+anchor=${(ruinsMetrics.targetedUnitsPerLoop + ruinsMetrics.anchorUnitsPerLoop).toFixed(3)}`,
    },
    {
      ruleId: 'ruins_gold_secondary',
      passed: ruinsMetrics.goldPerLoop > 0 && ruinsMetrics.targetedAndAnchorShare > ruinsMetrics.commonShare,
      detail: `ruins gold=${ruinsMetrics.goldPerLoop.toFixed(2)} targeted+anchor share=${ruinsMetrics.targetedAndAnchorShare.toFixed(3)} commonShare=${ruinsMetrics.commonShare.toFixed(3)}`,
    },
    {
      ruleId: 'pair_distinct_lessons',
      passed:
        outskirtsMetrics.commonShare > ruinsMetrics.commonShare &&
        ruinsMetrics.targetedAndAnchorShare > outskirtsMetrics.targetedAndAnchorShare,
      detail: `commonShare outskirts=${outskirtsMetrics.commonShare.toFixed(3)} ruins=${ruinsMetrics.commonShare.toFixed(3)} targeted+anchor outskirts=${outskirtsMetrics.targetedAndAnchorShare.toFixed(3)} ruins=${ruinsMetrics.targetedAndAnchorShare.toFixed(3)}`,
    },
  ];

  const driftReasons = rules.filter((rule) => !rule.passed).map((rule) => `${rule.ruleId}: ${rule.detail}`);
  return {
    cityId,
    cityIndex: profile.cityIndex,
    readModel,
    deterministicAnchorItemId: anchor,
    outskirtsHeadlineRole: readModel.outskirts.roleTag,
    ruinsHeadlineRole: readModel.ruins.roleTag,
    outskirtsGoldPosture: 'primary',
    ruinsGoldPosture: 'secondary',
    outskirtsCommonPosture: rules.find((rule) => rule.ruleId === 'outskirts_common_material_strength')?.passed ? 'primary' : 'weak',
    ruinsTargetedPosture: rules.find((rule) => rule.ruleId === 'ruins_targeted_material_strength')?.passed ? 'primary' : 'weak',
    localOverlapRisks: overlapRisks,
    driftDetected: driftReasons.length > 0,
    driftReasons,
    metrics: {
      outskirts: outskirtsMetrics,
      ruins: ruinsMetrics,
    },
    rules,
  };
}

export function buildRewardParityAuditReport(
  content: Pick<ValidatedContent, 'economy' | 'outskirts' | 'ruins'>,
): RewardParityAuditReport {
  return {
    cities: buildAllCityActivityRewardReadModels(content)
      .map((entry) => inspectCityRewardParity(content, entry.cityId))
      .sort((a, b) => a.cityIndex - b.cityIndex),
  };
}
