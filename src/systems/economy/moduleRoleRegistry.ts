import type { LiveWorldModuleKey } from '../../content/types.js';
import { getLiveExpeditionRoutePurposes } from '../world/expeditionRouteContract.js';
import { LIVE_BOUNTY_BOARD_SLOTS } from '../world/bountyBoardContract.js';
import { DEFERRED_WORLD_MODULES } from '../world/liveWorldSchema.js';
import { ECONOMY_FACING_MODULE_KEYS } from './economicConstants.js';

export type EconomicModuleCategory =
  | 'resource_source'
  | 'targeted_source'
  | 'readiness'
  | 'permanent_floor'
  | 'support_loop'
  | 'passive_smoothing'
  | 'build_correction'
  | 'milestone';

export type EconomicModuleKind = 'primary_source' | 'conversion_station' | 'support_loop' | 'milestone_step';
export type EconomicModuleActivityMode = 'foreground' | 'background';

export interface EconomicModuleRoleEntry {
  moduleKey: LiveWorldModuleKey;
  roleTag: string;
  bestUsedWhen: string;
  economicCategory: EconomicModuleCategory;
  moduleKind: EconomicModuleKind;
  activityMode: EconomicModuleActivityMode;
}

export const MODULE_ROLE_REGISTRY: readonly EconomicModuleRoleEntry[] = [
  {
    moduleKey: 'outskirts',
    roleTag: 'Gold & Common Mats',
    bestUsedWhen: 'You need gold and broad common-material income.',
    economicCategory: 'resource_source',
    moduleKind: 'primary_source',
    activityMode: 'foreground',
  },
  {
    moduleKey: 'ruins',
    roleTag: 'Targeted Mats',
    bestUsedWhen: 'You need deterministic targeted mats or anchor drops.',
    economicCategory: 'targeted_source',
    moduleKind: 'primary_source',
    activityMode: 'foreground',
  },
  {
    moduleKey: 'apothecary',
    roleTag: 'Immediate Readiness',
    bestUsedWhen: 'You need immediate readiness through buying, brewing, or pouch restock.',
    economicCategory: 'readiness',
    moduleKind: 'conversion_station',
    activityMode: 'background',
  },
  {
    moduleKey: 'forge',
    roleTag: 'Permanent Floor',
    bestUsedWhen: 'You need permanent refine, temper, or rune floor progress.',
    economicCategory: 'permanent_floor',
    moduleKind: 'conversion_station',
    activityMode: 'background',
  },
  {
    moduleKey: 'bounties',
    roleTag: 'Merit & Routing',
    bestUsedWhen: 'You need support-economy progress, refreshes, or route guidance.',
    economicCategory: 'support_loop',
    moduleKind: 'support_loop',
    activityMode: 'background',
  },
  {
    moduleKey: 'expeditions',
    roleTag: 'Passive Support',
    bestUsedWhen: 'You need passive shortage smoothing for herbs, ore, or fragments.',
    economicCategory: 'passive_smoothing',
    moduleKind: 'support_loop',
    activityMode: 'background',
  },
  {
    moduleKey: 'manualPavilion',
    roleTag: 'Build Correction',
    bestUsedWhen: 'You need build correction, manual options, or scout-route support.',
    economicCategory: 'build_correction',
    moduleKind: 'support_loop',
    activityMode: 'background',
  },
  {
    moduleKey: 'gateTrial',
    roleTag: 'Gate Progress',
    bestUsedWhen: 'You are ready to resolve the current milestone gate.',
    economicCategory: 'milestone',
    moduleKind: 'milestone_step',
    activityMode: 'foreground',
  },
] as const satisfies readonly EconomicModuleRoleEntry[];

export const MODULE_ROLE_REGISTRY_BY_KEY = Object.fromEntries(
  MODULE_ROLE_REGISTRY.map((entry) => [entry.moduleKey, entry]),
) as Record<LiveWorldModuleKey, EconomicModuleRoleEntry>;

export function getEconomicModuleRole(moduleKey: string): EconomicModuleRoleEntry | null {
  return MODULE_ROLE_REGISTRY_BY_KEY[moduleKey as LiveWorldModuleKey] ?? null;
}

export function getEconomicModuleRoleEntries(): EconomicModuleRoleEntry[] {
  return [...MODULE_ROLE_REGISTRY];
}

export function getDeferredModuleLeakKeysForModuleRoleRegistry(): string[] {
  return MODULE_ROLE_REGISTRY.map((entry) => entry.moduleKey).filter((moduleKey) =>
    DEFERRED_WORLD_MODULES.includes(moduleKey as (typeof DEFERRED_WORLD_MODULES)[number]),
  );
}

export function getEconomyFacingModuleKeys(): LiveWorldModuleKey[] {
  return [...ECONOMY_FACING_MODULE_KEYS];
}

export function getExpeditionPurposeConsistencySummary() {
  const purposes = getLiveExpeditionRoutePurposes();
  return {
    purposeCount: purposes.length,
    referencedModuleKeys: purposes.map((purpose) => purpose.moduleKey),
    missingModuleRoles: purposes
      .map((purpose) => purpose.moduleKey)
      .filter((moduleKey) => !MODULE_ROLE_REGISTRY_BY_KEY[moduleKey]),
    bountyBoardRoles: LIVE_BOUNTY_BOARD_SLOTS.map((slot) => slot.role),
  };
}
