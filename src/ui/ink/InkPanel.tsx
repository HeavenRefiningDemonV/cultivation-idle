import type { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import { FrameCard, type FrameCardSkin, type FrameCardVariant } from '../chrome/FrameCard.js';
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

export interface InkPanelProps {
  variant?: InkPanelVariant;
  header?: ReactNode;
  watermark?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

const variantMap: Record<InkPanelVariant, { variant: FrameCardVariant; skin: FrameCardSkin }> = {
  default: { variant: 'shell', skin: 'default' },
  apothecary: { variant: 'shell', skin: 'apothecary' },
  forge: { variant: 'shell', skin: 'forge' },
  manual: { variant: 'shell', skin: 'manual' },
  techniques: { variant: 'shell', skin: 'techniques' },
  prestige: { variant: 'shell', skin: 'prestige' },
  pouch: { variant: 'shell', skin: 'pouch' },
  heartlaw: { variant: 'shell', skin: 'heartlaw' },
  modal: { variant: 'modal', skin: 'default' },
};

export function InkPanel({
  variant = 'default',
  header,
  watermark = false,
  className,
  style,
  children,
}: InkPanelProps) {
  const mapped = variantMap[variant];

  return (
    <FrameCard
      variant={mapped.variant}
      skin={mapped.skin}
      watermark={watermark}
      className={classNames('inkPanel', `inkPanel--${variant}`, { 'inkPanel--watermark': watermark }, className)}
      style={style}
      header={header ? <div className="inkPanel__header">{header}</div> : undefined}
    >
      <div className="inkPanel__body">{children}</div>
    </FrameCard>
  );
}
