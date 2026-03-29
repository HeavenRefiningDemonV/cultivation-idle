import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';
import { FrameCard } from '../chrome/FrameCard.js';
import './PaperCard.scss';

type PaperCardVariant = 'card' | 'tray' | 'label' | 'pouch';

export interface PaperCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: PaperCardVariant;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}

export function PaperCard({
  variant = 'card',
  interactive = false,
  selected = false,
  disabled = false,
  className,
  style,
  children,
  ...rest
}: PaperCardProps) {
  const frameVariant = variant === 'tray' ? 'tray' : variant === 'label' ? 'label' : 'shell';
  const frameSkin = variant === 'pouch' ? 'pouch' : 'default';

  return (
    <FrameCard
      variant={frameVariant}
      skin={frameSkin}
      interactive={interactive}
      selected={selected}
      disabled={disabled}
      className={classNames(
        'inkPaperCard',
        'uiChromeOverlaySurface',
        'uiChromeDoNotFlatten',
        `inkPaperCard--${variant}`,
        {
          'inkPaperCard--interactive': interactive,
          'inkPaperCard--selected': selected,
          'inkPaperCard--disabled': disabled,
          'uiChromeOverlaySurface--raised': variant === 'tray',
          'uiChromeOverlaySurface--label': variant === 'label',
        },
        className,
      )}
      style={style}
      data-ui-chrome-surface="ink-paper-card"
      data-preserve-base-art="true"
      {...rest}
    >
      {children}
    </FrameCard>
  );
}
