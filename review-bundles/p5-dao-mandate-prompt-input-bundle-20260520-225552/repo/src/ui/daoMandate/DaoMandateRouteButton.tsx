import { useId } from 'react';
import classNames from 'classnames';

import type { DaoMandateRoute } from '../../systems/ui/daoMandate/index.js';
import type { DaoMandateRouteActionHandler } from './daoMandateComponentTypes.js';
import {
  describeDaoRouteTarget,
  getDaoRouteButtonViewModel,
  getDaoRouteReasonElementId,
} from './daoMandateUiFormatters.js';
import './DaoMandateRouteButton.scss';

export interface DaoMandateRouteButtonProps {
  route: DaoMandateRoute | null;
  onRouteAction?: DaoMandateRouteActionHandler;
  variant?: 'primary' | 'secondary' | 'ghost' | 'inline';
  size?: 'compact' | 'default' | 'large';
  disabled?: boolean;
  disabledReason?: string | null;
  showDestination?: boolean;
  className?: string;
}

export function DaoMandateRouteButton({
  route,
  onRouteAction,
  variant = 'primary',
  size = 'default',
  disabled = false,
  disabledReason = null,
  showDestination = false,
  className,
}: DaoMandateRouteButtonProps) {
  const reactId = useId();
  const viewModel = getDaoRouteButtonViewModel({
    route,
    hasHandler: Boolean(onRouteAction),
    disabled,
    disabledReason,
  });
  const reasonId = getDaoRouteReasonElementId(route?.id, reactId);
  const destinationLabel = route ? describeDaoRouteTarget(route) : null;

  return (
    <span
      className={classNames(
        'daoMandateRouteButtonWrap',
        `daoMandateRouteButtonWrap--${variant}`,
        className,
      )}
      data-route-id={route?.id ?? 'none'}
      data-route-blocked={String(!viewModel.enabled)}
      data-route-kind={viewModel.kind}
    >
      <button
        type="button"
        className={classNames(
          'daoMandateRouteButton',
          `daoMandateRouteButton--${variant}`,
          `daoMandateRouteButton--${size}`,
          `daoMandateRouteButton--${viewModel.kind}`,
        )}
        disabled={!viewModel.enabled}
        aria-label={viewModel.ariaLabel}
        aria-describedby={viewModel.reason ? reasonId : undefined}
        data-testid="dao-mandate-route-button"
        data-route-id={route?.id ?? 'none'}
        data-route-blocked={String(!viewModel.enabled)}
        data-route-kind={viewModel.kind}
        onClick={() => {
          if (!route || !viewModel.enabled) return;
          onRouteAction?.(route);
        }}
      >
        <span className="daoMandateRouteButton__label">{viewModel.label}</span>
        {showDestination && viewModel.destinationLabel ? (
          <span className="daoMandateRouteButton__destination">{viewModel.destinationLabel}</span>
        ) : null}
      </button>
      {showDestination && destinationLabel && !viewModel.destinationLabel ? (
        <span className="daoMandateRouteButton__target">{destinationLabel}</span>
      ) : null}
      <span
        id={reasonId}
        className={classNames('daoMandateRouteButton__reason', {
          'daoMandateRouteButton__reason--empty': !viewModel.reason,
        })}
        aria-hidden={!viewModel.reason ? true : undefined}
      >
        {viewModel.reason ?? '\u00A0'}
      </span>
    </span>
  );
}
