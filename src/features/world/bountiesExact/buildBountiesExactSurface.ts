import type { RewardBundle } from '../../../services/rewards/index.js';
import { useBountyStore, type BountyInstance } from '../../../stores/bountyStore.js';
import { useCityStore } from '../../../stores/cityStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { buildLiveCraftBountyRouteSupportState } from '../../../systems/bounties/liveCraftBountyRouteSupport.js';
import { buildSupportEconomySurfaceModel } from '../../../systems/economy/supportEconomySurfaceModel.js';
import { buildCurrentGateEconomyContext } from '../../../systems/progression/currentGateEconomyContext.js';
import { LIVE_BOUNTY_BOARD_SLOTS, type LiveBountyBoardRole } from '../../../systems/world/bountyBoardContract.js';
import { getWorldModuleLabel, sanitizeLiveCityName } from '../../../ui/text/playerFacingLabels.js';
import { normalizeItemList } from '../../../utils/itemList.js';
import { resolveBountyDestination } from '../../../utils/bountyRouting.js';
import { BOUNTIES_EXACT_ASSETS } from './bountiesExactAssetRegistry.js';
import {
  BOUNTIES_EXACT_DEFAULT_CITY_ID,
  BOUNTIES_EXACT_ROOT_TEST_ID,
  BOUNTIES_EXACT_SURFACE_VERSION,
  clampPct,
  compactCityName,
  createBountiesExactButton,
  formatCompactTime,
  titleCaseFromId,
} from './bountiesExactPresentation.js';
import type {
  BountiesExactIconKey,
  BountiesExactNoteSurface,
  BountiesExactRewardChip,
  BountiesExactSurfaceMode,
  BountiesExactSurfaceV1,
  ExactStatCardSurface,
} from './bountiesExactTypes.js';

type BuildOptions = {
  mode?: BountiesExactSurfaceMode;
  selectedOrderId?: string | null;
  now?: number;
};

const REGION_ORDER = [
  'header',
  'statusPlaque',
  'statStrip',
  'trackedRail',
  'postedOrdersBoard',
  'bountyOffice',
  'bottomActions',
];

const FIXTURE_NOTES: [BountiesExactNoteSurface, BountiesExactNoteSurface, BountiesExactNoteSurface] = [
  {
    id: 'fixture-herb-stock',
    role: 'support',
    roleLabel: 'Support Order',
    stateRibbon: 'TRACKED',
    title: 'Herb Stock Notice',
    subtitle: 'SUPPORT ORDER',
    objective: 'Refill basic healing stock through safe city sources before the next gate attempt.',
    progressPct: 62,
    progressText: '62%',
    rewardLine: 'Merit +2 · Herbs ×14',
    rewardChips: [
      { id: 'merit', label: 'Merit +2', iconKey: 'merit', tone: 'gold' },
      { id: 'herbs', label: 'Herbs ×14', iconKey: 'herb', tone: 'jade' },
    ],
    iconKey: 'herb',
    selected: true,
    tracked: true,
    claimReady: true,
    claimed: false,
    primaryButton: createBountiesExactButton('fixture-route-expeditions', 'Route: Expeditions', 'route-order', {
      tone: 'gold',
    }),
    routeTarget: { cityId: BOUNTIES_EXACT_DEFAULT_CITY_ID, moduleKey: 'expeditions', label: 'Expeditions' },
  },
  {
    id: 'fixture-ruins-sweep',
    role: 'route',
    roleLabel: 'Route Order',
    stateRibbon: 'NOW',
    title: 'Ruins Sweep Order',
    subtitle: 'ROUTE ORDER',
    objective: 'Clear one support chamber to stabilize targeted materials and reduce drought risk.',
    progressPct: 35,
    progressText: '35%',
    rewardLine: 'Merit +3 · Ore Cache',
    rewardChips: [
      { id: 'merit', label: 'Merit +3', iconKey: 'merit', tone: 'gold' },
      { id: 'ore-cache', label: 'Ore Cache', iconKey: 'ore', tone: 'muted' },
    ],
    iconKey: 'bestRouteRuins',
    selected: false,
    tracked: false,
    claimReady: true,
    claimed: false,
    primaryButton: createBountiesExactButton('fixture-route-ruins', 'Route: Ruins', 'route-order', {
      tone: 'gold',
    }),
    routeTarget: { cityId: BOUNTIES_EXACT_DEFAULT_CITY_ID, moduleKey: 'ruins', label: 'Ruins' },
  },
  {
    id: 'fixture-gate-prep',
    role: 'challenge',
    roleLabel: 'Challenge Order',
    stateRibbon: null,
    title: 'Gate Prep Challenge',
    subtitle: 'CHALLENGE ORDER',
    objective: 'Win two safe hunts or refine a weapon floor before challenging Foundation.',
    progressPct: 20,
    progressText: '20%',
    rewardLine: 'Merit +5 · Spirit Stone',
    rewardChips: [
      { id: 'merit', label: 'Merit +5', iconKey: 'merit', tone: 'gold' },
      { id: 'spirit-stone', label: 'Spirit Stone', iconKey: 'spiritStone', tone: 'cinnabar' },
    ],
    iconKey: 'challengeSword',
    selected: false,
    tracked: false,
    claimReady: false,
    claimed: false,
    primaryButton: createBountiesExactButton('fixture-track-order', 'Track Order', 'track-order', { tone: 'gold' }),
    routeTarget: null,
  },
];

