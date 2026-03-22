import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { useUIStore } from '../stores/uiStore.js';
import { useCityStore } from '../stores/cityStore.js';
import { useBountyStore } from '../stores/bountyStore.js';
import { useContentStore } from '../stores/contentStore.js';
import { openWorldModule } from '../systems/world/openWorldModule.js';
import { buildLiveCraftBountyRouteSupportState } from '../systems/bounties/liveCraftBountyRouteSupport.js';
import { isAllowedLiveWorldSurfaceModule } from '../systems/world/liveWorldLeakAudit.js';
import { resolveBountyDestination } from '../utils/bountyRouting.js';
import { formatNumber } from '../utils/numbers.js';
import { SaveService } from '../services/save/SaveService.js';
import './Header.scss';

const EMPTY_CITY_MODULES: readonly string[] = Object.freeze([]);

/**
 * Header component - Top bar with game stats and save indicator
 */
export function Header() {
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const realm = useGameStore((state) => state.realm);
  const headerTitle = useUIStore((state) => state.headerTitle);
  const headerSubtitle = useUIStore((state) => state.headerSubtitle);
  const headerTone = useUIStore((state) => state.headerTone);

  const currentCityId = useCityStore((state) => state.currentCityId);
  const trackedByCityId = useBountyStore((state) => state.trackedByCityId);
  const activeByCityId = useBountyStore((state) => state.activeByCityId);
  const citiesById = useContentStore((state) => state.maps.citiesById);

  const trackedId = currentCityId ? trackedByCityId[currentCityId] ?? null : null;
  const trackedBounty = useMemo(() => {
    if (!currentCityId || !trackedId) return null;
    const activeBounties = activeByCityId[currentCityId];
    if (!activeBounties) return null;
    return activeBounties.find((entry) => entry.instanceId === trackedId) ?? null;
  }, [activeByCityId, currentCityId, trackedId]);
  const currentCityModules = useMemo(
    () => (currentCityId ? citiesById[currentCityId]?.modules ?? EMPTY_CITY_MODULES : EMPTY_CITY_MODULES),
    [citiesById, currentCityId],
  );

  const [lastSavedText, setLastSavedText] = useState<string>('Never');
  const [lastSavedTone, setLastSavedTone] = useState<'neutral' | 'fresh' | 'warn' | 'old'>('neutral');

  const handleTrackedClick = () => {
    if (!trackedBounty || !currentCityId) return;
    const destination = resolveBountyDestination({
      cityId: currentCityId,
      bountyKind: trackedBounty.kind,
      cityModules: currentCityModules,
      craftRouteSupportState: buildLiveCraftBountyRouteSupportState(currentCityId),
    });

    const targetModule =
      destination.kind === 'module' && isAllowedLiveWorldSurfaceModule(destination.moduleKey)
        ? destination.moduleKey
        : 'bounties';

    openWorldModule({ cityId: currentCityId, moduleKey: targetModule, source: 'header-tracked-bounty' });
  };

  useEffect(() => {
    const updateLastSaved = () => {
      const saveInfo = SaveService.getSaveInfo();

      if (!saveInfo) {
        setLastSavedText('Never');
        setLastSavedTone('neutral');
        return;
      }

      const now = Date.now();
      const diff = now - saveInfo.timestamp;
      const secondsAgo = Math.floor(diff / 1000);

      if (secondsAgo < 60) {
        setLastSavedText(`${secondsAgo}s ago`);
        setLastSavedTone('fresh');
      } else if (secondsAgo < 3600) {
        const minutesAgo = Math.floor(secondsAgo / 60);
        setLastSavedText(`${minutesAgo}m ago`);
        setLastSavedTone('warn');
      } else {
        const hoursAgo = Math.floor(secondsAgo / 3600);
        setLastSavedText(`${hoursAgo}h ago`);
        setLastSavedTone('old');
      }
    };

    updateLastSaved();
    const interval = setInterval(updateLastSaved, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className={`header ${headerTone === 'light' ? 'header--lightTitles' : ''}`}>
      <div className='headerBar'>
        <div className='headerStatBlock'>
          <div className='headerQiLine'>
            Qi: <span className='headerQiValue'>{formatNumber(qi)}</span>
            <span className='headerQiRate'>({formatNumber(qiPerSecond)}/s)</span>
          </div>
          <div className='headerRealmLine'>
            REALM:<span className='headerRealmAccent'>{realm.name}</span>
            <span className='headerRealmSubstage'>Substage {realm.substage + 1}</span>
          </div>
        </div>

        <div className="titles-container">
          <div className="big-title">{headerTitle}</div>
          <div className="subtitle">{headerSubtitle}</div>
        </div>

        <div className='headerTrackedBlock'>
          {trackedBounty && (
            <button className='headerTrackedBadge' onClick={handleTrackedClick}>
              <div className='headerTrackedLabel'>Tracked bounty</div>
              <div className='headerTrackedTitle'>
                {trackedBounty.title}
                <span className='headerTrackedProgress'>
                  {trackedBounty.progress}/{trackedBounty.target}
                </span>
              </div>
            </button>
          )}
        </div>

        <div className='headerSaveBlock'>
          <div className='headerSaveLabel'>
            Last Saved
          </div>
          <div
            className={`headerSaveTime ${lastSavedTone === 'fresh'
                ? 'headerFresh'
                : lastSavedTone === 'warn'
                  ? 'headerWarn'
                  : lastSavedTone === 'old'
                    ? 'headerOld'
                    : 'headerNeutral'
              }`}
          >
            {lastSavedText}
          </div>
        </div>
      </div>
    </header>
  );
}
