import type { EconomyConfig, OutskirtsDef, RuinDef } from '../../content/types.js';
import { CITY_ACTIVITY_REWARD_ROLE_PROFILES, getCityActivityRewardRoleProfile, isOutskirtsCommonFieldMaterial, isProtectedRuinsIdentityItem, isRuinsAnchorItem, isRuinsLeadMaterial } from './activityRewardRoles.js';

export interface ActivityRewardRoutingCityAudit {
  cityId: string;
  cityIndex: number;
  outskirtsId: string | null;
  ruinId: string | null;
  outskirtsCommonPool: string[];
  outskirtsRarePool: string[];
  outskirtsCommonLeakage: string[];
  outskirtsRareTargetedSpikes: string[];
  outskirtsRareAnchorLeakage: string[];
  ruinsAnchorItemId: string | null;
  ruinsGuaranteedAnchors: string[];
  ruinsLeadMaterialsPresent: string[];
  ruinsGoldPosture: { perRoomAvg: number; finalChestAvg: number } | null;
  outskirtsGoldPosture: { mobAvg: number; bossAvg: number } | null;
  notes: string[];
}

const averageRange = (range: [number, number] | undefined): number => {
  if (!range) return 0;
  return (Number(range[0] ?? 0) + Number(range[1] ?? 0)) / 2;
};

const byCityIndex = <T>(source: Record<number, T> | T[] | undefined, cityIndex: number): T | undefined => {
  if (Array.isArray(source)) return source[cityIndex] ?? source[source.length - 1];
  if (source && typeof source === 'object') return source[cityIndex] ?? Object.values(source)[Object.values(source).length - 1];
  return undefined;
};

export function inspectActivityRewardRouting(content: {
  economy: EconomyConfig;
  outskirts: OutskirtsDef[];
  ruins: RuinDef[];
}): ActivityRewardRoutingCityAudit[] {
  return CITY_ACTIVITY_REWARD_ROLE_PROFILES.map((profile) => {
    const outskirts = content.outskirts.find((entry) => entry.cityId === profile.cityId) ?? null;
    const ruin = content.ruins.find((entry) => entry.cityId === profile.cityId) ?? null;
    const commonPool = outskirts?.matPools?.common ?? [];
    const rarePool = outskirts?.matPools?.rare ?? [];
    const guaranteedAnchors = ruin?.finalChestDrops.guaranteed?.map((entry) => entry.itemId) ?? [];
    const ruinItems = new Set<string>([
      ...(ruin?.dropsPerRoom.pool.map((entry) => entry.itemId) ?? []),
      ...(ruin?.finalChestDrops.pool.map((entry) => entry.itemId) ?? []),
      ...guaranteedAnchors,
    ]);

    const notes: string[] = [];
    const outskirtsGold = {
      mobAvg: averageRange(byCityIndex(content.economy.drops?.outskirts?.mobGoldByCityIndex, profile.cityIndex) as [number, number] | undefined),
      bossAvg: averageRange(byCityIndex(content.economy.drops?.outskirts?.bossGoldByCityIndex, profile.cityIndex) as [number, number] | undefined),
    };
    const ruinsGold = ruin
      ? {
          perRoomAvg: averageRange([ruin.dropsPerRoom.goldMin ?? 0, ruin.dropsPerRoom.goldMax ?? 0]),
          finalChestAvg: averageRange([ruin.finalChestDrops.goldMin ?? 0, ruin.finalChestDrops.goldMax ?? 0]),
        }
      : null;

    if (ruinsGold && outskirtsGold.mobAvg <= ruinsGold.perRoomAvg) {
      notes.push('Outskirts mob gold is not clearly ahead of Ruins per-room gold.');
    }
    if (ruin && !guaranteedAnchors.includes(profile.ruinsAnchorItemId)) {
      notes.push(`Ruins guaranteed anchor drifted from ${profile.ruinsAnchorItemId}.`);
    }

    return {
      cityId: profile.cityId,
      cityIndex: profile.cityIndex,
      outskirtsId: outskirts?.id ?? null,
      ruinId: ruin?.id ?? null,
      outskirtsCommonPool: [...commonPool],
      outskirtsRarePool: [...rarePool],
      outskirtsCommonLeakage: commonPool.filter((itemId) => !isOutskirtsCommonFieldMaterial(profile.cityId, itemId)),
      outskirtsRareTargetedSpikes: rarePool.filter((itemId) => isProtectedRuinsIdentityItem(profile.cityId, itemId)),
      outskirtsRareAnchorLeakage: rarePool.filter((itemId) => isRuinsAnchorItem(profile.cityId, itemId)),
      ruinsAnchorItemId: getCityActivityRewardRoleProfile(profile.cityId)?.ruinsAnchorItemId ?? null,
      ruinsGuaranteedAnchors: guaranteedAnchors,
      ruinsLeadMaterialsPresent: [...ruinItems].filter((itemId) => isRuinsLeadMaterial(profile.cityId, itemId)),
      ruinsGoldPosture: ruinsGold,
      outskirtsGoldPosture: outskirtsGold,
      notes,
    };
  });
}
