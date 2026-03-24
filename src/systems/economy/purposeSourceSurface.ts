import type { ItemDef, LiveWorldModuleKey, ValidatedContent } from '../../content/index.js';
import { getWorldModuleLabel, sanitizeLiveCityName } from '../../ui/text/playerFacingLabels.js';
import { buildBestSourceIndex, type BestSourceIndex, type BestSourceIndexEntry, type BestSourceOption } from './bestSourceIndex.js';
import { buildCityActivityRewardReadModel, type CityActivityRewardReadModel } from './activityRewardReadModel.js';
import { getEconomicModuleRoleEntries, type EconomicModuleRoleEntry } from './moduleRoleRegistry.js';
import { getAllPrepBudgetRegistryEntries } from './prepBudgetRegistry.js';
import { listVisibleForgeInputItemIds } from './economicSourceAdapters.js';

export interface PurposeSourceSurface {
  purposeTag: string;
  purposeLine: string;
  primarySourceLabel?: string;
  primarySourceLine?: string;
  secondarySourceLabel?: string;
  secondarySourceLine?: string;
  boundaryLine?: string;
}

export interface ModulePurposeSourceSurface extends PurposeSourceSurface {
  moduleKey: LiveWorldModuleKey;
  moduleLabel: string;
  outputHint?: string;
}

export interface PurposeSourceContext {
  bestSourceIndex: BestSourceIndex;
  moduleRolesByKey: Record<LiveWorldModuleKey, EconomicModuleRoleEntry>;
  activityByCityId: Record<string, CityActivityRewardReadModel>;
  prepItemIds: Set<string>;
  forgeInputItemIds: Set<string>;
}

const CURRENCY_PURPOSES: Record<string, Pick<PurposeSourceSurface, 'purposeTag' | 'purposeLine' | 'boundaryLine'>> = {
  gold: {
    purposeTag: 'Core Currency',
    purposeLine: 'Used for manuals, gear, and most city spending.',
    boundaryLine: 'Use Outskirts first when you need a clean gold refill.',
  },
  merit: {
    purposeTag: 'Support Currency',
    purposeLine: 'Used for Safety Net support and other bounded reserve spending.',
    boundaryLine: 'Treat Bounties as the first Merit refill route.',
  },
  spiritStones: {
    purposeTag: 'Support Currency',
    purposeLine: 'Used for reserve-heavy support spending and late prep pressure.',
    boundaryLine: 'Treat Bounties as the first spirit-stone refill route.',
  },
};

function collectPrepItemIds(): Set<string> {
  const itemIds = new Set<string>();
  getAllPrepBudgetRegistryEntries().forEach((entry) => {
    entry.minimumPrepPackage.stockPackage.directCore.forEach((line) => itemIds.add(line.itemId));
    entry.minimumPrepPackage.stockPackage.supplementLanes.forEach((lane) => lane.optionItemIds.forEach((itemId) => itemIds.add(itemId)));
    entry.recommendedPrepPackage.stockPackage.directCore.forEach((line) => itemIds.add(line.itemId));
    entry.recommendedPrepPackage.stockPackage.supplementLanes.forEach((lane) => lane.optionItemIds.forEach((itemId) => itemIds.add(itemId)));
  });
  return itemIds;
}

export function buildPurposeSourceContext(content: ValidatedContent): PurposeSourceContext {
  const activityByCityId = Object.fromEntries(
    content.cities.map((city) => [city.id, buildCityActivityRewardReadModel(content, city.id)]),
  ) as Record<string, CityActivityRewardReadModel>;

  return {
    bestSourceIndex: buildBestSourceIndex(content),
    moduleRolesByKey: Object.fromEntries(
      getEconomicModuleRoleEntries().map((entry) => [entry.moduleKey, entry]),
    ) as Record<LiveWorldModuleKey, EconomicModuleRoleEntry>,
    activityByCityId,
    prepItemIds: collectPrepItemIds(),
    forgeInputItemIds: new Set(listVisibleForgeInputItemIds(content)),
  };
}

