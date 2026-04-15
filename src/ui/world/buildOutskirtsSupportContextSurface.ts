import type { BountyInstance } from '../../stores/bountyStore.js';
import type { RunCompassActionLine } from '../../systems/ui/runCompass/index.js';
import type { LiveWorldModuleKey } from '../../content/types.js';

export type OutskirtsRouteDestination = 'ruins' | 'forge' | 'apothecary';

export interface OutskirtsSupportRouteHint {
  destination: OutskirtsRouteDestination;
  moduleKey: Extract<LiveWorldModuleKey, OutskirtsRouteDestination>;
  label: string;
  reason: string;
}

export interface OutskirtsSupportBountySurface {
  title: string;
  progressText: string;
  rewardSummary: string;
  overlapState: 'relevant';
}

export interface OutskirtsSupportContextSurface {
  trackedBounty: OutskirtsSupportBountySurface | null;
  farmerRecommendation: { label: string; reason: string } | null;
  primaryRouteHint: OutskirtsSupportRouteHint | null;
  secondaryRouteHint: OutskirtsSupportRouteHint | null;
  routeHints: OutskirtsSupportRouteHint[];
}

const ROUTE_DESTINATIONS = new Map<LiveWorldModuleKey, OutskirtsRouteDestination>([
  ['ruins', 'ruins'],
  ['forge', 'forge'],
  ['apothecary', 'apothecary'],
]);

function formatBountyRewardSummary(bounty: BountyInstance): string {
  const currencies = bounty.rewards.currencies ?? {};
  const lines: string[] = [];
  if (currencies.gold && Number(currencies.gold) > 0) lines.push(`Gold ${currencies.gold}`);
  if (currencies.merit && Number(currencies.merit) > 0) lines.push(`Merit ${currencies.merit}`);
  if (currencies.spiritStones && Number(currencies.spiritStones) > 0) lines.push(`Spirit Stones ${currencies.spiritStones}`);
  return lines.length > 0 ? lines.join(' • ') : 'Claim reward ready on Bounties board';
}

function toRouteLabel(destination: OutskirtsRouteDestination): string {
  switch (destination) {
    case 'ruins': return 'Better next step: Ruins';
    case 'forge': return 'Better next step: Forge';
    case 'apothecary': return 'Better next step: Apothecary';
  }
}

export interface BuildOutskirtsSupportContextSurfaceArgs {
  trackedOutskirtsBounty: BountyInstance | null;
  runCompassActions: RunCompassActionLine[] | null | undefined;
  farmerRecommendationLine: string | null;
  cityId: string;
}

export function buildOutskirtsSupportContextSurface(args: BuildOutskirtsSupportContextSurfaceArgs): OutskirtsSupportContextSurface {
  const trackedBounty = args.trackedOutskirtsBounty
    ? {
      title: args.trackedOutskirtsBounty.title,
      progressText: `${args.trackedOutskirtsBounty.progress} / ${args.trackedOutskirtsBounty.target}${args.trackedOutskirtsBounty.progress >= args.trackedOutskirtsBounty.target ? ' • Ready' : ''}`,
      rewardSummary: formatBountyRewardSummary(args.trackedOutskirtsBounty),
      overlapState: 'relevant' as const,
    }
    : null;

  const farmerRecommendation = args.farmerRecommendationLine && /farmer/i.test(args.farmerRecommendationLine)
    ? {
      label: 'Recommended AI: Farmer',
      reason: 'Best low-risk profile for repeatable field farming.',
    }
    : null;

  const routeHints: OutskirtsSupportRouteHint[] = [];
  const seen = new Set<OutskirtsRouteDestination>();
  for (const action of args.runCompassActions ?? []) {
    if (action.blocked || action.target?.kind !== 'world_module') continue;
    if (action.target.cityId !== args.cityId) continue;
    const destination = ROUTE_DESTINATIONS.get(action.target.moduleKey);
    if (!destination || seen.has(destination)) continue;
    seen.add(destination);
    routeHints.push({
      destination,
      moduleKey: action.target.moduleKey as Extract<LiveWorldModuleKey, OutskirtsRouteDestination>,
      label: toRouteLabel(destination),
      reason: action.why,
    });
    if (routeHints.length >= 2) break;
  }

  return {
    trackedBounty,
    farmerRecommendation,
    primaryRouteHint: routeHints[0] ?? null,
    secondaryRouteHint: routeHints[1] ?? null,
    routeHints,
  };
}
