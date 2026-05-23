import { useId, useState } from 'react';
import classNames from 'classnames';

import type { DaoSourceThreadOptionV1, DaoSourceThreadV1 } from '../../systems/ui/daoMandate/daoOmenProjectionTypes.js';
import './SourceThreadDrawer.scss';

export interface SourceThreadAction {
  label: string;
  ariaLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  onClick?: () => void;
}

export interface SourceThreadDrawerProps {
  threads: DaoSourceThreadV1[];
  initiallyOpen?: boolean;
  title?: string;
  summary?: string;
  getThreadAction?: (thread: DaoSourceThreadV1) => SourceThreadAction | undefined;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  testId?: string;
}

export function SourceThreadDrawer({
  threads,
  initiallyOpen = false,
  title = 'Source threads',
  summary,
  getThreadAction,
  onOpenChange,
  className,
  testId = 'dao-source-thread-drawer',
}: SourceThreadDrawerProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const reactId = useId();
  const contentId = `${testId}-${reactId}-content`;
  const threadCountLabel = `${threads.length} ${threads.length === 1 ? 'source thread' : 'source threads'}`;

  const toggleOpen = (): void => {
    const nextOpen = !open;
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <section
      className={classNames('daoSourceThreadDrawer', open && 'daoSourceThreadDrawer--open', className)}
      aria-label={title}
      data-testid={testId}
    >
      <div className="daoSourceThreadDrawer__summary">
        <span className="daoSourceThreadDrawer__icon" aria-hidden="true">
          <span className="daoSourceThreadDrawer__glyph" />
        </span>
        <span className="daoSourceThreadDrawer__text">
          <span className="daoSourceThreadDrawer__title">{title}</span>
          <span className="daoSourceThreadDrawer__count">{summary ?? threadCountLabel}</span>
        </span>
        <button
          type="button"
          className="daoSourceThreadDrawer__toggle"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={toggleOpen}
        >
          {open ? 'Hide threads' : 'Show threads'}
        </button>
      </div>

      {open ? (
        <div id={contentId} className="daoSourceThreadDrawer__content" role="region" aria-label={`${title} details`}>
          {threads.length === 0 ? (
            <p className="daoSourceThreadDrawer__empty">No source thread is visible.</p>
          ) : (
            <div className="daoSourceThreadDrawer__list" role="list">
              {threads.map((thread) => (
                <SourceThreadItem key={thread.id} thread={thread} action={getThreadAction?.(thread)} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function SourceThreadItem({
  thread,
  action,
}: {
  thread: DaoSourceThreadV1;
  action?: SourceThreadAction;
}) {
  const disabledReasonId = `dao-source-thread-${thread.id}-disabled-reason`;

  return (
    <article className="daoSourceThread" role="listitem" aria-label={thread.label}>
      <div className="daoSourceThread__heading">
        <span className="daoSourceThread__label">{thread.label}</span>
        <span className="daoSourceThread__visibility">{sourceVisibilityLabel(thread.routeVisibility)}</span>
      </div>
      <p className="daoSourceThread__evidence">{thread.evidenceLine}</p>
      <dl className="daoSourceThread__facts">
        <div>
          <dt>Need</dt>
          <dd>{thread.missingThing}</dd>
        </div>
        <div>
          <dt>Sink</dt>
          <dd>{thread.sinkLabel}</dd>
        </div>
      </dl>
      <SourceThreadOptions thread={thread} />
      {action ? (
        <div className="daoSourceThread__action">
          <button
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.ariaLabel ?? action.label}
            aria-describedby={action.disabled && action.disabledReason ? disabledReasonId : undefined}
          >
            {action.label}
          </button>
          {action.disabled && action.disabledReason ? (
            <span id={disabledReasonId} className="daoSourceThread__disabledReason">
              {action.disabledReason}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function SourceThreadOptions({ thread }: { thread: DaoSourceThreadV1 }) {
  const options = [
    ...(thread.bestSource ? [thread.bestSource] : []),
    ...thread.fallbackSources,
  ];

  if (options.length === 0) return null;

  return (
    <ul className="daoSourceThread__options" aria-label={`${thread.label} provenance`}>
      {options.map((option) => (
        <li key={option.id}>
          <SourceThreadOption option={option} />
        </li>
      ))}
    </ul>
  );
}

function SourceThreadOption({ option }: { option: DaoSourceThreadOptionV1 }) {
  return (
    <span className="daoSourceThread__option">
      <span className="daoSourceThread__optionLabel">{option.label}</span>
      <span className="daoSourceThread__optionDetail">{option.detail}</span>
      {option.lockedReason ? <span className="daoSourceThread__locked">{option.lockedReason}</span> : null}
    </span>
  );
}

function sourceVisibilityLabel(visibility: DaoSourceThreadV1['routeVisibility']): string {
  switch (visibility) {
    case 'hidden':
      return 'Folded';
    case 'drawer':
      return 'Drawer';
    case 'local_owner':
      return 'Local owner';
    case 'hard_lock':
      return 'Hard proof';
  }
}
