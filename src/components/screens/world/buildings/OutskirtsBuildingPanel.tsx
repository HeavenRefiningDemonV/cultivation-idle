import { useMemo } from 'react';

import { useActivityStore } from '../../../../stores/activityStore';
import { useCombatStore } from '../../../../stores/combatStore';
import { useContentStore } from '../../../../stores/contentStore';
import { useOutskirtsStore } from '../../../../stores/outskirtsStore';
import { resolveModuleRef, pickEnemyFromPool } from '../worldUtils';
import { CombatTheaterPreviewCard } from './CombatTheaterPreviewCard';

interface OutskirtsBuildingPanelProps {
  cityId: string;
}

export function OutskirtsBuildingPanel({ cityId }: OutskirtsBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const outskirtsById = useContentStore((state) => state.maps.outskirtsById);
  const enemiesById = useContentStore((state) => state.maps.enemiesById);

  const progressByOutskirtsId = useOutskirtsStore((state) => state.progressByOutskirtsId);
  const shouldSpawnBoss = useOutskirtsStore((state) => state.shouldSpawnBoss);

  const activeActivity = useActivityStore((state) => state.active);
  const startActivity = useActivityStore((state) => state.startActivity);
  const stopActivity = useActivityStore((state) => state.stopActivity);

  const combatContext = useCombatStore((state) => state.combatContext);
  const startCombat = useCombatStore((state) => state.startCombat);
  const exitCombat = useCombatStore((state) => state.exitCombat);
  const setAutoAttack = useCombatStore((state) => state.setAutoAttack);

  const outskirtsRefId = useMemo(() => resolveModuleRef(city ?? null, 'outskirts'), [city]);
  const outskirtsDef = outskirtsRefId ? outskirtsById[outskirtsRefId] : undefined;
  const outskirtsProgress = outskirtsRefId
    ? progressByOutskirtsId[outskirtsRefId] ?? { killsSinceBoss: 0, totalKills: 0, bossDefeated: false }
    : null;
  const isOutskirtsActive = activeActivity?.type === 'outskirts' && activeActivity.sourceId === outskirtsRefId;
  const bossName = outskirtsDef ? enemiesById[outskirtsDef.bossId]?.name ?? outskirtsDef.bossId : null;
  const isBossReady = outskirtsDef ? shouldSpawnBoss(outskirtsDef.id, outskirtsDef) : false;

  const killsSinceBoss = outskirtsProgress?.killsSinceBoss ?? 0;
  const killsToBoss = outskirtsDef?.killsToBoss ?? 0;
  const progressRatio = killsToBoss ? Math.min(killsSinceBoss / killsToBoss, 1) : 0;

  const handleStartOutskirts = () => {
    if (!city || !outskirtsDef) return;

    const nextEnemyId = isBossReady ? outskirtsDef.bossId : pickEnemyFromPool(outskirtsDef.mobPool);
    if (!nextEnemyId) return;

    startActivity('outskirts', { cityId, sourceId: outskirtsDef.id });
    setAutoAttack(true);

    startCombat(nextEnemyId, {
      type: 'outskirts',
      cityId,
      sourceId: outskirtsDef.id,
      cityIndex: outskirtsDef.cityIndex,
      isBoss: isBossReady,
    });
  };

  const handleStopOutskirts = () => {
    stopActivity();
    if (combatContext.type === 'outskirts') {
      exitCombat();
    }
  };

  if (!outskirtsDef) {
    return (
      <CombatTheaterPreviewCard moduleLabel="Outskirts" title="Outskirts" variant="outskirts">
        <div className="combatPreviewCard__item">
          <div className="combatPreviewCard__label">Status</div>
          <div className="combatPreviewCard__value">Unavailable for this city.</div>
        </div>
      </CombatTheaterPreviewCard>
    );
  }

  return (
    <CombatTheaterPreviewCard
      moduleLabel="Outskirts"
      title={outskirtsDef.name ?? 'Outskirts'}
      subtitle={`City ${city?.name ?? cityId}`}
      variant="outskirts"
      statusLine={`Activity: ${isOutskirtsActive ? 'Active' : 'Inactive'}`}
      actions={
        <>
          <button
            className="button-standard combatPreviewCard__primary"
            onClick={handleStartOutskirts}
            disabled={!outskirtsDef}
            type="button"
          >
            Start Farming
          </button>
          <button className="button-standard" onClick={handleStopOutskirts} type="button">
            Stop
          </button>
        </>
      }
    >
      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Next Encounter</div>
        <div className="combatPreviewCard__value">{isBossReady ? 'Boss' : 'Mob'}</div>
      </div>

      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Boss</div>
        <div className="combatPreviewCard__value">{bossName ?? 'Unknown'}</div>
      </div>

      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Progress to Boss</div>
        <div className="combatPreviewCard__value">
          {killsSinceBoss} / {killsToBoss || '?'} kills
        </div>
        <div className="combatPreviewCard__progress">
          <div className="combatPreviewCard__progressFill" style={{ width: `${progressRatio * 100}%` }} />
        </div>
      </div>

      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Total Kills</div>
        <div className="combatPreviewCard__value">{outskirtsProgress?.totalKills ?? 0}</div>
      </div>

      {isBossReady && bossName && (
        <div className="combatPreviewCard__callout">Boss {bossName} is ready to spawn!</div>
      )}
    </CombatTheaterPreviewCard>
  );
}
