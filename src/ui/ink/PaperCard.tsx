import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';
import './PaperCard.scss';

export type PaperCardVariant = 'card' | 'tray' | 'label' | 'pouch';
export type PaperCardSurface = 'surface' | 'raised' | 'inspector' | 'dense' | 'ritual';
export type PaperCardDensity = 'dense' | 'default' | 'roomy';

export interface PaperCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: PaperCardVariant;
  surface?: PaperCardSurface;
  density?: PaperCardDensity;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}

export function PaperCard({
  variant = 'card',
  surface = 'surface',
  density = 'default',
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
        `inkPaperCard--surface-${surface}`,
        `inkPaperCard--density-${density}`,
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
