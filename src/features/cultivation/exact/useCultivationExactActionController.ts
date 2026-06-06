import { useCallback, useEffect, useRef, useState } from 'react';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useCityStore } from '../../../stores/cityStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { GameEvents, type ProgressionBreakthroughCompletedEvent } from '../../../services/events/GameEvents.js';
import { performRunCompassAction } from '../../../systems/ui/runCompass/performRunCompassAction.js';
import type { RunCompassActionLine } from '../../../systems/ui/runCompass/index.js';
import type { WorldBuildingKey } from '../../../stores/uiStore.js';
import {
  buildLiveBreakthroughRitualPreviewSurface,
  buildLiveBreakthroughRitualResultSurface,
  type BreakthroughRitualSurfaceV1,
} from '../../breakthroughRitual/index.js';
import type {
  CultivationButtonSurface,
  CultivationExactDrawerId,
  CultivationExactSurfaceV1,
} from './cultivationExactTypes.js';

export interface CultivationExactActionController {
  selectedDrawer: CultivationExactDrawerId;
  showDaoHeart: boolean;
  isBreakingThrough: boolean;
  ritualSurface: BreakthroughRitualSurfaceV1 | null;
  onCommandAction: (button: CultivationButtonSurface) => void;
  onOpenDrawer: (drawerId: CultivationExactDrawerId) => void;
  onCloseDrawer: () => void;
  onOpenDaoHeart: () => void;
  onCloseDaoHeart: () => void;
  onRunCompassAction: (action: RunCompassActionLine) => void;
  onCloseRitual: () => void;
  onRitualRoute: () => void;
}

function performActionIfAvailable(action: RunCompassActionLine | null | undefined): boolean {
  if (!action || action.blocked) return false;
  performRunCompassAction(action);
  return true;
}

