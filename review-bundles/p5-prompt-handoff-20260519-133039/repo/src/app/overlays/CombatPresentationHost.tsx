import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CombatTheaterModal } from '../../components/combat/presentation/CombatTheaterModal.js';
import { CombatDock } from '../../components/combat/presentation/CombatDock.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useActivityStore } from '../../stores/activityStore.js';
import type { CombatPresentationContext } from '../../stores/uiStore.js';
import type { CombatTheaterFocus } from '../../components/combat/theater/ProgressPanel.js';
import { COMBAT_ACTIVITY_TYPES } from '../../types/activity.js';
import { useCombatStore } from '../../stores/combatStore.js';

export function CombatPresentationHost() {
  const { context } = useUIStore((state) => state.combatPresentation);
  const isVisible = useUIStore((state) => state.isCombatVisible());
  const isDocked = useUIStore((state) => state.isCombatDocked());
  const activeActivity = useActivityStore((state) => state.active);
  const inCombat = useCombatStore((state) => state.inCombat);

  const derivedContext = useMemo<CombatPresentationContext | null>(() => {
    if (context) return context;
    if (activeActivity && COMBAT_ACTIVITY_TYPES.includes(activeActivity.type)) {
      const inferredModuleKey = activeActivity.type === 'trial' ? 'gateTrial' : activeActivity.type;
      return {
        type: activeActivity.type as CombatPresentationContext['type'],
        cityId: activeActivity.cityId ?? activeActivity.payload?.cityId,
        sourceId: activeActivity.sourceId ?? activeActivity.payload?.sourceId,
        moduleKey: inferredModuleKey,
      };
    }
    return null;
  }, [activeActivity, context]);

  if (!isVisible && !isDocked) return null;
  if (!derivedContext) return null;

  const theaterMode = inCombat ? 'active' : 'preview';
  const focus: CombatTheaterFocus = derivedContext.sourceId
    ? { type: derivedContext.type, id: derivedContext.sourceId }
    : { type: null };

  return createPortal(
    <>
      {isDocked ? <CombatDock context={derivedContext} /> : null}
      {isVisible ? <CombatTheaterModal mode={theaterMode} context={derivedContext} focus={focus} /> : null}
    </>,
    document.body,
  );
}
