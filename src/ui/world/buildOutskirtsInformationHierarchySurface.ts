import type { OutskirtsActivityRewardReadModel } from '../../systems/economy/activityRewardReadModel.js';
import type { CombatPostureFit } from '../../systems/builds/combatPostureTypes.js';
import { evaluateAiProfileFit } from '../../systems/builds/aiProfileFit.js';
import { COMBAT_POSTURE_RATING_ORDER } from '../../systems/builds/combatPostureTypes.js';
import type { AiProfile, CultivationPath } from '../../types/index.js';

export interface BuildOutskirtsInformationHierarchySurfaceArgs {
  model: OutskirtsActivityRewardReadModel;
  resolveItemName: (itemId: string) => string | null;
  killsSinceBoss: number;
  killsToBoss: number;
  postureFit: CombatPostureFit;
  postureProfile: AiProfile;
  hasTrackedBounty: boolean;
  hasFarmTool: boolean;
  cultivationPath: CultivationPath | null;
}

export interface OutskirtsInformationHierarchySurface {
  roleTag: string;
  bestUsedWhen: string;
  boundaryLine: string;
  goldExpectationLine: string;
  commonMaterialsLine: string;
  bossAvailabilityLine: string | null;
  trackedBountyVisible: boolean;
  recommendedAiLine: string | null;
  secondaryPostureLine: string | null;
}

function resolveCommonMaterialsLine(args: {
  model: OutskirtsActivityRewardReadModel;
  resolveItemName: (itemId: string) => string | null;
}): string {
  const names = args.model.keyExpectedOutputs
    .filter((id) => id !== 'gold')
    .map((id) => args.resolveItemName(id))
    .filter((name): name is string => Boolean(name))
    .filter((name, index, all) => all.indexOf(name) === index)
    .slice(0, 3);

  if (names.length === 0) {
    return 'Common mats: broad field drops.';
  }

  return `Common mats: ${names.join(', ')}`;
}

function resolveBossAvailabilityLine(killsSinceBoss: number, killsToBoss: number): string {
  const target = Math.max(1, killsToBoss);
  const clampedKills = Math.max(0, killsSinceBoss);
  const remaining = Math.max(0, target - clampedKills);
  if (remaining === 0) {
    return 'Boss available now.';
  }
  return `Boss in ${remaining} ${remaining === 1 ? 'kill' : 'kills'}.`;
}

function isFarmerMateriallyBest(args: { hasFarmTool: boolean; cultivationPath: CultivationPath | null }): boolean {
  const farmer = evaluateAiProfileFit({
    encounterType: 'outskirts',
    aiProfile: 'farmer',
    loadoutSignals: {
      hasBossTool: false,
      hasFarmTool: args.hasFarmTool,
      hasSetupTool: false,
      hasSurvivalTool: false,
      equippedFamilies: [],
      equippedSupportFlags: [],
    },
    path: args.cultivationPath,
  }).rating;

  const nonFarmerProfiles: AiProfile[] = ['balanced', 'survivor', 'burst'];
  const farmerIndex = COMBAT_POSTURE_RATING_ORDER.indexOf(farmer);

  return nonFarmerProfiles.every((profile) => {
    const rating = evaluateAiProfileFit({
      encounterType: 'outskirts',
      aiProfile: profile,
      loadoutSignals: {
        hasBossTool: false,
        hasFarmTool: args.hasFarmTool,
        hasSetupTool: false,
        hasSurvivalTool: false,
        equippedFamilies: [],
        equippedSupportFlags: [],
      },
      path: args.cultivationPath,
    }).rating;
    return farmerIndex <= COMBAT_POSTURE_RATING_ORDER.indexOf(rating);
  });
}

export function buildOutskirtsInformationHierarchySurface(args: BuildOutskirtsInformationHierarchySurfaceArgs): OutskirtsInformationHierarchySurface {
  const farmerBest = isFarmerMateriallyBest({
    hasFarmTool: args.hasFarmTool,
    cultivationPath: args.cultivationPath,
  });

  const secondaryPostureLine = args.postureFit.warnings.length > 0
    ? args.postureFit.warnings[0]
    : args.postureProfile === 'farmer' && args.postureFit.aiFit === 'good'
      ? 'Farmer AI remains a strong fit for repeatable field farming.'
      : null;

  return {
    roleTag: args.model.roleTag,
    bestUsedWhen: args.model.bestUsedWhen,
    boundaryLine: args.model.boundaryLine,
    goldExpectationLine: 'Gold: steady baseline income from repeatable field fights.',
    commonMaterialsLine: resolveCommonMaterialsLine(args),
    bossAvailabilityLine: resolveBossAvailabilityLine(args.killsSinceBoss, args.killsToBoss),
    trackedBountyVisible: args.hasTrackedBounty,
    recommendedAiLine: farmerBest ? 'Recommended AI: Farmer' : null,
    secondaryPostureLine,
  };
}
