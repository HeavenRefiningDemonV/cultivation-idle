import type { ValidatedContent } from '../../../content/index.js';
import { buildResourceProvenanceSurface } from '../../../systems/economy/resourceProvenanceSurface.js';
import { p3ModuleRoute, type P3Route } from '../../../systems/world/p3SurfaceTypes.js';

export interface ExpeditionShortageSurfaceV1 {
  version: 1;
  cityId?: string;
  activeSlots: ExpeditionSlotSurface[];
  recommendedRoutes: ExpeditionRouteFitSurface[];
  currentShortages: ExpeditionShortageTarget[];
  expectedReliefLines: string[];
  claimDeltas: string[];
  summaryLine: string;
  debugNotes: string[];
}

export interface ExpeditionSlotSurface {
  id: string;
  state: 'idle' | 'active' | 'claimable' | 'locked';
  line: string;
}

export interface ExpeditionRouteFitSurface {
  routeId: string;
  label: string;
  fit: 'primary' | 'secondary' | 'routine' | 'not_now';
  shortageTargets: string[];
  expectedYieldLine: string;
  durationLine: string;
  originCityLine?: string;
  routeButton?: P3Route;
}

export interface ExpeditionShortageTarget {
  itemId: string;
  label: string;
  route?: P3Route;
}

interface BuildExpeditionShortageSurfaceArgs {
  content: ValidatedContent;
  cityId: string;
  activeRuns: Array<{ id?: string; expeditionTypeId: string; status: string; endsAt?: number }>;
  slots: number;
  shortageItemIds: readonly string[];
}

function itemName(content: ValidatedContent, itemId: string): string {
  return content.items.find((item) => item.id === itemId)?.name ?? itemId;
}

function shortageTag(itemId: string): string {
  if (/ore|iron|steel|core/i.test(itemId)) return 'ore';
  if (/herb|leaf|dew|pollen|reagent|cons_/i.test(itemId)) return 'herbs';
  if (/fragment|manual|scrap/i.test(itemId)) return 'fragments';
  return 'support';
}

export function buildExpeditionShortageSurface(args: BuildExpeditionShortageSurfaceArgs): ExpeditionShortageSurfaceV1 {
  const running = args.activeRuns.filter((run) => run.status === 'running');
  const idle = Math.max(0, args.slots - running.length);
  const currentShortages = args.shortageItemIds.map((itemId) => {
    const provenance = buildResourceProvenanceSurface({
      content: args.content,
      kind: itemId.includes('fragment') ? 'fragment' : 'item',
      id: itemId,
      currentCityId: args.cityId,
      currentShortageIds: [itemId],
    });
    return { itemId, label: itemName(args.content, itemId), route: provenance.bestSourceRoute };
  });
  const tags = new Set(args.shortageItemIds.map(shortageTag));
  const recommendedRoutes = args.content.expeditions.types.map((route) => {
    const routeTags = route.yieldTags.map((tag) => tag.toLowerCase());
    const matches = routeTags.filter((tag) => tags.has(tag));
    const fit: ExpeditionRouteFitSurface['fit'] = matches.length > 0 && idle > 0 ? 'primary' : matches.length > 0 ? 'secondary' : args.shortageItemIds.length === 0 ? 'routine' : 'not_now';
    return {
      routeId: route.id,
      label: route.name,
      fit,
      shortageTargets: currentShortages.filter((shortage) => routeTags.includes(shortageTag(shortage.itemId))).map((shortage) => shortage.label),
      expectedYieldLine: matches.length > 0 ? `Targets ${matches.join(', ')} shortage smoothing.` : 'Routine support; no current shortage target.',
      durationLine: args.content.expeditions.durations[0]?.label ?? 'Duration unavailable',
      originCityLine: `Launch from ${args.content.cities.find((city) => city.id === args.cityId)?.name ?? 'current city'}.`,
      routeButton: p3ModuleRoute('expeditions', `Launch ${route.name} for background support.`, args.cityId),
    };
  }).sort((left, right) => {
    const order = { primary: 0, secondary: 1, routine: 2, not_now: 3 } as const;
    return order[left.fit] - order[right.fit] || left.label.localeCompare(right.label);
  });
  const activeSlots: ExpeditionSlotSurface[] = [
    ...running.map((run, index) => ({ id: run.id ?? `active_${index}`, state: 'active' as const, line: `${run.expeditionTypeId} is smoothing background support.` })),
    ...Array.from({ length: idle }, (_, index) => ({ id: `idle_${index}`, state: 'idle' as const, line: 'Idle slot can target a current shortage.' })),
  ];

  return {
    version: 1,
    cityId: args.cityId,
    activeSlots,
    recommendedRoutes,
    currentShortages,
    expectedReliefLines: recommendedRoutes.filter((route) => route.fit === 'primary').map((route) => route.expectedYieldLine),
    claimDeltas: running.length > 0 ? ['Claim will report whether a shortage row changed.'] : [],
    summaryLine: idle > 0 && currentShortages.length > 0
      ? 'Idle expedition slot can route toward a current shortage.'
      : currentShortages.length > 0
        ? 'Active expeditions are already smoothing shortages.'
        : 'No current shortage; expeditions are routine background support.',
    debugNotes: [`slots=${args.slots}`, `running=${running.length}`],
  };
}
