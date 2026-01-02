import { useEffect, useMemo, useState } from 'react';
import { useBountyStore } from '../../stores/bountyStore';
import { useCityStore } from '../../stores/cityStore';
import { useContentStore } from '../../stores/contentStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useTrialStore } from '../../stores/trialStore';
import { bountyKindToLabel, bountyKindToProgressRule, resolveBountyDestination } from '../../utils/bountyRouting';
import { formatDurationHMS } from '../../utils/timeFormat';
import type { RewardBundle } from '../../services/rewards';
import './BountyBoardPanel.scss';
import { openWorldModule } from '../../systems/world/openWorldModule';

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

function formatRewards(bundle: RewardBundle): string[] {
  const entries: string[] = [];
  const currencies = bundle.currencies ?? {};
  if (currencies.gold) entries.push(`${currencies.gold} Gold`);
  if (currencies.merit) entries.push(`${currencies.merit} Merit`);
  if (currencies.spiritStones) entries.push(`${currencies.spiritStones} Spirit Stones`);
  return entries;
}

function resolveModuleRef(city: any, moduleKey: string | null) {
  if (!city || !moduleKey || !city.refs) return null;
  const mapping: Record<string, string> = {
    outskirts: 'outskirtsId',
    ruins: 'ruinsId',
    expeditions: 'expeditionsId',
    gateTrial: 'gateTrialId',
    manualPavilion: 'pavilionId',
  };
  if (mapping[moduleKey] && city.refs[mapping[moduleKey]]) return city.refs[mapping[moduleKey]];
  if (city.refs[`${moduleKey}Id`]) return city.refs[`${moduleKey}Id`];
  if (city.refs[moduleKey]) return city.refs[moduleKey];
  return null;
}

