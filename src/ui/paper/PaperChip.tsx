import type { ReactNode } from 'react';
import classNames from 'classnames';
import { ChromeChip, type ChromeChipTone, type ChromeChipVariant } from '../chrome/ChromeChip.js';
import './paper.scss';

type PaperChipVariant = Exclude<ChromeChipVariant, 'microLabel'>;
type PaperChipTone = Exclude<ChromeChipTone, 'warning' | 'recommendation'>;

export interface PaperChipProps {
  variant?: PaperChipVariant;
  icon?: ReactNode;
  text: string;
  tone?: PaperChipTone;
  onClick?: () => void;
  className?: string;
}

export function PaperChip({ variant = 'pill', icon, text, tone = 'neutral', onClick, className }: PaperChipProps) {
  return (
    <ChromeChip
      variant={variant}
      icon={icon}
      text={text}
      tone={tone}
      onClick={onClick}
      data-ui-chrome-surface="paper-chip"
      data-preserve-base-art="true"
      className={classNames(
        'paperChip',
        'uiChromeOverlaySurface',
        'uiChromeOverlaySurface--label',
        {
          'paperChip--tag': variant === 'tag',
          'paperChip--clickable': Boolean(onClick),
        },
        `paperChip--tone-${tone}`,
        className,
      )}
    />
  );
}
