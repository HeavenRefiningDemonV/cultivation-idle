import type { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import './InkPanel.scss';

export type InkPanelVariant =
  | 'default'
  | 'apothecary'
  | 'forge'
  | 'manual'
  | 'techniques'
  | 'prestige'
  | 'pouch'
  | 'heartlaw'
  | 'modal';

export type InkPanelSurface = 'surface' | 'raised' | 'inspector' | 'dense' | 'ritual';
export type InkPanelDensity = 'dense' | 'default' | 'roomy';

export interface InkPanelProps {
  variant?: InkPanelVariant;
  surface?: InkPanelSurface;
  density?: InkPanelDensity;
  header?: ReactNode;
  watermark?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function InkPanel({
  variant = 'default',
  surface = 'surface',
  density = 'default',
  header,
  watermark = false,
  className,
  style,
  children,
}: InkPanelProps) {
  return (
    <div
      className={classNames(
        'inkPanel',
        `inkPanel--${variant}`,
        `inkPanel--surface-${surface}`,
        `inkPanel--density-${density}`,
        { 'inkPanel--watermark': watermark },
        className,
      )}
      style={style}
    >
      {header ? <div className="inkPanel__header">{header}</div> : null}
      <div className="inkPanel__body">{children}</div>
    </div>
  );
}
