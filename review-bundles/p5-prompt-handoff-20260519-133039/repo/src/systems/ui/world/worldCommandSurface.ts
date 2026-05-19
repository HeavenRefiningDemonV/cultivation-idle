import type { LiveWorldModuleKey } from '../../../content/types.js';
import type { ModulePurposeSourceSurface } from '../../economy/purposeSourceSurface.js';
import type { RunCompassActionTarget } from '../runCompass/index.js';
import { resolveWorldStrongRecommendationModuleKey } from './worldModuleRoutingSurface.js';
import { isLiveWorldModule } from '../../world/liveWorldSchema.js';
import { getWorldModuleCardDefinition } from '../../world/moduleCardRegistry.js';
import { getWorldModuleLabel } from '../../../ui/text/playerFacingLabels.js';

export type WorldCommandGroupId = 'combat' | 'preparation' | 'support';

export interface WorldCommandCardSurface {
  moduleKey: LiveWorldModuleKey;
  moduleLabel: string;
  roleTag: string;
  bestUsedWhen: string;
  outputHint: string | null;
  recommendedNow: boolean;
}

export interface WorldCommandGroupSurface {
  id: WorldCommandGroupId;
  label: 'Combat' | 'Preparation' | 'Support';
  cards: WorldCommandCardSurface[];
}

export interface WorldCommandRecommendation {
  moduleKey: LiveWorldModuleKey | null;
  reason: string;
  from: 'run_compass' | 'economic' | 'tracked_bounty' | 'none';
}

export interface WorldCommandAlertSurface {
  id: 'tracked_bounty' | 'expedition_idle';
  title: string;
  detail: string;
  ctaLabel: string;
  ctaModuleKey: LiveWorldModuleKey;
}

export interface WorldCommandSurface {
  groups: WorldCommandGroupSurface[];
  recommendation: WorldCommandRecommendation;
  alerts: WorldCommandAlertSurface[];
}

const GROUP_ORDER: readonly WorldCommandGroupId[] = ['combat', 'preparation', 'support'];

const GROUP_LABELS: Record<WorldCommandGroupId, WorldCommandGroupSurface['label']> = {
  combat: 'Combat',
  preparation: 'Preparation',
  support: 'Support',
};

const GROUP_MEMBERS: Record<WorldCommandGroupId, readonly LiveWorldModuleKey[]> = {
  combat: ['outskirts', 'ruins', 'gateTrial'],
  preparation: ['apothecary', 'forge', 'manualPavilion'],
  support: ['bounties', 'expeditions'],
};

function isVisibleModule(visibleModules: readonly string[], moduleKey: string): moduleKey is LiveWorldModuleKey {
  return isLiveWorldModule(moduleKey) && visibleModules.includes(moduleKey);
}

export function resolveWorldRecommendedModule(input: {
  visibleModules: readonly string[];
  runCompassPrimaryAction: { why: string; target: RunCompassActionTarget | null } | null;
  runCompassSecondaryModuleKey?: LiveWorldModuleKey | null;
  economicTopModuleKey: string | null;
  economicReason: string | null;
  trackedBountyModuleKey: string | null;
}): WorldCommandRecommendation {
  const { visibleModules, runCompassPrimaryAction, runCompassSecondaryModuleKey = null, economicTopModuleKey, economicReason, trackedBountyModuleKey } = input;
  const visibleLiveModules = visibleModules.filter((moduleKey): moduleKey is LiveWorldModuleKey => isVisibleModule(visibleModules, moduleKey));
  const primaryModuleKey = runCompassPrimaryAction?.target?.kind === 'world_module' ? runCompassPrimaryAction.target.moduleKey : null;
  const economicModuleKeys = economicTopModuleKey && isVisibleModule(visibleModules, economicTopModuleKey) ? [economicTopModuleKey] : [];
  const trackedModuleKey = trackedBountyModuleKey && isVisibleModule(visibleModules, trackedBountyModuleKey) ? trackedBountyModuleKey : null;

  const moduleKey = resolveWorldStrongRecommendationModuleKey({
    visibleModules: visibleLiveModules,
    runCompassPrimaryModuleKey: primaryModuleKey ?? null,
    runCompassSecondaryModuleKey,
    economicModuleKeys,
    trackedBountyModuleKey: trackedModuleKey,
  });

  if (moduleKey === primaryModuleKey && runCompassPrimaryAction?.target?.kind === 'world_module') {
    return {
      moduleKey,
      reason: runCompassPrimaryAction.why,
      from: 'run_compass',
    };
  }
  if (moduleKey && moduleKey === runCompassSecondaryModuleKey) {
    return {
      moduleKey,
      reason: 'Run Compass support route points here.',
      from: 'run_compass',
    };
  }
  if (moduleKey && economicModuleKeys.includes(moduleKey)) {
    return {
      moduleKey,
      reason: economicReason ?? 'Top economic route is in this city.',
      from: 'economic',
    };
  }
  if (moduleKey && trackedModuleKey === moduleKey) {
    return {
      moduleKey,
      reason: 'Tracked bounty routing points here.',
      from: 'tracked_bounty',
    };
  }

  return {
    moduleKey: null,
    reason: 'Recommended next step is outside World right now.',
    from: 'none',
  };
}

export function buildWorldCommandSurface(input: {
  visibleModules: readonly string[];
  moduleSurfacesByKey: Partial<Record<string, ModulePurposeSourceSurface>>;
  runCompassPrimaryAction: { why: string; target: RunCompassActionTarget | null } | null;
  runCompassSecondaryModuleKey?: LiveWorldModuleKey | null;
  economicTopModuleKey: string | null;
  economicReason: string | null;
  trackedBountyModuleKey: string | null;
  trackedBountyAlert: WorldCommandAlertSurface | null;
  expeditionIdleAlert: WorldCommandAlertSurface | null;
}): WorldCommandSurface {
  const recommendation = resolveWorldRecommendedModule({
    visibleModules: input.visibleModules,
    runCompassPrimaryAction: input.runCompassPrimaryAction,
    runCompassSecondaryModuleKey: input.runCompassSecondaryModuleKey,
    economicTopModuleKey: input.economicTopModuleKey,
    economicReason: input.economicReason,
    trackedBountyModuleKey: input.trackedBountyModuleKey,
  });

  const groups = GROUP_ORDER.map((groupId) => {
    const cards = GROUP_MEMBERS[groupId]
      .filter((moduleKey) => isVisibleModule(input.visibleModules, moduleKey))
      .map((moduleKey) => {
        const surface = input.moduleSurfacesByKey[moduleKey];
        return {
          moduleKey,
          moduleLabel: surface?.moduleLabel ?? getWorldModuleLabel(moduleKey),
          roleTag: surface?.purposeTag ?? getWorldModuleCardDefinition(moduleKey).roleTag,
          bestUsedWhen: surface?.purposeLine ?? getWorldModuleCardDefinition(moduleKey).bestUsedWhen,
          outputHint: surface?.outputHint ?? null,
          recommendedNow: recommendation.moduleKey === moduleKey,
        };
      });

    return {
      id: groupId,
      label: GROUP_LABELS[groupId],
      cards,
    };
  }).filter((group) => group.cards.length > 0);

  const alerts = [input.trackedBountyAlert, input.expeditionIdleAlert].filter((entry): entry is WorldCommandAlertSurface => entry != null);

  return {
    groups,
    recommendation,
    alerts,
  };
}
