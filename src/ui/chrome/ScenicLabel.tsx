import type { ReactNode } from 'react';
import classNames from 'classnames';

export interface ScenicLabelProps {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}

export function ScenicLabel({ title, subtitle, className }: ScenicLabelProps) {
  return (
    <span className={classNames('scenicLabel', className)}>
      <span className="scenicLabel__title">{title}</span>
      {subtitle ? <span className="scenicLabel__subtitle">{subtitle}</span> : null}
    </span>
  );
}
