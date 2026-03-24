import { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useBountyStore } from '../../stores/bountyStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import {
  bountyKindToLabel,
  bountyKindToProgressRule,
  getBountyDestinationCtaLabel,
  resolveBountyDestination,
} from '../../utils/bountyRouting.js';
import { formatDurationHMS } from '../../utils/timeFormat.js';
import type { RewardBundle } from '../../services/rewards/index.js';
import './BountyBoardPanel.scss';
import { openWorldModule } from '../../systems/world/openWorldModule.js';
import { PaperCard, PaperChip, PaperStamp } from '../../ui/paper/index.js';
import { DetailScrollModal } from '../../ui/primitives/DetailScrollModal.js';
import { normalizeItemList } from '../../utils/itemList.js';
import type { BountyInstance } from '../../stores/bountyStore.js';
import { buildSupportEconomySurfaceModel } from '../../systems/economy/supportEconomySurfaceModel.js';
import { buildLiveCraftBountyRouteSupportState } from '../../systems/bounties/liveCraftBountyRouteSupport.js';
import { getWorldModuleLabel, sanitizeLiveCityName } from '../../ui/text/playerFacingLabels.js';
import { WorldRouteChip } from '../../ui/world/WorldRouteChip.js';
import '../../ui/world/WorldModuleCard.scss';

const difficultyBadge: Record<string, string> = {
  easy: 'D',
  medium: 'B',
  hard: 'S',
};


const paperPositions = ['bountyPaperButton--left', 'bountyPaperButton--center', 'bountyPaperButton--right'] as const;
const EMPTY_BOUNTIES: readonly BountyInstance[] = Object.freeze([]);
const EMPTY_CITY_MODULES: readonly string[] = Object.freeze([]);

type PaperPositionClass = (typeof paperPositions)[number];

type RewardChip = {
  id: string;
  text: string;
  tone?: 'neutral' | 'ink' | 'success' | 'danger' | 'merit' | 'rare';
};

function formatRewards(bundle: RewardBundle, itemsById: Record<string, { name?: string }>): RewardChip[] {
  const entries: RewardChip[] = [];
  const currencies = bundle.currencies ?? {};
  if (currencies.gold) entries.push({ id: 'gold', text: `${currencies.gold} Gold` });
  if (currencies.merit) entries.push({ id: 'merit', text: `${currencies.merit} Merit`, tone: 'merit' });
  if (currencies.spiritStones) entries.push({ id: 'spiritStones', text: `${currencies.spiritStones} Spirit Stones` });
  const items = normalizeItemList(bundle.items);
  items.forEach((item) => {
    const name = itemsById[item.itemId]?.name ?? item.itemId;
    entries.push({ id: item.itemId, text: `${name} ×${item.qty}` });
  });
  return entries;
}

