import type { EconomyConfig, OutskirtsDef, RuinDef, RuinDropTable } from '../../content/types.js';
import { buildActivityRewardReadModel, type ActivityRewardReadModelEntry } from './activityRewardReadModel.js';
import {
  getCityActivityRewardRoleProfile,
  isOutskirtsCommonFieldMaterial,
  isProtectedRuinsIdentityItem,
  isRuinsAnchorItem,
  isRuinsLeadMaterial,
  isRuinsSupportItem,
} from './activityRewardRoles.js';

export interface RewardParityCityAudit {
  cityId: string;
  cityIndex: number;
  readModel: ActivityRewardReadModelEntry;
  expectedGoldPosture: {
    outskirtsMobAvg: number;
    outskirtsBossAvg: number;
    ruinsPerRoomAvg: number;
    ruinsFinalChestAvg: number;
    ruinsRunAvg: number;
  };
  expectedOutskirtsPosture: {
    commonExpected: number;
    supportExpected: number;
    targetedExpected: number;
    commonPoolCount: number;
  };
  expectedRuinsPosture: {
    targetedExpected: number;
    supportExpected: number;
    anchorExpected: number;
    targetedShare: number;
  };
  localOverlapRisks: string[];
  roleBoundaryDrift: string[];
  hasDrift: boolean;
}

const avgRange = (range: [number, number] | undefined): number => {
  if (!range) return 0;
  return (Number(range[0] ?? 0) + Number(range[1] ?? 0)) / 2;
};

const byCityIndex = <T>(source: Record<number, T> | T[] | undefined, cityIndex: number): T | undefined => {
  if (Array.isArray(source)) return source[cityIndex] ?? source[source.length - 1];
  if (source && typeof source === 'object') return source[cityIndex] ?? Object.values(source)[Object.values(source).length - 1];
  return undefined;
};

const expectedWeightedQty = (
  table: RuinDropTable,
  predicate: (itemId: string) => boolean,
): number => {
  const totalWeight = (table.pool ?? []).reduce((sum, entry) => sum + Math.max(0, entry.weight ?? 0), 0);
  const poolExpected = totalWeight <= 0
    ? 0
    : (table.pool ?? []).reduce((sum, entry) => {
        if (!predicate(entry.itemId)) return sum;
        const avgQty = avgRange([entry.qtyMin ?? 0, entry.qtyMax ?? 0]);
        return sum + ((entry.weight ?? 0) / totalWeight) * avgQty;
      }, 0) * (table.rolls ?? 0);
  const guaranteedExpected = (table.guaranteed ?? []).reduce((sum, entry) => sum + (predicate(entry.itemId) ? Math.max(0, entry.qty ?? 0) : 0), 0);
  return poolExpected + guaranteedExpected;
};

const expectedTableTotal = (table: RuinDropTable): number =>
  expectedWeightedQty(table, () => true);

