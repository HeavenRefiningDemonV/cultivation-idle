import { useCallback, useMemo, useState } from 'react';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useCombatStore } from '../../../stores/combatStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useOutskirtsStore } from '../../../stores/outskirtsStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { pickEnemyFromPool, resolveModuleRef } from '../../../components/screens/world/worldUtils.js';
import { buildOutskirtsMockupSurfaceFromStores } from './buildOutskirtsMockupSurface.js';
import { OutskirtsExactMockupScreen } from './OutskirtsExactMockupScreen.js';
import { useOutskirtsScreenActionController } from './useOutskirtsScreenActionController.js';
import { isSameOutskirtsActivitySource, isSameOutskirtsCombatSource } from './getOutskirtsModuleViewState.js';
import { useOutskirtsActiveClock } from './hooks/useOutskirtsActiveClock.js';
import { routeCombatAftermathTarget } from '../../combatAftermath/index.js';
import type { OutskirtsSurfaceMode } from './types.js';
import {
  applyDaoMandateVisibility,
  buildLiveDaoMandateSurfaceV1,
  pickDaoMandateGuidanceSettings,
  resolveDaoMandateEffectiveMotionMode,
} from '../../../systems/ui/daoMandate/index.js';
import {
  applyLocalMandateLensVisibility,
  buildLocalMandateLensSurface,
} from '../../../systems/world/localMandateLensSurface.js';
import { normalizeCityModulesForLiveSlice } from '../../../systems/world/liveWorldSchema.js';
import type { OutskirtsMandateLensView } from './components/OutskirtsTopRegion.js';
import './OutskirtsExactMockupScreen.scss';
import '../../combatAftermath/CombatAftermathCard.scss';

interface OutskirtsScreenOwnerProps {
  cityId: string;
}