function formatItemNames(content: ValidatedContent, itemIds: readonly string[]): string {
  return itemIds
    .map((itemId) => content.items.find((item) => item.id === itemId)?.name ?? itemId)
    .slice(0, 3)
    .join(' • ');
}

function formatSourceLabel(option: BestSourceOption, content: ValidatedContent, currentCityId?: string | null): string {
  const moduleLabel = getWorldModuleLabel(option.moduleKey);
  const cityName = option.cityId
    ? sanitizeLiveCityName(content.cities.find((city) => city.id === option.cityId)?.name ?? '')
    : null;

  if (option.sourceKind === 'apothecary_buy' || option.sourceKind === 'apothecary_brew') {
    if (option.cityId && option.cityId === currentCityId) return 'Current city Apothecary';
    return cityName ? `${cityName} Apothecary` : 'Apothecary';
  }

  if (option.cityId && option.cityId === currentCityId) {
    return `Current city ${moduleLabel}`;
  }
  if (cityName) {
    return `${cityName} ${moduleLabel}`;
  }
  return moduleLabel;
}

function formatSourceLine(option: BestSourceOption): string {
  return option.routeDetail || option.reason || option.shortReason;
}

function buildSurfaceFromIndexEntry(
  entry: BestSourceIndexEntry,
  purpose: Pick<PurposeSourceSurface, 'purposeTag' | 'purposeLine' | 'boundaryLine'>,
  content: ValidatedContent,
  currentCityId?: string | null,
): PurposeSourceSurface {
  return {
    purposeTag: purpose.purposeTag,
    purposeLine: purpose.purposeLine,
    primarySourceLabel: entry.primarySource ? formatSourceLabel(entry.primarySource, content, currentCityId) : undefined,
    primarySourceLine: entry.primarySource ? formatSourceLine(entry.primarySource) : undefined,
    secondarySourceLabel: entry.secondarySource ? formatSourceLabel(entry.secondarySource, content, currentCityId) : undefined,
    secondarySourceLine: entry.secondarySource ? formatSourceLine(entry.secondarySource) : undefined,
    boundaryLine: purpose.boundaryLine ?? entry.currentCityEligibilityRule,
  };
}

function buildItemPurpose(item: ItemDef, itemId: string, context: PurposeSourceContext): Pick<PurposeSourceSurface, 'purposeTag' | 'purposeLine' | 'boundaryLine'> {
  if (itemId === 'mat_technique_fragment') {
    return {
      purposeTag: 'Technique Progression',
      purposeLine: 'Used to rank techniques and convert duplicate manuals into lasting build progress.',
      boundaryLine: 'Keep fragments for rank-ups instead of treating them like generic material overflow.',
    };
  }
  if (context.prepItemIds.has(itemId) || itemId.startsWith('gate_')) {
    return {
      purposeTag: 'Gate Prep',
      purposeLine: 'Used to cover breakthrough and gate package requirements for the current progression band.',
      boundaryLine: 'If today\'s shop caps out, use brew or fallback routes only for the honest remainder.',
    };
  }
  if (context.forgeInputItemIds.has(itemId)) {
    return {
      purposeTag: 'Permanent Power',
      purposeLine: 'Used in Forge recipes, rune work, and other permanent power-floor upgrades.',
      boundaryLine: 'Do not burn core forge mats on throwaway spending when a floor upgrade is waiting.',
    };
  }
  if (item.usage === 'combat_only' || item.usage === 'combat_or_world' || item.usage === 'cultivate_only') {
    return {
      purposeTag: 'Consumable',
      purposeLine: item.usage === 'cultivate_only'
        ? 'Used to accelerate cultivation-side prep and breakthrough pressure.'
        : 'Used to stabilize runs, refill readiness, or cover moment-to-moment combat prep.',
    };
  }
  return {
    purposeTag: item.category === 'material' ? 'Material' : 'General Use',
    purposeLine: item.description ?? `Used within the ${item.category} loop when that path is active.`,
  };
}

