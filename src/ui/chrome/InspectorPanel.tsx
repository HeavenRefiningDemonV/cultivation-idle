import type { ReactNode } from 'react';
import classNames from 'classnames';
import { FrameCard } from './FrameCard.js';
import './InspectorPanel.scss';

export interface InspectorPanelProps {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  chips?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  scrollBody?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function InspectorPanel({
  title,
  subtitle,
  eyebrow,
  chips,
  meta,
  footer,
  scrollBody = false,
  className,
  bodyClassName,
  children,
}: InspectorPanelProps) {
  const isEmpty = !children;
  return (
    <FrameCard
      variant="inspector"
      className={classNames(
        'inspectorPanel',
        { 'inspectorPanel--scrollBody': scrollBody, 'inspectorPanel--empty': isEmpty },
        className,
      )}
    >
      <header className="inspectorPanel__header">
        {eyebrow ? <div className="inspectorPanel__eyebrow">{eyebrow}</div> : null}
        <div className="inspectorPanel__title">{title}</div>
        {subtitle ? <div className="inspectorPanel__subtitle">{subtitle}</div> : null}
      </header>
      {chips ? <div className="inspectorPanel__chips">{chips}</div> : null}
      {meta ? <div className="inspectorPanel__meta">{meta}</div> : null}
      <div className={classNames('inspectorPanel__body', bodyClassName)}>{children}</div>
      {footer ? <footer className="inspectorPanel__footer">{footer}</footer> : null}
    </FrameCard>
  );
}