export function OutskirtsScreenOwner({ cityId }: OutskirtsScreenOwnerProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const outskirtsById = useContentStore((state) => state.maps.outskirtsById);
  const getProgress = useOutskirtsStore((state) => state.getProgress);
  const startActivity = useActivityStore((state) => state.startActivity);
  const stopActivity = useActivityStore((state) => state.stopActivity);
  const activeActivity = useActivityStore((state) => state.active);
  const autoContinue = useOutskirtsStore((state) => state.autoContinue);
  const setAutoContinue = useOutskirtsStore((state) => state.setAutoContinue);
  const setAutoAttack = useCombatStore((state) => state.setAutoAttack);
  const startCombat = useCombatStore((state) => state.startCombat);
  const exitCombat = useCombatStore((state) => state.exitCombat);
  const combatContext = useCombatStore((state) => state.combatContext);
  const uiSettings = useUIStore((state) => state.settings);
  const closeWorldBuildingModal = useUIStore((state) => state.closeWorldBuildingModal);
  const openWorldBuildingModal = useUIStore((state) => state.openWorldBuildingModal);
  const [previewEncounterId, setPreviewEncounterId] = useState<string | null>(null);

  const outskirtsRefId = useMemo(() => resolveModuleRef(city ?? null, 'outskirts'), [city]);
  const outskirtsDef = outskirtsRefId ? outskirtsById[outskirtsRefId] : undefined;

  const hasSameSourceActivity = isSameOutskirtsActivitySource(cityId, outskirtsDef?.id ?? null, activeActivity);
  const hasSameSourceCombat = isSameOutskirtsCombatSource(cityId, outskirtsDef?.id ?? null, combatContext);
  const activityMode: OutskirtsSurfaceMode = hasSameSourceActivity || hasSameSourceCombat ? 'active' : 'planning';
  const liveNowMs = useOutskirtsActiveClock(activityMode === 'active');
  const guidanceSettings = useMemo(() => pickDaoMandateGuidanceSettings(uiSettings), [uiSettings]);
  const mandateMotionMode = useMemo(
    () => resolveDaoMandateEffectiveMotionMode({
      mandateMotionMode: guidanceSettings.mandateMotionMode,
      storyMotionMode: uiSettings.storyMotionMode,
    }),
    [guidanceSettings.mandateMotionMode, uiSettings.storyMotionMode],
  );
  const mandateLens = useMemo((): OutskirtsMandateLensView | null => {
    if (!city) return null;
    const rawMandate = buildLiveDaoMandateSurfaceV1({
      currentScreen: 'outskirts',
      guidanceProfile: guidanceSettings.guidanceOath,
    });
    const visibleMandate = applyDaoMandateVisibility(rawMandate, { settings: guidanceSettings });
    const rawLens = buildLocalMandateLensSurface({
      mandate: visibleMandate,
      cityId,
      moduleKey: 'outskirts',
      visibleModules: normalizeCityModulesForLiveSlice(city.modules),
      isModuleAvailable: Boolean(outskirtsDef),
      hasActiveForegroundHere: activityMode === 'active',
    });
    const visibleLens = applyLocalMandateLensVisibility(rawLens, visibleMandate, guidanceSettings);
    if (!visibleLens) return null;
    return {
      lens: visibleLens,
      profile: guidanceSettings.guidanceOath,
      motionMode: mandateMotionMode,
      variant: guidanceSettings.localLensBanners === 'compact'
        ? 'compact'
        : guidanceSettings.localLensBanners === 'full' ? 'full' : 'default',
    };
  }, [activityMode, city, cityId, guidanceSettings, mandateMotionMode, outskirtsDef]);

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

  const handleStopOutskirts = useCallback(() => {
    if (isSameOutskirtsActivitySource(cityId, outskirtsDef?.id ?? null, activeActivity)) {
      stopActivity('outskirts-stop-hunt');
    }
    if (isSameOutskirtsCombatSource(cityId, outskirtsDef?.id ?? null, combatContext)) {
      exitCombat();
    }
  }, [activeActivity, cityId, combatContext, exitCombat, outskirtsDef?.id, stopActivity]);

  const handleOpenSettings = useCallback(() => {
    useUIStore.getState().setActiveTab('settings');
    closeWorldBuildingModal();
  }, [closeWorldBuildingModal]);

  const screenSurface = useMemo(
    () => buildOutskirtsMockupSurfaceFromStores(cityId, {
      previewEncounterId: activityMode === 'active' ? undefined : previewEncounterId ?? undefined,
      allowEncounterPreviewSelection: activityMode !== 'active',
      medicinePouchActionEnabled: true,
      activityMode,
      nowMs: liveNowMs,
    }),
    [activityMode, cityId, previewEncounterId, liveNowMs],
  );

  const encounterIds = useMemo(() => screenSurface.encounterStrip.nodes.map((node) => node.id), [screenSurface.encounterStrip.nodes]);
  const selectedEncounterId = screenSurface.encounterStrip.selectedEncounterId;

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

  const actionController = useOutskirtsScreenActionController({
    cityId,
    outskirtsDef,
    activityMode,
    onStartOutskirts: handleStartOutskirts,
    onStopOutskirts: handleStopOutskirts,
    onOpenSettings: handleOpenSettings,
    onToggleAutoRepeat: handleToggleAutoRepeat,
    onPreviewPreviousEncounter: handlePreviewPreviousEncounter,
    onPreviewNextEncounter: handlePreviewNextEncounter,
    onSelectEncounterPreview: handleSelectEncounterPreview,
    onOpenMedicinePouch: handleOpenMedicinePouch,
  });

  return (
    <div className="outskirtsScreenOwner" data-testid="outskirts-view-screen" data-activity-mode={activityMode}>
      <OutskirtsExactMockupScreen
        surface={screenSurface}
        onPrimaryAction={actionController.onPrimaryAction}
        onOpenSettings={actionController.onOpenSettings}
        onPreviewPreviousEncounter={actionController.onPreviewPreviousEncounter}
        onPreviewNextEncounter={actionController.onPreviewNextEncounter}
        onSelectEncounterPreview={actionController.onSelectEncounterPreview}
        onToggleAutoRepeat={actionController.onToggleAutoRepeat}
        onOpenMedicinePouch={actionController.onOpenMedicinePouch}
        onOpenLoadout={actionController.onOpenLoadout}
        onOpenAiProfile={actionController.onOpenAiProfile}
        onOpenAttackFocus={actionController.onOpenAttackFocus}
        onOpenEquipmentSlot={actionController.onOpenEquipmentSlot}
        onOpenTrackedBounties={actionController.onOpenTrackedBounties}
        onOpenTacticalCell={actionController.onOpenTacticalCell}
        onOpenAreaSelector={actionController.onOpenAreaSelector}
        onAftermathRoute={routeCombatAftermathTarget}
        mandateLens={mandateLens}
      />
    </div>
  );
}
