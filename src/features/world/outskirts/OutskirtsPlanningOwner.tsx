import { useCallback, useMemo } from 'react';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useCombatStore } from '../../../stores/combatStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useOutskirtsStore } from '../../../stores/outskirtsStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { pickEnemyFromPool, resolveModuleRef } from '../../../components/screens/world/worldUtils.js';
import { buildOutskirtsMockupSurfaceFromStores } from './buildOutskirtsMockupSurface.js';
import { OutskirtsExactMockupScreen } from './OutskirtsExactMockupScreen.js';
import './OutskirtsExactMockupScreen.scss';

interface OutskirtsPlanningOwnerProps {
  cityId: string;
}

export function OutskirtsPlanningOwner({ cityId }: OutskirtsPlanningOwnerProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const outskirtsById = useContentStore((state) => state.maps.outskirtsById);
  const getProgress = useOutskirtsStore((state) => state.getProgress);
  const startActivity = useActivityStore((state) => state.startActivity);
  const setAutoAttack = useCombatStore((state) => state.setAutoAttack);
  const startCombat = useCombatStore((state) => state.startCombat);
  const closeWorldBuildingModal = useUIStore((state) => state.closeWorldBuildingModal);

  const outskirtsRefId = useMemo(() => resolveModuleRef(city ?? null, 'outskirts'), [city]);
  const outskirtsDef = outskirtsRefId ? outskirtsById[outskirtsRefId] : undefined;

  const handleStartOutskirts = useCallback(() => {
    if (!city || !outskirtsDef) return;
    const progressSnapshot = getProgress(outskirtsDef.id);
    const nextIsBoss = progressSnapshot.killsSinceBoss >= outskirtsDef.killsToBoss;
    const nextEnemyId = nextIsBoss ? outskirtsDef.bossId : pickEnemyFromPool(outskirtsDef.mobPool);
    if (!nextEnemyId) return;
    startActivity('outskirts', { cityId, sourceId: outskirtsDef.id });
    setAutoAttack(true);
    startCombat(nextEnemyId, {
      type: 'outskirts',
      cityId,
      sourceId: outskirtsDef.id,
      cityIndex: outskirtsDef.cityIndex,
      isBoss: nextIsBoss,
    });
  }, [city, cityId, getProgress, outskirtsDef, setAutoAttack, startActivity, startCombat]);


  const handleOpenSettings = useCallback(() => {
    useUIStore.getState().setActiveTab('settings');
    closeWorldBuildingModal();
  }, [closeWorldBuildingModal]);

  const planningSurface = useMemo(() => buildOutskirtsMockupSurfaceFromStores(cityId), [cityId]);

  return (
    <div className="outskirtsPlanningOwner" data-testid="outskirts-view-planning">
      <OutskirtsExactMockupScreen
        surface={planningSurface}
        onStartHunt={handleStartOutskirts}
        onOpenSettings={handleOpenSettings}
      />
    </div>
  );
}