export function BountyBoardPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const cityMap = useContentStore((state) => state.maps.citiesById);
  const cityRefs = useContentStore((state) => state.maps.trialsById);
  const economy = useContentStore((state) => state.raw?.economy);
  const gateTrialEconomy = (economy as any)?.manualSystem?.gateTrials;

  const currentCityId = useCityStore((state) => state.currentCityId);

  const bounties = useBountyStore((state) => (currentCityId ? state.activeByCityId[currentCityId] ?? [] : []));
  const generateForCity = useBountyStore((state) => state.generateForCity);
  const refresh = useBountyStore((state) => state.refresh);
  const canRefresh = useBountyStore((state) => state.canRefresh);
  const nextRefreshAt = useBountyStore((state) => state.nextRefreshAt);
  const claim = useBountyStore((state) => state.claim);
  const trackedId = useBountyStore((state) => (currentCityId ? state.trackedByCityId[currentCityId] : null));
  const setTrackedBounty = useBountyStore((state) => state.setTrackedBounty);

  const merit = useInventoryStore((state) => state.merit);
  const getItemCount = useInventoryStore((state) => state.getItemCount);

  const trialProgressById = useTrialStore((state) => state.progressByTrialId);

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
  const lastRefreshAt = useBountyStore((state) =>
    currentCityId ? state.lastRefreshAtByCityId[currentCityId] : undefined,
  );

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

  const manualModuleDestination = useMemo(() => {
    if (!currentCityId || !cityModules.includes('manualPavilion')) {
      return { available: false, reason: 'Manual Pavilion not available in this city' };
    }
    return { available: true, cityId: currentCityId, moduleKey: 'manualPavilion' as const };
  }, [cityModules, currentCityId]);

  const gateTrialSuggestion = useMemo(() => {
    if (!currentCityId || !cityModules.includes('gateTrial')) {
      return { available: false, reason: 'Gate Trial not available in this city' };
    }
    const trialId = resolveModuleRef(city, 'gateTrial');
    const trialDef = trialId ? cityRefs[trialId] : null;
    const attempts = trialId ? trialProgressById[trialId]?.attempts ?? 0 : 0;
    const threshold =
      trialDef?.failSafe?.thresholdAttempts ??
      gateTrialEconomy?.failSafe?.failThresholdEligibleAttempts ??
      3;
    const gateItemOwned = trialDef ? getItemCount(trialDef.gateItemId) > 0 : false;
    const eligible = Boolean(trialDef && attempts >= threshold && !gateItemOwned);
    return {
      available: true,
      cityId: currentCityId,
      moduleKey: 'gateTrial' as const,
      eligible,
      attempts,
      threshold,
    };
  }, [city, cityModules, cityRefs, currentCityId, gateTrialEconomy, getItemCount, trialProgressById]);

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

  return (
    <div className={'bountyBoardPanel'}>
      <div className={'bountyBoardHeader'}>
        <div>
          <div className={'bountyBoardTitle'}>Bounty Board</div>
          <div className={'bountyBoardSubtitle'}>
            {cityName} • Last refresh: {lastRefreshAt ? new Date(lastRefreshAt).toLocaleTimeString() : 'Never'}
          </div>
          <div className={'bountyBoardSubtitle'}>
            Next refresh: {canRefresh(currentCityId, now)
              ? 'Ready'
              : formatDurationHMS(Math.max(0, (nextRefreshAt(currentCityId) ?? 0) - now))}
          </div>
        </div>
        <button
          className={'worldScreenModuleButton'}
          onClick={() => refresh(currentCityId, cityIndex)}
          disabled={!canRefresh(currentCityId, now)}
        >
          Refresh Bounties
        </button>
      </div>

      <div className={'bountyMeritRow'}>
        <div className={'bountyWallet'}>
          <div className={'bountyWalletLabel'}>Merit</div>
          <div className={'bountyWalletValue'}>{merit}</div>
        </div>
        <div className={'bountySuggestions'}>
          <div className={'bountySuggestionCard'}>
            <div className={'bountySuggestionHeader'}>Manual Pavilion</div>
            <div className={'bountySuggestionBody'}>Spend Merit to acquire techniques.</div>
            <div className={'bountySuggestionActions'}>
              {manualModuleDestination.available ? (
                <button
                  className={'worldScreenModuleButton'}
                  onClick={() => handleGoToModule(manualModuleDestination.cityId!, manualModuleDestination.moduleKey)}
                >
                  Go There
                </button>
              ) : (
                <button className={'worldScreenModuleButton'} disabled>
                  {manualModuleDestination.reason}
                </button>
              )}
            </div>
          </div>
          <div className={'bountySuggestionCard'}>
            <div className={'bountySuggestionHeader'}>Gate Trial Fail-safe</div>
            <div className={'bountySuggestionBody'}>
              Fail-safe purchase costs Merit (after enough attempts).
              {gateTrialSuggestion.available && (
                <span className={'bountySuggestionBadge'}>
                  {gateTrialSuggestion.eligible ? 'Available now' : 'Not yet'}
                </span>
              )}
            </div>
            <div className={'bountySuggestionActions'}>
              {gateTrialSuggestion.available ? (
                <button
                  className={'worldScreenModuleButton'}
                  onClick={() => handleGoToModule(gateTrialSuggestion.cityId!, gateTrialSuggestion.moduleKey)}
                >
                  Go There
                </button>
              ) : (
                <button className={'worldScreenModuleButton'} disabled>
                  {gateTrialSuggestion.reason}
                </button>
              )}
            </div>
            {gateTrialSuggestion.available && (
              <div className={'bountySuggestionMeta'}>
                Attempts: {gateTrialSuggestion.attempts ?? 0} / {gateTrialSuggestion.threshold}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={'bountyBoardLayout'}>
        <div className={'bountyListColumn'}>
          <div className={'bountyListHeader'}>Active Bounties</div>
          <div className={'bountyCardList'}>
            {bounties.map((bounty) => {
              const isSelected = selectedBounty?.instanceId === bounty.instanceId;
              const isComplete = bounty.progress >= bounty.target;
              const difficultyLabel = difficultyBadge[bounty.difficulty] ?? bounty.difficulty;
              const isTracked = trackedId === bounty.instanceId;
              return (
                <div
                  key={bounty.instanceId}
                  className={`bountyCard ${isSelected ? 'bountyCard--selected' : ''} ${isComplete ? 'bountyCard--complete' : ''}`}
                  onClick={() => setSelectedId(bounty.instanceId)}
                >
                  <div className={'bountyCardHeader'}>
                    <div>
                      <div className={'bountyCardTitle'}>{bounty.title}</div>
                      <div className={'bountyCardSubtitle'}>
                        Difficulty: {difficultyLabel} • {bountyKindToLabel(bounty.kind)}
                      </div>
                    </div>
                    <div className={'bountyBadge'}>{difficultyLabel}</div>
                  </div>
                  <div className={'bountyCardBody'}>
                    <div className={'bountyCardDescription'}>{bounty.description}</div>
                    {renderProgressBar(bounty.progress, bounty.target)}
                    <div className={'bountyCardFooter'}>
                      <span className={'bountyStatus'}>
                        {bounty.claimed ? 'Claimed' : isComplete ? 'Completed' : 'In progress'}
                      </span>
                      <button
                        className={`bountyTrackButton ${isTracked ? 'bountyTrackButton--active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrackToggle(bounty.instanceId);
                        }}
                      >
                        {isTracked ? 'Tracked' : 'Track'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {bounties.length === 0 && (
              <div className={'worldScreenPlaceholderBody'}>No bounties are available for this city.</div>
            )}
          </div>
        </div>

        <div className={'bountyDetailColumn'}>
          {selectedBounty ? (
            <div className={'bountyDetailCard'}>
              <div className={'bountyDetailHeader'}>
                <div>
                  <div className={'bountyDetailTitle'}>{selectedBounty.title}</div>
                  <div className={'bountyDetailSubtitle'}>
                    {cityName} • {bountyKindToLabel(selectedBounty.kind)}
                  </div>
                </div>
                <div className={'bountyBadge'}>{difficultyBadge[selectedBounty.difficulty]}</div>
              </div>

              <div className={'bountyDetailSection'}>
                <div className={'bountyDetailLabel'}>Objective</div>
                <div className={'bountyDetailValue'}>{selectedBounty.description}</div>
                {destination && destination.kind !== 'unavailable' && (
                  <div className={'bountyDetailHint'}>
                    Target: {destination.kind === 'moduleChoice'
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
                    <div key={entry} className={'bountyRewardChip'}>
                      {entry}
                    </div>
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
                    className={`worldScreenModuleButton ${trackedId === selectedBounty.instanceId ? 'worldScreenModuleButton--primary' : ''}`}
                    onClick={() => handleTrackToggle(selectedBounty.instanceId)}
                  >
                    {trackedId === selectedBounty.instanceId ? 'Tracked' : 'Track'}
                  </button>
                  {renderClaimButton()}
                </div>
              </div>
            </div>
          ) : (
            <div className={'worldScreenPlaceholderBody'}>Select a bounty to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/*
Manual test checklist (P19.3):
- Queue an Alchemy job in City A, switch to City B, claim the job, and verify bounty progress increments in City A only.
- Complete an expedition in City A, claim rewards, and verify EXPEDITION_COMPLETE bounty progress in City A.
- Reload the page to ensure tracked bounty selection and crafting job cityId persist.
*/
