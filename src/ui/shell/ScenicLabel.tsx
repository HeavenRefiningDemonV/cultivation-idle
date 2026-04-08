import type { FocusEventHandler, MouseEventHandler, ReactNode } from 'react';
import classNames from 'classnames';
import './ScenicLabel.scss';

export const SCENIC_LABEL_VARIANT_OPTIONS = ['building', 'location'] as const;
export type ScenicLabelVariant = (typeof SCENIC_LABEL_VARIANT_OPTIONS)[number];

export const SCENIC_LABEL_STATE_OPTIONS = ['default', 'active', 'recommended', 'locked'] as const;
export type ScenicLabelState = (typeof SCENIC_LABEL_STATE_OPTIONS)[number];

export const SCENIC_LABEL_EMPHASIS_OPTIONS = ['quiet', 'medium'] as const;
export type ScenicLabelEmphasis = (typeof SCENIC_LABEL_EMPHASIS_OPTIONS)[number];

export interface ScenicLabelProps {
  label: ReactNode;
  sublabel?: ReactNode;
  variant?: ScenicLabelVariant;
  state?: ScenicLabelState;
  emphasis?: ScenicLabelEmphasis;
  reserveStateSlot?: boolean;
  stateSlot?: ReactNode;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  sublabelClassName?: string;
  onClick?: () => void;
  onMouseEnter?: MouseEventHandler<HTMLElement>;
  onMouseLeave?: MouseEventHandler<HTMLElement>;
  onFocus?: FocusEventHandler<HTMLElement>;
  onBlur?: FocusEventHandler<HTMLElement>;
  title?: string;
}

function getDefaultStateSlot(state: ScenicLabelState): ReactNode {
  switch (state) {
    case 'active':
      return 'ON';
    case 'recommended':
      return 'REC';
    case 'locked':
      return 'LOCK';
    case 'default':
    default:
      return null;
  }
}

export function ScenicLabel({
  label,
  sublabel,
  variant = 'building',
  state = 'default',
  emphasis = 'quiet',
  reserveStateSlot = true,
  stateSlot,
  disabled = false,
  className,
  labelClassName,
  sublabelClassName,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  title,
}: ScenicLabelProps) {
  const interactive = Boolean(onClick);
  const resolvedState = disabled && state === 'default' ? 'locked' : state;
  const stateContent = stateSlot ?? getDefaultStateSlot(resolvedState);
  const showStateSlot = reserveStateSlot || Boolean(stateContent);

  const content = (
    <>
      <span className="scenicLabel__textStack">
        <span className={classNames('scenicLabel__label', labelClassName)}>{label}</span>
        {sublabel ? <span className={classNames('scenicLabel__sublabel', sublabelClassName)}>{sublabel}</span> : null}
      </span>
      {showStateSlot ? (
        <span className="scenicLabel__stateSlot" aria-hidden={stateContent ? undefined : 'true'}>
          {stateContent ?? <span className="scenicLabel__statePlaceholder" aria-hidden="true" />}
        </span>
      ) : null}
    </>
  );

  const sharedProps = {
    className: classNames(
      'scenicLabel',
      `scenicLabel--${variant}`,
      `scenicLabel--${resolvedState}`,
      `scenicLabel--${emphasis}`,
      { 'scenicLabel--interactive': interactive },
      className,
    ),
    title,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
  };

  if (interactive) {
    return (
      <button
        type="button"
        {...sharedProps}
        disabled={disabled}
        onClick={onClick}
        aria-pressed={resolvedState === 'active' ? true : undefined}
      >
        {content}
      </button>
    );
  }

  return <div {...sharedProps}>{content}</div>;
}
