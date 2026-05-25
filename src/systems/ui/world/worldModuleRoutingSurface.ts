import type { LiveWorldModuleKey } from '../../../content/types.js';
import type { EconomicProblemKind } from '../../economy/economicProblemKinds.js';
import { getProblemChipFamily } from '../../economy/problemDestinationPolicy.js';
import {
  WORLD_MODULE_GROUP_LABELS,
  WORLD_MODULE_GROUP_ORDER,
  buildWorldModuleCardSurface,
  getWorldModuleCardDefinition,
  type WorldRoutingChipKind,
} from '../../world/moduleCardRegistry.js';

type ChipTone = 'strong' | 'support' | 'neutral';

export interface WorldRoutingPriorityInput {
  visibleModules: readonly LiveWorldModuleKey[];
  primaryModuleKey?: LiveWorldModuleKey | null;
  secondaryModuleKeys?: readonly LiveWorldModuleKey[];
  supportModuleKeys?: readonly LiveWorldModuleKey[];
  blockedModuleKeys?: readonly LiveWorldModuleKey[];
  /** @deprecated Public World routing should use local routing keys. */
  runCompassPrimaryModuleKey?: LiveWorldModuleKey | null;
  /** @deprecated Public World routing should use local routing keys. */
  runCompassSecondaryModuleKey?: LiveWorldModuleKey | null;
  economicModuleKeys: LiveWorldModuleKey[];
  trackedBountyModuleKey: LiveWorldModuleKey | null;
}

export interface WorldModuleRoutingCard {
  moduleKey: LiveWorldModuleKey;
  label: string;
  roleTag: string;
  bestUsedWhen: string;
  outputs: string[];
  openLabel: string;
  chips: Array<{ kind: WorldRoutingChipKind; tone: ChipTone }>;
  active: boolean;
}

export interface WorldModuleRoutingGroup {
  id: (typeof WORLD_MODULE_GROUP_ORDER)[number];
  label: string;
  cards: WorldModuleRoutingCard[];
}

export interface WorldModuleRoutingAlert {
  id: 'tracked_bounty' | 'expedition_idle';
  title: string;
  detail: string;
  ctaLabel: string;
  ctaModuleKey: LiveWorldModuleKey;
  chipKind?: WorldRoutingChipKind;
}

function toStrongKind(problemKind: EconomicProblemKind | null): WorldRoutingChipKind {
  const family = getProblemChipFamily(problemKind);
  if (family === 'gate_critical') return 'gate_critical';
  if (family === 'build_fix') return 'build_fix';
  if (family === 'stock_low') return 'stock_low';
  return 'recommended_now';
}

export function resolveWorldStrongRecommendationModuleKey(input: WorldRoutingPriorityInput): LiveWorldModuleKey | null {
  const visibleSet = new Set(input.visibleModules);
  const secondaryModuleKeys = input.secondaryModuleKeys ?? [
    input.runCompassSecondaryModuleKey ?? null,
  ].filter((moduleKey): moduleKey is LiveWorldModuleKey => moduleKey !== null);
  return [
    ...(input.blockedModuleKeys ?? []),
    input.primaryModuleKey ?? input.runCompassPrimaryModuleKey ?? null,
    input.economicModuleKeys[0] ?? null,
    input.trackedBountyModuleKey,
  ].find((moduleKey): moduleKey is LiveWorldModuleKey => moduleKey !== null && visibleSet.has(moduleKey)) ?? null;
}

