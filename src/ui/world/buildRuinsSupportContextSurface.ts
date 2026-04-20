import type { BountyInstance } from '../../stores/bountyStore.js';
import type { RunCompassActionLine } from '../../systems/ui/runCompass/index.js';
import type { GateTrialReadinessLabel } from '../../systems/readiness/section5Adapters.js';

export type RuinsSupportDestination = 'forge' | 'apothecary' | 'gateTrial';

export interface RuinsSupportExitHint {
  destination: RuinsSupportDestination;
  label: string;
  reason: string;
  ctaLabel: string;
  routeable: boolean;
}

export interface RuinsTrackedBountySurface {
  title: string;
  progressText: string;
  rewardSummary: string;
  kind: BountyInstance['kind'];
}

export interface RuinsSupportContextSurface {
  trackedBounty: RuinsTrackedBountySurface | null;
  primaryExitHint: RuinsSupportExitHint | null;
  secondaryExitHint: RuinsSupportExitHint | null;
}

interface MaterialRequirement {
  itemId: string;
  needed: number;
  owned: number;
}

export interface BuildRuinsSupportContextSurfaceArgs {
  trackedBounty: BountyInstance | null;
  runCompassActions: RunCompassActionLine[] | null | undefined;
  cityId: string;
  cityModules: readonly string[];
  leadMaterialIds: readonly string[];
  itemCountsById: Record<string, number>;
  itemNamesById: Record<string, string | undefined>;
  forgeBlueprints: ReadonlyArray<{ id: string; unlocksAtCityId: string; inputs?: Record<string, number> }>;
  alchemyRecipes: ReadonlyArray<{ id: string; unlocksAtCityId: string; inputs: Record<string, number> }>;
  gateReadiness: {
    readinessLabel: GateTrialReadinessLabel;
    readinessDetail: string;
    gateResolved: boolean;
    canStart: boolean;
  } | null;
}

function formatBountyRewardSummary(bounty: BountyInstance): string {
  const currencies = bounty.rewards.currencies ?? {};
  const parts: string[] = [];
  if (Number(currencies.gold ?? 0) > 0) parts.push(`Gold ${currencies.gold}`);
  if (Number(currencies.merit ?? 0) > 0) parts.push(`Merit ${currencies.merit}`);
  if (Number(currencies.spiritStones ?? 0) > 0) parts.push(`Spirit Stones ${currencies.spiritStones}`);
  return parts.length > 0 ? parts.join(' • ') : 'Reward ready on Bounties board';
}

function summarizeSatisfiedMaterials(
  inputs: Record<string, number>,
  leadMaterialIds: readonly string[],
  itemCountsById: Record<string, number>,
): MaterialRequirement[] {
  const requirements = leadMaterialIds
    .map((itemId) => {
      const needed = Number(inputs[itemId] ?? 0);
      if (needed <= 0) return null;
      return { itemId, needed, owned: Number(itemCountsById[itemId] ?? 0) };
    })
    .filter((entry): entry is MaterialRequirement => Boolean(entry));

  if (requirements.length === 0) return [];
  if (requirements.some((entry) => entry.owned < entry.needed)) return [];
  return requirements;
}

function formatMaterialReason(materials: MaterialRequirement[], itemNamesById: Record<string, string | undefined>, suffix: string): string {
  const tokens = materials.slice(0, 2).map((material) => {
    const label = itemNamesById[material.itemId] ?? material.itemId;
    return `${label} ${material.owned}/${material.needed}`;
  });
  return `Enough ${tokens.join(' • ')} ${suffix}`;
}

function hasRouteAction(
  actions: RunCompassActionLine[] | null | undefined,
  cityId: string,
  moduleKey: RuinsSupportDestination,
): boolean {
  return Boolean((actions ?? []).find((action) =>
    !action.blocked
    && action.target?.kind === 'world_module'
    && action.target.cityId === cityId
    && action.target.moduleKey === moduleKey,
  ));
}

function buildForgeHint(args: BuildRuinsSupportContextSurfaceArgs): RuinsSupportExitHint | null {
  if (!args.cityModules.includes('forge')) return null;

  for (const blueprint of args.forgeBlueprints) {
    if (blueprint.unlocksAtCityId !== args.cityId) continue;
    const inputs = blueprint.inputs ?? {};
    const satisfied = summarizeSatisfiedMaterials(inputs, args.leadMaterialIds, args.itemCountsById);
    if (satisfied.length <= 0) continue;
    return {
      destination: 'forge',
      label: 'You now have enough for Forge',
      reason: formatMaterialReason(satisfied, args.itemNamesById, 'for a forge step.'),
      ctaLabel: 'Open Forge',
      routeable: hasRouteAction(args.runCompassActions, args.cityId, 'forge'),
    };
  }

  return null;
}

function buildApothecaryHint(args: BuildRuinsSupportContextSurfaceArgs): RuinsSupportExitHint | null {
  if (!args.cityModules.includes('apothecary')) return null;

  for (const recipe of args.alchemyRecipes) {
    if (recipe.unlocksAtCityId !== args.cityId) continue;
    const satisfied = summarizeSatisfiedMaterials(recipe.inputs, args.leadMaterialIds, args.itemCountsById);
    if (satisfied.length <= 0) continue;
    return {
      destination: 'apothecary',
      label: 'You now have enough for Apothecary',
      reason: formatMaterialReason(satisfied, args.itemNamesById, 'for a brew package.'),
      ctaLabel: 'Open Apothecary',
      routeable: hasRouteAction(args.runCompassActions, args.cityId, 'apothecary'),
    };
  }

  return null;
}

function buildGateHint(args: BuildRuinsSupportContextSurfaceArgs): RuinsSupportExitHint | null {
  const gate = args.gateReadiness;
  if (!gate || gate.gateResolved || !args.cityModules.includes('gateTrial')) return null;
  if (gate.readinessLabel !== 'Close') return null;

  return {
    destination: 'gateTrial',
    label: 'Gate Trial is now near-ready',
    reason: gate.readinessDetail,
    ctaLabel: 'Open Gate Trial',
    routeable: hasRouteAction(args.runCompassActions, args.cityId, 'gateTrial'),
  };
}

export function buildRuinsSupportContextSurface(args: BuildRuinsSupportContextSurfaceArgs): RuinsSupportContextSurface {
  const trackedBounty = args.trackedBounty
    ? {
      title: args.trackedBounty.title,
      progressText: `${args.trackedBounty.progress} / ${args.trackedBounty.target}${args.trackedBounty.progress >= args.trackedBounty.target ? ' • Ready' : ''}`,
      rewardSummary: formatBountyRewardSummary(args.trackedBounty),
      kind: args.trackedBounty.kind,
    }
    : null;

  const gateHint = buildGateHint(args);
  const forgeHint = buildForgeHint(args);
  const apothecaryHint = buildApothecaryHint(args);

  const ordered = [gateHint, forgeHint, apothecaryHint].filter((entry): entry is RuinsSupportExitHint => Boolean(entry));

  return {
    trackedBounty,
    primaryExitHint: ordered[0] ?? null,
    secondaryExitHint: ordered[1] ?? null,
  };
}
