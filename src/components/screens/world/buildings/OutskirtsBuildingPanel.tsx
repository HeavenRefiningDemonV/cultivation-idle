import { useMemo } from 'react';
import { useActivityStore } from '../../../../stores/activityStore';
import { useCombatStore } from '../../../../stores/combatStore';
import { useContentStore } from '../../../../stores/contentStore';
import { useOutskirtsStore } from '../../../../stores/outskirtsStore';
import { useUIStore } from '../../../../stores/uiStore';
import { resolveModuleRef } from '../worldUtils';

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
  const stopActivity = useActivityStore((state) => state.stopActivity);

  const combatContext = useCombatStore((state) => state.combatContext);
  const exitCombat = useCombatStore((state) => state.exitCombat);

  const openCombatPreview = useUIStore((state) => state.openCombatPreview);
  const stopCombatAndClose = useUIStore((state) => state.stopCombatAndClose);

  const outskirtsRefId = useMemo(() => resolveModuleRef(city ?? null, 'outskirts'), [city]);
  const outskirtsDef = outskirtsRefId ? outskirtsById[outskirtsRefId] : undefined;
  const outskirtsProgress = outskirtsRefId
    ? progressByOutskirtsId[outskirtsRefId] ?? { killsSinceBoss: 0, totalKills: 0, bossDefeated: false }
    : null;
  const isOutskirtsActive = activeActivity?.type === 'outskirts' && activeActivity.sourceId === outskirtsRefId;
  const bossName = outskirtsDef ? enemiesById[outskirtsDef.bossId]?.name ?? outskirtsDef.bossId : null;
  const isBossReady = outskirtsDef ? shouldSpawnBoss(outskirtsDef.id, outskirtsDef) : false;

  const handleStartOutskirts = () => {
    if (!city || !outskirtsDef) return;
    openCombatPreview({ type: 'outskirts', cityId, sourceId: outskirtsDef.id });
  };

  const handleStopOutskirts = () => {
    stopCombatAndClose();
    stopActivity();
    if (combatContext.type === 'outskirts') {
      exitCombat();
    }
  };

  if (!outskirtsDef) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Outskirts</div>
          <div className={'worldScreenPlaceholderKey'}>outskirts</div>
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
        <div className={'worldScreenPlaceholderTitle'}>{outskirtsDef.name ?? 'Outskirts'}</div>
        <div className={'worldScreenPlaceholderKey'}>outskirts</div>
      </div>
      <div className={'worldScreenPlaceholderBody'}>
        <div className={'worldScreenPlaceholderLine'}>
          {outskirtsProgress?.killsSinceBoss ?? 0} kills since boss — Next: {isBossReady ? 'Boss' : 'Mob'}
        </div>
        <div className={'worldScreenPlaceholderLine'}>
          Boss: {bossName ?? 'Unknown'} • Defeated: {outskirtsProgress?.bossDefeated ? 'Yes' : 'No'}
        </div>
        <div className={'worldScreenPlaceholderLine'}>
          Activity: {isOutskirtsActive ? 'Active' : 'Inactive'}
        </div>
      </div>
      <div className={'worldScreenPlaceholderActions'}>
        <button
          className={'worldScreenModuleButton worldScreenModuleButton--active'}
          onClick={handleStartOutskirts}
          disabled={!outskirtsDef}
          type="button"
        >
          Start Farming
        </button>
        <button className={'worldScreenModuleButton'} onClick={handleStopOutskirts} type="button">
          Stop
        </button>
        {isBossReady && bossName && (
          <div className={'worldScreenPlaceholderLine worldScreenBossAlert'}>
            Boss {bossName} is ready to spawn!
          </div>
        )}
      </div>
    </div>
  );
}