export function buildItemPurposeSourceSurface(
  content: ValidatedContent,
  context: PurposeSourceContext,
  itemId: string,
  currentCityId?: string | null,
): PurposeSourceSurface | null {
  const item = content.items.find((entry) => entry.id === itemId);
  if (!item) return null;
  const entry = context.bestSourceIndex.entriesByTargetId[itemId] ?? null;
  const purpose = buildItemPurpose(item, itemId, context);

  if (!entry) {
    return {
      purposeTag: purpose.purposeTag,
      purposeLine: purpose.purposeLine,
      boundaryLine: purpose.boundaryLine,
    };
  }

  return buildSurfaceFromIndexEntry(entry, purpose, content, currentCityId);
}

export function buildCurrencyPurposeSourceSurface(
  content: ValidatedContent,
  context: PurposeSourceContext,
  currencyId: 'gold' | 'merit' | 'spiritStones',
  currentCityId?: string | null,
): PurposeSourceSurface | null {
  const entry = context.bestSourceIndex.entriesByTargetId[currencyId] ?? null;
  const purpose = CURRENCY_PURPOSES[currencyId];
  if (!entry) {
    return purpose;
  }
  return buildSurfaceFromIndexEntry(entry, purpose, content, currentCityId);
}

export function buildModulePurposeSourceSurface(
  content: ValidatedContent,
  context: PurposeSourceContext,
  cityId: string,
  moduleKey: LiveWorldModuleKey,
): ModulePurposeSourceSurface | null {
  const activityReadModel = context.activityByCityId[cityId] ?? null;

  if (moduleKey === 'outskirts' && activityReadModel) {
    return {
      moduleKey,
      moduleLabel: getWorldModuleLabel(moduleKey),
      purposeTag: activityReadModel.outskirts.roleTag,
      purposeLine: activityReadModel.outskirts.bestUsedWhen,
      boundaryLine: activityReadModel.outskirts.boundaryLine,
      outputHint: `Expected outputs: ${formatItemNames(content, activityReadModel.outskirts.keyExpectedOutputs)}`,
    };
  }

  if (moduleKey === 'ruins' && activityReadModel) {
    return {
      moduleKey,
      moduleLabel: getWorldModuleLabel(moduleKey),
      purposeTag: activityReadModel.ruins.roleTag,
      purposeLine: activityReadModel.ruins.bestUsedWhen,
      boundaryLine: activityReadModel.ruins.boundaryLine,
      outputHint: `Expected outputs: ${formatItemNames(content, activityReadModel.ruins.keyExpectedOutputs)}`,
    };
  }

  const role = context.moduleRolesByKey[moduleKey] ?? null;
  if (!role) return null;

  return {
    moduleKey,
    moduleLabel: getWorldModuleLabel(moduleKey),
    purposeTag: role.roleTag.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    purposeLine: `Best used when ${role.bestUsedWhen.charAt(0).toLowerCase()}${role.bestUsedWhen.slice(1)}`,
    boundaryLine: role.moduleKey === 'outskirts'
      ? 'Switch away once you need targeted local mats instead of broad farming.'
      : role.moduleKey === 'ruins'
        ? 'Gold is secondary here; treat Ruins as the targeted-material route.'
        : undefined,
  };
}

export function buildTechniqueFragmentPurposeSourceSurface(
  content: ValidatedContent,
  context: PurposeSourceContext,
  currentCityId?: string | null,
): PurposeSourceSurface | null {
  return buildItemPurposeSourceSurface(content, context, 'mat_technique_fragment', currentCityId);
}

export function buildManualPurposeSourceSurface(): PurposeSourceSurface {
  return {
    purposeTag: 'Build Correction',
    purposeLine: 'Buy manuals to study new techniques, then equip the resulting technique in your live build.',
    primarySourceLabel: 'Manual Pavilion',
    primarySourceLine: 'This is the direct source for new manual offers in the current city.',
    secondarySourceLabel: 'Technique Fragments',
    secondarySourceLine: 'Duplicate manuals convert into Technique Fragments for rank progression instead of becoming junk.',
  };
}
