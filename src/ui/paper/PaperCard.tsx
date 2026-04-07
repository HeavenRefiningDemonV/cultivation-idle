import type { ReactNode } from 'react';
import classNames from 'classnames';
import { PaperCard as InkPaperCard, type PaperCardProps as InkPaperCardProps } from '../ink/PaperCard.js';
import './paper.scss';

type PaperCardVariant = 'card' | 'tray' | 'label';

export interface PaperCardProps extends Omit<InkPaperCardProps, 'variant' | 'selected' | 'disabled' | 'children'> {
  variant?: PaperCardVariant;
  selected?: boolean;
  complete?: boolean;
  claimed?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

/**
 * Compatibility wrapper only.
 * Canonical primitive behavior lives in `ui/ink/PaperCard`.
 */
export function PaperCard({
  variant = 'card',
  interactive = false,
  selected = false,
  complete = false,
  claimed = false,
  disabled = false,
  className,
  children,
  ...rest
}: PaperCardProps) {
  return (
    <InkPaperCard
      variant={variant}
      interactive={interactive}
      selected={selected}
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
      {...rest}
    >
      {children}
    </InkPaperCard>
  );
}
