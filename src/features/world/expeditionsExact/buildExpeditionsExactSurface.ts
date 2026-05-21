import type { RewardBundle } from '../../../services/rewards/index.js';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { useCityStore } from '../../../stores/cityStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useExpeditionStore, type ExpeditionRun } from '../../../stores/expeditionStore.js';
import { buildLiveDaoMandateModuleSourceSinkProjection } from '../../../systems/ui/daoMandate/index.js';
import { getLiveExpeditionRoutePurpose } from '../../../systems/world/expeditionRouteContract.js';
import { sanitizeLiveCityName } from '../../../ui/text/playerFacingLabels.js';
import { normalizeItemList } from '../../../utils/itemList.js';
import { EXPEDITIONS_EXACT_ASSETS } from './expeditionsExactAssetRegistry.js';
import {
  EXPEDITION_ROUTE_ORDER,
  EXPEDITION_SLOT_ROMANS,
  EXPEDITIONS_EXACT_DEFAULT_CITY_ID,
  EXPEDITIONS_EXACT_ROOT_TEST_ID,
  EXPEDITIONS_EXACT_SURFACE_VERSION,
  clampPct,
  createExpeditionsExactButton,
  formatTimeLeft,
  titleCaseFromId,
} from './expeditionsExactPresentation.js';
import type {
  DispatchSlotSurface,
  ExpeditionRouteCardSurface,
  ExpeditionsExactIconKey,
  ExpeditionsExactSurfaceMode,
  ExpeditionsExactSurfaceV1,
} from './expeditionsExactTypes.js';

type BuildOptions = {
  mode?: ExpeditionsExactSurfaceMode;
  selectedRouteId?: string | null;
  selectedDurationId?: string | null;
  selectedSlotIndex?: number | null;
  now?: number;
};

const REGION_ORDER = [
  'header',
  'statusPlaque',
  'dispatchSlots',
  'routeMap',
  'availableRoutes',
  'dispatchLedger',
  'bottomActions',
];

const ROUTE_MAP_NODES = [
  { id: 'hamlet', label: 'Hamlet', x: 128, y: 110 },
  { id: 'herb-ridge', label: 'Herb ridge', x: 318, y: 152 },
  { id: 'ore-creek', label: 'Ore creek', x: 360, y: 270 },
  { id: 'old-road', label: 'Old road', x: 168, y: 424 },
  { id: 'scout-rise', label: 'Scout rise', x: 390, y: 470 },
];

function shellFlags(): ExpeditionsExactSurfaceV1['shell'] {
  return {
    useScreenOwnedExactPage: true,
    showLegacyPanel: false,
    showContextStrip: false,
  };
}

function asSlots(slots: DispatchSlotSurface[]): ExpeditionsExactSurfaceV1['dispatchSlots'] {
  return slots.slice(0, 4) as ExpeditionsExactSurfaceV1['dispatchSlots'];
}

function asRoutes(routes: ExpeditionRouteCardSurface[]): ExpeditionsExactSurfaceV1['availableRoutes']['routes'] {
  return routes.slice(0, 3) as ExpeditionsExactSurfaceV1['availableRoutes']['routes'];
}

