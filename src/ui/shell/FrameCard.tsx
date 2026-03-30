import type { ElementType, ReactNode } from 'react';
import classNames from 'classnames';
import { InkPanel, type InkPanelVariant } from '../ink/InkPanel.js';
import { PaperCard } from '../ink/PaperCard.js';
import { BadgeSlot } from './BadgeSlot.js';
import { PlaqueHeader } from './PlaqueHeader.js';
import './FrameCard.scss';

export type FrameCardFrame = 'panel' | 'card' | 'tray';
export type FrameCardEmphasis = 'light' | 'medium' | 'strong';
export type FrameCardSurface = 'surface' | 'raised' | 'inspector' | 'dense' | 'ritual';
export type FrameCardDensity = 'dense' | 'default' | 'roomy';

export interface FrameCardProps {
  as?: 'div' | 'section' | 'article';
  frame?: FrameCardFrame;
  surface?: FrameCardSurface;
  density?: FrameCardDensity;
  emphasis?: FrameCardEmphasis;
  title?: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  stamp?: ReactNode;
  watermark?: boolean;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  panelVariant?: InkPanelVariant;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  children: ReactNode;
}

function buildAutoHeader(props: Pick<FrameCardProps, 'title' | 'eyebrow' | 'subtitle' | 'actions' | 'stamp' | 'density' | 'emphasis' | 'headerClassName'>) {
  const { title, eyebrow, subtitle, actions, stamp, density = 'default', emphasis = 'medium', headerClassName } = props;
  if (!title && !eyebrow && !subtitle) return null;

  const plaqueDensity = density === 'dense' ? 'compact' : 'default';

  return (
    <PlaqueHeader
      title={title ?? ''}
      eyebrow={eyebrow}
      subtitle={subtitle}
      density={plaqueDensity}
      emphasis={emphasis}
      endSlot={stamp}
      actions={actions}
      className={headerClassName}
    />
  );
}

export function FrameCard({
  as: As = 'section',
  frame = 'panel',
  surface = 'surface',
  density = 'default',
  emphasis = 'medium',
  title,
  eyebrow,
  subtitle,
  header,
  footer,
  actions,
  stamp,
  watermark = false,
  interactive = false,
  selected = false,
  disabled = false,
  panelVariant = 'default',
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  children,
}: FrameCardProps) {
  const autoHeader = buildAutoHeader({ title, eyebrow, subtitle, actions, stamp, density, emphasis, headerClassName });
  const resolvedHeader = header ?? autoHeader;

  const cardBody = (
    <>
      {resolvedHeader ? <div className={classNames('frameCard__header', headerClassName)}>{resolvedHeader}</div> : null}
      {header && (stamp || actions) ? (
        <div className="frameCard__headerExtras">
          <BadgeSlot preset="headerTrailing">{stamp}</BadgeSlot>
          {actions ? <div className="frameCard__actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className={classNames('frameCard__body', bodyClassName)}>{children}</div>
      {footer ? <div className={classNames('frameCard__footer', footerClassName)}>{footer}</div> : null}
    </>
  );

  const shellClass = classNames('frameCard', `frameCard--${frame}`, `frameCard--${emphasis}`, className);

  if (frame === 'panel') {
    return (
      <As className="frameCardHost">
        <InkPanel
          variant={panelVariant}
          surface={surface}
          density={density}
          watermark={watermark}
          header={header ? undefined : autoHeader}
          className={shellClass}
        >
          {header ? (
            <div className={classNames('frameCard__header frameCard__header--panel', headerClassName)}>
              {header}
              {(stamp || actions) ? (
                <div className="frameCard__headerExtras">
                  <BadgeSlot preset="headerTrailing">{stamp}</BadgeSlot>
                  {actions ? <div className="frameCard__actions">{actions}</div> : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className={classNames('frameCard__body', bodyClassName)}>{children}</div>
          {footer ? <div className={classNames('frameCard__footer', footerClassName)}>{footer}</div> : null}
        </InkPanel>
      </As>
    );
  }

  return (
    <As className="frameCardHost">
      <PaperCard
        variant={frame === 'tray' ? 'tray' : 'card'}
        surface={surface}
        density={density}
        interactive={interactive}
        selected={selected}
        disabled={disabled}
        className={shellClass}
      >
        {cardBody}
      </PaperCard>
    </As>
  );
}
