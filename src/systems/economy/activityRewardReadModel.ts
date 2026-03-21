import type { EconomyConfig, OutskirtsDef, RuinDef } from '../../content/types.js';
import {
  CITY_ACTIVITY_REWARD_ROLE_PROFILES,
  getCityActivityRewardRoleProfile,
} from './activityRewardRoles.js';

export const OUTSKIRTS_ROLE_TAG = 'Gold & Common Mats';
export const OUTSKIRTS_BEST_USED_WHEN = 'Best used when you need gold, common materials, or low-risk combat reps.';
export const OUTSKIRTS_BOUNDARY_LINE = 'Not the best source for targeted city materials.';

export const RUINS_ROLE_TAG = 'Targeted Mats';
export const RUINS_BEST_USED_WHEN = 'Best used when you need targeted local materials and deterministic support rewards.';

export interface ActivityRewardReadModelEntry {
  cityId: string;
  cityIndex: number;
  outskirts: {
    activityId: string | null;
    roleTag: typeof OUTSKIRTS_ROLE_TAG;
    bestUsedWhen: typeof OUTSKIRTS_BEST_USED_WHEN;
    boundaryLine: typeof OUTSKIRTS_BOUNDARY_LINE;
    keyExpectedOutputs: string[];
    localCaveat: string;
  };
  ruins: {
    activityId: string | null;
    roleTag: typeof RUINS_ROLE_TAG;
    bestUsedWhen: typeof RUINS_BEST_USED_WHEN;
    roomCount: number;
    leadLocalMaterials: string[];
    deterministicFinalAnchor: string | null;
    keyExpectedOutputs: string[];
    pitySummary: string;
    goldIsSecondary: true;
  };
}

const buildRuinsPitySummary = (economy: EconomyConfig | null | undefined): string => {
  const rarePity = economy?.tuning?.pityDefaults?.ruinsBossChestRare;
  const manualPityRuns = economy?.drops?.ruins?.manualPityRunGuarantee;
  const rareParts: string[] = [];

  if ((rarePity?.baseChance ?? 0) > 0) {
    rareParts.push(`Rare chest pity starts at ${Math.round((rarePity?.baseChance ?? 0) * 100)}%`);
  }
  if ((rarePity?.pityIncrement ?? 0) > 0) {
    rareParts.push(`gains ${Math.round((rarePity?.pityIncrement ?? 0) * 100)}% per miss`);
  }
  if ((rarePity?.pityCap ?? 0) > 1) {
    rareParts.push(`and guarantees by ${rarePity?.pityCap} failures`);
  }

  const rareLine = rareParts.length > 0 ? `${rareParts.join(' ')}.` : 'Rare chest pity is active.';
  const manualLine = typeof manualPityRuns === 'number' && manualPityRuns > 0
    ? ` Manual support pity guarantees a drop within ${manualPityRuns} runs.`
    : '';

  return `${rareLine}${manualLine}`.trim();
};

export function buildActivityRewardReadModel(content: {
  economy: EconomyConfig;
  outskirts: OutskirtsDef[];
  ruins: RuinDef[];
}): ActivityRewardReadModelEntry[] {
  return CITY_ACTIVITY_REWARD_ROLE_PROFILES.map((profile) => {
    const roleProfile = getCityActivityRewardRoleProfile(profile.cityId);
    const outskirts = content.outskirts.find((entry) => entry.cityId === profile.cityId) ?? null;
    const ruin = content.ruins.find((entry) => entry.cityId === profile.cityId) ?? null;
    const deterministicFinalAnchor = roleProfile?.ruinsAnchorItemId ?? null;

    return {
      cityId: profile.cityId,
      cityIndex: profile.cityIndex,
      outskirts: {
        activityId: outskirts?.id ?? null,
        roleTag: OUTSKIRTS_ROLE_TAG,
        bestUsedWhen: OUTSKIRTS_BEST_USED_WHEN,
        boundaryLine: OUTSKIRTS_BOUNDARY_LINE,
        keyExpectedOutputs: [
          'gold',
          ...(roleProfile?.outskirtsCommonFieldMaterialIds ?? []),
          ...(roleProfile?.outskirtsSupportItemIds ?? []),
        ],
        localCaveat: `Targeted city spikes stay secondary here: ${(roleProfile?.outskirtsTargetedSpikeItemIds ?? []).join(', ') || 'none'}.`,
      },
      ruins: {
        activityId: ruin?.id ?? null,
        roleTag: RUINS_ROLE_TAG,
        bestUsedWhen: RUINS_BEST_USED_WHEN,
        roomCount: ruin?.roomCount ?? 0,
        leadLocalMaterials: [...(roleProfile?.ruinsLeadMaterialIds ?? [])],
        deterministicFinalAnchor,
        keyExpectedOutputs: [
          ...(roleProfile?.ruinsLeadMaterialIds ?? []),
          ...(roleProfile?.ruinsSupportItemIds ?? []),
          ...(deterministicFinalAnchor ? [deterministicFinalAnchor] : []),
        ],
        pitySummary: buildRuinsPitySummary(content.economy),
        goldIsSecondary: true,
      },
    };
  });
}

export function getActivityRewardReadModelEntry(content: {
  economy: EconomyConfig;
  outskirts: OutskirtsDef[];
  ruins: RuinDef[];
}, cityId: string): ActivityRewardReadModelEntry | null {
  return buildActivityRewardReadModel(content).find((entry) => entry.cityId === cityId) ?? null;
}