export function createExpeditionsExactMockupFixture(
  overrides: Partial<ExpeditionsExactSurfaceV1> = {},
): ExpeditionsExactSurfaceV1 {
  const surface: ExpeditionsExactSurfaceV1 = {
    meta: {
      surfaceId: 'expeditions-exact',
      version: EXPEDITIONS_EXACT_SURFACE_VERSION,
      mode: 'fixture',
      cityId: EXPEDITIONS_EXACT_DEFAULT_CITY_ID,
      cityIndex: 0,
      selectedRouteId: 'scout',
      selectedDurationId: 'short',
      selectedSlotIndex: 2,
      idleSlotCount: 2,
      activeSlotCount: 1,
      claimReadyCount: 1,
      rootTestId: EXPEDITIONS_EXACT_ROOT_TEST_ID,
    },
    shell: shellFlags(),
    assets: EXPEDITIONS_EXACT_ASSETS,
    page: {
      title: 'Expeditions',
      subtitle: 'Passive route dispatch · Slots, yield smoothing, and claim-ready support.',
      statusPlaque: 'Pinewind Hamlet · 1 Active · 2 Idle · 1 Claim Ready',
    },
    dispatchSlots: asSlots([
      {
        visualIndex: 0,
        roman: 'I',
        realSlotIndex: 0,
        status: 'active',
        statusLabel: 'ACTIVE',
        title: 'Forage',
        subtitle: '18m left',
        progressPct: 68,
        iconKey: 'hourglassProgress',
        action: createExpeditionsExactButton('fixture-slot-active', 'Active', 'slot-action', { enabled: false, tone: 'jade' }),
      },
      {
        visualIndex: 1,
        roman: 'II',
        realSlotIndex: 1,
        status: 'claim-ready',
        statusLabel: 'CLAIM READY',
        title: 'Mine',
        subtitle: 'Ore satchel',
        progressPct: 100,
        iconKey: 'hourglassProgress',
        action: createExpeditionsExactButton('fixture-slot-claim', 'Claim', 'claim-expedition', { tone: 'gold' }),
      },
      {
        visualIndex: 2,
        roman: 'III',
        realSlotIndex: 2,
        status: 'idle',
        statusLabel: 'IDLE',
        title: 'Recommended:',
        subtitle: 'Scout',
        progressPct: 0,
        iconKey: 'hourglass',
        action: createExpeditionsExactButton('fixture-slot-idle', 'Use Slot', 'select-slot', { tone: 'gold' }),
      },
      {
        visualIndex: 3,
        roman: 'IV',
        realSlotIndex: null,
        status: 'locked',
        statusLabel: 'LOCKED',
        title: 'Prestige slot +1',
        subtitle: 'Complete trial to unlock',
        progressPct: 0,
        iconKey: 'lock',
        action: createExpeditionsExactButton('fixture-slot-locked', 'Locked', 'disabled', { enabled: false, tone: 'muted' }),
      },
    ]),
    routeMap: {
      title: 'Route Map',
      nodes: ROUTE_MAP_NODES,
      footer: 'Local yield identity: herbs, ore, fragments, utility stock.',
    },
    availableRoutes: {
      title: 'Available Routes',
      routes: asRoutes([
        {
          routeId: 'forage',
          title: 'Forage Route',
          purpose: 'Herbs · Healing support',
          durationLabel: 'Short / Medium',
          yieldIcons: [
            { id: 'herb', label: 'Herb', iconKey: 'herb' },
            { id: 'pouch', label: 'Pouch', iconKey: 'pouch' },
            { id: 'elixir', label: 'Elixir', iconKey: 'elixir' },
          ],
          recommended: true,
          selected: false,
          defaultDurationId: 'medium',
          button: createExpeditionsExactButton('fixture-select-forage', 'Select Route', 'select-route', { tone: 'gold' }),
        },
        {
          routeId: 'mine',
          title: 'Mine Route',
          purpose: 'Ore · Forge floor',
          durationLabel: 'Medium / Long',
          yieldIcons: [
            { id: 'ore', label: 'Ore', iconKey: 'ore' },
            { id: 'coin', label: 'Coin', iconKey: 'coin' },
            { id: 'ingot', label: 'Ingot', iconKey: 'ingot' },
          ],
          recommended: false,
          selected: false,
          defaultDurationId: 'medium',
          button: createExpeditionsExactButton('fixture-select-mine', 'Select Route', 'select-route', { tone: 'gold' }),
        },
        {
          routeId: 'scout',
          title: 'Scout Route',
          purpose: 'Fragments · Bounty routing',
          durationLabel: 'Short',
          yieldIcons: [
            { id: 'paper', label: 'Paper', iconKey: 'paper' },
            { id: 'fragment', label: 'Fragment', iconKey: 'fragment' },
            { id: 'token', label: 'Token', iconKey: 'token' },
          ],
          recommended: false,
          selected: true,
          defaultDurationId: 'short',
          button: createExpeditionsExactButton('fixture-select-scout', 'Select Route', 'select-route', { tone: 'gold' }),
        },
      ]),
    },
    dispatchLedger: {
      title: 'Dispatch Ledger',
      claimBlock: {
        stamp: 'Claim Ready',
        headline: 'Mine Route Complete',
        body: 'Ore satchel and gold can be collected now.',
        button: createExpeditionsExactButton('fixture-claim-expedition', 'Claim Expedition', 'claim-expedition', {
          tone: 'gold',
        }),
        iconKey: 'pouch',
      },
      recommendedBlock: {
        title: 'Recommended Now',
        headline: 'Scout Route',
        body: 'Best overlap with tracked bounty and manual support.',
        button: createExpeditionsExactButton('fixture-auto-fill', 'Auto-fill Recommended', 'auto-fill-recommended', {
          tone: 'gold',
        }),
        iconKey: 'paper',
      },
      footer: 'Keep one slot occupied when possible.',
    },
    bottomActions: {
      dispatch: createExpeditionsExactButton('fixture-dispatch', 'Dispatch Expedition', 'dispatch-expedition', {
        tone: 'gold',
      }),
      claimAllReady: createExpeditionsExactButton('fixture-claim-all', 'Claim All Ready', 'claim-all-ready', {
        tone: 'gold',
      }),
    },
    debug: {
      notes: ['Fixture values are locked to the supplied Expeditions mockup.'],
      regionOrder: REGION_ORDER,
    },
  };

  return { ...surface, ...overrides };
}

