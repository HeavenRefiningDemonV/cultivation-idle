import type { ReactNode } from 'react';
import classNames from 'classnames';
import './paper.scss';

type PaperChipVariant = 'pill' | 'tag';
type PaperChipTone = 'neutral' | 'ink' | 'danger' | 'success';

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
    'paperChip',
    {
      'paperChip--tag': variant === 'tag',
      'paperChip--clickable': Boolean(onClick),
    },
    `paperChip--tone-${tone}`,
    className,
  );

  const content = (
    <>
      {icon ? <span className="paperChip__icon">{icon}</span> : null}
      <span className="paperChip__text">{text}</span>
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
