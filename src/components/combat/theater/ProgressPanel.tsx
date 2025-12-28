import { useMemo } from 'react';
import { useActivityStore } from '../../../stores/activityStore';
import { useCombatStore } from '../../../stores/combatStore';
import { OutskirtsProgress } from './panels/OutskirtsProgress';
import { TrialProgress } from '../../../features/trials/ui/TrialProgress';
import { RuinsProgress } from '../../../features/ruins/ui/RuinsProgress';

export function ProgressPanel() {
  const activity = useActivityStore((state) => state.active);
  const combatContext = useCombatStore((state) => state.combatContext);

  const contextType = combatContext?.type ?? null;
  const activeType = activity?.type ?? null;

  const target = useMemo(() => {
    if (activeType) return activeType;
    return contextType;
  }, [activeType, contextType]);

  if (target === 'outskirts') {
    return (
      <div className="combat-theater__panel">
        <OutskirtsProgress />
      </div>
    );
  }

  if (target === 'trial') {
    return (
      <div className="combat-theater__panel">
        <TrialProgress />
      </div>
    );
  }

  if (target === 'ruins') {
    return (
      <div className="combat-theater__panel">
        <RuinsProgress />
      </div>
    );
  }

  return null;
}