export function inspectRewardParity(content: {
  economy: EconomyConfig;
  outskirts: OutskirtsDef[];
  ruins: RuinDef[];
}): RewardParityCityAudit[] {
  const readModel = buildActivityRewardReadModel(content);

  return readModel.map((entry) => {
    const profile = getCityActivityRewardRoleProfile(entry.cityId);
    const outskirts = content.outskirts.find((candidate) => candidate.cityId === entry.cityId) ?? null;
    const ruin = content.ruins.find((candidate) => candidate.cityId === entry.cityId) ?? null;
    const cityIndex = entry.cityIndex;
    const drops = content.economy.drops?.outskirts;

    const outskirtsMobAvg = avgRange(byCityIndex(drops?.mobGoldByCityIndex, cityIndex) as [number, number] | undefined);
    const outskirtsBossAvg = avgRange(byCityIndex(drops?.bossGoldByCityIndex, cityIndex) as [number, number] | undefined);
    const outskirtsCommonExpected = (drops?.mobCommonMatChance ?? 0) * (1 + (drops?.mobDoubleMatChance ?? 0));
    const outskirtsSupportExpected = (byCityIndex(drops?.mobManualScrapsChanceByCityIndex, cityIndex) ?? 0)
      * avgRange(byCityIndex(drops?.mobManualScrapsRangeByCityIndex, cityIndex) as [number, number] | undefined);
    const outskirtsTargetedExpected = drops?.mobRareMatChance ?? 0;

    const ruinsPerRoomAvg = ruin ? avgRange([ruin.dropsPerRoom.goldMin ?? 0, ruin.dropsPerRoom.goldMax ?? 0]) : 0;
    const ruinsFinalChestAvg = ruin ? avgRange([ruin.finalChestDrops.goldMin ?? 0, ruin.finalChestDrops.goldMax ?? 0]) : 0;
    const ruinsRunAvg = ruin ? ruinsPerRoomAvg * ruin.roomCount + ruinsFinalChestAvg : 0;

    const ruinsPerRoomTargeted = ruin
      ? expectedWeightedQty(ruin.dropsPerRoom, (itemId) => isRuinsLeadMaterial(entry.cityId, itemId) || isRuinsAnchorItem(entry.cityId, itemId))
      : 0;
    const ruinsFinalChestTargeted = ruin
      ? expectedWeightedQty(ruin.finalChestDrops, (itemId) => isRuinsLeadMaterial(entry.cityId, itemId) || isRuinsAnchorItem(entry.cityId, itemId))
      : 0;
    const ruinsSupportExpected = ruin
      ? expectedWeightedQty(ruin.dropsPerRoom, (itemId) => isRuinsSupportItem(entry.cityId, itemId))
        + expectedWeightedQty(ruin.finalChestDrops, (itemId) => isRuinsSupportItem(entry.cityId, itemId))
      : 0;
    const ruinsAnchorExpected = ruin ? expectedWeightedQty(ruin.finalChestDrops, (itemId) => isRuinsAnchorItem(entry.cityId, itemId)) : 0;
    const ruinsTargetedExpected = ruin ? ruinsPerRoomTargeted * ruin.roomCount + ruinsFinalChestTargeted : 0;
    const ruinsTotalItems = ruin ? expectedTableTotal(ruin.dropsPerRoom) * ruin.roomCount + expectedTableTotal(ruin.finalChestDrops) : 0;
    const ruinsTargetedShare = ruinsTotalItems > 0 ? ruinsTargetedExpected / ruinsTotalItems : 0;

    const overlapRisks = [
      ...((outskirts?.matPools?.common ?? []).filter((itemId) => isRuinsAnchorItem(entry.cityId, itemId)).map((itemId) => `outskirts common leaks deterministic ruin anchor: ${itemId}`)),
      ...((outskirts?.matPools?.rare ?? []).filter((itemId) => isRuinsAnchorItem(entry.cityId, itemId)).map((itemId) => `outskirts rare duplicates ruin anchor: ${itemId}`)),
      ...(((profile?.outskirtsTargetedSpikeItemIds ?? []).filter((itemId) => (profile?.ruinsLeadMaterialIds ?? []).includes(itemId)).map((itemId) => `outskirts targeted spike overlaps ruin lead material: ${itemId}`))),
    ];

    const drift: string[] = [];
    if (outskirtsBossAvg <= ruinsFinalChestAvg) {
      drift.push('Outskirts boss gold posture no longer beats a Ruins final chest.');
    }
    if (outskirtsCommonExpected <= outskirtsTargetedExpected || outskirtsCommonExpected < 0.75) {
      drift.push('Outskirts common-material posture is too weak for the baseline field loop.');
    }
    if (outskirtsTargetedExpected >= Math.max(outskirtsCommonExpected * 0.5, 0.25)) {
      drift.push('Outskirts targeted-material leakage is too strong relative to its common loop.');
    }
    if (ruinsAnchorExpected < 1) {
      drift.push('Ruins lost their deterministic final anchor.');
    }
    if (ruinsTargetedExpected <= (outskirtsTargetedExpected + (byCityIndex(drops?.bossRareMatChanceByCityIndex, cityIndex) ?? 0))) {
      drift.push('Ruins targeted-material posture is too weak relative to Outskirts targeted leakage.');
    }
    if (ruinsTargetedShare < 0.55) {
      drift.push('Ruins item mix is too generic and no longer clearly teaches a targeted-material lesson.');
    }
    if (ruinsFinalChestAvg <= 0 || ruinsRunAvg <= 0) {
      drift.push('Ruins no longer provide a visible secondary gold marker.');
    }
    if (overlapRisks.some((risk) => risk.includes('deterministic ruin anchor'))) {
      drift.push('A city pair leaks the deterministic ruin anchor into the Outskirts common loop.');
    }
    if (drift.length === 0) {
      const distinctLesson = outskirtsBossAvg > ruinsFinalChestAvg
        && outskirtsCommonExpected > outskirtsTargetedExpected
        && ruinsTargetedExpected > outskirtsTargetedExpected
        && ruinsAnchorExpected >= 1
        && (profile?.ruinsLeadMaterialIds?.length ?? 0) >= 2;
      if (!distinctLesson) {
        drift.push('Outskirts and Ruins no longer teach a distinct local lesson.');
      }
    }

    return {
      cityId: entry.cityId,
      cityIndex,
      readModel: entry,
      expectedGoldPosture: {
        outskirtsMobAvg,
        outskirtsBossAvg,
        ruinsPerRoomAvg,
        ruinsFinalChestAvg,
        ruinsRunAvg,
      },
      expectedOutskirtsPosture: {
        commonExpected: outskirtsCommonExpected,
        supportExpected: outskirtsSupportExpected,
        targetedExpected: outskirtsTargetedExpected,
        commonPoolCount: outskirts?.matPools?.common?.filter((itemId) => isOutskirtsCommonFieldMaterial(entry.cityId, itemId)).length ?? 0,
      },
      expectedRuinsPosture: {
        targetedExpected: ruinsTargetedExpected,
        supportExpected: ruinsSupportExpected,
        anchorExpected: ruinsAnchorExpected,
        targetedShare: ruinsTargetedShare,
      },
      localOverlapRisks: overlapRisks,
      roleBoundaryDrift: drift,
      hasDrift: drift.length > 0,
    };
  });
}