export function useCultivationExactActionController(surface: CultivationExactSurfaceV1): CultivationExactActionController {
  const addNotification = useUIStore((state) => state.addNotification);
  const [selectedDrawer, setSelectedDrawer] = useState<CultivationExactDrawerId>(surface.meta.selectedDrawer);
  const [showDaoHeart, setShowDaoHeart] = useState(false);
  const [isBreakingThrough, setIsBreakingThrough] = useState(false);
  const [ritualSurface, setRitualSurface] = useState<BreakthroughRitualSurfaceV1 | null>(null);
  const breakthroughTimeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    setSelectedDrawer(surface.meta.selectedDrawer);
  }, [surface.meta.selectedDrawer]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedDrawer('none');
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    return () => {
      breakthroughTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      breakthroughTimeoutsRef.current = [];
    };
  }, []);

  const startCultivation = useCallback(() => {
    const { startActivity } = useActivityStore.getState();
    startActivity('meditate', undefined, 'cultivation-exact-start');
  }, []);

  const stopCultivation = useCallback(() => {
    const { stopActivity } = useActivityStore.getState();
    stopActivity('cultivation-exact-stop');
  }, []);

  const breakThrough = useCallback(() => {
    if (isBreakingThrough) return;
    setIsBreakingThrough(true);
    setRitualSurface(buildLiveBreakthroughRitualPreviewSurface());
    const gatherTimeout = window.setTimeout(() => {
      const game = useGameStore.getState();
      let completedEvent: ProgressionBreakthroughCompletedEvent | null = null;
      const handleCompleted = (event: ProgressionBreakthroughCompletedEvent) => {
        completedEvent = event;
      };
      GameEvents.on('progression/breakthrough_completed', handleCompleted);
      const breakthroughOk = game.breakthrough();
      GameEvents.off('progression/breakthrough_completed', handleCompleted);
      if (breakthroughOk) {
        setRitualSurface(buildLiveBreakthroughRitualResultSurface(completedEvent));
      } else {
        const failure = useCultivationStore.getState().lastBreakthroughFailureSummary;
        setRitualSurface(null);
        addNotification('warning', failure?.message ?? 'Breakthrough threshold is not ready.');
      }
      const settleTimeout = window.setTimeout(() => {
        setIsBreakingThrough(false);
      }, 600);
      breakthroughTimeoutsRef.current.push(settleTimeout);
    }, 2000);
    breakthroughTimeoutsRef.current.push(gatherTimeout);
  }, [addNotification, isBreakingThrough]);

  const openGateTrial = useCallback((button: CultivationButtonSurface) => {
    const action = button.runCompassAction ?? surface.drawers.gate.action?.runCompassAction ?? null;
    if (performActionIfAvailable(action)) return;
    addNotification('warning', button.reason ?? 'Gate Trial route is not available yet.');
  }, [addNotification, surface]);

  const openPrestige = useCallback((button: CultivationButtonSurface) => {
    const action = button.runCompassAction ?? surface.lifeCycleWhisper.runCompassAction ?? null;
    if (performActionIfAvailable(action)) return;
    useUIStore.getState().setActiveTab('prestige');
  }, [surface]);

  const openWorldModule = useCallback((buildingKey: WorldBuildingKey) => {
    const ui = useUIStore.getState();
    const cityId = useCityStore.getState().currentCityId;
    ui.setActiveTab('adventure');
    if (cityId) {
      ui.openWorldBuildingModal({ cityId, buildingKey, intent: null });
    }
  }, []);

  const onCommandAction = useCallback((button: CultivationButtonSurface) => {
    if (button.disabled) {
      if (button.reason) addNotification('info', button.reason);
      return;
    }

    switch (button.actionKey) {
      case 'startCultivation':
        startCultivation();
        return;
      case 'stopCultivation':
        stopCultivation();
        return;
      case 'openDaoHeart':
        setShowDaoHeart(true);
        return;
      case 'openTrainingHall':
        openWorldModule('trainingHall');
        return;
      case 'breakThrough':
        breakThrough();
        return;
      case 'openGateTrial':
        openGateTrial(button);
        return;
      case 'openApothecary':
        openWorldModule('apothecary');
        return;
      case 'openForge':
        openWorldModule('forge');
        return;
      case 'openSpiritRootObservation':
        useUIStore.getState().openSpiritRootObservation('profile');
        return;
      case 'rest':
        addNotification('info', button.reason ?? 'Let current pressure settle before attempting the gate.');
        return;
      case 'openPrestige':
        openPrestige(button);
        return;
      case 'none':
      default:
        if (button.reason) addNotification('info', button.reason);
    }
  }, [addNotification, breakThrough, openGateTrial, openPrestige, openWorldModule, startCultivation, stopCultivation]);

  const onOpenDrawer = useCallback((drawerId: CultivationExactDrawerId) => {
    setSelectedDrawer(drawerId);
  }, []);

  const onCloseDrawer = useCallback(() => {
    setSelectedDrawer('none');
  }, []);

  const onOpenDaoHeart = useCallback(() => {
    setShowDaoHeart(true);
  }, []);

  const onCloseDaoHeart = useCallback(() => {
    setShowDaoHeart(false);
  }, []);

  const onRunCompassAction = useCallback((action: RunCompassActionLine) => {
    if (performActionIfAvailable(action)) return;
    addNotification('warning', action.reason ?? 'That route is not available yet.');
  }, [addNotification]);

  const onCloseRitual = useCallback(() => {
    setRitualSurface(null);
  }, []);

  const onRitualRoute = useCallback(() => {
    const target = ritualSurface?.nextMilestone?.target ?? null;
    setRitualSurface(null);
    if (!target) return;
    const ui = useUIStore.getState();
    if (target.kind === 'tab') {
      ui.setActiveTab(target.tab);
      return;
    }
    ui.setActiveTab('adventure');
    ui.openWorldBuildingModal({
      cityId: target.cityId,
      buildingKey: target.moduleKey as WorldBuildingKey,
      intent: target.moduleKey === 'gateTrial'
        ? { gateTrialExactMode: 'live' }
        : target.moduleKey === 'ruins'
          ? { ruinsExactMode: 'live' }
          : null,
    });
  }, [ritualSurface]);

  return {
    selectedDrawer,
    showDaoHeart,
    isBreakingThrough,
    ritualSurface,
    onCommandAction,
    onOpenDrawer,
    onCloseDrawer,
    onOpenDaoHeart,
    onCloseDaoHeart,
    onRunCompassAction,
    onCloseRitual,
    onRitualRoute,
  };
}
