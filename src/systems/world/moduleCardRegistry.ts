import type { LiveWorldModuleKey, ValidatedContent } from '../../content/index.js';
import type { EconomicProblemKind } from '../economy/economicProblemKinds.js';
import { getWorldModuleLabel } from '../../ui/text/playerFacingLabels.js';
import { sanitizeLiveCityName } from '../../ui/text/playerFacingLabels.js';
import {
  buildCityActivityRewardReadModel,
  OUTSKIRTS_ROLE_TAG,
  OUTSKIRTS_BEST_USED_WHEN,
  OUTSKIRTS_BOUNDARY_LINE,
  RUINS_ROLE_TAG,
  RUINS_BEST_USED_WHEN,
  OUTSKIRTS_CARD_OUTPUT_HINTS,
  RUINS_CARD_OUTPUT_HINTS,
} from '../economy/activityRewardReadModel.js';
import { getTrialGateItemId } from '../progression/runtime/gateResolver.js';

export type WorldModuleGroupKey = 'combat' | 'preparation' | 'support';

export type WorldRoutingChipKind =
  | 'recommended_now'
  | 'useful_soon'
  | 'claim_ready'
  | 'idle_slot'
  | 'build_fix'
  | 'gate_critical'
  | 'stock_low';

export type WorldRoutingChipFamily = 'recommendation' | 'alert' | 'progress';

export interface WorldRoutingChipDefinition {
  kind: WorldRoutingChipKind;
  label: string;
  family: WorldRoutingChipFamily;
}

export interface WorldModuleOutputHint {
  key: string;
  label: string;
}

export interface WorldModuleCardDefinition {
  moduleKey: LiveWorldModuleKey;
  label: string;
  group: WorldModuleGroupKey;
  sortOrder: number;
  roleTag: string;
  bestUsedWhen: string;
  defaultOutputs: WorldModuleOutputHint[];
  ctaLabel: string;
  allowedChipKinds: readonly WorldRoutingChipKind[];
  allowStrongRecommendation: boolean;
  allowSecondaryRecommendation: boolean;
}

export interface BuildWorldModuleCardSurfaceArgs {
  content: ValidatedContent;
  cityId: string;
  moduleKey: LiveWorldModuleKey;
}

export interface WorldModuleCardSurface {
  moduleKey: LiveWorldModuleKey;
  label: string;
  group: WorldModuleGroupKey;
  roleTag: string;
  bestUsedWhen: string;
  outputs: WorldModuleOutputHint[];
  boundaryLine: string | null;
  ctaLabel: string;
  allowedChipKinds: readonly WorldRoutingChipKind[];
}

export const WORLD_MODULE_GROUP_ORDER = ['combat', 'preparation', 'support'] as const;

export const WORLD_MODULE_GROUP_LABELS = {
  combat: 'Combat',
  preparation: 'Preparation',
  support: 'Support',
} as const satisfies Record<WorldModuleGroupKey, string>;

export const WORLD_ROUTING_CHIP_DEFINITIONS: Record<WorldRoutingChipKind, WorldRoutingChipDefinition> = {
  recommended_now: { kind: 'recommended_now', label: 'Recommended Now', family: 'recommendation' },
  useful_soon: { kind: 'useful_soon', label: 'Useful Soon', family: 'recommendation' },
  claim_ready: { kind: 'claim_ready', label: 'Claim Ready', family: 'progress' },
  idle_slot: { kind: 'idle_slot', label: 'Idle Slot', family: 'alert' },
  build_fix: { kind: 'build_fix', label: 'Build Fix', family: 'alert' },
  gate_critical: { kind: 'gate_critical', label: 'Gate Critical', family: 'alert' },
  stock_low: { kind: 'stock_low', label: 'Stock Low', family: 'alert' },
};