function resolveCityId(inputCityId?: string | null): string {
  const content = useContentStore.getState();
  const cityStore = useCityStore.getState();
  if (inputCityId && content.maps.citiesById[inputCityId]) return inputCityId;
  if (cityStore.currentCityId && content.maps.citiesById[cityStore.currentCityId]) return cityStore.currentCityId;
  return cityStore.unlockedCityIds.find((cityId) => content.maps.citiesById[cityId])
    ?? content.citiesSorted[0]?.id
    ?? EXPEDITIONS_EXACT_DEFAULT_CITY_ID;
}

function findDurationLabel(ids: string[], durations: Array<{ id: string; label: string }>): string {
  return ids
    .map((id) => durations.find((duration) => duration.id === id)?.label ?? titleCaseFromId(id))
    .join(' / ');
}

function defaultDurationForRoute(routeId: string, durations: Array<{ id: string }>): string | null {
  const preferred = routeId === 'scout' ? ['short'] : ['medium', 'short', 'long'];
  return preferred.find((id) => durations.some((duration) => duration.id === id))
    ?? durations[0]?.id
    ?? null;
}

function durationIdsForRoute(routeId: string, durations: Array<{ id: string }>): string[] {
  const preferred = routeId === 'forage'
    ? ['short', 'medium']
    : routeId === 'mine'
      ? ['medium', 'long']
      : ['short'];
  const available = preferred.filter((id) => durations.some((duration) => duration.id === id));
  return available.length > 0 ? available : durations.slice(0, 2).map((duration) => duration.id);
}

function purposeForRoute(routeId: string): string {
  if (routeId === 'forage') return 'Herbs · Healing support';
  if (routeId === 'mine') return 'Ore · Forge floor';
  if (routeId === 'scout') return 'Fragments · Bounty routing / Manual support';
  const purpose = getLiveExpeditionRoutePurpose(routeId);
  return purpose ? `${purpose.moduleLabel} support` : 'Utility stock';
}

function routeTitle(routeId: string, name?: string): string {
  if (routeId === 'forage') return 'Forage Route';
  if (routeId === 'mine') return 'Mine Route';
  if (routeId === 'scout') return 'Scout Route';
  return name ?? `${titleCaseFromId(routeId)} Route`;
}

function routeIcon(routeId: string): ExpeditionsExactIconKey {
  if (routeId === 'mine') return 'mine';
  if (routeId === 'scout') return 'scout';
  return 'forage';
}

function yieldIconFromReward(itemId: string): ExpeditionsExactIconKey {
  const lower = itemId.toLowerCase();
  if (lower.includes('ore') || lower.includes('iron') || lower.includes('metal')) return 'ore';
  if (lower.includes('fragment') || lower.includes('manual')) return 'fragment';
  if (lower.includes('pill') || lower.includes('elixir')) return 'elixir';
  return 'herb';
}

function routeYieldIcons(routeId: string, bundle: RewardBundle | null, itemsById: Record<string, { name?: string }>) {
  const icons: Array<{ id: string; label: string; iconKey: ExpeditionsExactIconKey; qtyLabel?: string }> = normalizeItemList(bundle?.items).map((item) => ({
    id: item.itemId,
    label: itemsById[item.itemId]?.name ?? titleCaseFromId(item.itemId),
    qtyLabel: `×${item.qty}`,
    iconKey: yieldIconFromReward(item.itemId),
  }));
  const currencies = bundle?.currencies ?? {};
  if (currencies.gold) icons.push({ id: 'gold', label: 'Gold', qtyLabel: `+${currencies.gold}`, iconKey: 'coin' as const });
  if (routeId === 'forage') {
    icons.push({ id: 'pouch', label: 'Pouch', iconKey: 'pouch' });
    icons.push({ id: 'elixir', label: 'Reagent', iconKey: 'elixir' });
  }
  if (routeId === 'mine') {
    icons.push({ id: 'coin', label: 'Coin', iconKey: 'coin' });
    icons.push({ id: 'ingot', label: 'Ingot', iconKey: 'ingot' });
  }
  if (routeId === 'scout') {
    icons.push({ id: 'paper', label: 'Paper', iconKey: 'paper' });
    icons.push({ id: 'fragment', label: 'Fragment', iconKey: 'fragment' });
    icons.push({ id: 'token', label: 'Token', iconKey: 'token' });
  }
  return icons.filter((entry, index, list) => list.findIndex((candidate) => candidate.id === entry.id) === index).slice(0, 3);
}

