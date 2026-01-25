import type { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import './paper.scss';

type PaperCardVariant = 'card' | 'tray' | 'label';

export interface PaperCardProps {
  variant?: PaperCardVariant;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
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
        },
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
