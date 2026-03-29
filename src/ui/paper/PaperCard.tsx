import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';
import { FrameCard } from '../chrome/FrameCard.js';
import './paper.scss';

type PaperCardVariant = 'card' | 'tray' | 'label';

export interface PaperCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: PaperCardVariant;
  interactive?: boolean;
  selected?: boolean;
  complete?: boolean;
  claimed?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

const variantToFrameVariant: Record<PaperCardVariant, 'shell' | 'tray' | 'label'> = {
  card: 'shell',
  tray: 'tray',
  label: 'label',
};

export function PaperCard({
  variant = 'card',
  interactive = false,
  selected = false,
  complete = false,
  claimed = false,
  disabled = false,
  className,
  style,
  children,
  ...rest
}: PaperCardProps) {
  return (
    <FrameCard
      variant={variantToFrameVariant[variant]}
      interactive={interactive}
      selected={selected}
      complete={complete}
      claimed={claimed}
      disabled={disabled}
      className={classNames(
        'paperCard',
        'uiChromeOverlaySurface',
        'uiChromeDoNotFlatten',
        `paperCard--${variant}`,
        {
          'paperCard--interactive': interactive,
          'paperCard--selected': selected,
          'paperCard--disabled': disabled,
          isInteractive: interactive,
          isSelected: selected,
          isComplete: complete,
          isClaimed: claimed,
          isDisabled: disabled,
          'uiChromeOverlaySurface--raised': variant === 'tray',
          'uiChromeOverlaySurface--label': variant === 'label',
        },
        className,
      )}
      style={style}
      data-ui-chrome-surface="paper-card"
      data-preserve-base-art="true"
      {...rest}
    >
      {children}
    </FrameCard>
  );
}