function expectedBundleForRoute(cityIndex: number, routeId: string): RewardBundle | null {
  const content = useContentStore.getState().raw?.expeditions;
  const type = content?.types.find((entry) => entry.id === routeId);
  const cityYields = content?.cityYields.find((entry) => entry.cityIndex === cityIndex);
  const firstTag = type?.yieldTags[0];
  return firstTag ? cityYields?.yieldsByTag?.[firstTag] ?? null : null;
}

function recommendRoute(cityId: string, idleSlotCount: number): string {
  const bountyStore = useBountyStore.getState();
  const trackedId = bountyStore.trackedByCityId[cityId];
  const tracked = trackedId ? bountyStore.activeByCityId[cityId]?.find((entry) => entry.instanceId === trackedId) : null;
  if (tracked?.kind === 'EXPEDITION_COMPLETE' || tracked?.kind === 'CRAFT_COMPLETE') return 'scout';
  return idleSlotCount > 0 ? 'forage' : 'scout';
}

function buildRoutes(args: {
  cityIndex: number;
  selectedRouteId: string | null;
  selectedDurationId: string | null;
  recommendedRouteId: string;
}): ExpeditionsExactSurfaceV1['availableRoutes']['routes'] {
  const content = useContentStore.getState();
  const expeditions = content.raw?.expeditions;
  const durations = expeditions?.durations ?? [];
  const routes = EXPEDITION_ROUTE_ORDER.map((routeId) => {
    const type = expeditions?.types.find((entry) => entry.id === routeId);
    const exists = Boolean(type);
    const durationIds = durationIdsForRoute(routeId, durations);
    const defaultDurationId = defaultDurationForRoute(routeId, durations);
    return {
      routeId,
      title: routeTitle(routeId, type?.name),
      purpose: purposeForRoute(routeId),
      durationLabel: durationIds.length > 0 ? findDurationLabel(durationIds, durations) : 'No duration',
      yieldIcons: routeYieldIcons(routeId, expectedBundleForRoute(args.cityIndex, routeId), content.maps.itemsById),
      recommended: routeId === args.recommendedRouteId,
      selected: args.selectedRouteId === routeId,
      defaultDurationId,
      button: createExpeditionsExactButton(`select-route-${routeId}`, 'Select Route', 'select-route', {
        enabled: exists && Boolean(defaultDurationId),
        tone: 'gold',
        reason: exists ? null : 'This route is missing from content.',
      }),
    };
  });
  return asRoutes(routes);
}

