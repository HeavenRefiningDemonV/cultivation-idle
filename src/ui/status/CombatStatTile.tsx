import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type CombatStatTileTone =
  | 'hp'
  | 'offense'
  | 'defense'
  | 'recovery'
  | 'crit'
  | 'evasion'
  | 'neutral';

type CombatStatTileProps = {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: CombatStatTileTone;
  sub?: string;
  title?: string;
  pulseKey?: string | number;
};

export function CombatStatTile({
  label,
  value,
  icon,
  tone = 'neutral',
  sub,
  title,
  pulseKey,
}: CombatStatTileProps) {
  const [pulsing, setPulsing] = useState(false);
  const prev = useRef(pulseKey);

  useEffect(() => {
    if (prev.current !== pulseKey) {
      prev.current = pulseKey;
      setPulsing(true);
      const timeout = window.setTimeout(() => setPulsing(false), 220);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [pulseKey]);

  return (
    <div className={`combatStatTile combatStatTile--${tone} ${pulsing ? 'is-pulsing' : ''}`} title={title}>
      <div className="combatStatTile__top">
        <span className="combatStatTile__icon" aria-hidden>
          {icon}
        </span>
        <span className="combatStatTile__label">{label}</span>
      </div>
      <div className="combatStatTile__valueRow">
        <span className="combatStatTile__value">{value}</span>
      </div>
      {sub ? <div className="combatStatTile__sub">{sub}</div> : null}
    </div>
  );
}
