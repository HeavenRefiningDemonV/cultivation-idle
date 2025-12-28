import { useMemo } from 'react';
import { useActivityStore } from '../../../stores/activityStore';
import { useCombatStore } from '../../../stores/combatStore';
import { OutskirtsProgress } from './panels/OutskirtsProgress';

function TrialProgressStub() {
  return <div className="combat-theater__progress-placeholder">Trial progress coming in P12-2.</div>;
}

function RuinsProgressStub() {
  return <div className="combat-theater__progress-placeholder">Ruins progress coming in P12-3.</div>;
}

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
        <TrialProgressStub />
      </div>
    );
  }

  if (target === 'ruins') {
    return (
      <div className="combat-theater__panel">
        <RuinsProgressStub />
      </div>
    );
  }

  return null;
}
