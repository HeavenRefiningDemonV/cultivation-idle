import classNames from 'classnames';
import './InlineOnboardingCallout.scss';

export interface InlineOnboardingCalloutProps {
  title: string;
  body: string;
  badgeLabel?: string | null;
  actionLabel?: string | null;
  onAction?: () => void;
  onDismiss?: () => void;
  tone?: 'paper' | 'ink';
  className?: string;
}

export function InlineOnboardingCallout({
  title,
  body,
  badgeLabel,
  actionLabel,
  onAction,
  onDismiss,
  tone = 'paper',
  className,
}: InlineOnboardingCalloutProps) {
  return (
    <div className={classNames('inlineOnboardingCallout', `inlineOnboardingCallout--${tone}`, className)} role="status" aria-live="polite">
      <div className="inlineOnboardingCallout__header">
        <div className="inlineOnboardingCallout__title">{title}</div>
        {badgeLabel ? <div className="inlineOnboardingCallout__badge">{badgeLabel}</div> : null}
      </div>
      <div className="inlineOnboardingCallout__body">{body}</div>
      <div className="inlineOnboardingCallout__actions">
        {actionLabel && onAction ? (
          <button type="button" className="worldScreenModuleButton" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
        <button type="button" className="worldScreenModuleButton worldScreenModuleButton--subtle" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