function buildSlot(args: {
  visualIndex: 0 | 1 | 2 | 3;
  slots: number;
  run: ExpeditionRun | null;
  now: number;
  recommendedRouteId: string;
}): DispatchSlotSurface {
  const roman = EXPEDITION_SLOT_ROMANS[args.visualIndex];
  if (args.visualIndex >= args.slots) {
    return {
      visualIndex: args.visualIndex,
      roman,
      realSlotIndex: null,
      status: 'locked',
      statusLabel: 'LOCKED',
      title: 'Prestige slot +1',
      subtitle: 'Complete trial to unlock',
      progressPct: 0,
      iconKey: 'lock',
      action: createExpeditionsExactButton(`slot-${args.visualIndex}-locked`, 'Locked', 'disabled', {
        enabled: false,
        tone: 'muted',
      }),
    };
  }

  if (!args.run) {
    return {
      visualIndex: args.visualIndex,
      roman,
      realSlotIndex: args.visualIndex,
      status: 'idle',
      statusLabel: 'IDLE',
      title: 'Recommended:',
      subtitle: titleCaseFromId(args.recommendedRouteId),
      progressPct: 0,
      iconKey: 'hourglass',
      action: createExpeditionsExactButton(`slot-${args.visualIndex}-idle`, 'Use Slot', 'select-slot', {
        tone: 'gold',
      }),
    };
  }

  const type = useContentStore.getState().raw?.expeditions.types.find((entry) => entry.id === args.run!.expeditionTypeId);
  const durationMs = Math.max(1, args.run.endsAt - args.run.startedAt);
  const elapsedMs = Math.max(0, Math.min(durationMs, args.now - args.run.startedAt));
  const ready = args.run.status === 'complete' || args.now >= args.run.endsAt;
  return {
    visualIndex: args.visualIndex,
    roman,
    realSlotIndex: args.run.slotIndex,
    status: ready ? 'claim-ready' : 'active',
    statusLabel: ready ? 'CLAIM READY' : 'ACTIVE',
    title: routeTitle(args.run.expeditionTypeId, type?.name).replace(/\s+Route$/u, ''),
    subtitle: ready ? `${routeTitle(args.run.expeditionTypeId, type?.name).replace(/\s+Route$/u, '')} satchel` : formatTimeLeft(args.run.endsAt - args.now),
    progressPct: ready ? 100 : clampPct((elapsedMs / durationMs) * 100),
    iconKey: ready ? 'hourglassProgress' : 'hourglassProgress',
    action: createExpeditionsExactButton(`slot-${args.visualIndex}-${ready ? 'claim' : 'active'}`, ready ? 'Claim' : 'Active', ready ? 'claim-expedition' : 'disabled', {
      enabled: ready,
      tone: ready ? 'gold' : 'jade',
    }),
  };
}

