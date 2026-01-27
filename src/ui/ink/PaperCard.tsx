import type { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import './PaperCard.scss';

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
        'inkPaperCard',
        `inkPaperCard--${variant}`,
        {
          'inkPaperCard--interactive': interactive,
          'inkPaperCard--selected': selected,
          'inkPaperCard--disabled': disabled,
        },
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
