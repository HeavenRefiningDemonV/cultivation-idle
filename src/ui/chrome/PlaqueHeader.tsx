import type { ReactNode } from 'react';
import classNames from 'classnames';

export interface PlaqueHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PlaqueHeader({ title, eyebrow, subtitle, icon, actions, className }: PlaqueHeaderProps) {
  return (
    <header className={classNames('plaqueHeader', className)}>
      {icon ? <div className="plaqueHeader__icon">{icon}</div> : null}
      <div className="plaqueHeader__content">
        {eyebrow ? <div className="plaqueHeader__eyebrow">{eyebrow}</div> : null}
        <div className="plaqueHeader__title">{title}</div>
        {subtitle ? <div className="plaqueHeader__subtitle">{subtitle}</div> : null}
      </div>
      {actions ? <div className="plaqueHeader__actions">{actions}</div> : null}
    </header>
  );
}
