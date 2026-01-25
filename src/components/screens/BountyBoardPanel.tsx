import { useEffect, useMemo, useState } from 'react';
import { useBountyStore } from '../../stores/bountyStore';
import { useCityStore } from '../../stores/cityStore';
import { useContentStore } from '../../stores/contentStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { bountyKindToLabel, bountyKindToProgressRule, resolveBountyDestination } from '../../utils/bountyRouting';
import { formatDurationHMS } from '../../utils/timeFormat';
import type { RewardBundle } from '../../services/rewards';
import './BountyBoardPanel.scss';
import { openWorldModule } from '../../systems/world/openWorldModule';
import { PaperCard, PaperChip, PaperStamp } from '../../ui/paper';
import { DetailScrollModal } from '../../ui/primitives/DetailScrollModal';

const difficultyBadge: Record<string, string> = {
  easy: 'D',
  medium: 'B',
  hard: 'S',
};

const moduleLabelMap: Record<string, string> = {
  outskirts: 'Outskirts',
  ruins: 'Ruins',
  gateTrial: 'Gate Trial',
  expeditions: 'Expeditions',
  alchemy: 'Alchemy',
  forge: 'Forge',
  talismanStudio: 'Talisman Studio',
  manualPavilion: 'Manual Pavilion',
};

const paperPositions = ['bountyPaperButton--left', 'bountyPaperButton--center', 'bountyPaperButton--right'] as const;

type PaperPositionClass = (typeof paperPositions)[number];

function formatRewards(bundle: RewardBundle): string[] {
  const entries: string[] = [];
  const currencies = bundle.currencies ?? {};
  if (currencies.gold) entries.push(`${currencies.gold} Gold`);
  if (currencies.merit) entries.push(`${currencies.merit} Merit`);
  if (currencies.spiritStones) entries.push(`${currencies.spiritStones} Spirit Stones`);
  return entries;
}

