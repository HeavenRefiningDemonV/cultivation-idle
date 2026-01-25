import type { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import './paper.scss';

type PaperCardVariant = 'card' | 'tray' | 'label';

export interface PaperCardProps {
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
}: PaperCardProps) {
  return (
    <div
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
    >
      {children}
    </div>
  );
}