function shellFlags(): BountiesExactSurfaceV1['shell'] {
  return {
    useScreenOwnedExactPage: true,
    showLegacyPanel: false,
    showContextStrip: false,
  };
}

function asStatCards(cards: ExactStatCardSurface[]): BountiesExactSurfaceV1['statCards'] {
  return cards.slice(0, 7) as BountiesExactSurfaceV1['statCards'];
}

function asNotes(notes: BountiesExactNoteSurface[]): BountiesExactSurfaceV1['postedOrders']['notes'] {
  return notes.slice(0, 3) as BountiesExactSurfaceV1['postedOrders']['notes'];
}

export function createBountiesExactMockupFixture(
  overrides: Partial<BountiesExactSurfaceV1> = {},
): BountiesExactSurfaceV1 {
  const surface: BountiesExactSurfaceV1 = {
    meta: {
      surfaceId: 'bounties-exact',
      version: BOUNTIES_EXACT_SURFACE_VERSION,
      mode: 'fixture',
      cityId: BOUNTIES_EXACT_DEFAULT_CITY_ID,
      cityIndex: 0,
      selectedOrderId: 'fixture-herb-stock',
      trackedOrderId: 'fixture-herb-stock',
      claimReadyCount: 2,
      refreshReady: true,
      rootTestId: BOUNTIES_EXACT_ROOT_TEST_ID,
    },
    shell: shellFlags(),
    assets: BOUNTIES_EXACT_ASSETS,
    page: {
      title: 'Bounties',
      subtitle: 'Directed city support board · Merit, routing, and claimable posted work.',
      statusPlaque: 'Pinewind Hamlet · 1 Tracked · 2 Claimable · 12 / 15 Reserve',
    },
    statCards: asStatCards([
      { id: 'next-need', label: 'Next Need', value: 'Foundation Gate', iconKey: 'foundationGate' },
      { id: 'merit', label: 'Merit', value: '12 / 15', iconKey: 'merit', tone: 'gold' },
      { id: 'tracked', label: 'Tracked', value: 'Herb Notice', iconKey: 'trackedNotice', tone: 'jade' },
      { id: 'claimable', label: 'Claimable', value: '2 Orders', iconKey: 'claimable', tone: 'jade' },
      { id: 'best-route', label: 'Best Route', value: 'Ruins', iconKey: 'bestRouteRuins' },
      { id: 'refresh', label: 'Refresh', value: '3 left', iconKey: 'refresh' },
      { id: 'city', label: 'City', value: 'Pinewind', iconKey: 'city' },
    ]),
    trackedNotice: {
      title: 'Tracked Notice',
      noticeTitle: 'Gather Healing Herbs',
      body: 'Complete Outskirts or Expedition herb sources to refill the next gate package.',
      progressPct: 55,
      progressText: '55%',
      rewardLine: 'Merit +2 · Common Herb ×14',
      routeButton: createBountiesExactButton('fixture-route-notice', 'Route to Source', 'route-notice', {
        tone: 'secondary',
      }),
      untrackButton: createBountiesExactButton('fixture-untrack', 'Untrack', 'track-selected', {
        tone: 'muted',
      }),
      boardTruth: {
        title: 'Board Truth',
        body: 'Bounties reward healthy rotation and keep Merit reserve ready for safety-net access.',
      },
    },
    postedOrders: {
      title: 'Posted Orders',
      subtitle: 'One support order, one route order, one challenge order. Pick what helps this city phase now.',
      notes: FIXTURE_NOTES,
    },
    office: {
      title: 'Bounty Office',
      meritReserve: {
        title: 'Merit Reserve',
        value: '12 / 15',
        progressPct: 80,
        body: 'Merit supports fail-safe gate access. Keep this reserve healthy.',
      },
      claimQueue: {
        title: 'Claim Queue',
        countText: '2 orders ready',
        primaryButton: createBountiesExactButton('fixture-claim-ready-orders', 'Claim Ready Orders', 'claim-all-ready', {
          tone: 'gold',
        }),
        secondaryButton: createBountiesExactButton('fixture-refresh-board', 'Refresh Board', 'refresh-board', {
          tone: 'secondary',
        }),
      },
      nextBestUse: {
        title: 'Next Best Use',
        body: 'Track the Ruins Sweep Order if ore or gate support materials are short.',
      },
    },
    bottomActions: {
      trackSelected: createBountiesExactButton('fixture-track-selected', 'Track Selected', 'track-selected', {
        tone: 'gold',
      }),
      claimReady: createBountiesExactButton('fixture-claim-ready', 'Claim Ready', 'claim-ready', {
        tone: 'gold',
      }),
      routeNow: createBountiesExactButton('fixture-route-now', 'Route Now', 'route-now', {
        tone: 'gold',
      }),
    },
    debug: {
      notes: ['Fixture values are locked to the supplied Bounties mockup.'],
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
    ?? BOUNTIES_EXACT_DEFAULT_CITY_ID;
}

function rewardChips(bundle: RewardBundle, itemsById: Record<string, { name?: string }>): BountiesExactRewardChip[] {
  const chips: BountiesExactRewardChip[] = [];
  const currencies = bundle.currencies ?? {};
  if (currencies.merit) chips.push({ id: 'merit', label: `Merit +${currencies.merit}`, iconKey: 'merit', tone: 'gold' });
  if (currencies.gold) chips.push({ id: 'gold', label: `Gold +${currencies.gold}`, iconKey: 'coin', tone: 'gold' });
  if (currencies.spiritStones) {
    chips.push({ id: 'spiritStones', label: `Spirit Stones +${currencies.spiritStones}`, iconKey: 'spiritStone', tone: 'cinnabar' });
  }
  normalizeItemList(bundle.items).forEach((item) => {
    const name = itemsById[item.itemId]?.name ?? titleCaseFromId(item.itemId);
    chips.push({
      id: item.itemId,
      label: `${name} ×${item.qty}`,
      iconKey: item.itemId.toLowerCase().includes('ore') ? 'ore' : 'herb',
      tone: item.itemId.toLowerCase().includes('ore') ? 'muted' : 'jade',
    });
  });
  return chips.slice(0, 3);
}

function rewardLine(bundle: RewardBundle, itemsById: Record<string, { name?: string }>): string {
  const chips = rewardChips(bundle, itemsById);
  return chips.length > 0 ? chips.map((chip) => chip.label).join(' · ') : 'Reward pending';
}

function roleLabel(role: LiveBountyBoardRole): string {
  return `${role.slice(0, 1).toUpperCase()}${role.slice(1)} Order`;
}

function roleIcon(role: LiveBountyBoardRole, bounty?: BountyInstance | null): BountiesExactIconKey {
  if (role === 'support') return bounty?.kind === 'EXPEDITION_COMPLETE' ? 'herb' : 'foundationGate';
  if (role === 'route') return bounty?.kind.startsWith('RUINS') ? 'bestRouteRuins' : 'ore';
  return 'challengeSword';
}

function buildNote(args: {
  bounty: BountyInstance | null;
  role: LiveBountyBoardRole;
  selectedOrderId: string | null;
  trackedOrderId: string | null;
  cityModules: readonly string[];
  itemsById: Record<string, { name?: string }>;
  cityId: string;
  placeholderIndex: number;
}): BountiesExactNoteSurface {
  const { bounty, role, selectedOrderId, trackedOrderId, cityModules, itemsById, cityId, placeholderIndex } = args;
  if (!bounty) {
    const id = `empty-${role}-${placeholderIndex}`;
    return {
      id,
      role,
      roleLabel: roleLabel(role),
      stateRibbon: null,
      title: `${roleLabel(role)} Pending`,
      subtitle: roleLabel(role).toUpperCase(),
      objective: 'The city office has not posted this order yet.',
      progressPct: 0,
      progressText: '0%',
      rewardLine: 'No reward posted',
      rewardChips: [],
      iconKey: roleIcon(role),
      selected: selectedOrderId === id,
      tracked: false,
      claimReady: false,
      claimed: false,
      primaryButton: createBountiesExactButton(`disabled-${role}`, 'Unavailable', 'disabled', {
        enabled: false,
        tone: 'muted',
        reason: 'No live bounty is posted in this slot yet.',
      }),
      routeTarget: null,
    };
  }

  const progressPct = bounty.target > 0 ? clampPct((bounty.progress / bounty.target) * 100) : 0;
  const claimReady = bounty.progress >= bounty.target && !bounty.claimed;
  const craftRouteSupportState = buildLiveCraftBountyRouteSupportState(cityId);
  const destination = resolveBountyDestination({
    cityId: bounty.cityId,
    bountyKind: bounty.kind,
    cityModules: [...cityModules],
    craftRouteSupportState,
  });
  const routeTarget = destination.kind === 'module'
    ? { cityId: destination.cityId, moduleKey: destination.moduleKey, label: getWorldModuleLabel(destination.moduleKey) }
    : null;
  const primaryLabel = claimReady
    ? 'Claim Reward'
    : routeTarget
      ? `Route: ${routeTarget.label}`
      : trackedOrderId === bounty.instanceId
        ? 'Tracked'
        : 'Track Order';

  return {
    id: bounty.instanceId,
    role,
    roleLabel: roleLabel(role),
    stateRibbon: trackedOrderId === bounty.instanceId ? 'TRACKED' : claimReady ? 'READY' : role === 'route' ? 'NOW' : null,
    title: bounty.title,
    subtitle: roleLabel(role).toUpperCase(),
    objective: bounty.description,
    progressPct,
    progressText: `${bounty.progress} / ${bounty.target}`,
    rewardLine: rewardLine(bounty.rewards, itemsById),
    rewardChips: rewardChips(bounty.rewards, itemsById),
    iconKey: roleIcon(role, bounty),
    selected: selectedOrderId === bounty.instanceId,
    tracked: trackedOrderId === bounty.instanceId,
    claimReady,
    claimed: bounty.claimed,
    primaryButton: createBountiesExactButton(`note-primary-${bounty.instanceId}`, primaryLabel, claimReady ? 'claim-order' : routeTarget ? 'route-order' : 'track-order', {
      tone: 'gold',
      enabled: claimReady || Boolean(routeTarget) || !bounty.claimed,
      reason: destination.kind === 'unavailable' ? destination.reason : null,
    }),
    routeTarget,
  };
}

function gateLabel(content: ReturnType<typeof useContentStore.getState>['raw'], cityId: string): string {
  const trial = content?.trials.find((entry) => entry.cityId === cityId);
  const raw = trial?.gatesToMajorRealm ?? 'foundation';
  const label = titleCaseFromId(raw);
  return label.includes('Gate') ? label : `${label} Gate`;
}

export function buildBountiesExactSurfaceFromStores(
  cityId?: string | null,
  options: BuildOptions = {},
): BountiesExactSurfaceV1 {
  if (options.mode === 'fixture') {
    return createBountiesExactMockupFixture({
      meta: {
        ...createBountiesExactMockupFixture().meta,
        cityId: cityId ?? BOUNTIES_EXACT_DEFAULT_CITY_ID,
      },
    });
  }

  const now = options.now ?? Date.now();
  const contentStore = useContentStore.getState();
  const bountyStore = useBountyStore.getState();
  const inventory = useInventoryStore.getState();
  const game = useGameStore.getState();
  const resolvedCityId = resolveCityId(cityId);
  const city = contentStore.maps.citiesById[resolvedCityId] ?? null;
  const currentGateContext = contentStore.raw
    ? buildCurrentGateEconomyContext({
        content: contentStore.raw,
        realmIndex: game.realm.index,
        cityId: resolvedCityId,
      })
    : null;
  const cityIndex = typeof city?.index === 'number' ? city.index : null;
  const cityName = sanitizeLiveCityName(city?.name ?? 'Unknown City');
  const board = bountyStore.activeByCityId[resolvedCityId] ?? [];
  const trackedOrderId = bountyStore.trackedByCityId[resolvedCityId] ?? null;
  const selectedOrderId = options.selectedOrderId && board.some((entry) => entry.instanceId === options.selectedOrderId)
    ? options.selectedOrderId
    : trackedOrderId && board.some((entry) => entry.instanceId === trackedOrderId)
      ? trackedOrderId
      : board[0]?.instanceId ?? null;
  const claimReady = board.filter((entry) => entry.progress >= entry.target && !entry.claimed);
  const refreshReady = bountyStore.canRefresh(resolvedCityId, now);
  const supportSurface = buildSupportEconomySurfaceModel({
    content: contentStore.raw,
    cityId: resolvedCityId,
    currencies: inventory.currencies,
  });

  const notes = asNotes(LIVE_BOUNTY_BOARD_SLOTS.map((slot, index) => buildNote({
    bounty: board[index] ?? null,
    role: slot.role,
    selectedOrderId,
    trackedOrderId,
    cityModules: city?.modules ?? [],
    itemsById: contentStore.maps.itemsById,
    cityId: resolvedCityId,
    placeholderIndex: index,
  })));
  const selectedNote = notes.find((note) => note.id === selectedOrderId) ?? null;
  const trackedNote = notes.find((note) => note.id === trackedOrderId) ?? null;
  const noticeNote = trackedNote ?? selectedNote ?? notes.find((note) => note.claimReady) ?? notes[0];
  const bestRouteNote = notes.find((note) => note.role === 'route' && note.routeTarget) ?? notes.find((note) => note.routeTarget);
  const nextRefreshAt = bountyStore.nextRefreshAt(resolvedCityId);
  const refreshValue = refreshReady ? 'Ready' : nextRefreshAt ? formatCompactTime(nextRefreshAt - now) : 'Ready';
  const trackedValue = trackedNote
    ? trackedNote.title.replace(/\b(Stock|Order|Notice|Challenge)\b/giu, '').trim() || trackedNote.title
    : 'None';

  return {
    meta: {
      surfaceId: 'bounties-exact',
      version: BOUNTIES_EXACT_SURFACE_VERSION,
      mode: 'live',
      cityId: resolvedCityId,
      cityIndex,
      selectedOrderId,
      trackedOrderId: trackedNote?.id ?? null,
      claimReadyCount: claimReady.length,
      refreshReady,
      rootTestId: BOUNTIES_EXACT_ROOT_TEST_ID,
    },
    shell: shellFlags(),
    assets: BOUNTIES_EXACT_ASSETS,
    page: {
      title: 'Bounties',
      subtitle: 'Directed city support board · Merit, routing, and claimable posted work.',
      statusPlaque: `${cityName} · ${trackedNote ? 1 : 0} Tracked · ${claimReady.length} Claimable · ${supportSurface.readModel.currentMerit} / ${supportSurface.readModel.targetMeritReserve} Reserve`,
    },
    statCards: asStatCards([
      { id: 'next-need', label: 'Next Need', value: currentGateContext?.gateLabel ?? gateLabel(contentStore.raw, resolvedCityId), iconKey: 'foundationGate' },
      {
        id: 'merit',
        label: 'Merit',
        value: `${supportSurface.readModel.currentMerit} / ${supportSurface.readModel.targetMeritReserve}`,
        iconKey: 'merit',
        tone: 'gold',
      },
      { id: 'tracked', label: 'Tracked', value: trackedValue, iconKey: 'trackedNotice', tone: trackedNote ? 'jade' : 'muted' },
      { id: 'claimable', label: 'Claimable', value: `${claimReady.length} ${claimReady.length === 1 ? 'Order' : 'Orders'}`, iconKey: 'claimable', tone: claimReady.length > 0 ? 'jade' : 'muted' },
      { id: 'best-route', label: 'Best Route', value: bestRouteNote?.routeTarget?.label ?? 'None', iconKey: 'bestRouteRuins' },
      { id: 'refresh', label: 'Refresh', value: refreshValue, iconKey: 'refresh', tone: refreshReady ? 'jade' : 'muted' },
      { id: 'city', label: 'City', value: compactCityName(cityName), iconKey: 'city' },
    ]),
    trackedNotice: {
      title: 'Tracked Notice',
      noticeTitle: noticeNote?.title ?? 'No Tracked Notice',
      body: noticeNote?.objective ?? 'Pick an order to track a city objective here.',
      progressPct: noticeNote?.progressPct ?? 0,
      progressText: noticeNote?.progressText ?? '0%',
      rewardLine: noticeNote?.rewardLine ?? 'No reward posted',
      routeButton: createBountiesExactButton('route-notice', 'Route to Source', 'route-notice', {
        enabled: Boolean(noticeNote?.routeTarget),
        tone: 'secondary',
        reason: noticeNote?.routeTarget ? null : 'This notice has no route target.',
      }),
      untrackButton: createBountiesExactButton('untrack-notice', trackedNote ? 'Untrack' : 'Track Selected', 'track-selected', {
        enabled: Boolean(noticeNote && !noticeNote.id.startsWith('empty-')),
        tone: 'muted',
      }),
      boardTruth: {
        title: 'Board Truth',
        body: 'Bounties reward healthy rotation and keep Merit reserve ready for safety-net access.',
      },
    },
    postedOrders: {
      title: 'Posted Orders',
      subtitle: 'One support order, one route order, one challenge order. Pick what helps this city phase now.',
      notes,
    },
    office: {
      title: 'Bounty Office',
      meritReserve: {
        title: 'Merit Reserve',
        value: `${supportSurface.readModel.currentMerit} / ${supportSurface.readModel.targetMeritReserve}`,
        progressPct: clampPct((Number(supportSurface.readModel.currentMerit) / Math.max(1, Number(supportSurface.readModel.targetMeritReserve))) * 100),
        body: 'Merit supports fail-safe gate access. Keep this reserve healthy.',
      },
      claimQueue: {
        title: 'Claim Queue',
        countText: `${claimReady.length} ${claimReady.length === 1 ? 'order' : 'orders'} ready`,
        primaryButton: createBountiesExactButton('claim-ready-orders', 'Claim Ready Orders', 'claim-all-ready', {
          enabled: claimReady.length > 0,
          tone: 'gold',
          reason: claimReady.length > 0 ? null : 'No bounty is ready to claim.',
        }),
        secondaryButton: createBountiesExactButton('refresh-board', 'Refresh Board', 'refresh-board', {
          enabled: refreshReady && cityIndex !== null,
          tone: 'secondary',
          reason: refreshReady ? null : `Refresh in ${refreshValue}.`,
        }),
      },
      nextBestUse: {
        title: 'Next Best Use',
        body: bestRouteNote?.routeTarget
          ? `Track ${bestRouteNote.title} if ${bestRouteNote.routeTarget.label} support materials are short.`
          : supportSurface.reserveGapLine,
      },
    },
    bottomActions: {
      trackSelected: createBountiesExactButton('track-selected', selectedNote?.tracked ? 'Untrack Selected' : 'Track Selected', 'track-selected', {
        enabled: Boolean(selectedNote && !selectedNote.id.startsWith('empty-')),
        tone: 'gold',
      }),
      claimReady: createBountiesExactButton('claim-ready', 'Claim Ready', 'claim-ready', {
        enabled: claimReady.length > 0,
        tone: 'gold',
        reason: claimReady.length > 0 ? null : 'No bounty is ready to claim.',
      }),
      routeNow: createBountiesExactButton('route-now', 'Route Now', 'route-now', {
        enabled: Boolean(selectedNote?.routeTarget ?? trackedNote?.routeTarget),
        tone: 'gold',
        reason: selectedNote?.routeTarget || trackedNote?.routeTarget ? null : 'No route is available for the selected order.',
      }),
    },
    debug: {
      notes: [
        'Live Bounties Exact surface is built from BountyStore, content, inventory support economy, and bounty routing helpers.',
        ...(board.length < 3 ? [`Live board has ${board.length} entries; disabled placeholders fill the exact three-slot board.`] : []),
      ],
      regionOrder: REGION_ORDER,
    },
  };
}
