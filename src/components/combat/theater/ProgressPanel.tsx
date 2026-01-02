import { useMemo } from 'react';
import { useActivityStore } from '../../../stores/activityStore';
import { useCombatStore } from '../../../stores/combatStore';
import { OutskirtsProgress } from './panels/OutskirtsProgress';
import { TrialProgress } from '../../../features/trials/ui/TrialProgress';
import { RuinsProgress } from '../../../features/ruins/ui/RuinsProgress';

export type CombatTheaterFocus =
  | { type: 'outskirts'; id: string }
  | { type: 'ruins'; id: string }
  | { type: 'trial'; id: string }
  | { type: null };

export function ProgressPanel({ focus }: { focus?: CombatTheaterFocus }) {
  const activity = useActivityStore((state) => state.active);
  const combatContext = useCombatStore((state) => state.combatContext);

  const contextType = combatContext?.type ?? null;
  const activeType = activity?.type ?? null;

  const target = useMemo(() => {
    if (focus?.type) return focus.type;
    if (activeType) return activeType;
    return contextType;
  }, [activeType, contextType, focus?.type]);

  if (target === 'outskirts') {
    return (
      <div className="combat-theater__panel">
        <OutskirtsProgress outskirtsId={focus?.type === 'outskirts' ? focus.id : undefined} />
      </div>
    );
  }

  if (target === 'trial') {
    return (
      <div className="combat-theater__panel">
        <TrialProgress trialId={focus?.type === 'trial' ? focus.id : undefined} />
      </div>
    );
  }

  if (target === 'ruins') {
    return (
      <div className="combat-theater__panel">
        <RuinsProgress ruinsId={focus?.type === 'ruins' ? focus.id : undefined} />
      </div>
    );
  }

  return null;
}
