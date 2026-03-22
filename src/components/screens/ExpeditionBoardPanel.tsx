import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import type { RewardBundle } from '../../services/rewards.js';
import { pityProgressPercent } from '../../services/economy/pity.js';
import { normalizeItemList } from '../../utils/itemList.js';
import { multiply } from '../../utils/numbers.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useExpeditionStore, type ExpeditionRun } from '../../stores/expeditionStore.js';
import { openWorldModule } from '../../systems/world/openWorldModule.js';
import { getLiveExpeditionRoutePurpose } from '../../systems/world/expeditionRouteContract.js';
import { resolveExpeditionUseMaterialsDestinations } from '../../utils/bountyRouting.js';
import { PaperCard, PaperChip, PaperStamp } from '../../ui/paper.js';
import { DetailScrollModal } from '../../ui/primitives/DetailScrollModal.js';
import './ExpeditionBoardPanel.scss';

function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`.trim();
  }
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

function formatTimer(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function clampVarianceRange(qty: number, variance: number): { min: number; max: number } {
  const clamped = Math.max(0, Math.min(0.5, variance));
  const min = Math.max(1, Math.floor(qty * (1 - clamped)));
  const max = Math.max(1, Math.ceil(qty * (1 + clamped)));
  return { min, max };
}

function mergeRewardBundles(bundles: RewardBundle[]): RewardBundle {
  const merged: RewardBundle = {};

  bundles.forEach((bundle) => {
    if (!bundle) return;

    if (bundle.currencies) {
      merged.currencies = merged.currencies ?? {};
      (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
        const value = bundle.currencies?.[key];
        if (!value) return;
        const current = merged.currencies![key] ?? '0';
        merged.currencies![key] = multiply(current, 1).plus(multiply(value, 1)).toString();
      });
    }

    const items = normalizeItemList(bundle.items);
    if (items.length > 0) {
      merged.items = merged.items ?? [];
      merged.items.push(...items.map((item) => ({ ...item })));
    }

    if (bundle.techniqueFragments && bundle.techniqueFragments.length > 0) {
      merged.techniqueFragments = merged.techniqueFragments ?? [];
      merged.techniqueFragments.push(...bundle.techniqueFragments.map((fragment) => ({ ...fragment })));
    }

    if (bundle.manuals && bundle.manuals.length > 0) {
      merged.manuals = merged.manuals ?? [];
      merged.manuals.push(...bundle.manuals.map((manual) => ({ ...manual })));
    }

    if (typeof bundle.comprehension === 'number') {
      merged.comprehension = (merged.comprehension ?? 0) + bundle.comprehension;
    }
  });

  return merged;
}

function applyEfficiency(bundle: RewardBundle, efficiencyMult?: number): RewardBundle {
  if (!efficiencyMult || efficiencyMult === 1) return bundle;
  const normalizedItems = normalizeItemList(bundle.items);
  const next: RewardBundle = {
    currencies: bundle.currencies ? { ...bundle.currencies } : undefined,
    items: normalizedItems.length > 0 ? normalizedItems.map((item) => ({ ...item })) : undefined,
    techniqueFragments: bundle.techniqueFragments
      ? bundle.techniqueFragments.map((fragment) => ({ ...fragment }))
      : undefined,
    comprehension: bundle.comprehension,
    manuals: bundle.manuals ? bundle.manuals.map((manual) => ({ ...manual })) : undefined,
  };

  if (next.currencies) {
    (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
      const value = next.currencies?.[key];
      if (!value) return;
      next.currencies![key] = multiply(value, efficiencyMult).floor().toString();
    });
  }

  if (next.items) {
    next.items = next.items.map((item) => ({
      ...item,
      qty: Math.max(0, Math.floor(item.qty * efficiencyMult)),
    }));
  }

  if (next.techniqueFragments) {
    next.techniqueFragments = next.techniqueFragments.map((fragment) => ({
      ...fragment,
      qty: Math.max(0, Math.floor(fragment.qty * efficiencyMult)),
    }));
  }

  if (typeof next.comprehension === 'number') {
    next.comprehension = Math.floor(next.comprehension * efficiencyMult);
  }

  return next;
}

function collapseRewardBundle(bundle: RewardBundle): RewardBundle {
  const normalizedItems = normalizeItemList(bundle.items);
  const itemTotals: Record<string, number> = {};
  normalizedItems.forEach((item) => {
    if (!item.itemId || !Number.isFinite(item.qty) || item.qty <= 0) return;
    itemTotals[item.itemId] = (itemTotals[item.itemId] ?? 0) + item.qty;
  });

  const fragmentTotals: Record<string, number> = {};
  bundle.techniqueFragments?.forEach((fragment) => {
    if (!fragment.techId || !Number.isFinite(fragment.qty) || fragment.qty <= 0) return;
    fragmentTotals[fragment.techId] = (fragmentTotals[fragment.techId] ?? 0) + fragment.qty;
  });

  const collapsed: RewardBundle = {
    currencies: bundle.currencies ? { ...bundle.currencies } : undefined,
    items: Object.entries(itemTotals).map(([itemId, qty]) => ({ itemId, qty })),
    techniqueFragments: Object.entries(fragmentTotals).map(([techId, qty]) => ({ techId, qty })),
    comprehension: bundle.comprehension,
    manuals: bundle.manuals ? bundle.manuals.map((manual) => ({ ...manual })) : undefined,
  };

  if (collapsed.items && collapsed.items.length === 0) delete collapsed.items;
  if (collapsed.techniqueFragments && collapsed.techniqueFragments.length === 0) delete collapsed.techniqueFragments;
  if (collapsed.currencies && Object.keys(collapsed.currencies).length === 0) delete collapsed.currencies;
  if (collapsed.manuals && collapsed.manuals.length === 0) delete collapsed.manuals;

  return collapsed;
}

function computeExpectedBundle(
  cityIndex: number,
  typeId: string,
  durationId: string,
  content: NonNullable<ReturnType<typeof useContentStore.getState>['raw']>['expeditions'],
): RewardBundle | null {
  const type = content.types.find((entry) => entry.id === typeId);
  const duration = content.durations.find((entry) => entry.id === durationId);
  if (!type || !duration) return null;
  const yieldTags = type.yieldTags ?? [];
  if (yieldTags.length === 0) return null;

  const yields = content.cityYields.find((entry) => entry.cityIndex === cityIndex);
  if (!yields) return null;
  const bundles = yieldTags.map((tag) => yields.yieldsByTag?.[tag]).filter(Boolean) as RewardBundle[];
  if (bundles.length === 0) return null;

  const baseBundle = mergeRewardBundles(bundles);
  const finalBundle = applyEfficiency(baseBundle, duration.efficiencyMult);
  return collapseRewardBundle(finalBundle);
}

function computeValueEstimate(bundle: RewardBundle, variancePct: number, itemsById: Record<string, any>) {
  const items = normalizeItemList(bundle.items);
  let expectedValue = 0;
  items.forEach((item) => {
    const sell = itemsById[item.itemId]?.sellValue;
    if (!Number.isFinite(sell)) return;
    expectedValue += sell * item.qty;
  });

  if (expectedValue <= 0) {
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const range = clampVarianceRange(totalQty, variancePct);
    return { label: `${range.min} - ${range.max} items` };
  }

  const range = clampVarianceRange(expectedValue, variancePct);
  return { label: `${range.min.toFixed(0)} - ${range.max.toFixed(0)} value` };
}

type CeremonyState = {
  open: boolean;
  slotIndex: number | null;
  run: ExpeditionRun | null;
  rolled: RewardBundle | null;
  rareDrop: { itemId: string; qty: number } | null | undefined;
  spotlightItemId: string | null | undefined;
};

const routePositions = ['expRouteButton--left', 'expRouteButton--center', 'expRouteButton--right'] as const;

type RoutePositionClass = (typeof routePositions)[number];

export function ExpeditionBoardPanel() {
  const currentCityId = useCityStore((state) => state.currentCityId);
  const content = useContentStore((state) => state.raw?.expeditions);
  const economy = useContentStore((state) => state.economy);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const citiesById = useContentStore((state) => state.maps.citiesById);

  const slots = useExpeditionStore((state) => state.slots);
  const activeRuns = useExpeditionStore((state) => state.active);
  const rareProgressByKey = useExpeditionStore((state) => state.rareProgressByKey);
  const start = useExpeditionStore((state) => state.start);
  const claim = useExpeditionStore((state) => state.claim);

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedDurationId, setSelectedDurationId] = useState<string | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [sentPulseSlotIndex, setSentPulseSlotIndex] = useState<number | null>(null);
  const [sentRoutePulseId, setSentRoutePulseId] = useState<string | null>(null);
  const [durationPulseId, setDurationPulseId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [ceremony, setCeremony] = useState<CeremonyState>({
    open: false,
    slotIndex: null,
    run: null,
    rolled: null,
    rareDrop: null,
    spotlightItemId: null,
  });
  const [ceremonyError, setCeremonyError] = useState<string | null>(null);

  const cityIndex = useMemo(() => {
    if (!currentCityId) return null;
    return citiesById[currentCityId]?.index ?? null;
  }, [citiesById, currentCityId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!content) return;
    if (!selectedDurationId && content.durations.length > 0) {
      setSelectedDurationId(content.durations[0].id);
    }
  }, [content, selectedDurationId]);

  const selectedRoute = useMemo(() => {
    if (!content || !selectedRouteId) return null;
    return content.types.find((entry) => entry.id === selectedRouteId) ?? null;
  }, [content, selectedRouteId]);

  const selectedDuration = useMemo(() => {
    if (!content || !selectedDurationId) return null;
    return content.durations.find((entry) => entry.id === selectedDurationId) ?? null;
  }, [content, selectedDurationId]);

  const pityDefaults = economy?.tuning?.pityDefaults?.expeditionsRare;

  const selectedPity = useMemo(() => {
    if (!selectedRoute || !selectedDuration) return null;
    const key = `${selectedRoute.id}::${selectedDuration.id}`;
    const failures = rareProgressByKey[key] ?? 0;
    const pityCap = pityDefaults?.pityCap ?? 0;
    const pityIncrement = pityDefaults?.pityIncrement ?? 0;
    const chance = Math.min(1, (selectedDuration.rareChance ?? 0) + failures * pityIncrement);
    return { chance, pityCap, pityIncrement, failures };
  }, [pityDefaults, rareProgressByKey, selectedDuration, selectedRoute]);

  const expectedBundle = useMemo(() => {
    if (!content || cityIndex == null || !selectedRoute || !selectedDuration) return null;
    return computeExpectedBundle(cityIndex, selectedRoute.id, selectedDuration.id, content);
  }, [cityIndex, content, selectedDuration, selectedRoute]);

  const variancePct = selectedDuration?.variancePct ?? 0.15;

  if (!currentCityId || cityIndex == null) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No city selected</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Select a city to view expeditions.</div>
      </div>
    );
  }

  if (!content || content.types.length === 0 || content.durations.length === 0) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Expeditions unavailable</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Expedition content is missing or empty.</div>
      </div>
    );
  }

  const durationChips = content.durations.map((duration) => {
    const previewBundle = selectedRoute
      ? computeExpectedBundle(cityIndex, selectedRoute.id, duration.id, content)
      : null;
    const variance = duration.variancePct ?? 0.15;
    const valueEstimate = previewBundle ? computeValueEstimate(previewBundle, variance, itemsById) : null;
    const failures = selectedRoute ? rareProgressByKey[`${selectedRoute.id}::${duration.id}`] ?? 0 : 0;
    const pityCap = pityDefaults?.pityCap ?? 0;
    const pityIncrement = pityDefaults?.pityIncrement ?? 0;
    const chance = Math.min(1, (duration.rareChance ?? 0) + failures * pityIncrement);
    const chancePct = Math.round(chance * 100);
    const showPity = Boolean(selectedRoute && pityCap > 1);
    const shardsCap = Math.max(1, pityCap - 1);
    const progressPct = showPity ? pityProgressPercent(failures, pityCap) * 100 : 0;
    const chipText = [
      duration.label,
      formatDuration(duration.seconds),
      selectedRoute ? `Rare ${chancePct}%` : null,
      valueEstimate ? `Yield ${valueEstimate.label}` : null,
    ]
      .filter(Boolean)
      .join(' • ');
    const isSelected = selectedDurationId === duration.id;
    return (
      <div key={duration.id} className="expDurationChipGroup">
        <PaperChip
          variant="pill"
          text={chipText}
          tone={isSelected ? 'ink' : 'neutral'}
          onClick={() => {
            setSelectedDurationId(duration.id);
            setDurationPulseId(duration.id);
            window.setTimeout(() => setDurationPulseId(null), 250);
          }}
          className={`expDurationChip${isSelected ? ' expDurationChip--selected' : ''}`}
        />
        {showPity ? (
          <div className={'expDurationPity'}>
            Intel shards: {failures} / {shardsCap}
            <div className={'expDurationPityBar'}>
              <div className={'expDurationPityFill'} style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        ) : null}
      </div>
    );
  });

  const queueDurationChips = content.durations.map((duration) => {
    const isSelected = selectedDurationId === duration.id;
    const chancePct = Math.round((duration.rareChance ?? 0) * 100);
    const chipText = [
      duration.label,
      formatDuration(duration.seconds),
      duration.rareChance ? `Rare ${chancePct}%` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return (
      <PaperChip
        key={duration.id}
        variant="pill"
        text={chipText}
        tone={isSelected ? 'ink' : 'neutral'}
        onClick={() => {
          setSelectedDurationId(duration.id);
          setDurationPulseId(duration.id);
          window.setTimeout(() => setDurationPulseId(null), 250);
        }}
        className={`eqsDurationChip${isSelected ? ' eqsDurationChip--selected' : ''}${
          durationPulseId === duration.id ? ' eqsDurationChip--pulse' : ''
        }`}
      />
    );
  });

  const selectedPreviewItems = useMemo(() => {
    if (!expectedBundle) return [] as { itemId: string; qty: number; min: number; max: number }[];
    const items = normalizeItemList(expectedBundle.items);
    return items
      .map((item) => ({
        ...item,
        ...clampVarianceRange(item.qty, variancePct),
      }))
      .sort((a, b) => b.qty - a.qty);
  }, [expectedBundle, variancePct]);

  const rareChancePct = Math.round((selectedPity?.chance ?? selectedDuration?.rareChance ?? 0) * 100);

  const handleClaim = (slotIndex: number) => {
    const result = claim(slotIndex);
    if (result.ok) {
      setCeremony({
        open: true,
        slotIndex,
        run: result.run ?? null,
        rolled: result.rolled ?? null,
        rareDrop: result.rareDrop,
        spotlightItemId: result.spotlightItemId,
      });
      setCeremonyError(null);
    }
  };

  const startWithSelection = (slotIndex: number) => {
    if (!selectedRoute || !selectedDuration) return false;
    const success = start(slotIndex, selectedRoute.id, selectedDuration.id, currentCityId, cityIndex);
    if (success) {
      setSentPulseSlotIndex(slotIndex);
      setSentRoutePulseId(selectedRoute.id);
      window.setTimeout(() => setSentPulseSlotIndex(null), 700);
      window.setTimeout(() => setSentRoutePulseId(null), 700);
    }
    return success;
  };

  const closeCeremony = () => {
    setCeremony({
      open: false,
      slotIndex: null,
      run: null,
      rolled: null,
      rareDrop: null,
      spotlightItemId: null,
    });
    setCeremonyError(null);
  };

  const sendAgain = () => {
    if (!ceremony.run) return;
    const { slotIndex, expeditionTypeId, durationId, cityId, cityIndex: runCityIndex } = ceremony.run;
    const success = start(slotIndex, expeditionTypeId, durationId, cityId, runCityIndex);
    if (success) {
      closeCeremony();
    } else {
      setCeremonyError('Unable to restart this expedition.');
    }
  };

  const goUseMaterials = (moduleKey: string) => {
    if (!ceremony.run) return;
    openWorldModule({ cityId: ceremony.run.cityId, moduleKey, source: 'expedition-use-materials' });
    closeCeremony();
  };

  const selectedRouteRareNames = selectedRoute?.rareDrops
    ?.slice(0, 2)
    .map((drop) => itemsById[drop.itemId]?.name ?? drop.itemId);
  const selectedRouteRareItems = selectedRoute?.rareDrops ?? [];

  const queueYieldChips = selectedPreviewItems.slice(0, 3).map((item) => {
    const name = itemsById[item.itemId]?.name ?? item.itemId;
    return {
      id: item.itemId,
      text: `${name} ${item.min}–${item.max}`,
    };
  });

  const queueRareChip = selectedRouteRareNames && selectedRouteRareNames.length > 0
    ? `Rare: ${selectedRouteRareNames.join(', ')}`
    : null;

  const routePapers = content.types.slice(0, 3).map((type, index) => ({
    type,
    positionClass: routePositions[index] as RoutePositionClass,
  }));

  const availableSlots = Math.max(0, slots - activeRuns.length);
  const availableSlotIndices = Array.from({ length: slots })
    .map((_, index) => index)
    .filter((index) => !activeRuns.some((entry) => entry.slotIndex === index));
  const activeRunBySlot = useMemo(() => {
    const map = new Map<number, ExpeditionRun>();
    activeRuns.forEach((run) => map.set(run.slotIndex, run));
    return map;
  }, [activeRuns]);

  const canDispatch = Boolean(selectedRoute && selectedDuration);

  useEffect(() => {
    if (!routeModalOpen) return;
    if (availableSlotIndices.length === 0) {
      setSelectedSlotIndex(null);
      return;
    }
    setSelectedSlotIndex((current) =>
      current != null && availableSlotIndices.includes(current) ? current : availableSlotIndices[0],
    );
  }, [availableSlotIndices, routeModalOpen]);

  useEffect(() => {
    if (!ceremony.open) return;
    if (routeModalOpen) {
      setRouteModalOpen(false);
    }
  }, [ceremony.open, routeModalOpen]);

  return (
    <div className={`expStageRoot${ceremony.open ? ' expStageRoot--muted' : ''}`}>
      <div className={'expStageHud'}>
        <PaperCard variant="label" className="expStageHudGroup">
          <div className={'expStageTitle'}>Expeditions</div>
          <div className={'expStageSub'}>{citiesById[currentCityId]?.name ?? 'Unknown City'}</div>
        </PaperCard>
      </div>

      <div className={'expStageArea'}>
        {routePapers.map(({ type, positionClass }) => {
          const previewDuration = selectedDuration ?? content.durations[0];
          const preview = computeExpectedBundle(cityIndex, type.id, previewDuration.id, content);
          const items = normalizeItemList(preview?.items).slice(0, 3);
          const variance = previewDuration.variancePct ?? 0.15;
          const rarePreviewNames = type.rareDrops?.slice(0, 2).map((drop) => itemsById[drop.itemId]?.name ?? drop.itemId);
          const isSelected = selectedRouteId === type.id;
          const isRoutePulse = sentRoutePulseId === type.id;
          return (
            <button
              key={type.id}
              className={classNames('expRouteButton', positionClass, {
                'expRouteButton--selected': isSelected,
              })}
              onClick={() => {
                setSelectedRouteId(type.id);
                setRouteModalOpen(true);
                setSentRoutePulseId(type.id);
                window.setTimeout(() => setSentRoutePulseId(null), 600);
              }}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Select expedition route: ${type.name}`}
            >
              <PaperCard
                variant="card"
                interactive
                selected={isSelected}
                className={classNames('expRouteCard', {
                  'expRouteCard--selected': isSelected,
                  'expRouteCard--pulse': isRoutePulse,
                })}
              >
                <div className={'expRouteHeader'}>
                  <div className={'expRouteTitle'}>{type.name}</div>
                  <PaperChip variant="tag" text="ROUTE" />
                </div>
                <div className={'expRouteDescription'}>{type.description ?? 'Send disciples to gather resources.'}</div>
                <div className={'expRouteItems'}>
                  {items.length === 0 && <div className={'expRouteItem'}>No yields defined</div>}
                  {items.map((item) => {
                    const range = clampVarianceRange(item.qty, variance);
                    const name = itemsById[item.itemId]?.name ?? item.itemId;
                    return (
                      <div key={item.itemId} className={'expRouteItem'}>
                        {name}: {range.min}–{range.max}
                      </div>
                    );
                  })}
                </div>
                {rarePreviewNames && rarePreviewNames.length > 0 ? (
                  <div className={'expRouteRare'}>Rare: {rarePreviewNames.join(', ')}</div>
                ) : (
                  <div className={'expRouteRare'}>Rare: —</div>
                )}
              </PaperCard>
            </button>
          );
        })}

      </div>

      <div className={'expeditionQueueStrip'}>
        <div className={classNames('eqsPlanner', { 'eqsPlanner--active': Boolean(selectedRoute) })}>
          <div className={'eqsPlannerHeader'}>
            <div className={'eqsSelectedRoute'}>
              {selectedRoute ? (
                <>
                  <span className={'eqsRouteName'}>{selectedRoute.name}</span>
                  <span className={'eqsRouteDesc'}>{selectedRoute.description ?? 'Plan your expedition.'}</span>
                </>
              ) : (
                <span className={'eqsRoutePlaceholder'}>Select a route above</span>
              )}
            </div>
            <div className={'eqsPlannerMeta'}>
              <span className={'eqsMetaItem'}>Slots: {availableSlots} / {slots}</span>
              <div className={'eqsRareTag'}>
                {selectedRoute ? (
                  <>
                    <PaperChip variant="tag" text={`Rare ${rareChancePct}%`} tone="rare" />
                    {selectedRouteRareNames && selectedRouteRareNames.length > 0 ? (
                      <div className="eqsRareChips">
                        {selectedRouteRareItems.slice(0, 2).map((drop) => (
                          <PaperChip
                            key={drop.itemId}
                            variant="pill"
                            text={itemsById[drop.itemId]?.name ?? drop.itemId}
                            tone="rare"
                          />
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <PaperChip variant="tag" text="Select a route to view rare chances" tone="neutral" />
                )}
              </div>
            </div>
          </div>

          <div className={'eqsPlannerHint'}>Select route + duration, then click a slot to send.</div>

          <div className={'eqsDurations'}>
            {queueDurationChips}
          </div>

          <div className={'eqsYieldChips'}>
            {queueYieldChips.length > 0 ? (
              queueYieldChips.map((entry) => (
                <PaperChip key={entry.id} variant="pill" text={entry.text} tone="neutral" />
              ))
            ) : (
              <PaperChip variant="pill" text="Yield preview unavailable" tone="neutral" />
            )}
            {queueRareChip && <PaperChip variant="pill" text={queueRareChip} tone="rare" />}
          </div>
        </div>

        <div className={'eqsSlots'}>
          {Array.from({ length: slots }).map((_, slotIndex) => {
            const run = activeRunBySlot.get(slotIndex) ?? null;
            if (run) {
              const durationDef = content.durations.find((entry) => entry.id === run.durationId);
              const typeDef = content.types.find((entry) => entry.id === run.expeditionTypeId);
              const remainingMs = Math.max(0, run.endsAt - now);
              const isComplete = run.status === 'complete' || remainingMs <= 0;
              const totalMs = Math.max(1, run.endsAt - run.startedAt);
              const elapsed = Math.min(totalMs, totalMs - remainingMs);
              const progress = Math.min(100, Math.max(0, (elapsed / totalMs) * 100));

              const isSentPulse = sentPulseSlotIndex === slotIndex;
              return (
                <PaperCard
                  key={slotIndex}
                  variant="card"
                  complete={isComplete}
                  className={classNames('eqsSlotTile', {
                    'eqsSlotTile--ready': isComplete,
                    'eqsSlotTile--active': !isComplete,
                    'eqsSlotTile--sent': isSentPulse,
                  })}
                >
                  <div className={'eqsSlotHeader'}>
                    <div className={'eqsSlotTitle'}>Slot {slotIndex + 1}</div>
                    {isComplete ? (
                      <PaperStamp text="Ready" size="sm" tone="seal" className="paperStamp--ready" />
                    ) : (
                      <span className={'eqsSlotStatus'}>In Progress</span>
                    )}
                  </div>
                  <div className={'eqsSlotMeta'}>
                    {typeDef?.name ?? run.expeditionTypeId} · {durationDef?.label ?? run.durationId} · {' '}
                    {citiesById[run.cityId]?.name ?? run.cityId}
                  </div>
                  <div className={'eqsSlotTimer'}>
                    {isComplete ? 'Ready to claim' : formatTimer(remainingMs)}
                  </div>
                  {!isComplete && (
                    <div className={'eqsSlotProgress'}>
                      <div className={'eqsSlotProgressFill'} style={{ width: `${progress}%` }} />
                    </div>
                  )}
                  {isSentPulse && <span className="eqsSlotStamp">Sent</span>}
                  {isComplete && (
                    <button
                      className={'worldScreenModuleButton eqsSlotAction'}
                      type="button"
                      onClick={() => handleClaim(slotIndex)}
                    >
                      Claim
                    </button>
                  )}
                </PaperCard>
              );
            }

            const tileClass = classNames(
              'eqsSlotTile',
              'eqsSlotTileButton',
              'eqsSlotTile--idle',
              { 'eqsSlotTile--dispatchable': canDispatch, 'eqsSlotTile--sent': sentPulseSlotIndex === slotIndex },
            );
            return (
              <button
                key={slotIndex}
                type="button"
                className={tileClass}
                onClick={() => startWithSelection(slotIndex)}
                disabled={!canDispatch}
              >
                <PaperCard variant="card" className="eqsSlotInner">
                  <div className={'eqsSlotHeader'}>
                    <div className={'eqsSlotTitle'}>Slot {slotIndex + 1}</div>
                    <span className={'eqsSlotStatus'}>Idle</span>
                  </div>
                  <div className={'eqsSlotMeta'}>
                    {selectedRoute ? selectedRoute.name : 'Pick a route'} ·{' '}
                    {selectedDuration ? selectedDuration.label : 'Pick a duration'}
                  </div>
                  <div className={'eqsSlotHint'}>
                    {canDispatch ? 'Click to send' : 'Select route + duration'}
                  </div>
                  {sentPulseSlotIndex === slotIndex && <span className="eqsSlotStamp">Sent</span>}
                </PaperCard>
              </button>
            );
          })}
        </div>
      </div>

      {selectedRoute && (
        <DetailScrollModal
          open={routeModalOpen}
          title={selectedRoute.name}
          subtitle={`${citiesById[currentCityId]?.name ?? 'Unknown City'} • ${selectedRoute.description ?? 'Plan a route.'}`}
          meta={<PaperChip variant="tag" text={`Rare ${rareChancePct}%`} />}
          onClose={() => setRouteModalOpen(false)}
        >
          <div className={'expDetailSection'}>
            <div className={'expDetailLabel'}>What You Might Find</div>
            <div className={'expDetailYieldList'}>
              {selectedPreviewItems.length > 0 ? (
                selectedPreviewItems.slice(0, 6).map((item) => {
                  const name = itemsById[item.itemId]?.name ?? item.itemId;
                  return (
                    <div key={item.itemId} className={'expDetailYieldRow'}>
                      <span>{name}</span>
                      <span>
                        {item.min}–{item.max}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className={'expDetailHint'}>No yield data available.</div>
              )}
            </div>
          </div>

          <div className={'expDetailSection'}>
            <div className={'expDetailLabel'}>Rare Finds</div>
            <div className={'expDetailHint'}>Chance: {rareChancePct}%</div>
            <div className={'expDetailRareList'}>
              {selectedRouteRareNames && selectedRouteRareNames.length > 0 ? (
                selectedRouteRareNames.map((name) => <PaperChip key={name} variant="pill" text={name} />)
              ) : (
                <PaperChip variant="pill" text="No rare drops listed" tone="neutral" />
              )}
            </div>
            {selectedPity && selectedPity.pityCap > 1 ? (
              <div className={'expDetailHint'}>
                Intel shards: {selectedPity.failures} / {Math.max(1, selectedPity.pityCap - 1)}
              </div>
            ) : null}
          </div>

          <div className={'expDetailSection'}>
            <div className={'expDetailLabel'}>Choose Duration</div>
            <div className={'expDurationRow'}>{durationChips}</div>
          </div>

          <div className={'expDetailSection'}>
            <div className={'expDetailLabel'}>Send Expedition</div>
            <div className={'expDetailSlotPicker'}>
              {Array.from({ length: slots }).map((_, slotIndex) => {
                const run = activeRuns.find((entry) => entry.slotIndex === slotIndex) ?? null;
                const isSelected = selectedSlotIndex === slotIndex;
                return (
                  <button
                    key={slotIndex}
                    type="button"
                    className={`expDetailSlot${isSelected ? ' expDetailSlot--selected' : ''}${
                      run ? ' expDetailSlot--busy' : ''
                    }`}
                    onClick={() => {
                      if (run) return;
                      setSelectedSlotIndex(slotIndex);
                    }}
                    disabled={Boolean(run)}
                  >
                    <div>Slot {slotIndex + 1}</div>
                    <div>{run ? (run.status === 'complete' ? 'Complete' : 'In progress') : 'Idle'}</div>
                  </button>
                );
              })}
            </div>
            <div className={'expDetailActions'}>
              <button
                className={'worldScreenModuleButton worldScreenModuleButton--primary'}
                onClick={() => {
                  if (!selectedDuration || selectedSlotIndex == null) return;
                  const success = start(selectedSlotIndex, selectedRoute.id, selectedDuration.id, currentCityId, cityIndex);
                  if (success) {
                    setRouteModalOpen(false);
                  }
                }}
                disabled={!selectedDuration || selectedSlotIndex == null || availableSlotIndices.length === 0}
              >
                Send Expedition
              </button>
              {!selectedDuration && <div className={'expDetailHint'}>Choose a duration first.</div>}
              {selectedDuration && selectedSlotIndex == null && (
                <div className={'expDetailHint'}>Select an available slot.</div>
              )}
              {availableSlotIndices.length === 0 && <div className={'expDetailHint'}>No slots available.</div>}
            </div>
          </div>
        </DetailScrollModal>
      )}

      {ceremony.open && ceremony.run && ceremony.rolled && (
        <DetailScrollModal
          open={ceremony.open}
          title="Expedition Complete"
          subtitle={`${content.types.find((entry) => entry.id === ceremony.run?.expeditionTypeId)?.name ?? 'Expedition'} · ${
            content.durations.find((entry) => entry.id === ceremony.run?.durationId)?.label ?? 'Duration'
          } · ${citiesById[ceremony.run.cityId]?.name ?? ceremony.run.cityId}`}
          meta={
            ceremony.slotIndex != null ? (
              <PaperChip variant="tag" text={`Slot ${ceremony.slotIndex + 1}`} className="expCeremonyMetaChip" />
            ) : null
          }
          onClose={closeCeremony}
        >
          <div
            className={classNames('expCeremonySpotlight', {
              'expCeremonySpotlight--rare': ceremony.rareDrop && ceremony.rareDrop.itemId === ceremony.spotlightItemId,
            })}
          >
            <div className={'expCeremonySpotlightLabel'}>Best Drop</div>
            <div className={'expCeremonySpotlightItem'}>
              {ceremony.spotlightItemId
                ? itemsById[ceremony.spotlightItemId]?.name ?? ceremony.spotlightItemId
                : 'No items'}
            </div>
            {ceremony.rareDrop && ceremony.rareDrop.itemId === ceremony.spotlightItemId ? (
              <PaperStamp text="Rare" size="sm" tone="seal" className="expCeremonySpotlightBadge" />
            ) : null}
          </div>

          <div className={'expCeremonyRewardList'}>
            <div className={'expCeremonyRewardHeader'}>Rewards Gained</div>
            {normalizeItemList(ceremony.rolled.items).map((item, index) => {
              const isRareDrop = ceremony.rareDrop?.itemId === item.itemId;
              return (
                <div
                  key={item.itemId}
                  className={classNames('expCeremonyRewardRow', { 'expCeremonyRewardRow--rare': isRareDrop })}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <PaperChip
                    variant="pill"
                    text={`${itemsById[item.itemId]?.name ?? item.itemId} ×${item.qty}`}
                    className={classNames('expCeremonyRewardChip', {
                      'expCeremonyRewardChip--rare': isRareDrop,
                    })}
                    tone={isRareDrop ? 'rare' : 'neutral'}
                  />
                  {isRareDrop && <PaperStamp text="Rare" size="sm" tone="seal" className="paperStamp--ready" />}
                </div>
              );
            })}
            {ceremony.rolled.currencies ? (
              <div className={'expCeremonyRewardCurrencies'}>
                {Object.entries(ceremony.rolled.currencies).map(([key, value], index) => (
                  <div
                    key={key}
                    className="expCeremonyRewardRow"
                    style={{ animationDelay: `${(index + 1) * 80}ms` }}
                  >
                    <PaperChip
                      variant="pill"
                      text={`${key}: ${value}`}
                      className="expCeremonyRewardChip"
                      tone={key === 'merit' ? 'merit' : 'neutral'}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {ceremonyError && <div className={'expCeremonyError'}>{ceremonyError}</div>}

          <div className={'expCeremonyActions'}>
            <button className={'worldScreenModuleButton'} onClick={sendAgain}>
              Send Again
            </button>
            <div className={'expCeremonyUse'}>
              <div className={'expCeremonyUseLabel'}>Go use materials</div>
              <div className={'expCeremonyUseButtons'}>
                {(() => {
                  const routePurpose = ceremony.run
                    ? getLiveExpeditionRoutePurpose(ceremony.run.expeditionTypeId)
                    : null;
                  const destinations = ceremony.run
                    ? resolveExpeditionUseMaterialsDestinations({
                        cityId: ceremony.run.cityId,
                        expeditionTypeId: ceremony.run.expeditionTypeId,
                        cityModules: citiesById[ceremony.run.cityId]?.modules ?? [],
                        recommendedModuleKey: routePurpose?.moduleKey,
                      })
                    : [];
                  if (!routePurpose) {
                    return <div className={'expDetailHint'}>No follow-up destination available.</div>;
                  }
                  const destination = destinations[0] ?? null;
                  if (!destination) {
                    return <div className={'expDetailHint'}>{routePurpose.moduleLabel} unavailable in the origin city.</div>;
                  }
                  return (
                    <button
                      key={destination.moduleKey}
                      className={'worldScreenModuleButton worldScreenModuleButton--subtle'}
                      onClick={() => goUseMaterials(destination.moduleKey)}
                    >
                      {routePurpose.ctaLabel}
                    </button>
                  );
                })()}
              </div>
            </div>
            <button className={'worldScreenModuleButton worldScreenModuleButton--ghost'} onClick={closeCeremony}>
              Close
            </button>
          </div>
        </DetailScrollModal>
      )}
    </div>
  );
}
