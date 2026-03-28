import type { ReactNode } from 'react';
import classNames from 'classnames';
import { FrameCard } from './FrameCard.js';
import './TopRibbon.scss';

export type TopRibbonSurface = 'none' | 'tray';

export interface TopRibbonProps {
  children: ReactNode;
  chips?: ReactNode;
  end?: ReactNode;
  compact?: boolean;
  surface?: TopRibbonSurface;
  className?: string;
}

export function TopRibbon({ children, chips, end, compact = false, surface = 'none', className }: TopRibbonProps) {
  const content = (
    <div className={classNames('topRibbon__inner', { 'topRibbon__inner--compact': compact })}>
      <div className="topRibbon__stats">{children}</div>
      {chips ? <div className="topRibbon__chips">{chips}</div> : null}
      {end ? <div className="topRibbon__end">{end}</div> : null}
    </div>
  );

  if (surface === 'tray') {
    return (
      <div className={classNames('topRibbon', 'topRibbon--surface-tray', { 'topRibbon--compact': compact }, className)}>
        <FrameCard variant="tray" className="topRibbon__surfaceCard">
          {content}
        </FrameCard>
      </div>
    );
  }

  return (
    <div className={classNames('topRibbon', 'topRibbon--surface-none', { 'topRibbon--compact': compact }, className)}>
      {content}
    </div>
  );
}
