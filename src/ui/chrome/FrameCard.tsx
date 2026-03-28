import type { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import { PaperCard } from '../paper/PaperCard.js';

export type FrameCardVariant = 'card' | 'tray' | 'label' | 'pouch';

export interface FrameCardProps {
  variant?: FrameCardVariant;
  interactive?: boolean;
  selected?: boolean;
  complete?: boolean;
  claimed?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function FrameCard({
  variant = 'card',
  interactive = false,
  selected = false,
  complete = false,
  claimed = false,
  disabled = false,
  className,
  style,
  children,
}: FrameCardProps) {
  const paperVariant = variant === 'pouch' ? 'card' : variant;

  return (
    <PaperCard
      variant={paperVariant}
      interactive={interactive}
      selected={selected}
      complete={complete}
      claimed={claimed}
      disabled={disabled}
      className={classNames('chromeFrameCard', { 'chromeFrameCard--pouch': variant === 'pouch' }, className)}
      style={style}
    >
      {children}
    </PaperCard>
  );
}
