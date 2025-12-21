import { useEffect, useMemo, useState } from 'react';
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

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function formatDifficultyLabel(difficulty: string): string {
  if (difficulty === 'easy') return 'Easy';
  if (difficulty === 'medium') return 'Medium';
  if (difficulty === 'hard') return 'Hard';
  return difficulty;
}

export function BountyBoardPanel() {
  const currentCityId = useCityStore((state) => state.currentCityId);
  const cityMap = useContentStore((state) => state.maps.citiesById);
  const generateForCity = useBountyStore((state) => state.generateForCity);
  const refresh = useBountyStore((state) => state.refresh);
  const canRefresh = useBountyStore((state) => state.canRefresh);
  const nextRefreshAt = useBountyStore((state) => state.nextRefreshAt);
  const claim = useBountyStore((state) => state.claim);
  const bounties = useBountyStore((state) =>
    currentCityId ? state.activeByCityId[currentCityId] ?? [] : [],
  );
  const lastRefreshAt = useBountyStore((state) =>
    currentCityId ? state.lastRefreshAtByCityId[currentCityId] : undefined,
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

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
          <div className={'bountyBoardSubtitle'}>
            Next refresh:{' '}
            {canRefresh(currentCityId, now)
              ? 'Ready'
              : formatDuration(Math.max(0, (nextRefreshAt(currentCityId) ?? 0) - now))}
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

      <div className={'bountyBoardList'}>
        {bounties.map((bounty) => {
          const isComplete = bounty.progress >= bounty.target;
          const isReadyToClaim = isComplete && !bounty.claimed;
          const difficultyLabel = formatDifficultyLabel(bounty.difficulty);
          return (
            <div
              key={bounty.instanceId}
              className={`bountyBoardCard ${isReadyToClaim ? 'bountyBoardCard--ready' : ''}`}
            >
              <div className={'bountyBoardCardHeader'}>
                <div>
                  <div className={'bountyBoardCardTitle'}>{bounty.title}</div>
                  <div className={'bountyBoardCardSubtitle'}>{difficultyLabel}</div>
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
                {isReadyToClaim && <div className={'bountyBoardCardReady'}>Ready to claim!</div>}
              </div>
              <div className={'bountyBoardCardActions'}>
                <button
                  className={'worldScreenModuleButton'}
                  onClick={() => claim(currentCityId, bounty.instanceId)}
                  disabled={!isComplete || bounty.claimed}
                >
                  {bounty.claimed ? 'Claimed' : 'Claim'}
                </button>
              </div>
            </div>
          );
        })}
        {bounties.length === 0 && (
          <div className={'worldScreenPlaceholderBody'}>No bounties are available for this city.</div>
        )}
      </div>

      {/* Dev buttons removed once real hooks are wired. */}
    </div>
  );
}
