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
        },
        className,
      )}
      style={style}
      {...rest}
    >
      {children}
    </FrameCard>
  );
}
