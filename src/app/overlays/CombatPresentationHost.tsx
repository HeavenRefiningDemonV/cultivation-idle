import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CombatTheaterModal } from '../../components/combat/presentation/CombatTheaterModal';
import { CombatDock } from '../../components/combat/presentation/CombatDock';
import { useUIStore } from '../../stores/uiStore';
import { useActivityStore } from '../../stores/activityStore';
import type { CombatPresentationContext } from '../../stores/uiStore';
import { COMBAT_ACTIVITY_TYPES } from '../../types/activity';

export function CombatPresentationHost() {
  const { mode, context } = useUIStore((state) => state.combatPresentation);
  const isVisible = useUIStore((state) => state.isCombatVisible());
  const isDocked = useUIStore((state) => state.isCombatDocked());
  const activeActivity = useActivityStore((state) => state.active);

  const derivedContext = useMemo<CombatPresentationContext | null>(() => {
    if (context) return context;
    if (activeActivity && COMBAT_ACTIVITY_TYPES.includes(activeActivity.type)) {
      return {
        type: activeActivity.type as CombatPresentationContext['type'],
        cityId: activeActivity.cityId ?? activeActivity.payload?.cityId,
        sourceId: activeActivity.sourceId ?? activeActivity.payload?.sourceId,
      };
    }
    return null;
  }, [activeActivity, context]);

  if (!isVisible && !isDocked) return null;
  if (!derivedContext) return null;

  return createPortal(
    <>
      {isDocked ? <CombatDock context={derivedContext} /> : null}
      {isVisible ? (
        <CombatTheaterModal mode={mode === 'preview' ? 'preview' : 'active'} context={derivedContext} />
      ) : null}
    </>,
    document.body,
  );
}
