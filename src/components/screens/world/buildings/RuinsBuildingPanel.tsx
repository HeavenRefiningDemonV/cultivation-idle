import { useMemo } from 'react';
import { useActivityStore } from '../../../../stores/activityStore.js';
import { useCombatStore } from '../../../../stores/combatStore.js';
import { useContentStore } from '../../../../stores/contentStore.js';
import { useRuinsStore } from '../../../../stores/ruinsStore.js';
import { useUIStore } from '../../../../stores/uiStore.js';
import { resolveModuleRef } from '../worldUtils.js';

interface RuinsBuildingPanelProps {
  cityId: string;
}

export function RuinsBuildingPanel({ cityId }: RuinsBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const ruinsById = useContentStore((state) => state.maps.ruinsById);

  const ruinsProgressById = useRuinsStore((state) => state.progressByRuinId);
  const activeRun = useRuinsStore((state) => state.activeRun);
  const stopRun = useRuinsStore((state) => state.stopRun);
  const setAutoRepeat = useRuinsStore((state) => state.setAutoRepeat);
  const autoRepeatDefault = useRuinsStore((state) => state.autoRepeatDefault);

  const activeActivity = useActivityStore((state) => state.active);
  const stopActivity = useActivityStore((state) => state.stopActivity);

  const combatContext = useCombatStore((state) => state.combatContext);
  const exitCombat = useCombatStore((state) => state.exitCombat);
  const openCombatPreview = useUIStore((state) => state.openCombatPreview);
  const stopCombatAndClose = useUIStore((state) => state.stopCombatAndClose);

  const ruinRefId = useMemo(() => resolveModuleRef(city ?? null, 'ruins'), [city]);
  const ruinDef = ruinRefId ? ruinsById[ruinRefId] : undefined;
  const ruinProgress = ruinRefId
    ? ruinsProgressById[ruinRefId] ?? { totalRuns: 0, totalRoomsCleared: 0, bossKills: 0 }
    : null;
  const isRuinsActive = activeActivity?.type === 'ruins' && activeActivity.sourceId === ruinRefId;
  const activeRuin = activeRun && activeRun.ruinId === ruinRefId ? activeRun : null;

  const handleStartRuins = () => {
    if (!ruinDef) return;
    openCombatPreview({ type: 'ruins', cityId, sourceId: ruinDef.id });
  };

  const handleStopRuins = () => {
    stopCombatAndClose();
    stopRun();
    stopActivity();
    if (combatContext.type === 'ruins') {
      exitCombat();
    }
  };

  const handleToggleRuinsAutoRepeat = () => {
    setAutoRepeat(!autoRepeatDefault);
  };

  if (!ruinDef) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Ruins</div>
          <div className={'worldScreenPlaceholderKey'}>ruins</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>
          <div className={'worldScreenPlaceholderLine'}>Unavailable for this city.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={'worldScreenPlaceholder'}>
      <div className={'worldScreenPlaceholderHeader'}>
        <div className={'worldScreenPlaceholderTitle'}>{ruinDef.name ?? 'Ruins'}</div>
        <div className={'worldScreenPlaceholderKey'}>ruins</div>
      </div>
      <div className={'worldScreenPlaceholderBody'}>
        <div className={'worldScreenPlaceholderLine'}>Rooms: {ruinDef.roomCount}</div>
        <div className={'worldScreenPlaceholderLine'}>
          Activity: {isRuinsActive ? 'Active' : 'Inactive'}
          {activeRuin && (
            <span>
              {' '}
              (Room {activeRuin.roomIndex + 1}/{activeRuin.roomCount})
            </span>
          )}
        </div>
        <div className={'worldScreenPlaceholderLine'}>
          Runs: {ruinProgress?.totalRuns ?? 0} • Boss kills: {ruinProgress?.bossKills ?? 0}
        </div>
        <div className={'worldScreenPlaceholderLine'}>
          Best time: {ruinProgress?.bestRunSeconds ? `${ruinProgress.bestRunSeconds.toFixed(1)}s` : 'N/A'}
        </div>
        {ruinProgress?.lastRun && (
          <div className={'worldScreenPlaceholderLine'}>
            Last run: {ruinProgress.lastRun.victory ? 'Victory' : 'Defeat'} in {ruinProgress.lastRun.seconds.toFixed(1)}s
            (rooms {ruinProgress.lastRun.roomsCleared})
          </div>
        )}
      </div>
      <div className={'worldScreenPlaceholderActions'}>
        <button
          className={'worldScreenModuleButton worldScreenModuleButton--active'}
          onClick={handleStartRuins}
          disabled={!ruinDef}
          type="button"
        >
          Start Run
        </button>
        <button className={'worldScreenModuleButton'} onClick={handleStopRuins} type="button">
          Stop
        </button>
        <button className={'worldScreenModuleButton'} onClick={handleToggleRuinsAutoRepeat} type="button">
          Auto-repeat: {autoRepeatDefault ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );
}
