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
};

export function CombatStatTile({ label, value, icon, tone = 'neutral', sub, title }: CombatStatTileProps) {
  return (
    <div className={`combatStatTile combatStatTile--${tone}`} title={title}>
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
