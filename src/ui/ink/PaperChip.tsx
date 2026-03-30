import type { ReactNode } from 'react';
import classNames from 'classnames';
import { buildStableInteractiveClassName } from '../motion/layoutStability.js';
import './PaperChip.scss';

export type PaperChipVariant = 'pill' | 'tag';
export type PaperChipTone =
  | 'neutral'
  | 'ink'
  | 'danger'
  | 'success'
  | 'rare'
  | 'merit'
  | 'role'
  | 'ready'
  | 'warning'
  | 'recommended'
  | 'selected';

export interface PaperChipProps {
  variant?: PaperChipVariant;
  icon?: ReactNode;
  text: string;
  tone?: PaperChipTone;
  reserveIconSpace?: boolean;
  reserveEndSpace?: boolean;
  onClick?: () => void;
  className?: string;
}

function resolveEndMark(tone: PaperChipTone): ReactNode {
  switch (tone) {
    case 'selected':
      return '•';
    case 'recommended':
      return '◎';
    case 'warning':
      return '!';
    case 'ready':
      return 'R';
    default:
      return null;
  }
}

export function PaperChip({
  variant = 'pill',
  icon,
  text,
  tone = 'neutral',
  reserveIconSpace = false,
  reserveEndSpace = true,
  onClick,
  className,
}: PaperChipProps) {
  const endMark = resolveEndMark(tone);

  const classes = buildStableInteractiveClassName(
    classNames(
      'inkPaperChip',
      {
        'inkPaperChip--tag': variant === 'tag',
        'inkPaperChip--clickable': Boolean(onClick),
        'inkPaperChip--reserve-icon': reserveIconSpace,
        'inkPaperChip--reserve-end': reserveEndSpace || Boolean(endMark),
      },
      `inkPaperChip--tone-${tone}`,
      className,
    ),
    Boolean(onClick),
  );

  const content = (
    <>
      <span className="inkPaperChip__icon" aria-hidden="true">
        {icon ?? null}
      </span>
      <span className="inkPaperChip__text">{text}</span>
      <span className="inkPaperChip__end" aria-hidden="true">
        {endMark}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <span className={classes}>{content}</span>;
}
