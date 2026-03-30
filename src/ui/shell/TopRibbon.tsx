import type { ReactNode } from 'react';
import classNames from 'classnames';
import { PlaqueHeader } from './PlaqueHeader.js';
import { BadgeSlot } from './BadgeSlot.js';
import { PaperChip } from '../ink/PaperChip.js';
import './TopRibbon.scss';

export type TopRibbonVariant = 'hero' | 'world' | 'dense';
export type TopRibbonDensity = 'compact' | 'default';
export type TopRibbonTone = 'paper' | 'ink';
export type TopRibbonItemTone = 'neutral' | 'bronze' | 'jade' | 'warning' | 'seal';

export interface TopRibbonItem {
  id: string;
  label?: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  tone?: TopRibbonItemTone;
  title?: string;
}

export interface TopRibbonProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  header?: ReactNode;
  variant?: TopRibbonVariant;
  density?: TopRibbonDensity;
  tone?: TopRibbonTone;
  startSlot?: ReactNode;
  endSlot?: ReactNode;
  items?: TopRibbonItem[];
  meta?: ReactNode;
  className?: string;
  contentClassName?: string;
}

function toChipTone(tone: TopRibbonItemTone | undefined): 'neutral' | 'rare' | 'ready' | 'warning' | 'recommended' {
  switch (tone) {
    case 'bronze':
      return 'rare';
    case 'jade':
      return 'ready';
    case 'warning':
      return 'warning';
    case 'seal':
      return 'recommended';
    default:
      return 'neutral';
  }
}

function buildAutoHeader(props: Pick<TopRibbonProps, 'title' | 'subtitle' | 'eyebrow' | 'variant' | 'density' | 'meta'>) {
  const { title, subtitle, eyebrow, variant = 'hero', density = 'default', meta } = props;
  if (!title && !subtitle && !eyebrow) return null;

  return (
    <PlaqueHeader
      title={title ?? ''}
      subtitle={subtitle}
      eyebrow={eyebrow}
      variant={variant === 'world' ? 'location' : 'section'}
      emphasis={variant === 'hero' ? 'strong' : 'medium'}
      density={density === 'compact' ? 'compact' : 'default'}
      endSlot={meta}
      className="topRibbon__plaqueHeader"
    />
  );
}

export function TopRibbon({
  title,
  subtitle,
  eyebrow,
  header,
  variant = 'hero',
  density = 'default',
  tone = 'paper',
  startSlot,
  endSlot,
  items,
  meta,
  className,
  contentClassName,
}: TopRibbonProps) {
  const resolvedHeader = header ?? buildAutoHeader({ title, subtitle, eyebrow, variant, density, meta });

  return (
    <section
      className={classNames(
        'topRibbon',
        `topRibbon--${variant}`,
        `topRibbon--${density}`,
        `topRibbon--${tone}`,
        className,
      )}
      aria-label="Top ribbon"
    >
      <div className={classNames('topRibbon__content', contentClassName)}>
        <div className="topRibbon__start">
          <BadgeSlot preset="headerTrailing">{startSlot}</BadgeSlot>
        </div>

        <div className="topRibbon__center">
          {resolvedHeader ? <div className="topRibbon__header">{resolvedHeader}</div> : null}
          {items && items.length > 0 ? (
            <div className="topRibbon__items" role="list">
              {items.map((item) => {
                const isSimpleValue = typeof item.value === 'string' || typeof item.value === 'number';
                const isSimpleLabel = typeof item.label === 'string' || typeof item.label === 'number' || item.label === undefined;

                return (
                  <div key={item.id} role="listitem" className="topRibbon__item" title={item.title}>
                    {isSimpleValue && isSimpleLabel ? (
                      <PaperChip
                        variant="pill"
                        icon={item.icon}
                        text={item.label ? `${item.label}: ${item.value}` : String(item.value)}
                        tone={toChipTone(item.tone)}
                        reserveIconSpace={Boolean(item.icon)}
                      />
                    ) : (
                      <div className="topRibbon__itemCustom">
                        {item.icon ? <span className="topRibbon__itemIcon">{item.icon}</span> : null}
                        {item.label ? <span className="topRibbon__itemLabel">{item.label}</span> : null}
                        <span className="topRibbon__itemValue">{item.value}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="topRibbon__end">
          <BadgeSlot preset="headerTrailing">{endSlot}</BadgeSlot>
        </div>
      </div>
    </section>
  );
}
