import type { ReactNode } from 'react';
import classNames from 'classnames';
import { OverlaySwash } from './OverlaySwash.js';
import { SelectionHalo } from './SelectionHalo.js';
import './ScenicLabel.scss';

export type ScenicLabelTone = 'default' | 'recommendation' | 'warning';

export interface ScenicLabelProps {
  title: ReactNode;
  subtitle?: ReactNode;
  active?: boolean;
  compact?: boolean;
  tone?: ScenicLabelTone;
  className?: string;
  titleAttr?: string;
}

export function ScenicLabel({
  title,
  subtitle,
  active = false,
  compact = false,
  tone = 'default',
  className,
  titleAttr,
}: ScenicLabelProps) {
  const showRecommendationSwash = tone === 'recommendation';

  return (
    <span
      className={classNames(
        'scenicLabel',
        `scenicLabel--tone-${tone}`,
        {
          'scenicLabel--active': active,
          'scenicLabel--compact': compact,
        },
        className,
      )}
      title={titleAttr}
    >
      {showRecommendationSwash ? <OverlaySwash active variant="shortBar" tone="recommendation" placement="center" /> : null}
      <SelectionHalo active={active} tone={tone === 'recommendation' ? 'recommendation' : 'default'} variant="label" inset="tight" />
      <span className="scenicLabel__title">{title}</span>
      {subtitle ? <span className="scenicLabel__subtitle">{subtitle}</span> : null}
    </span>
  );
}
