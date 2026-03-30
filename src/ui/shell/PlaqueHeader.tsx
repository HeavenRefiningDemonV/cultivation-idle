import type { ReactNode } from 'react';
import classNames from 'classnames';
import { BadgeSlot } from './BadgeSlot.js';
import './PlaqueHeader.scss';

export type PlaqueHeaderVariant = 'section' | 'inspector' | 'location';
export type PlaqueHeaderEmphasis = 'light' | 'medium' | 'strong';
export type PlaqueHeaderDensity = 'compact' | 'default';
export type PlaqueHeaderAlign = 'start' | 'center';

export interface PlaqueHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  variant?: PlaqueHeaderVariant;
  emphasis?: PlaqueHeaderEmphasis;
  density?: PlaqueHeaderDensity;
  align?: PlaqueHeaderAlign;
  endSlot?: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function PlaqueHeader({
  title,
  eyebrow,
  subtitle,
  icon,
  variant = 'section',
  emphasis = 'medium',
  density = 'default',
  align = 'start',
  endSlot,
  actions,
  className,
  titleClassName,
  subtitleClassName,
}: PlaqueHeaderProps) {
  const hasTrailing = Boolean(endSlot) || Boolean(actions);

  return (
    <div
      className={classNames(
        'plaqueHeader',
        `plaqueHeader--${variant}`,
        `plaqueHeader--${emphasis}`,
        `plaqueHeader--${density}`,
        `plaqueHeader--${align}`,
        className,
      )}
    >
      <div className="plaqueHeader__main">
        {eyebrow ? <div className="plaqueHeader__eyebrow">{eyebrow}</div> : null}
        <div className="plaqueHeader__titleRow">
          {icon ? <span className="plaqueHeader__icon">{icon}</span> : null}
          <h3 className={classNames('plaqueHeader__title', titleClassName)}>{title}</h3>
        </div>
        {subtitle ? <div className={classNames('plaqueHeader__subtitle', subtitleClassName)}>{subtitle}</div> : null}
      </div>
      <div className="plaqueHeader__trailing">
        <BadgeSlot preset="headerTrailing" reserveWhenEmpty={!hasTrailing}>
          {endSlot}
        </BadgeSlot>
        {actions ? <div className="plaqueHeader__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
