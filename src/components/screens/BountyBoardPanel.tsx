import { useEffect, useMemo } from 'react';
import { useCityStore } from '../../stores/cityStore';
import { useContentStore } from '../../stores/contentStore';
import { useBountyStore } from '../../stores/bountyStore';
import type { RewardBundle } from '../../systems/rewards';

function formatRewards(bundle: RewardBundle): string {
  const parts: string[] = [];
  const currencies = bundle.currencies ?? {};
  if (currencies.gold) parts.push(`${currencies.gold} Gold`);
  if (currencies.merit) parts.push(`${currencies.merit} Merit`);
  if (currencies.spiritStones) parts.push(`${currencies.spiritStones} Spirit Stones`);
  return parts.length > 0 ? parts.join(' / ') : 'None';
}

export function BountyBoardPanel() {
  const currentCityId = useCityStore((state) => state.currentCityId);
  const cityMap = useContentStore((state) => state.maps.citiesById);
  const generateForCity = useBountyStore((state) => state.generateForCity);
  const refresh = useBountyStore((state) => state.refresh);
  const recordEvent = useBountyStore((state) => state.recordEvent);
  const claim = useBountyStore((state) => state.claim);
  const bounties = useBountyStore((state) =>
    currentCityId ? state.activeByCityId[currentCityId] ?? [] : [],
  );
  const lastRefreshAt = useBountyStore((state) =>
    currentCityId ? state.lastRefreshAtByCityId[currentCityId] : undefined,
  );

  const cityIndex = useMemo(() => {
    if (!currentCityId) return null;
    return cityMap[currentCityId]?.index ?? null;
  }, [cityMap, currentCityId]);

  useEffect(() => {
    if (!currentCityId || cityIndex == null) return;
    generateForCity(currentCityId, cityIndex);
  }, [cityIndex, currentCityId, generateForCity]);

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
            City index: {cityIndex} • Last refresh:{' '}
            {lastRefreshAt ? new Date(lastRefreshAt).toLocaleTimeString() : 'Never'}
          </div>
        </div>
        <button
          className={'worldScreenModuleButton'}
          onClick={() => refresh(currentCityId, cityIndex)}
        >
          Refresh Bounties
        </button>
      </div>

      <div className={'bountyBoardList'}>
        {bounties.map((bounty) => {
          const isComplete = bounty.progress >= bounty.target;
          return (
            <div key={bounty.instanceId} className={'bountyBoardCard'}>
              <div className={'bountyBoardCardHeader'}>
                <div>
                  <div className={'bountyBoardCardTitle'}>{bounty.title}</div>
                  <div className={'bountyBoardCardSubtitle'}>{bounty.difficulty.toUpperCase()}</div>
                </div>
                <div className={'bountyBoardCardMeta'}>
                  <div>Target: {bounty.target}</div>
                  <div>Status: {bounty.claimed ? 'Claimed' : isComplete ? 'Complete' : 'In progress'}</div>
                </div>
              </div>
              <div className={'bountyBoardCardBody'}>
                <div className={'bountyBoardCardLine'}>{bounty.description}</div>
                <div className={'bountyBoardCardLine'}>
                  Progress: {bounty.progress} / {bounty.target}
                </div>
                <div className={'bountyBoardCardLine'}>Rewards: {formatRewards(bounty.rewards)}</div>
              </div>
              <div className={'bountyBoardCardActions'}>
                <button
                  className={'worldScreenModuleButton'}
                  onClick={() => claim(currentCityId, bounty.instanceId)}
                  disabled={!isComplete || bounty.claimed}
                >
                  Claim
                </button>
              </div>
            </div>
          );
        })}
        {bounties.length === 0 && (
          <div className={'worldScreenPlaceholderBody'}>No bounties are available for this city.</div>
        )}
      </div>

      <div className={'bountyBoardDevTools'}>
        <div className={'bountyBoardDevTitle'}>Simulate progress</div>
        <div className={'bountyBoardDevButtons'}>
          <button
            className={'worldScreenModuleButton'}
            onClick={() => recordEvent({ type: 'OUTSKIRTS_KILL', cityId: currentCityId })}
          >
            Sim Outskirts Kill
          </button>
          <button
            className={'worldScreenModuleButton'}
            onClick={() => recordEvent({ type: 'OUTSKIRTS_BOSS_KILL', cityId: currentCityId })}
          >
            Sim Outskirts Boss
          </button>
          <button
            className={'worldScreenModuleButton'}
            onClick={() => recordEvent({ type: 'RUINS_ROOM_CLEAR', cityId: currentCityId })}
          >
            Sim Ruins Room
          </button>
          <button
            className={'worldScreenModuleButton'}
            onClick={() => recordEvent({ type: 'RUINS_RUN_CLEAR', cityId: currentCityId })}
          >
            Sim Ruins Run
          </button>
          <button
            className={'worldScreenModuleButton'}
            onClick={() => recordEvent({ type: 'TRIAL_CLEAR', cityId: currentCityId })}
          >
            Sim Trial Clear
          </button>
        </div>
      </div>
    </div>
  );
}
