import { useEffect, useMemo, useState } from 'react';
import type { RewardBundle } from '../../services/rewards';
import { pityProgressPercent } from '../../services/economy/pity';
import { normalizeItemList } from '../../utils/itemList';
import { multiply } from '../../utils/numbers';
import { useCityStore } from '../../stores/cityStore';
import { useContentStore } from '../../stores/contentStore';
import { useExpeditionStore, type ExpeditionRun } from '../../stores/expeditionStore';
import { useUIStore } from '../../stores/uiStore';

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
        className={`expeditionDurationChip${selectedDurationId === duration.id ? ' expeditionDurationChip--selected' : ''}`}
        onClick={() => setSelectedDurationId(duration.id)}
      >
        <div className={'expeditionDurationChipHeader'}>
          <span>{duration.label}</span>
          <span className={'expeditionDurationTime'}>{formatDuration(duration.seconds)}</span>
        </div>
        <div className={'expeditionDurationMeta'}>Rare: {chancePct}%</div>
        {valueEstimate && <div className={'expeditionDurationMeta'}>Yield: {valueEstimate.label}</div>}
        {showPity ? (
          <div className={'expeditionPityMeta'}>
            Intel shards: {failures} / {shardsCap}
            <div className={'expeditionPityBar expeditionPityBar--inline'}>
              <div className={'expeditionPityFill'} style={{ width: `${progressPct}%` }} />
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

  return (
    <div className={'expeditionBoardPanel'}>
      <div className={'expeditionPlanner'}>
        <div className={'expeditionPlannerHeader'}>
          <div>
            <div className={'expeditionBoardTitle'}>Expeditions</div>
            <div className={'expeditionBoardSubtitle'}>Slots available: {slots}</div>
          </div>
          <div className={'expeditionRareInfo'}>
            Rare chance: {rareChancePct}%
            {selectedTypeRareNames && selectedTypeRareNames.length > 0 ? (
              <span className={'expeditionRareItems'}> — {selectedTypeRareNames.join(', ')}</span>
            ) : null}
          </div>
        </div>

        <div className={'expeditionRouteGrid'}>
          {content.types.map((type) => {
            const previewDuration = selectedDuration ?? content.durations[0];
            const preview = computeExpectedBundle(cityIndex, type.id, previewDuration.id, content);
            const items = normalizeItemList(preview?.items).slice(0, 3);
            const variance = previewDuration.variancePct ?? 0.15;
            const rarePreviewNames = type.rareDrops?.slice(0, 2).map((drop) => itemsById[drop.itemId]?.name ?? drop.itemId);
            return (
              <button
                key={type.id}
                className={`expeditionRouteCard${selectedTypeId === type.id ? ' expeditionRouteCard--selected' : ''}`}
                onClick={() => setSelectedTypeId(type.id)}
              >
                <div className={'expeditionRouteCardHeader'}>
                  <div className={'expeditionRouteTitle'}>{type.name}</div>
                  <div className={'expeditionRouteRare'}>Rare: {Math.round((previewDuration.rareChance ?? 0) * 100)}%</div>
                </div>
                <div className={'expeditionRouteDescription'}>{type.description ?? 'Send disciples to gather resources.'}</div>
                <div className={'expeditionRouteItems'}>
                  {items.length === 0 && <div className={'expeditionRouteItem'}>No yields defined</div>}
                  {items.map((item) => {
                    const range = clampVarianceRange(item.qty, variance);
                    const name = itemsById[item.itemId]?.name ?? item.itemId;
                    return (
                      <div key={item.itemId} className={'expeditionRouteItem'}>
                        {name}: {range.min}–{range.max}
                      </div>
                    );
                  })}
                </div>
                {rarePreviewNames && rarePreviewNames.length > 0 ? (
                  <div className={'expeditionRouteRareItems'}>Rares: {rarePreviewNames.join(', ')}</div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className={'expeditionDurationRow'}>{durationChips}</div>

        {selectedPreviewItems.length > 0 && (
          <div className={'expeditionYieldList'}>
            <div className={'expeditionYieldHeader'}>You can expect:</div>
            {selectedPreviewItems.map((item) => {
              const name = itemsById[item.itemId]?.name ?? item.itemId;
              return (
                <div key={item.itemId} className={'expeditionYieldItem'}>
                  <span>{name}</span>
                  <span>
                    {item.min} - {item.max}
                  </span>
                </div>
              );
            })}
            <div className={'expeditionYieldRare'}>
              Rare drop chance: {rareChancePct}%
              {selectedTypeRareNames && selectedTypeRareNames.length > 0 ? (
                <span> — Possible rares: {selectedTypeRareNames.join(', ')}</span>
              ) : null}
            </div>
            {selectedPity && selectedPity.pityCap > 1 ? (
              <div className={'expeditionPityBlock'}>
                <div className={'expeditionPityMeta'}>
                  Rare chance now: {Math.round(selectedPity.chance * 100)}% · Intel shards: {selectedPity.failures} /{' '}
                  {Math.max(1, selectedPity.pityCap - 1)}
                </div>
                <div className={'expeditionPityBar'}>
                  <div
                    className={'expeditionPityFill'}
                    style={{ width: `${pityProgressPercent(selectedPity.failures, selectedPity.pityCap) * 100}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className={'expeditionSlots'}>
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
              <div key={slotIndex} className={'expeditionSlotCard'}>
                <div className={'expeditionSlotHeader'}>
                  <div>
                    <div className={'expeditionSlotTitle'}>
                      Slot {slotIndex + 1}: {typeDef?.name ?? run.expeditionTypeId}
                    </div>
                    <div className={'expeditionSlotMeta'}>{durationDef?.label ?? run.durationId}</div>
                  </div>
                  <div className={`expeditionSlotStatus${isComplete ? ' expeditionSlotStatus--ready' : ''}`}>
                    {isComplete ? 'Ready to claim' : 'Running'}
                  </div>
                </div>
                <div className={'expeditionProgressBar'}>
                  <div className={'expeditionProgressFill'} style={{ width: `${progress}%` }} />
                </div>
                <div className={'expeditionSlotMeta'}>
                  {isComplete ? 'Complete' : `${formatTimer(remainingMs)} remaining`}
                </div>
                <div className={'expeditionSlotActions'}>
                  <button
                    className={'worldScreenModuleButton'}
                    onClick={() => handleClaim(slotIndex)}
                    disabled={!isComplete}
                  >
                    {isComplete ? 'Claim Rewards' : 'In Progress'}
                  </button>
                </div>
              </div>
            );
          }

          const canStart = Boolean(selectedType && selectedDuration && expectedBundle);

          return (
            <div key={slotIndex} className={'expeditionSlotCard expeditionSlotCard--idle'}>
              <div className={'expeditionSlotHeader'}>
                <div className={'expeditionSlotTitle'}>Slot {slotIndex + 1}</div>
                <div className={'expeditionSlotStatus'}>Idle</div>
              </div>
              <div className={'expeditionSlotMeta'}>
                {selectedType ? selectedType.name : 'Pick a route'} · {selectedDuration ? selectedDuration.label : 'Pick a duration'}
              </div>
              <div className={'expeditionSlotActions'}>
                <button
                  className={'worldScreenModuleButton'}
                  onClick={() => startWithSelection(slotIndex)}
                  disabled={!canStart}
                >
                  Send Expedition
                </button>
              </div>
              {!canStart && <div className={'expeditionSlotError'}>Select a route and duration to begin.</div>}
            </div>
          );
        })}
      </div>

      {ceremony.open && ceremony.run && ceremony.rolled && (
        <div className={'expeditionCeremonyOverlay'} onClick={closeCeremony}>
          <div className={'expeditionCeremonyModal'} onClick={(event) => event.stopPropagation()}>
            <div className={'expeditionCeremonyHeader'}>
              <div>
                <div className={'expeditionCeremonyTitle'}>Expedition Complete</div>
                <div className={'expeditionCeremonySubtitle'}>
                  {content.types.find((entry) => entry.id === ceremony.run?.expeditionTypeId)?.name ?? 'Expedition'} ·
                  {content.durations.find((entry) => entry.id === ceremony.run?.durationId)?.label ?? 'Duration'}
                </div>
              </div>
              <button className={'expeditionCeremonyClose'} onClick={closeCeremony} aria-label="Close">
                ×
              </button>
            </div>

            <div className={'expeditionCeremonySpotlight'}>
              <div className={'expeditionSpotlightLabel'}>Best Drop</div>
              <div className={'expeditionSpotlightItem'}>
                {ceremony.spotlightItemId
                  ? itemsById[ceremony.spotlightItemId]?.name ?? ceremony.spotlightItemId
                  : 'No items'}
              </div>
              {ceremony.rareDrop && ceremony.rareDrop.itemId === ceremony.spotlightItemId ? (
                <div className={'expeditionSpotlightBadge'}>Rare Find</div>
              ) : null}
            </div>

            <div className={'expeditionRewardList'}>
              <div className={'expeditionRewardHeader'}>Rewards Gained</div>
              {normalizeItemList(ceremony.rolled.items).map((item) => (
                <div key={item.itemId} className={'expeditionRewardRow'}>
                  <span>{itemsById[item.itemId]?.name ?? item.itemId}</span>
                  <span>×{item.qty}</span>
                </div>
              ))}
              {ceremony.rolled.currencies ? (
                <div className={'expeditionRewardCurrencies'}>
                  {Object.entries(ceremony.rolled.currencies).map(([key, value]) => (
                    <div key={key} className={'expeditionRewardRow'}>
                      <span>{key}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {ceremonyError && <div className={'expeditionCeremonyError'}>{ceremonyError}</div>}

            <div className={'expeditionCeremonyActions'}>
              <button className={'worldScreenModuleButton'} onClick={sendAgain}>
                Send Again
              </button>
              <div className={'expeditionCeremonyUse'}>
                <div className={'expeditionCeremonyUseLabel'}>Go use materials</div>
                <div className={'expeditionCeremonyUseButtons'}>
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