export function buildWorldModuleRoutingSurface(input: {
  content: Parameters<typeof buildWorldModuleCardSurface>[0]['content'];
  cityId: string;
  visibleModules: readonly LiveWorldModuleKey[];
  activeModuleKey: string | null;
  primaryModuleKey?: LiveWorldModuleKey | null;
  secondaryModuleKeys?: readonly LiveWorldModuleKey[];
  supportModuleKeys?: readonly LiveWorldModuleKey[];
  blockedModuleKeys?: readonly LiveWorldModuleKey[];
  /** @deprecated Public World routing should use local routing keys. */
  runCompassPrimaryModuleKey?: LiveWorldModuleKey | null;
  /** @deprecated Public World routing should use local routing keys. */
  runCompassSecondaryModuleKey?: LiveWorldModuleKey | null;
  economicModuleKeys: LiveWorldModuleKey[];
  economicPrimaryProblemKind: EconomicProblemKind | null;
  trackedBountyModuleKey: LiveWorldModuleKey | null;
  trackedBountyAlert: WorldModuleRoutingAlert | null;
  expeditionIdleAlert: WorldModuleRoutingAlert | null;
  readyBountyCount: number;
  idleExpeditionSlots: number;
}): {
  groups: WorldModuleRoutingGroup[];
  alerts: WorldModuleRoutingAlert[];
  strongRecommendationModuleKey: LiveWorldModuleKey | null;
} {
  const strongRecommendationModuleKey = resolveWorldStrongRecommendationModuleKey({
    visibleModules: input.visibleModules,
    primaryModuleKey: input.primaryModuleKey,
    secondaryModuleKeys: input.secondaryModuleKeys,
    supportModuleKeys: input.supportModuleKeys,
    blockedModuleKeys: input.blockedModuleKeys,
    runCompassPrimaryModuleKey: input.runCompassPrimaryModuleKey,
    runCompassSecondaryModuleKey: input.runCompassSecondaryModuleKey,
    economicModuleKeys: input.economicModuleKeys,
    trackedBountyModuleKey: input.trackedBountyModuleKey,
  });

  const localSupportRecommendations = [
    ...(input.secondaryModuleKeys ?? [
      input.runCompassSecondaryModuleKey ?? null,
    ].filter((moduleKey): moduleKey is LiveWorldModuleKey => moduleKey !== null)),
    ...(input.supportModuleKeys ?? []),
  ];
  const supportingRecommendations = [
    ...localSupportRecommendations,
    ...input.economicModuleKeys,
  ]
    .filter((moduleKey) => moduleKey !== strongRecommendationModuleKey && input.visibleModules.includes(moduleKey))
    .slice(0, 2);

  const groups = WORLD_MODULE_GROUP_ORDER.map((groupId) => {
    const cards = input.visibleModules
      .map((moduleKey) => buildWorldModuleCardSurface({ content: input.content, cityId: input.cityId, moduleKey }))
      .filter((surface) => surface.group === groupId)
      .sort((left, right) => getWorldModuleCardDefinition(left.moduleKey).sortOrder - getWorldModuleCardDefinition(right.moduleKey).sortOrder)
      .map((surface) => {
        const chips: Array<{ kind: WorldRoutingChipKind; tone: ChipTone }> = [];
        if (surface.moduleKey === strongRecommendationModuleKey) {
          const isBlockedRoute = (input.blockedModuleKeys ?? []).includes(surface.moduleKey);
          const isPrimaryRoute = surface.moduleKey === input.primaryModuleKey || surface.moduleKey === input.runCompassPrimaryModuleKey;
          chips.push({
            kind: isBlockedRoute
              ? surface.moduleKey === 'gateTrial' ? 'gate_critical' : 'build_fix'
              : (isPrimaryRoute && surface.moduleKey === 'gateTrial')
                  ? 'gate_critical'
                  : isPrimaryRoute
                    ? 'recommended_now'
                    : toStrongKind(input.economicPrimaryProblemKind),
            tone: 'strong',
          });
        } else if (supportingRecommendations.includes(surface.moduleKey)) {
          chips.push({ kind: 'useful_soon', tone: 'support' });
        }

        if (surface.moduleKey === 'bounties' && input.readyBountyCount > 0 && chips.length < 2) {
          chips.unshift({ kind: 'claim_ready', tone: 'support' });
        }
        if (surface.moduleKey === 'expeditions' && input.idleExpeditionSlots > 0 && chips.length < 2) {
          chips.unshift({ kind: 'idle_slot', tone: 'support' });
        }
        if (surface.moduleKey === input.trackedBountyModuleKey && chips.length < 2) {
          chips.push({ kind: 'useful_soon', tone: 'support' });
        }

        return {
          moduleKey: surface.moduleKey,
          label: surface.label,
          roleTag: surface.roleTag,
          bestUsedWhen: surface.bestUsedWhen,
          outputs: surface.outputs.slice(0, 2).map((entry) => entry.label),
          openLabel: surface.ctaLabel,
          chips: chips.slice(0, 2),
          active: input.activeModuleKey === surface.moduleKey,
        };
      });

    return {
      id: groupId,
      label: WORLD_MODULE_GROUP_LABELS[groupId],
      cards,
    };
  }).filter((group) => group.cards.length > 0);

  return {
    groups,
    strongRecommendationModuleKey,
    alerts: [input.trackedBountyAlert, input.expeditionIdleAlert].filter((entry): entry is WorldModuleRoutingAlert => entry !== null),
  };
}
