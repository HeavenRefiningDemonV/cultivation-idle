import { useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { CombatTheater } from '../../components/combat/theater/CombatTheater';
import './CombatTheaterOverlay.css';

export function CombatTheaterOverlay() {
  const showCombatMinibar = useUIStore((state) => state.settings.showCombatMinibar);
  const combatTheaterOpen = useUIStore((state) => state.combatTheaterOpen);
  const closeCombatTheater = useUIStore((state) => state.closeCombatTheater);

  useEffect(() => {
    if (!showCombatMinibar && combatTheaterOpen) {
      closeCombatTheater();
    }
  }, [showCombatMinibar, combatTheaterOpen, closeCombatTheater]);

  if (!showCombatMinibar || !combatTheaterOpen) {
    return null;
  }

  return (
    <div className="combat-theater-overlay">
      <div className="combat-theater-overlay__panel">
        <CombatTheater onClose={closeCombatTheater} />
      </div>
    </div>
  );
}