const DEFINITION_LIST: readonly WorldModuleCardDefinition[] = [
  {
    moduleKey: 'outskirts',
    label: getWorldModuleLabel('outskirts'),
    group: 'combat',
    sortOrder: 1,
    roleTag: OUTSKIRTS_ROLE_TAG,
    bestUsedWhen: OUTSKIRTS_BEST_USED_WHEN,
    defaultOutputs: [{ key: 'gold', label: OUTSKIRTS_CARD_OUTPUT_HINTS[0] }, { key: 'common_mats', label: OUTSKIRTS_CARD_OUTPUT_HINTS[1] }],
    ctaLabel: 'Open Outskirts',
    allowedChipKinds: ['recommended_now', 'useful_soon'],
    allowStrongRecommendation: true,
    allowSecondaryRecommendation: true,
  },
  {
    moduleKey: 'ruins',
    label: getWorldModuleLabel('ruins'),
    group: 'combat',
    sortOrder: 2,
    roleTag: RUINS_ROLE_TAG,
    bestUsedWhen: RUINS_BEST_USED_WHEN,
    defaultOutputs: [{ key: 'local_mats', label: RUINS_CARD_OUTPUT_HINTS[0] }, { key: 'anchor_drop', label: RUINS_CARD_OUTPUT_HINTS[1] }],
    ctaLabel: 'Open Ruins',
    allowedChipKinds: ['recommended_now', 'useful_soon'],
    allowStrongRecommendation: true,
    allowSecondaryRecommendation: true,
  },
  {
    moduleKey: 'gateTrial',
    label: getWorldModuleLabel('gateTrial'),
    group: 'combat',
    sortOrder: 3,
    roleTag: 'Gate Item',
    bestUsedWhen: 'Use this hall when the current gate item is ready for judgment.',
    defaultOutputs: [{ key: 'gate_proof', label: 'Gate Item' }, { key: 'breakthrough', label: 'Breakthrough' }],
    ctaLabel: 'Open Gate Trial',
    allowedChipKinds: ['recommended_now', 'gate_critical'],
    allowStrongRecommendation: true,
    allowSecondaryRecommendation: false,
  },
  {
    moduleKey: 'manualPavilion',
    label: getWorldModuleLabel('manualPavilion'),
    group: 'preparation',
    sortOrder: 4,
    roleTag: 'Build Correction',
    bestUsedWhen: 'Best used when you need build correction, manuals, or technique growth.',
    defaultOutputs: [{ key: 'manuals', label: 'Manuals' }, { key: 'fragments', label: 'Technique Fragments' }],
    ctaLabel: 'Open Manual Pavilion',
    allowedChipKinds: ['recommended_now', 'useful_soon', 'build_fix'],
    allowStrongRecommendation: true,
    allowSecondaryRecommendation: true,
  },
  {
    moduleKey: 'apothecary',
    label: getWorldModuleLabel('apothecary'),
    group: 'preparation',
    sortOrder: 5,
    roleTag: 'Immediate Readiness',
    bestUsedWhen: 'Best used when you need immediate readiness through healing stock, remedies, or pouch prep.',
    defaultOutputs: [{ key: 'healing_stock', label: 'Healing Stock' }, { key: 'prep_remedies', label: 'Preparation Remedies' }],
    ctaLabel: 'Open Apothecary',
    allowedChipKinds: ['recommended_now', 'useful_soon', 'stock_low'],
    allowStrongRecommendation: true,
    allowSecondaryRecommendation: true,
  },
  {
    moduleKey: 'forge',
    label: getWorldModuleLabel('forge'),
    group: 'preparation',
    sortOrder: 6,
    roleTag: 'Permanent Floor',
    bestUsedWhen: 'Best used when you need permanent floor through refine, temper, or rune work.',
    defaultOutputs: [{ key: 'refines', label: 'Refines' }, { key: 'temper_runes', label: 'Temper / Runes' }],
    ctaLabel: 'Open Forge',
    allowedChipKinds: ['recommended_now', 'useful_soon', 'build_fix'],
    allowStrongRecommendation: true,
    allowSecondaryRecommendation: true,
  },
  {
    moduleKey: 'bounties',
    label: getWorldModuleLabel('bounties'),
    group: 'support',
    sortOrder: 7,
    roleTag: 'Merit & Routing',
    bestUsedWhen: 'Best used when you need Merit, routing help, or directed support rewards.',
    defaultOutputs: [{ key: 'merit', label: 'Merit' }, { key: 'spirit_stones', label: 'Spirit Stones' }],
    ctaLabel: 'Open Bounties',
    allowedChipKinds: ['recommended_now', 'useful_soon', 'claim_ready', 'stock_low'],
    allowStrongRecommendation: true,
    allowSecondaryRecommendation: true,
  },
  {
    moduleKey: 'expeditions',
    label: getWorldModuleLabel('expeditions'),
    group: 'support',
    sortOrder: 8,
    roleTag: 'Passive Support',
    bestUsedWhen: 'Best used when you need passive shortage smoothing for herbs, ore, or fragments.',
    defaultOutputs: [{ key: 'herbs', label: 'Herbs' }, { key: 'ore', label: 'Ore' }],
    ctaLabel: 'Open Expeditions',
    allowedChipKinds: ['recommended_now', 'useful_soon', 'idle_slot'],
    allowStrongRecommendation: true,
    allowSecondaryRecommendation: true,
  },
] as const;

const DEFINITION_BY_MODULE_KEY = Object.fromEntries(DEFINITION_LIST.map((entry) => [entry.moduleKey, entry])) as Record<LiveWorldModuleKey, WorldModuleCardDefinition>;

export function getWorldRoutingChipLabel(kind: WorldRoutingChipKind): string {
  return WORLD_ROUTING_CHIP_DEFINITIONS[kind].label;
}