export function buildExpeditionsExactSurfaceFromStores(
  cityId?: string | null,
  options: BuildOptions = {},
): ExpeditionsExactSurfaceV1 {
  if (options.mode === 'fixture') {
    return createExpeditionsExactMockupFixture({
      meta: {
        ...createExpeditionsExactMockupFixture().meta,
        cityId: cityId ?? EXPEDITIONS_EXACT_DEFAULT_CITY_ID,
      },
    });
  }

  const now = options.now ?? Date.now();
  const contentStore = useContentStore.getState();
  const expeditionStore = useExpeditionStore.getState();
  const resolvedCityId = resolveCityId(cityId);
  const city = contentStore.maps.citiesById[resolvedCityId] ?? null;
  const cityIndex = typeof city?.index === 'number' ? city.index : null;
  const cityName = sanitizeLiveCityName(city?.name ?? 'Unknown City');
  const visualSlots = Math.max(0, Math.min(4, expeditionStore.slots));
  const readyRuns = expeditionStore.active.filter((run) => run.status === 'complete' || now >= run.endsAt);
  const runningRuns = expeditionStore.active.filter((run) => run.status !== 'complete' && now < run.endsAt);
  const idleSlotIndexes = Array.from({ length: visualSlots }, (_, index) => index)
    .filter((slotIndex) => !expeditionStore.active.some((run) => run.slotIndex === slotIndex));
  const recommendedRouteId = recommendRoute(resolvedCityId, idleSlotIndexes.length);
  const selectedRouteId = options.selectedRouteId
    && EXPEDITION_ROUTE_ORDER.includes(options.selectedRouteId as (typeof EXPEDITION_ROUTE_ORDER)[number])
    ? options.selectedRouteId
    : recommendedRouteId;
  const routes = buildRoutes({
    cityIndex: cityIndex ?? 0,
    selectedRouteId,
    selectedDurationId: options.selectedDurationId ?? null,
    recommendedRouteId,
  });
  const selectedRoute = routes.find((route) => route.routeId === selectedRouteId) ?? routes.find((route) => route.recommended) ?? routes[0];
  const selectedDurationId = options.selectedDurationId ?? selectedRoute?.defaultDurationId ?? null;
  const selectedSlotIndex = typeof options.selectedSlotIndex === 'number' && idleSlotIndexes.includes(options.selectedSlotIndex)
    ? options.selectedSlotIndex
    : idleSlotIndexes[0] ?? null;
  const dispatchSlots = asSlots([0, 1, 2, 3].map((visualIndex) => buildSlot({
    visualIndex: visualIndex as 0 | 1 | 2 | 3,
    slots: expeditionStore.slots,
    run: expeditionStore.active.find((entry) => entry.slotIndex === visualIndex) ?? null,
    now,
    recommendedRouteId,
  })));
  const firstReadyRun = readyRuns[0] ?? null;
  const firstReadyType = firstReadyRun
    ? routeTitle(firstReadyRun.expeditionTypeId, contentStore.raw?.expeditions.types.find((entry) => entry.id === firstReadyRun.expeditionTypeId)?.name)
    : null;
  const recommendedRoute = routes.find((route) => route.routeId === recommendedRouteId) ?? routes[0];

  return {
    meta: {
      surfaceId: 'expeditions-exact',
      version: EXPEDITIONS_EXACT_SURFACE_VERSION,
      mode: 'live',
      cityId: resolvedCityId,
      cityIndex,
      selectedRouteId,
      selectedDurationId,
      selectedSlotIndex,
      idleSlotCount: idleSlotIndexes.length,
      activeSlotCount: runningRuns.length,
      claimReadyCount: readyRuns.length,
      rootTestId: EXPEDITIONS_EXACT_ROOT_TEST_ID,
    },
    shell: shellFlags(),
    assets: EXPEDITIONS_EXACT_ASSETS,
    page: {
      title: 'Expeditions',
      subtitle: 'Passive route dispatch · Slots, yield smoothing, and claim-ready support.',
      statusPlaque: `${cityName} · ${runningRuns.length} Active · ${idleSlotIndexes.length} Idle · ${readyRuns.length} Claim Ready`,
    },
    dispatchSlots,
    routeMap: {
      title: 'Route Map',
      nodes: ROUTE_MAP_NODES,
      footer: 'Local yield identity: herbs, ore, fragments, utility stock.',
    },
    availableRoutes: {
      title: 'Available Routes',
      routes,
    },
    dispatchLedger: {
      title: 'Dispatch Ledger',
      claimBlock: {
        stamp: 'Claim Ready',
        headline: firstReadyType ? `${firstReadyType} Complete` : 'No Route Complete',
        body: firstReadyType ? 'Route satchel and support stock can be collected now.' : 'No expedition is ready to claim yet.',
        button: createExpeditionsExactButton('claim-expedition', 'Claim Expedition', 'claim-expedition', {
          enabled: readyRuns.length > 0,
          tone: 'gold',
          reason: readyRuns.length > 0 ? null : 'No expedition is ready to claim.',
        }),
        iconKey: firstReadyRun?.expeditionTypeId === 'mine' ? 'pouch' : routeIcon(firstReadyRun?.expeditionTypeId ?? recommendedRouteId),
      },
      recommendedBlock: {
        title: 'Recommended Now',
        headline: recommendedRoute?.title ?? 'Forage Route',
        body: recommendedRouteId === 'scout'
          ? 'Best overlap with tracked bounty and manual support.'
          : recommendedRouteId === 'mine'
            ? 'Best overlap with ore pressure and Forge support.'
            : 'Best overlap with healing support and idle slots.',
        button: createExpeditionsExactButton('auto-fill-recommended', 'Auto-fill Recommended', 'auto-fill-recommended', {
          enabled: idleSlotIndexes.length > 0 && Boolean(recommendedRoute?.defaultDurationId),
          tone: 'gold',
          reason: idleSlotIndexes.length > 0 ? null : 'No idle real slot is available.',
        }),
        iconKey: recommendedRouteId === 'mine' ? 'ore' : recommendedRouteId === 'scout' ? 'paper' : 'herb',
      },
      footer: 'Keep one slot occupied when possible.',
    },
    bottomActions: {
      dispatch: createExpeditionsExactButton('dispatch-expedition', 'Dispatch Expedition', 'dispatch-expedition', {
        enabled: selectedSlotIndex !== null && Boolean(selectedRoute?.defaultDurationId) && cityIndex !== null,
        tone: 'gold',
        reason: selectedSlotIndex === null ? 'No idle real slot is available.' : null,
      }),
      claimAllReady: createExpeditionsExactButton('claim-all-ready', 'Claim All Ready', 'claim-all-ready', {
        enabled: readyRuns.length > 0,
        tone: 'gold',
        reason: readyRuns.length > 0 ? null : 'No expedition is ready to claim.',
      }),
    },
    mandateSourceSink: buildLiveDaoMandateModuleSourceSinkProjection({
      currentCityId: resolvedCityId,
      currentModuleKey: 'expeditions',
      currentScreen: 'expeditions',
    }),
    debug: {
      notes: [
        'Live Expeditions Exact surface is built from ExpeditionStore, content routes/durations, route-purpose contract, and tracked bounty recommendation hints.',
        ...(expeditionStore.slots > 4 ? [`Store has ${expeditionStore.slots} slots; exact visual strip renders the first four.`] : []),
      ],
      regionOrder: REGION_ORDER,
    },
  };
}
