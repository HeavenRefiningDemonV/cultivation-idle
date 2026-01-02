import { ReactNode } from 'react';

import './CombatTheaterPreviewCard.scss';

type CombatPreviewVariant = 'outskirts' | 'gateTrial' | 'ruins';

interface CombatTheaterPreviewCardProps {
  moduleLabel: string;
  title: string;
  subtitle?: string;
  variant: CombatPreviewVariant;
  statusLine?: string;
  children: ReactNode;
  actions: ReactNode;
}

export function CombatTheaterPreviewCard({
  moduleLabel,
  title,
  subtitle,
  variant,
  statusLine,
  children,
  actions,
}: CombatTheaterPreviewCardProps) {
  return (
    <div className={`combatPreviewCard combatPreviewCard--${variant}`}>
      <div className="combatPreviewCard__hero">
        <div className="combatPreviewCard__chip">{moduleLabel}</div>
        <div className="combatPreviewCard__title">{title}</div>
        {subtitle && <div className="combatPreviewCard__subtitle">{subtitle}</div>}
        {statusLine && <div className="combatPreviewCard__status">{statusLine}</div>}
      </div>

      <div className="combatPreviewCard__body">
        <div className="combatPreviewCard__grid">{children}</div>
      </div>

      <div className="combatPreviewCard__actions">{actions}</div>
    </div>
  );
}