export function BountyBoardPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const cityMap = useContentStore((state) => state.maps.citiesById);

  const currentCityId = useCityStore((state) => state.currentCityId);

  const bounties = useBountyStore((state) => (currentCityId ? state.activeByCityId[currentCityId] ?? [] : []));
  const generateForCity = useBountyStore((state) => state.generateForCity);
  const refresh = useBountyStore((state) => state.refresh);
  const canRefresh = useBountyStore((state) => state.canRefresh);
  const nextRefreshAt = useBountyStore((state) => state.nextRefreshAt);
  const claim = useBountyStore((state) => state.claim);
  const trackedId = useBountyStore((state) => (currentCityId ? state.trackedByCityId[currentCityId] : null));
  const trackedBounty = useBountyStore((state) => (currentCityId ? state.getTrackedBounty(currentCityId) : null));
  const setTrackedBounty = useBountyStore((state) => state.setTrackedBounty);

  const merit = useInventoryStore((state) => state.merit);

  const city = currentCityId ? cityMap[currentCityId] : null;
  const cityIndex = city?.index ?? null;
  const cityModules = city?.modules ?? [];

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
      setSelectedId(bounties[0]?.instanceId ?? null);
    }
  }, [bounties, selectedId]);

  const selectedBounty = useMemo(
    () => bounties.find((entry) => entry.instanceId === selectedId) ?? bounties[0] ?? null,
    [bounties, selectedId],
  );

  const cityName = city?.name ?? 'Unknown City';

  const destination = useMemo(
    () =>
      selectedBounty
        ? resolveBountyDestination({
            cityId: selectedBounty.cityId,
            bountyKind: selectedBounty.kind,
            cityModules,
          })
        : null,
    [cityModules, selectedBounty],
  );

  const rewardEntries = useMemo(() => (selectedBounty ? formatRewards(selectedBounty.rewards) : []), [selectedBounty]);

  const handleGoToModule = (cityId: string, moduleKey: string) => {
    openWorldModule({ cityId, moduleKey, source: 'bounty-go-there' });
  };

  const handleTrackToggle = (bountyId: string) => {
    if (!currentCityId) return;
    const isTracked = trackedId === bountyId;
    setTrackedBounty(currentCityId, isTracked ? null : bountyId);
  };

  const handleOpenDetail = (bountyId: string) => {
    setSelectedId(bountyId);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
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

    if (destination.kind === 'moduleChoice') {
      return (
        <div className={'bountyActionRow bountyActionRow--choices'}>
          {destination.options.map((option) => (
            <button
              key={option.moduleKey}
              className={'worldScreenModuleButton'}
              onClick={() => handleGoToModule(destination.cityId, option.moduleKey)}
            >
              Go to {option.label}
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className={'bountyActionRow'}>
        <button
          className={'worldScreenModuleButton'}
          onClick={() => handleGoToModule(destination.cityId, destination.moduleKey)}
        >
          Go There
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
        onClick={() => claim(currentCityId, selectedBounty.instanceId)}
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
        <PaperCard variant="label" className="bountyStageHudGroup bountyStageHudGroup--refresh">
          <div className={'bountyStageLabel'}>Next refresh</div>
          <div className={'bountyStageValue'}>
            {canRefresh(currentCityId, now)
              ? 'Ready'
              : formatDurationHMS(Math.max(0, (nextRefreshAt(currentCityId) ?? 0) - now))}
          </div>
          <button
            className={'worldScreenModuleButton bountyStageRefreshButton'}
            onClick={() => refresh(currentCityId, cityIndex)}
            disabled={!canRefresh(currentCityId, now)}
          >
            Refresh
          </button>
        </PaperCard>
      </div>

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
          const bountyRewards = formatRewards(bounty.rewards).slice(0, 3);
          const isTracked = trackedId === bounty.instanceId;
          const isSelected = selectedId === bounty.instanceId;

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
                className="bountyPaperCard"
              >
                <div className={'bountyPaperHeader'}>
                  <div className={'bountyPaperTitle'}>{bounty.title}</div>
                  <PaperStamp text={difficultyLabel} size="sm" tone="ink" />
                </div>
                <div className={'bountyPaperObjective'}>{bounty.description}</div>
                <div className={'bountyPaperProgress'}>
                  Progress: {bounty.progress} / {bounty.target}
                </div>
                <div className={'bountyPaperRewards'}>
                  {bountyRewards.length > 0 ? (
                    bountyRewards.map((entry) => (
                      <PaperChip key={entry} variant="pill" text={entry} />
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

      {trackedBounty && (
        <button
          type="button"
          className={'bountyStageFooter'}
          onClick={() => handleOpenDetail(trackedBounty.instanceId)}
        >
          <PaperCard variant="label" interactive className="bountyStageFooterCard">
            Tracked: {trackedBounty.title}
          </PaperCard>
        </button>
      )}

      {selectedBounty && (
        <DetailScrollModal
          open={detailOpen}
          title={selectedBounty.title}
          subtitle={`${cityName} • ${bountyKindToLabel(selectedBounty.kind)}`}
          meta={<PaperStamp text={difficultyBadge[selectedBounty.difficulty]} size="sm" tone="ink" />}
          onClose={handleCloseDetail}
        >
          <div className={'bountyDetailCard'}>
            <div className={'bountyDetailSection'}>
              <div className={'bountyDetailLabel'}>Objective</div>
              <div className={'bountyDetailValue'}>{selectedBounty.description}</div>
              {destination && destination.kind !== 'unavailable' && (
                <div className={'bountyDetailHint'}>
                  Target:{' '}
                  {destination.kind === 'moduleChoice'
                    ? destination.options.map((opt) => opt.label).join(' / ')
                    : moduleLabelMap[destination.moduleKey] ?? destination.moduleKey}
                </div>
              )}
              {destination && destination.kind === 'unavailable' && (
                <div className={'bountyDetailHint bountyDetailHint--warning'}>{destination.reason}</div>
              )}
            </div>

            <div className={'bountyDetailSection'}>
              <div className={'bountyDetailLabel'}>Progress</div>
              {renderProgressBar(selectedBounty.progress, selectedBounty.target)}
              <div className={'bountyDetailRule'}>{bountyKindToProgressRule(selectedBounty.kind)}</div>
            </div>

            <div className={'bountyDetailSection'}>
              <div className={'bountyDetailLabel'}>Rewards</div>
              <div className={'bountyRewards'}>
                {rewardEntries.map((entry) => (
                  <PaperChip key={entry} variant="pill" text={entry} />
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
            </div>
          </div>
        </DetailScrollModal>
      )}
    </div>
  );
}

/*
Manual test checklist (P19.3):
- Queue an Alchemy job in City A, switch to City B, claim the job, and verify bounty progress increments in City A only.
- Complete an expedition in City A, claim rewards, and verify EXPEDITION_COMPLETE bounty progress in City A.
- Reload the page to ensure tracked bounty selection and crafting job cityId persist.
*/
