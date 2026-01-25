import { useEffect, useMemo, useState } from 'react';
import type { RewardBundle } from '../../services/rewards';
import { pityProgressPercent } from '../../services/economy/pity';
import { normalizeItemList } from '../../utils/itemList';
import { multiply } from '../../utils/numbers';
import { useCityStore } from '../../stores/cityStore';
import { useContentStore } from '../../stores/contentStore';
import { useExpeditionStore, type ExpeditionRun } from '../../stores/expeditionStore';
import { useUIStore } from '../../stores/uiStore';
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

const routePositions = ['expRoutePaper--left', 'expRoutePaper--center', 'expRoutePaper--right'] as const;

type RoutePositionClass = (typeof routePositions)[number];

export function ExpeditionBoardPanel() {
  const currentCityId = useCityStore((state) => state.currentCityId);
  const setSelectedModule = useCityStore((state) => state.setSelectedModule);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const content = useContentStore((state) => state.raw?.expeditions);
  const economy = useContentStore((state) => state.economy);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const citiesById = useContentStore((state) => state.maps.citiesById);

  const slots = useExpeditionStore((state) => state.slots);
  const activeRuns = useExpeditionStore((state) => state.active);
  const rareProgressByKey = useExpeditionStore((state) => state.rareProgressByKey);
  const start = useExpeditionStore((state) => state.start);
  const claim = useExpeditionStore((state) => state.claim);

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedDurationId, setSelectedDurationId] = useState<string | null>(null);
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
    if (!selectedTypeId && content.types.length > 0) {
      setSelectedTypeId(content.types[0].id);
    }
    if (!selectedDurationId && content.durations.length > 0) {
      setSelectedDurationId(content.durations[0].id);
    }
  }, [content, selectedDurationId, selectedTypeId]);

  const selectedType = useMemo(() => {
    if (!content || !selectedTypeId) return null;
    return content.types.find((entry) => entry.id === selectedTypeId) ?? null;
  }, [content, selectedTypeId]);

  const selectedDuration = useMemo(() => {
    if (!content || !selectedDurationId) return null;
    return content.durations.find((entry) => entry.id === selectedDurationId) ?? null;
  }, [content, selectedDurationId]);

  const pityDefaults = economy?.tuning?.pityDefaults?.expeditionsRare;

  const selectedPity = useMemo(() => {
    if (!selectedType || !selectedDuration) return null;
    const key = `${selectedType.id}::${selectedDuration.id}`;
    const failures = rareProgressByKey[key] ?? 0;
    const pityCap = pityDefaults?.pityCap ?? 0;
    const pityIncrement = pityDefaults?.pityIncrement ?? 0;
    const chance = Math.min(1, (selectedDuration.rareChance ?? 0) + failures * pityIncrement);
    return { chance, pityCap, pityIncrement, failures };
  }, [pityDefaults, rareProgressByKey, selectedDuration, selectedType]);

  const expectedBundle = useMemo(() => {
    if (!content || cityIndex == null || !selectedType || !selectedDuration) return null;
    return computeExpectedBundle(cityIndex, selectedType.id, selectedDuration.id, content);
  }, [cityIndex, content, selectedDuration, selectedType]);

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
    const previewBundle = selectedType
      ? computeExpectedBundle(cityIndex, selectedType.id, duration.id, content)
      : null;
    const variance = duration.variancePct ?? 0.15;
    const valueEstimate = previewBundle ? computeValueEstimate(previewBundle, variance, itemsById) : null;
    const failures = selectedType ? rareProgressByKey[`${selectedType.id}::${duration.id}`] ?? 0 : 0;
    const pityCap = pityDefaults?.pityCap ?? 0;
    const pityIncrement = pityDefaults?.pityIncrement ?? 0;
    const chance = Math.min(1, (duration.rareChance ?? 0) + failures * pityIncrement);
    const chancePct = Math.round(chance * 100);
    const showPity = Boolean(selectedType && pityCap > 1);
    const shardsCap = Math.max(1, pityCap - 1);
    const progressPct = showPity ? pityProgressPercent(failures, pityCap) * 100 : 0;
    return (
      <button
        key={duration.id}
        className={`expDurationChip${selectedDurationId === duration.id ? ' expDurationChip--selected' : ''}`}
        onClick={() => setSelectedDurationId(duration.id)}
        type="button"
      >
        <div className={'expDurationChipHeader'}>
          <span>{duration.label}</span>
          <span className={'expDurationTime'}>{formatDuration(duration.seconds)}</span>
        </div>
        <div className={'expDurationMeta'}>Rare: {chancePct}%</div>
        {valueEstimate && <div className={'expDurationMeta'}>Yield: {valueEstimate.label}</div>}
        {showPity ? (
          <div className={'expDurationPity'}>
            Intel shards: {failures} / {shardsCap}
            <div className={'expDurationPityBar'}>
              <div className={'expDurationPityFill'} style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        ) : null}
      </button>
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
    if (!selectedType || !selectedDuration) return false;
    const success = start(slotIndex, selectedType.id, selectedDuration.id, currentCityId, cityIndex);
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
    setActiveTab('adventure');
    setSelectedModule(ceremony.run.cityId, moduleKey);
    closeCeremony();
  };

  const selectedTypeRareNames = selectedType?.rareDrops
    ?.slice(0, 2)
    .map((drop) => itemsById[drop.itemId]?.name ?? drop.itemId);

  const routePapers = content.types.slice(0, 3).map((type, index) => ({
    type,
    positionClass: routePositions[index] as RoutePositionClass,
  }));

  const availableSlots = Math.max(0, slots - activeRuns.length);

  return (
    <div className={'expStageRoot'}>
      <div className={'expStageHud'}>
        <div className={'expStageHudGroup'}>
          <div className={'expStageTitle'}>Expeditions</div>
          <div className={'expStageSub'}>{citiesById[currentCityId]?.name ?? 'Unknown City'}</div>
        </div>
        <div className={'expStageHudGroup'}>
          <div className={'expStageLabel'}>Slots</div>
          <div className={'expStageValue'}>
            {availableSlots} / {slots} available
          </div>
        </div>
        <div className={'expStageHudGroup expStageHudGroup--rare'}>
          <div className={'expStageLabel'}>Rare chance</div>
          <div className={'expStageValue'}>
            {rareChancePct}%
            {selectedTypeRareNames && selectedTypeRareNames.length > 0 ? (
              <span className={'expStageRareItems'}> — {selectedTypeRareNames.join(', ')}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className={'expStageArea'}>
        {routePapers.map(({ type, positionClass }) => {
          const previewDuration = selectedDuration ?? content.durations[0];
          const preview = computeExpectedBundle(cityIndex, type.id, previewDuration.id, content);
          const items = normalizeItemList(preview?.items).slice(0, 4);
          const variance = previewDuration.variancePct ?? 0.15;
          const rarePreviewNames = type.rareDrops?.slice(0, 2).map((drop) => itemsById[drop.itemId]?.name ?? drop.itemId);
          const isSelected = selectedTypeId === type.id;
          return (
            <button
              key={type.id}
              className={`expRoutePaper ${positionClass}${isSelected ? ' expRoutePaper--selected' : ''}`}
              onClick={() => setSelectedTypeId(type.id)}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Select expedition route: ${type.name}`}
            >
              <div className={'expRouteHeader'}>
                <div className={'expRouteTitle'}>{type.name}</div>
                <div className={'expRouteBadge'}>Route</div>
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
            </button>
          );
        })}

        <div className={'expControlsDock'}>
          <div className={'expDurationRow'}>{durationChips}</div>
          <div className={'expPreviewRow'}>
            {selectedPreviewItems.length > 0 ? (
              <>
                {selectedPreviewItems.slice(0, 4).map((item) => {
                  const name = itemsById[item.itemId]?.name ?? item.itemId;
                  return (
                    <div key={item.itemId} className={'expPreviewItem'}>
                      {name}: {item.min}–{item.max}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className={'expPreviewItem expPreviewItem--empty'}>Select a route to preview yields.</div>
            )}
            <div className={'expPreviewRareLine'}>
              Rare drop chance: {rareChancePct}%
              {selectedTypeRareNames && selectedTypeRareNames.length > 0 ? (
                <span> — {selectedTypeRareNames.join(', ')}</span>
              ) : null}
            </div>
          </div>
          <div className={'expSendRow'}>
            <span>Pick a slot below to send the selected route.</span>
          </div>
        </div>

        <div className={'expSlotStrip'}>
          {Array.from({ length: slots }).map((_, slotIndex) => {
            const run = activeRuns.find((entry) => entry.slotIndex === slotIndex) ?? null;
            if (run) {
              const durationDef = content.durations.find((entry) => entry.id === run.durationId);
              const typeDef = content.types.find((entry) => entry.id === run.expeditionTypeId);
              const remainingMs = Math.max(0, run.endsAt - now);
              const isComplete = run.status === 'complete' || remainingMs <= 0;
              const totalMs = Math.max(1, run.endsAt - run.startedAt);
              const elapsed = Math.min(totalMs, totalMs - remainingMs);
              const progress = Math.min(100, Math.max(0, (elapsed / totalMs) * 100));

              return (
                <div key={slotIndex} className={`expSlotCard${isComplete ? ' expSlotCard--ready' : ''}`}>
                  <div className={'expSlotHeader'}>
                    <div className={'expSlotTitle'}>Slot {slotIndex + 1}</div>
                    <div className={'expSlotStatus'}>{isComplete ? 'Complete' : 'Running'}</div>
                  </div>
                  <div className={'expSlotMeta'}>
                    {typeDef?.name ?? run.expeditionTypeId} · {durationDef?.label ?? run.durationId}
                  </div>
                  <div className={'expSlotTimer'}>
                    {isComplete ? 'Ready to claim' : `${formatTimer(remainingMs)} remaining`}
                  </div>
                  <div className={'expSlotProgress'}>
                    <div className={'expSlotProgressFill'} style={{ width: `${progress}%` }} />
                  </div>
                  <button
                    className={'worldScreenModuleButton expSlotAction'}
                    onClick={() => handleClaim(slotIndex)}
                    disabled={!isComplete}
                  >
                    {isComplete ? 'Claim' : 'In progress'}
                  </button>
                </div>
              );
            }

            const canStart = Boolean(selectedType && selectedDuration && expectedBundle);

            return (
              <div key={slotIndex} className={'expSlotCard expSlotCard--idle'}>
                <div className={'expSlotHeader'}>
                  <div className={'expSlotTitle'}>Slot {slotIndex + 1}</div>
                  <div className={'expSlotStatus'}>Idle</div>
                </div>
                <div className={'expSlotMeta'}>
                  {selectedType ? selectedType.name : 'Pick a route'} ·{' '}
                  {selectedDuration ? selectedDuration.label : 'Pick a duration'}
                </div>
                <button
                  className={'worldScreenModuleButton expSlotAction'}
                  onClick={() => startWithSelection(slotIndex)}
                  disabled={!canStart}
                >
                  Send
                </button>
                {!canStart && <div className={'expSlotError'}>Select a route and duration first.</div>}
              </div>
            );
          })}
        </div>
      </div>

      {ceremony.open && ceremony.run && ceremony.rolled && (
        <div className={'expCeremonyOverlay'} onClick={closeCeremony}>
          <div className={'expCeremonyModal'} onClick={(event) => event.stopPropagation()}>
            <div className={'expCeremonyHeader'}>
              <div>
                <div className={'expCeremonyTitle'}>Expedition Complete</div>
                <div className={'expCeremonySubtitle'}>
                  {content.types.find((entry) => entry.id === ceremony.run?.expeditionTypeId)?.name ?? 'Expedition'} ·
                  {content.durations.find((entry) => entry.id === ceremony.run?.durationId)?.label ?? 'Duration'}
                </div>
              </div>
              <button className={'expCeremonyClose'} onClick={closeCeremony} aria-label="Close">
                ×
              </button>
            </div>

            <div className={'expCeremonySpotlight'}>
              <div className={'expCeremonySpotlightLabel'}>Best Drop</div>
              <div className={'expCeremonySpotlightItem'}>
                {ceremony.spotlightItemId
                  ? itemsById[ceremony.spotlightItemId]?.name ?? ceremony.spotlightItemId
                  : 'No items'}
              </div>
              {ceremony.rareDrop && ceremony.rareDrop.itemId === ceremony.spotlightItemId ? (
                <div className={'expCeremonySpotlightBadge'}>Rare Find</div>
              ) : null}
            </div>

            <div className={'expCeremonyRewardList'}>
              <div className={'expCeremonyRewardHeader'}>Rewards Gained</div>
              {normalizeItemList(ceremony.rolled.items).map((item) => (
                <div key={item.itemId} className={'expCeremonyRewardRow'}>
                  <span>{itemsById[item.itemId]?.name ?? item.itemId}</span>
                  <span>×{item.qty}</span>
                </div>
              ))}
              {ceremony.rolled.currencies ? (
                <div className={'expCeremonyRewardCurrencies'}>
                  {Object.entries(ceremony.rolled.currencies).map(([key, value]) => (
                    <div key={key} className={'expCeremonyRewardRow'}>
                      <span>{key}</span>
                      <span>{value}</span>
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
                    const type = content.types.find((entry) => entry.id === ceremony.run?.expeditionTypeId);
                    const recommended = type?.recommendedModuleKey;
                    const fallback: Record<string, string> = {
                      forage: 'alchemy',
                      mine: 'forge',
                      scout: 'manualPavilion',
                    };
                    const moduleKey = recommended ?? (ceremony.run ? fallback[ceremony.run.expeditionTypeId] : undefined);
                    const buttons: { key: string; label: string }[] = [];
                    if (moduleKey === 'alchemy') buttons.push({ key: 'alchemy', label: 'Alchemy' });
                    if (moduleKey === 'forge') buttons.push({ key: 'forge', label: 'Forge' });
                    if (moduleKey === 'manualPavilion') buttons.push({ key: 'manualPavilion', label: 'Manual Pavilion' });
                    if (!moduleKey) {
                      buttons.push({ key: 'alchemy', label: 'Alchemy' });
                      buttons.push({ key: 'forge', label: 'Forge' });
                      buttons.push({ key: 'manualPavilion', label: 'Manual Pavilion' });
                    }
                    return buttons.map((entry) => (
                      <button
                        key={entry.key}
                        className={'worldScreenModuleButton worldScreenModuleButton--subtle'}
                        onClick={() => goUseMaterials(entry.key)}
                      >
                        {entry.label}
                      </button>
                    ));
                  })()}
                </div>
              </div>
              <button className={'worldScreenModuleButton worldScreenModuleButton--ghost'} onClick={closeCeremony}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
