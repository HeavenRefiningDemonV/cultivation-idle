import type { LiveWorldModuleKey } from '../../../content/types.js';
import type { ModulePurposeSourceSurface } from '../../economy/purposeSourceSurface.js';

interface RunCompassPrimaryAction {
  why: string;
  target: {
    kind: 'world_module' | 'tab';
    moduleKey?: LiveWorldModuleKey;
  } | null;
}

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

export const SUPPORT_IDENTITY_LABELS = {
  'starter-loop': 'Starter Loop',
  'forge-and-ore': 'Forge & Ore',
  'fragments-and-build-correction': 'Fragments & Build Correction',
  'reagents-and-survival-prep': 'Reagents & Survival Prep',
  'final-convergence': 'Final Convergence',
} as const;

function isVisibleModule(visibleModules: readonly string[], moduleKey: string): moduleKey is LiveWorldModuleKey {
  return visibleModules.includes(moduleKey);
}

export function resolveWorldRecommendedModule(input: {
  visibleModules: readonly string[];
  runCompassPrimaryAction: RunCompassPrimaryAction | null;
  economicTopModuleKey: string | null;
  economicReason: string | null;
  trackedBountyModuleKey: string | null;
}): WorldCommandRecommendation {
  const { visibleModules, runCompassPrimaryAction, economicTopModuleKey, economicReason, trackedBountyModuleKey } = input;

  if (
    runCompassPrimaryAction?.target?.kind === 'world_module'
    && runCompassPrimaryAction.target.moduleKey
    && isVisibleModule(visibleModules, runCompassPrimaryAction.target.moduleKey)
  ) {
    return {
      moduleKey: runCompassPrimaryAction.target.moduleKey,
      reason: runCompassPrimaryAction.why,
      from: 'run_compass',
    };
  }

  if (economicTopModuleKey && isVisibleModule(visibleModules, economicTopModuleKey)) {
    return {
      moduleKey: economicTopModuleKey,
      reason: economicReason ?? 'Top economic route is in this city.',
      from: 'economic',
    };
  }

  if (trackedBountyModuleKey && isVisibleModule(visibleModules, trackedBountyModuleKey)) {
    return {
      moduleKey: trackedBountyModuleKey,
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
  runCompassPrimaryAction: RunCompassPrimaryAction | null;
  economicTopModuleKey: string | null;
  economicReason: string | null;
  trackedBountyModuleKey: string | null;
  trackedBountyAlert: WorldCommandAlertSurface | null;
  expeditionIdleAlert: WorldCommandAlertSurface | null;
}): WorldCommandSurface {
  const recommendation = resolveWorldRecommendedModule({
    visibleModules: input.visibleModules,
    runCompassPrimaryAction: input.runCompassPrimaryAction,
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
          moduleLabel: surface?.moduleLabel ?? moduleKey,
          roleTag: surface?.purposeTag ?? 'World Module',
          bestUsedWhen: surface?.purposeLine ?? 'Open this module for current city progression.',
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
