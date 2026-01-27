import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';
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
      {...rest}
    >
      {children}
    </div>
  );
}
