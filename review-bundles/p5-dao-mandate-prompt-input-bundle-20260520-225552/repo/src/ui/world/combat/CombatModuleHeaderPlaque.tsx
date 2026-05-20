import type { ReactNode } from 'react';

export interface CombatModuleHeaderPlaqueProps {
  moduleName: string;
  roleTag: string;
  bestUsedWhen: string;
  variant?: 'outskirts' | 'ruins' | 'gate-trial';
  chipRow?: ReactNode;
}

export function CombatModuleHeaderPlaque({
  moduleName,
  roleTag,
  bestUsedWhen,
  variant = 'outskirts',
  chipRow,
}: CombatModuleHeaderPlaqueProps) {
  return (
    <section className={`combatPathModule__header combatPathModule__header--${variant}`}>
      <div className="combatPathModule__headerMain">
        <h2 className="combatPathModule__title">{moduleName}</h2>
        <span className="combatPathModule__roleTag">{roleTag}</span>
      </div>
      <p className="combatPathModule__bestUsedWhen">{bestUsedWhen}</p>
      <div className="combatPathModule__chipRow">{chipRow}</div>
    </section>
  );
}