export function getWorldModuleCardDefinition(moduleKey: LiveWorldModuleKey): WorldModuleCardDefinition {
  return DEFINITION_BY_MODULE_KEY[moduleKey];
}

export function getWorldModuleCardDefinitions(): WorldModuleCardDefinition[] {
  return DEFINITION_LIST.map((entry) => ({ ...entry, defaultOutputs: [...entry.defaultOutputs], allowedChipKinds: [...entry.allowedChipKinds] }));
}

function asOutputHints(labels: readonly string[]): WorldModuleOutputHint[] {
  return labels.slice(0, 2).map((label) => ({ key: label.toLowerCase().replace(/\s+/g, '_'), label: sanitizeLiveCityName(label) }));
}

function buildGateTrialOutputHints(content: ValidatedContent, cityId: string): WorldModuleOutputHint[] {
  const trial = content.trials.find((entry) => entry.cityId === cityId) ?? null;
  const gateItemId = getTrialGateItemId(content, trial);
  const gateItemName = gateItemId ? content.items.find((entry) => entry.id === gateItemId)?.name ?? null : null;
  return [
    { key: 'gate_proof', label: sanitizeLiveCityName(gateItemName ?? 'Gate Item') },
    { key: 'breakthrough', label: 'Breakthrough' },
  ];
}

function buildExpeditionOutputHints(content: ValidatedContent): WorldModuleOutputHint[] {
  const tags = new Set<string>();
  content.expeditions.types.forEach((entry) => entry.yieldTags.forEach((tag) => tags.add(tag)));
  const preferredOrder = ['herbs', 'ore', 'fragments'];
  const picked = preferredOrder.filter((tag) => tags.has(tag)).slice(0, 2);
  return asOutputHints(picked.length > 0 ? picked.map((tag) => tag[0].toUpperCase() + tag.slice(1)) : ['Herbs', 'Ore']);
}

export function buildWorldModuleCardSurface(args: BuildWorldModuleCardSurfaceArgs): WorldModuleCardSurface {
  const { content, cityId, moduleKey } = args;
  const definition = getWorldModuleCardDefinition(moduleKey);

  if (moduleKey === 'outskirts' || moduleKey === 'ruins') {
    const activityReadModel = buildCityActivityRewardReadModel(content, cityId);
    if (moduleKey === 'outskirts') {
      return {
        moduleKey,
        label: definition.label,
        group: definition.group,
        roleTag: activityReadModel.outskirts.roleTag,
        bestUsedWhen: activityReadModel.outskirts.bestUsedWhen,
        outputs: asOutputHints(OUTSKIRTS_CARD_OUTPUT_HINTS),
        boundaryLine: activityReadModel.outskirts.boundaryLine,
        ctaLabel: definition.ctaLabel,
        allowedChipKinds: definition.allowedChipKinds,
      };
    }

    return {
      moduleKey,
      label: definition.label,
      group: definition.group,
      roleTag: activityReadModel.ruins.roleTag,
      bestUsedWhen: activityReadModel.ruins.bestUsedWhen,
      outputs: asOutputHints(RUINS_CARD_OUTPUT_HINTS),
      boundaryLine: activityReadModel.ruins.boundaryLine,
      ctaLabel: definition.ctaLabel,
      allowedChipKinds: definition.allowedChipKinds,
    };
  }

  const outputs = moduleKey === 'gateTrial'
    ? buildGateTrialOutputHints(content, cityId)
    : moduleKey === 'expeditions'
      ? buildExpeditionOutputHints(content)
      : definition.defaultOutputs;

  return {
    moduleKey,
    label: definition.label,
    group: definition.group,
    roleTag: definition.roleTag,
    bestUsedWhen: definition.bestUsedWhen,
    outputs: outputs.slice(0, 2),
    boundaryLine: null,
    ctaLabel: definition.ctaLabel,
    allowedChipKinds: definition.allowedChipKinds,
  };
}

export function resolveWorldRecommendationChipKind(args: {
  weight: 'primary' | 'secondary' | 'optional';
  problemKind: EconomicProblemKind | null;
}): WorldRoutingChipKind {
  const { weight, problemKind } = args;
  if (weight === 'primary') {
    if (problemKind === 'missingGatePrepPackage') return 'gate_critical';
    if (problemKind === 'buildCorrectionGap' || problemKind === 'belowMinimumForgeFloor' || problemKind === 'belowRecommendedForgeFloor') return 'build_fix';
    if (
      problemKind === 'belowHealingFloor'
      || problemKind === 'belowSpecialtyFloor'
      || problemKind === 'belowCultivationPrepFloor'
      || problemKind === 'belowMeritReserve'
      || problemKind === 'belowSpiritStoneMinimum'
      || problemKind === 'belowSpiritStoneIdeal'
    ) return 'stock_low';
    return 'recommended_now';
  }
  return 'useful_soon';
}
