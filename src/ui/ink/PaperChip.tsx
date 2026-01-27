import type { ReactNode } from 'react';
import classNames from 'classnames';
import './PaperChip.scss';

type PaperChipVariant = 'pill' | 'tag';
type PaperChipTone = 'neutral' | 'ink' | 'danger' | 'success' | 'rare' | 'merit';

export interface PaperChipProps {
  variant?: PaperChipVariant;
  icon?: ReactNode;
  text: string;
  tone?: PaperChipTone;
  onClick?: () => void;
  className?: string;
}

export function PaperChip({
  variant = 'pill',
  icon,
  text,
  tone = 'neutral',
  onClick,
  className,
}: PaperChipProps) {
  const classes = classNames(
    'inkPaperChip',
    {
      'inkPaperChip--tag': variant === 'tag',
      'inkPaperChip--clickable': Boolean(onClick),
    },
    `inkPaperChip--tone-${tone}`,
    className,
  );

  const content = (
    <>
      {icon ? <span className="inkPaperChip__icon">{icon}</span> : null}
      <span className="inkPaperChip__text">{text}</span>
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
