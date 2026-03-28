import type { ReactNode } from 'react';
import classNames from 'classnames';
import './RibbonStat.scss';

export type RibbonStatTone = 'default' | 'success' | 'warning';

export interface RibbonStatProps {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  tone?: RibbonStatTone;
  truncate?: boolean;
  title?: string;
  className?: string;
}

export function RibbonStat({
  label,
  value,
  detail,
  icon,
  tone = 'default',
  truncate = false,
  title,
  className,
}: RibbonStatProps) {
  return (
    <div className={classNames('ribbonStat', `ribbonStat--tone-${tone}`, { 'ribbonStat--truncate': truncate }, className)} title={title}>
      <div className="ribbonStat__label">
        {icon ? <span className="ribbonStat__icon">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <div className="ribbonStat__value">{value}</div>
      {detail ? <div className="ribbonStat__detail">{detail}</div> : null}
    </div>
  );
}