export function BountyBoardPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pinPulseId, setPinPulseId] = useState<string | null>(null);
  const [claimAnimId, setClaimAnimId] = useState<string | null>(null);
  const [progressPulseIds, setProgressPulseIds] = useState<Record<string, boolean>>({});
  const previousProgressRef = useRef<Record<string, number>>({});
  const cityMap = useContentStore((state) => state.maps.citiesById);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const content = useContentStore((state) => state.raw);

  const currentCityId = useCityStore((state) => state.currentCityId);

  const activeByCityId = useBountyStore((state) => state.activeByCityId);
  const generateForCity = useBountyStore((state) => state.generateForCity);
  const refresh = useBountyStore((state) => state.refresh);
  const canRefresh = useBountyStore((state) => state.canRefresh);
  const nextRefreshAt = useBountyStore((state) => state.nextRefreshAt);
  const claim = useBountyStore((state) => state.claim);
  const trackedByCityId = useBountyStore((state) => state.trackedByCityId);
  const setTrackedBounty = useBountyStore((state) => state.setTrackedBounty);

  const merit = useInventoryStore((state) => state.merit);
  const spiritStones = useInventoryStore((state) => state.spiritStones);

  const city = currentCityId ? cityMap[currentCityId] : null;
  const cityIndex = city?.index ?? null;
  const cityModules = city?.modules ?? EMPTY_CITY_MODULES;
  const bounties = useMemo(
    () => (currentCityId ? activeByCityId[currentCityId] ?? EMPTY_BOUNTIES : EMPTY_BOUNTIES),
    [activeByCityId, currentCityId],
  );
  const trackedId = currentCityId ? trackedByCityId[currentCityId] ?? null : null;
  const trackedBounty = useMemo(
    () => (trackedId ? bounties.find((entry) => entry.instanceId === trackedId) ?? null : null),
    [bounties, trackedId],
  );

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

  useEffect(() => {
    if (!currentCityId || cityIndex == null) return;
    generateForCity(currentCityId, cityIndex);
  }, [cityIndex, currentCityId, generateForCity]);

  useEffect(() => {
    if (!selectedId && bounties.length > 0) {
      setSelectedId(bounties[0].instanceId);
      return;
    }
    if (selectedId && !bounties.find((entry) => entry.instanceId === selectedId)) {
      if (detailOpen) {
        setDetailOpen(false);
        setSelectedId(null);
        setClaimError(null);
      } else {
        setSelectedId(bounties[0]?.instanceId ?? null);
      }
    }
  }, [bounties, detailOpen, selectedId]);

  useEffect(() => {
    if (bounties.length === 0) return;
    setProgressPulseIds((current) => {
      const next = { ...current };
      bounties.forEach((entry) => {
        const previous = previousProgressRef.current[entry.instanceId] ?? entry.progress;
        if (entry.progress > previous) {
          next[entry.instanceId] = true;
          window.setTimeout(() => {
            setProgressPulseIds((inner) => {
              const updated = { ...inner };
              delete updated[entry.instanceId];
              return updated;
            });
          }, 450);
        }
        previousProgressRef.current[entry.instanceId] = entry.progress;
      });
      return next;
    });
  }, [bounties]);

  const selectedBounty = useMemo(
    () => bounties.find((entry) => entry.instanceId === selectedId) ?? bounties[0] ?? null,
    [bounties, selectedId],
  );

  const cityName = sanitizeLiveCityName(city?.name ?? 'Unknown City');
  const craftRouteSupportState = useMemo(
    () => (currentCityId ? buildLiveCraftBountyRouteSupportState(currentCityId) : undefined),
    [currentCityId, content, merit, spiritStones],
  );
  const supportSurface = useMemo(
    () =>
      buildSupportEconomySurfaceModel({
        content,
        cityId: currentCityId,
        currencies: {
          merit,
          spiritStones,
        },
      }),
    [content, currentCityId, merit, spiritStones],
  );

  const destination = useMemo(
    () =>
      selectedBounty
        ? resolveBountyDestination({
            cityId: selectedBounty.cityId,
            bountyKind: selectedBounty.kind,
            cityModules,
            craftRouteSupportState,
          })
        : null,
    [cityModules, craftRouteSupportState, selectedBounty],
  );

  const rewardEntries = useMemo(
    () => (selectedBounty ? formatRewards(selectedBounty.rewards, itemsById) : []),
    [itemsById, selectedBounty],
  );
  const refreshRemaining = Math.max(0, (nextRefreshAt(currentCityId) ?? 0) - now);
  const refreshReady = canRefresh(currentCityId, now);
  const refreshSoon = !refreshReady && refreshRemaining > 0 && refreshRemaining <= 60000;

  const claimReady = useMemo(
    () => bounties.filter((entry) => entry.progress >= entry.target && !entry.claimed),
    [bounties],
  );
  const primaryBounty = trackedBounty ?? claimReady[0] ?? null;
  const readyCount = claimReady.length;
  const primaryDestination = useMemo(() => {
    if (!primaryBounty) return null;
    return resolveBountyDestination({
      cityId: primaryBounty.cityId,
      bountyKind: primaryBounty.kind,
      cityModules,
      craftRouteSupportState,
    });
  }, [cityModules, craftRouteSupportState, primaryBounty]);
  const primaryActionLabel = getBountyDestinationCtaLabel(primaryDestination);

  const handleGoToModule = (cityId: string, moduleKey: string) => {
    openWorldModule({ cityId, moduleKey, source: 'bounty-go-there' });
  };

  const handlePrimaryAction = () => {
    if (!primaryBounty || !primaryDestination) return;
    if (primaryDestination.kind !== 'module') {
      openWorldModule({ cityId: primaryBounty.cityId, moduleKey: 'bounties', source: 'bounty-primary-fallback' });
      return;
    }
    handleGoToModule(primaryDestination.cityId, primaryDestination.moduleKey);
  };

  const handleTrackToggle = (bountyId: string) => {
    if (!currentCityId) return;
    const isTracked = trackedId === bountyId;
    setTrackedBounty(currentCityId, isTracked ? null : bountyId);
    if (!isTracked) {
      setPinPulseId(bountyId);
      window.setTimeout(() => setPinPulseId(null), 450);
    }
  };

  const handleOpenDetail = (bountyId: string) => {
    setSelectedId(bountyId);
    setDetailOpen(true);
    setClaimError(null);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedId(null);
    setClaimError(null);
  };

  const handleClaim = (bountyId: string) => {
    if (!currentCityId) return;
    const success = claim(currentCityId, bountyId);
    if (!success) {
      setClaimError('Unable to claim this bounty yet.');
    } else {
      setClaimError(null);
      setClaimAnimId(bountyId);
      window.setTimeout(() => setClaimAnimId(null), 900);
    }
  };

  const renderProgressBar = (progress: number, target: number) => {
    const percent = target > 0 ? Math.min(100, Math.floor((progress / target) * 100)) : 0;
    return (
      <div className={'bountyProgress'}>
        <div className={'bountyProgressBar'} style={{ width: `${percent}%` }} />
        <div className={'bountyProgressText'}>
          {progress} / {target}
        </div>
      </div>
    );
  };

  const renderDestinationActions = () => {
    if (!selectedBounty || !destination) return null;
    if (destination.kind === 'unavailable') {
      return (
        <div className={'bountyActionRow'}>
          <button className={'worldScreenModuleButton'} disabled>
            {destination.reason}
          </button>
        </div>
      );
    }

    return (
      <div className={'bountyActionRow'}>
        <button
          className={'worldScreenModuleButton'}
          onClick={() => handleGoToModule(destination.cityId, destination.moduleKey)}
        >
          {getBountyDestinationCtaLabel(destination)}
        </button>
      </div>
    );
  };

  const renderClaimButton = () => {
    if (!currentCityId || !selectedBounty) return null;
    const isComplete = selectedBounty.progress >= selectedBounty.target;
    if (!isComplete) return null;

    return (
      <button
        className={'worldScreenModuleButton worldScreenModuleButton--primary'}
        onClick={() => handleClaim(selectedBounty.instanceId)}
        disabled={selectedBounty.claimed}
      >
        {selectedBounty.claimed ? 'Claimed' : 'Claim Reward'}
      </button>
    );
  };

  if (!currentCityId || cityIndex == null) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No city selected</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Select a city to view its bounty board.</div>
      </div>
    );
  }

  const paperSlots = Array.from({ length: 3 }, (_, index) => ({
    bounty: bounties[index] ?? null,
    positionClass: paperPositions[index] as PaperPositionClass,
  }));

  return (
    <div className={'bountyStageRoot'}>
      <div className={'bountyStageHud'}>
        <PaperCard variant="label" className="bountyStageHudGroup">
          <div className={'bountyStageTitle'}>Bounty Board</div>
          <div className={'bountyStageSub'}>{cityName}</div>
        </PaperCard>
        <PaperCard variant="label" className="bountyStageHudGroup bountyStageHudGroup--merit">
          <div className={'bountyStageLabel'}>Merit</div>
          <div className={'bountyStageValue'}>{merit}</div>
        </PaperCard>
        <PaperCard
          variant="label"
          className={classNames('bountyStageHudGroup bountyStageHudGroup--refresh', {
            'bountyStageHudGroup--ready': refreshReady,
            'bountyStageHudGroup--soon': refreshSoon,
          })}
        >
          <div className={'bountyStageLabel'}>Next refresh</div>
          <div className={'bountyStageValue'}>
            {refreshReady ? 'Ready' : formatDurationHMS(refreshRemaining)}
          </div>
          <button
            className={classNames('worldScreenModuleButton bountyStageRefreshButton', {
              'bountyStageRefreshButton--ready': refreshReady,
            })}
            onClick={() => refresh(currentCityId, cityIndex)}
            disabled={!refreshReady}
          >
            Refresh
          </button>
        </PaperCard>
      </div>

      <PaperCard
        variant="card"
        className={classNames('bountySupportSummaryCard', {
          'bountySupportSummaryCard--warning': supportSurface.reserveTone === 'warning',
          'bountySupportSummaryCard--ready': supportSurface.reserveTone === 'ready',
        })}
      >
        <div className="bountySupportSummaryCard__header">
          <div>
            <div className="bountySupportSummaryCard__title">Safety Net reserve</div>
            <div className="bountySupportSummaryCard__subtitle">{supportSurface.reserveHeadline}</div>
          </div>
          <PaperStamp
            text={
              supportSurface.readModel.meritReserveStatus === 'at_ideal'
                ? 'At target'
                : supportSurface.readModel.meritReserveStatus === 'between_minimum_and_ideal'
                  ? 'Above minimum'
                  : 'Below target'
            }
            size="sm"
            tone={supportSurface.reserveTone === 'warning' ? 'danger' : supportSurface.reserveTone === 'ready' ? 'success' : 'ink'}
          />
        </div>
        <div className="bountySupportSummaryCard__chips">
          <PaperChip
            variant="pill"
            tone="merit"
            text={`Merit ${supportSurface.readModel.currentMerit} / ${supportSurface.readModel.targetMeritReserve} target`}
          />
          <PaperChip
            variant="pill"
            tone="neutral"
            text={`Spirit Stones ${supportSurface.readModel.currentSpiritStones} / ${supportSurface.readModel.spiritStoneMinimumReserve} minimum`}
          />
          <PaperChip
            variant="pill"
            tone={supportSurface.readModel.meritReserveGap === '0' ? 'success' : 'neutral'}
            text={
              supportSurface.readModel.meritReserveGap === '0'
                ? 'Reserve gap closed'
                : `${supportSurface.readModel.meritReserveGap} Merit to target`
            }
          />
        </div>
        <div className="bountySupportSummaryCard__summary">
          Merit supports Safety Net gate access. Keep this reserve healthy.
        </div>
      </PaperCard>

      <div className={'bountyStageArea'}>
        {paperSlots.map(({ bounty, positionClass }) => {
          if (!bounty) {
            return (
              <button
                key={`empty-${positionClass}`}
                className={`bountyPaperButton ${positionClass} bountyPaperButton--empty`}
                type="button"
                disabled
                aria-label="No bounty posted"
              >
                <PaperCard variant="card" className="bountyPaperCard" disabled>
                  <div className={'bountyPaperEmptyTitle'}>No bounty posted</div>
                  <div className={'bountyPaperEmptyBody'}>Check back after the next refresh.</div>
                </PaperCard>
              </button>
            );
          }

          const difficultyLabel = difficultyBadge[bounty.difficulty] ?? bounty.difficulty;
          const bountyRewards = formatRewards(bounty.rewards, itemsById).slice(0, 3);
          const isTracked = trackedId === bounty.instanceId;
          const isSelected = selectedId === bounty.instanceId;
          const isClaimed = bounty.claimed;
          const isComplete = bounty.progress >= bounty.target && !isClaimed;
          const canClaim = isComplete && !isClaimed;
          const bountyDestination = resolveBountyDestination({
            cityId: bounty.cityId,
            bountyKind: bounty.kind,
            cityModules,
            craftRouteSupportState,
          });
          const canGoThere = bountyDestination.kind !== 'unavailable';
          const isPinPulse = pinPulseId === bounty.instanceId;
          const isClaimAnimating = claimAnimId === bounty.instanceId;
          const isProgressPulse = Boolean(progressPulseIds[bounty.instanceId]);

          return (
            <button
              key={bounty.instanceId}
              className={`bountyPaperButton ${positionClass}`}
              type="button"
              onClick={() => handleOpenDetail(bounty.instanceId)}
              aria-pressed={isSelected}
              aria-label={`Open bounty details: ${bounty.title}`}
            >
              <PaperCard
                variant="card"
                interactive
                selected={isSelected}
                complete={isComplete}
                claimed={isClaimed}
                className={classNames('bountyPaperCard', {
                  isTracked,
                  isComplete,
                  isClaimed,
                  isSelected,
                  isClaimAnimating,
                  isProgressPulse,
                  isPinPulse,
                  canClaim,
                  canGoThere,
                })}
              >
                <span
                  className={classNames('bountyPaperPin', {
                    'bountyPaperPin--visible': isTracked,
                    'bountyPaperPin--pulse': isPinPulse,
                  })}
                  aria-hidden="true"
                />
                <div className={'bountyPaperHeader'}>
                  <div className={'bountyPaperTitle'}>{bounty.title}</div>
                  <PaperStamp text={difficultyLabel} size="sm" tone="ink" className="paperStamp--difficulty" />
                </div>
                {isComplete && (
                  <PaperStamp text="Ready" size="sm" tone="seal" className="bountyPaperReadyStamp paperStamp--ready" />
                )}
                {isClaimed && (
                  <PaperStamp text="Claimed" size="sm" tone="seal" className="bountyPaperClaimedStamp paperStamp--claimed" />
                )}
                {isClaimAnimating && (
                  <span className="bountyPaperClaimBurst" aria-hidden="true">
                    Claimed
                  </span>
                )}
                <div className={'bountyPaperObjective'}>{bounty.description}</div>
                <div className={classNames('bountyPaperProgress', { 'bountyPaperProgress--pulse': isProgressPulse })}>
                  Progress: {bounty.progress} / {bounty.target}
                </div>
                <div className={'bountyPaperRewards'}>
                  {bountyRewards.length > 0 ? (
                    bountyRewards.map((entry) => (
                      <PaperChip key={entry.id} variant="pill" text={entry.text} tone={entry.tone ?? 'neutral'} />
                    ))
                  ) : (
                    <PaperChip variant="pill" text="No rewards" tone="neutral" />
                  )}
                </div>
                {isTracked && <div className={'bountyPaperTracked'}>Tracked</div>}
              </PaperCard>
            </button>
          );
        })}
      </div>

      <div className={'bountyQueueStrip'}>
        <div className={'bqsPrimary'}>
          {primaryBounty ? (
            <>
              <div className={'bqsTitleRow'}>
                <span className={'bqsLabel'}>
                  {trackedBounty ? 'Tracked' : readyCount > 0 ? `Ready (${readyCount})` : 'In Progress'}
                </span>
                {trackedBounty ? (
                  <PaperStamp text="Tracked" size="sm" tone="ink" />
                ) : primaryBounty.progress >= primaryBounty.target && !primaryBounty.claimed ? (
                  <PaperStamp text="Ready" size="sm" tone="seal" className="paperStamp--ready" />
                ) : (
                  <PaperStamp text="Active" size="sm" tone="ink" />
                )}
              </div>
              <div className={'bqsHeadline'}>
                <span className={'bqsTitle'}>{primaryBounty.title}</span>
                <PaperStamp
                  text={difficultyBadge[primaryBounty.difficulty] ?? primaryBounty.difficulty}
                  size="sm"
                  tone="ink"
                  className="paperStamp--difficulty"
                />
              </div>
              <div className={'bqsProgress'}>
                Progress {primaryBounty.progress} / {primaryBounty.target}
              </div>
              <div className={'bqsChips'}>
                {primaryBounty.progress >= primaryBounty.target && !primaryBounty.claimed ? (
                  <WorldRouteChip kind="claim_ready" tone="strong" />
                ) : null}
                {primaryDestination?.kind === 'module' ? (
                  <WorldRouteChip kind="useful_soon" tone="support" />
                ) : null}
              </div>
              <div className={'bqsRewards'}>
                {formatRewards(primaryBounty.rewards, itemsById)
                  .slice(0, 3)
                  .map((entry) => (
                    <PaperChip key={entry.id} variant="pill" text={entry.text} tone={entry.tone ?? 'neutral'} />
                  ))}
              </div>
            </>
          ) : (
            <div className={'bqsEmpty'}>Select a bounty and Track it to pin progress here.</div>
          )}
        </div>

        <div className={'bqsActions'}>
          <button
            className={'worldScreenModuleButton'}
            type="button"
            onClick={() => primaryBounty && handleOpenDetail(primaryBounty.instanceId)}
            disabled={!primaryBounty}
          >
            View
          </button>
          <button
            className={'worldScreenModuleButton'}
            type="button"
            onClick={handlePrimaryAction}
            disabled={
              !primaryBounty ||
              !primaryDestination ||
              primaryDestination.kind === 'unavailable'
            }
            aria-label={
              primaryDestination && primaryDestination.kind === 'unavailable'
                ? primaryDestination.reason
                : undefined
            }
            title={
              primaryDestination && primaryDestination.kind === 'unavailable' ? primaryDestination.reason : undefined
            }
          >
            {primaryActionLabel}
          </button>
          <button
            className={`worldScreenModuleButton ${
              primaryBounty && trackedId === primaryBounty.instanceId ? 'worldScreenModuleButton--primary' : ''
            }`}
            type="button"
            onClick={() =>
              primaryBounty && handleTrackToggle(primaryBounty.instanceId)
            }
            disabled={!primaryBounty}
          >
            {primaryBounty && trackedId === primaryBounty.instanceId ? 'Untrack' : 'Track'}
          </button>
          <button
            className={'worldScreenModuleButton worldScreenModuleButton--primary'}
            type="button"
            onClick={() => primaryBounty && handleClaim(primaryBounty.instanceId)}
            disabled={!primaryBounty || primaryBounty.progress < primaryBounty.target || primaryBounty.claimed}
          >
            {primaryBounty?.claimed ? 'Claimed' : 'Claim'}
          </button>
        </div>

        <div className={'bqsMeta'}>
          <span>Ready: {readyCount}</span>
          <span>Active: {bounties.length}</span>
          <span>Merit: {merit}</span>
          <span>
            {canRefresh(currentCityId, now)
              ? 'Refresh ready'
              : `Refresh in ${formatDurationHMS(Math.max(0, (nextRefreshAt(currentCityId) ?? 0) - now))}`}
          </span>
        </div>
        {claimError && <div className={'bqsError'}>{claimError}</div>}
      </div>

      {selectedBounty && (
        <DetailScrollModal
          open={detailOpen}
          title={selectedBounty.title}
          subtitle={`${cityName} • ${bountyKindToLabel(selectedBounty.kind)}`}
          meta={
            <div className="bountyDetailMeta">
              <PaperStamp
                text={difficultyBadge[selectedBounty.difficulty]}
                size="sm"
                tone="ink"
                className="paperStamp--difficulty"
              />
              {selectedBounty.claimed ? (
                <PaperStamp text="Claimed" size="sm" tone="seal" className="paperStamp--claimed" />
              ) : selectedBounty.progress >= selectedBounty.target ? (
                <PaperStamp text="Complete" size="sm" tone="seal" className="paperStamp--complete" />
              ) : trackedId === selectedBounty.instanceId ? (
                <PaperStamp text="Tracked" size="sm" tone="ink" />
              ) : null}
            </div>
          }
          onClose={handleCloseDetail}
        >
          <div className={'bountyDetailCard'}>
            <div className={'bountyDetailSection'}>
              <div className={'bountyDetailLabel'}>Objective</div>
              <div className={'bountyDetailValue'}>{selectedBounty.description}</div>
              <div className={'bountyDetailValue'}>
                Progress: {selectedBounty.progress} / {selectedBounty.target}
              </div>
              {destination && destination.kind === 'module' && (
                <div className={'bountyDetailHint'}>
                  Target: {getWorldModuleLabel(destination.moduleKey)}
                </div>
              )}
              {destination && destination.kind === 'unavailable' && (
                <div className={'bountyDetailHint bountyDetailHint--warning'}>{destination.reason}</div>
              )}
            </div>

            <div className={'bountyDetailSection'}>
              <div className={'bountyDetailLabel'}>Progress</div>
              {renderProgressBar(selectedBounty.progress, selectedBounty.target)}
              <ul className={'bountyDetailRules'}>
                {bountyKindToProgressRule(selectedBounty.kind)
                  .split('\n')
                  .filter(Boolean)
                  .map((rule) => (
                    <li key={rule} className={'bountyDetailRule'}>
                      {rule}
                    </li>
                  ))}
              </ul>
            </div>

            <div className={'bountyDetailSection'}>
              <div className={'bountyDetailLabel'}>Rewards</div>
              <div className={'bountyRewards'}>
                {rewardEntries.map((entry) => (
                  <PaperChip key={entry.id} variant="pill" text={entry.text} tone={entry.tone ?? 'neutral'} />
                ))}
                {rewardEntries.length === 0 && (
                  <div className={'bountyDetailValue'}>No rewards</div>
                )}
              </div>
            </div>

            <div className={'bountyDetailSection bountyDetailActions'}>
              {renderDestinationActions()}
              <div className={'bountyActionRow'}>
                <button
                  className={`worldScreenModuleButton ${
                    trackedId === selectedBounty.instanceId ? 'worldScreenModuleButton--primary' : ''
                  }`}
                  onClick={() => handleTrackToggle(selectedBounty.instanceId)}
                >
                  {trackedId === selectedBounty.instanceId ? 'Tracked' : 'Track'}
                </button>
                {renderClaimButton()}
              </div>
              {!selectedBounty.claimed && selectedBounty.progress < selectedBounty.target && (
                <div className={'bountyDetailHint'}>Complete the objective to claim.</div>
              )}
              {claimError && <div className={'bountyDetailHint bountyDetailHint--warning'}>{claimError}</div>}
            </div>
          </div>
        </DetailScrollModal>
      )}
    </div>
  );
}

/*
Manual test checklist (P19.3):
- Queue a Forge job in City A, switch to City B, claim the job, and verify bounty progress increments in City A only.
- Complete an expedition in City A, claim rewards, and verify EXPEDITION_COMPLETE bounty progress in City A.
- Reload the page to ensure tracked bounty selection and crafting job cityId persist.
*/
