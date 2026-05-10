import { useCallback, useEffect, useRef, useState } from 'react';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { performRunCompassAction } from '../../../systems/ui/runCompass/performRunCompassAction.js';
import type { RunCompassActionLine } from '../../../systems/ui/runCompass/index.js';
import type {
  CultivationButtonSurface,
  CultivationExactDrawerId,
  CultivationExactSurfaceV1,
} from './cultivationExactTypes.js';

export interface CultivationExactActionController {
  selectedDrawer: CultivationExactDrawerId;
  showDaoHeart: boolean;
  isBreakingThrough: boolean;
  onCommandAction: (button: CultivationButtonSurface) => void;
  onOpenDrawer: (drawerId: CultivationExactDrawerId) => void;
  onCloseDrawer: () => void;
  onOpenDaoHeart: () => void;
  onCloseDaoHeart: () => void;
  onRunCompassAction: (action: RunCompassActionLine) => void;
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
    const gatherTimeout = window.setTimeout(() => {
      const game = useGameStore.getState();
      game.breakthrough();
      const settleTimeout = window.setTimeout(() => {
        setIsBreakingThrough(false);
      }, 600);
      breakthroughTimeoutsRef.current.push(settleTimeout);
    }, 2000);
    breakthroughTimeoutsRef.current.push(gatherTimeout);
  }, [isBreakingThrough]);

  const openGateTrial = useCallback((button: CultivationButtonSurface) => {
    const action = button.runCompassAction ?? surface.drawers.gate.action?.runCompassAction ?? null;
    if (performActionIfAvailable(action)) return;
    addNotification('warning', button.reason ?? 'Gate Trial route is not available yet.');
  }, [addNotification, surface.drawers.gate.action?.runCompassAction]);

  const openPrestige = useCallback((button: CultivationButtonSurface) => {
    const action = button.runCompassAction ?? surface.lifeCycleWhisper.runCompassAction ?? null;
    if (performActionIfAvailable(action)) return;
    useUIStore.getState().setActiveTab('prestige');
  }, [surface.lifeCycleWhisper.runCompassAction]);

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
      case 'breakThrough':
        breakThrough();
        return;
      case 'openGateTrial':
        openGateTrial(button);
        return;
      case 'openPrestige':
        openPrestige(button);
        return;
      case 'none':
      default:
        if (button.reason) addNotification('info', button.reason);
    }
  }, [addNotification, breakThrough, openGateTrial, openPrestige, startCultivation, stopCultivation]);

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

  return {
    selectedDrawer,
    showDaoHeart,
    isBreakingThrough,
    onCommandAction,
    onOpenDrawer,
    onCloseDrawer,
    onOpenDaoHeart,
    onCloseDaoHeart,
    onRunCompassAction,
  };
}
