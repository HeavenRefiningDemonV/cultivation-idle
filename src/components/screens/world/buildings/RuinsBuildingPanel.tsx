import { useMemo } from 'react';

import { useActivityStore } from '../../../../stores/activityStore';
import { useCombatStore } from '../../../../stores/combatStore';
import { useContentStore } from '../../../../stores/contentStore';
import { useRuinsStore } from '../../../../stores/ruinsStore';
import { resolveModuleRef } from '../worldUtils';
import { CombatTheaterPreviewCard } from './CombatTheaterPreviewCard';

interface RuinsBuildingPanelProps {
  cityId: string;
}

export function RuinsBuildingPanel({ cityId }: RuinsBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const ruinsById = useContentStore((state) => state.maps.ruinsById);

  const ruinsProgressById = useRuinsStore((state) => state.progressByRuinId);
  const activeRun = useRuinsStore((state) => state.activeRun);
  const startRun = useRuinsStore((state) => state.startRun);
  const stopRun = useRuinsStore((state) => state.stopRun);
  const setAutoRepeat = useRuinsStore((state) => state.setAutoRepeat);
  const autoRepeatDefault = useRuinsStore((state) => state.autoRepeatDefault);

  const activeActivity = useActivityStore((state) => state.active);
  const stopActivity = useActivityStore((state) => state.stopActivity);

  const combatContext = useCombatStore((state) => state.combatContext);
  const exitCombat = useCombatStore((state) => state.exitCombat);

  const ruinRefId = useMemo(() => resolveModuleRef(city ?? null, 'ruins'), [city]);
  const ruinDef = ruinRefId ? ruinsById[ruinRefId] : undefined;
  const ruinProgress = ruinRefId
    ? ruinsProgressById[ruinRefId] ?? { totalRuns: 0, totalRoomsCleared: 0, bossKills: 0 }
    : null;
  const isRuinsActive = activeActivity?.type === 'ruins' && activeActivity.sourceId === ruinRefId;
  const activeRuin = activeRun && activeRun.ruinId === ruinRefId ? activeRun : null;

  const handleStartRuins = () => {
    if (!ruinDef) return;
    startRun(ruinDef.id);
  };

  const handleStopRuins = () => {
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
      <CombatTheaterPreviewCard moduleLabel="Ruins" title="Ruins" variant="ruins">
        <div className="combatPreviewCard__item">
          <div className="combatPreviewCard__label">Status</div>
          <div className="combatPreviewCard__value">Unavailable for this city.</div>
        </div>
      </CombatTheaterPreviewCard>
    );
  }

  return (
    <CombatTheaterPreviewCard
      moduleLabel="Ruins"
      title={ruinDef.name ?? 'Ruins'}
      subtitle={`Rooms: ${ruinDef.roomCount}`}
      variant="ruins"
      statusLine={`Activity: ${isRuinsActive ? 'Active' : 'Inactive'}`}
      actions={
        <>
          <button
            className="button-standard combatPreviewCard__primary"
            onClick={handleStartRuins}
            disabled={!ruinDef}
            type="button"
          >
            Start Run
          </button>
          <button className="button-standard" onClick={handleStopRuins} type="button">
            Stop
          </button>
          <button className="button-standard" onClick={handleToggleRuinsAutoRepeat} type="button">
            Auto-repeat: {autoRepeatDefault ? 'On' : 'Off'}
          </button>
        </>
      }
    >
      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Current Room</div>
        <div className="combatPreviewCard__value">
          {activeRuin ? `Room ${activeRuin.roomIndex + 1}/${activeRuin.roomCount}` : 'Not in a run'}
        </div>
      </div>

      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Boss Kills</div>
        <div className="combatPreviewCard__value">{ruinProgress?.bossKills ?? 0}</div>
      </div>

      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Runs Cleared</div>
        <div className="combatPreviewCard__value">{ruinProgress?.totalRuns ?? 0}</div>
      </div>

      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Best Time</div>
        <div className="combatPreviewCard__value">
          {ruinProgress?.bestRunSeconds ? `${ruinProgress.bestRunSeconds.toFixed(1)}s` : 'N/A'}
        </div>
      </div>

      {ruinProgress?.lastRun && (
        <div className="combatPreviewCard__item">
          <div className="combatPreviewCard__label">Last Run</div>
          <div className="combatPreviewCard__value">
            {ruinProgress.lastRun.victory ? 'Victory' : 'Defeat'} in {ruinProgress.lastRun.seconds.toFixed(1)}s
            {' '}
            (rooms {ruinProgress.lastRun.roomsCleared})
          </div>
        </div>
      )}
    </CombatTheaterPreviewCard>
  );
}
