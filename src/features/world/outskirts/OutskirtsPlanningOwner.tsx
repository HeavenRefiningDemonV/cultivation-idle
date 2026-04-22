import { useCallback, useMemo, useState } from 'react';
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
  const autoContinue = useOutskirtsStore((state) => state.autoContinue);
  const setAutoContinue = useOutskirtsStore((state) => state.setAutoContinue);
  const setAutoAttack = useCombatStore((state) => state.setAutoAttack);
  const startCombat = useCombatStore((state) => state.startCombat);
  const closeWorldBuildingModal = useUIStore((state) => state.closeWorldBuildingModal);
  const openWorldBuildingModal = useUIStore((state) => state.openWorldBuildingModal);
  const [previewEncounterId, setPreviewEncounterId] = useState<string | null>(null);

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

  const planningSurface = useMemo(
    () => buildOutskirtsMockupSurfaceFromStores(cityId, {
      previewEncounterId: previewEncounterId ?? undefined,
      allowEncounterPreviewSelection: true,
      medicinePouchActionEnabled: true,
    }),
    [cityId, previewEncounterId],
  );

  const encounterIds = useMemo(() => planningSurface.encounterStrip.nodes.map((node) => node.id), [planningSurface.encounterStrip.nodes]);
  const selectedEncounterId = planningSurface.encounterStrip.selectedEncounterId;

  const handleSelectEncounterPreview = useCallback((encounterId: string) => {
    if (!encounterIds.includes(encounterId)) return;
    setPreviewEncounterId(encounterId);
  }, [encounterIds]);

  const handlePreviewPreviousEncounter = useCallback(() => {
    const currentIndex = encounterIds.indexOf(selectedEncounterId);
    if (currentIndex <= 0) return;
    setPreviewEncounterId(encounterIds[currentIndex - 1] ?? null);
  }, [encounterIds, selectedEncounterId]);

  const handlePreviewNextEncounter = useCallback(() => {
    const currentIndex = encounterIds.indexOf(selectedEncounterId);
    if (currentIndex < 0 || currentIndex >= encounterIds.length - 1) return;
    setPreviewEncounterId(encounterIds[currentIndex + 1] ?? null);
  }, [encounterIds, selectedEncounterId]);

  const handleToggleAutoRepeat = useCallback(() => {
    setAutoContinue(!autoContinue);
  }, [autoContinue, setAutoContinue]);

  const handleOpenMedicinePouch = useCallback(() => {
    openWorldBuildingModal({
      cityId,
      buildingKey: 'apothecary',
      intent: { apothecarySurface: 'pouch' },
    });
  }, [cityId, openWorldBuildingModal]);

  return (
    <div className="outskirtsPlanningOwner" data-testid="outskirts-view-planning">
      <OutskirtsExactMockupScreen
        surface={planningSurface}
        onStartHunt={handleStartOutskirts}
        onOpenSettings={handleOpenSettings}
        onPreviewPreviousEncounter={handlePreviewPreviousEncounter}
        onPreviewNextEncounter={handlePreviewNextEncounter}
        onSelectEncounterPreview={handleSelectEncounterPreview}
        onToggleAutoRepeat={handleToggleAutoRepeat}
        onOpenMedicinePouch={handleOpenMedicinePouch}
      />
    </div>
  );
}
