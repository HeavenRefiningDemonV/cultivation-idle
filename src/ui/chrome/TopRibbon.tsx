import type { ReactNode } from 'react';
import classNames from 'classnames';

export interface TopRibbonProps {
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function TopRibbon({ start, center, end, children, className }: TopRibbonProps) {
  return (
    <header className={classNames('topRibbon', className)}>
      {children ?? (
        <>
          <div className="topRibbon__start">{start}</div>
          <div className="topRibbon__center">{center}</div>
          <div className="topRibbon__end">{end}</div>
        </>
      )}
    </header>
  );
}
