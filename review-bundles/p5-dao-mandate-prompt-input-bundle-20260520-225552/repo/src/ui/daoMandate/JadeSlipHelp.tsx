import classNames from 'classnames';

import type {
  DaoJadeSlip,
  DaoMandateEffectiveMotionMode,
} from '../../systems/ui/daoMandate/index.js';
import type {
  DaoMandateDismissHandler,
  DaoMandateRouteActionHandler,
} from './daoMandateComponentTypes.js';
import { DaoMandateRouteButton } from './DaoMandateRouteButton.js';
import { getDaoMandateMotionClassName } from './daoMandateUiFormatters.js';
import './JadeSlipHelp.scss';

export interface JadeSlipHelpProps {
  slip: DaoJadeSlip;
  variant?: 'inline' | 'card' | 'compact';
  dismissed?: boolean;
  onDismiss?: DaoMandateDismissHandler;
  onRouteAction?: DaoMandateRouteActionHandler;
  motionMode?: DaoMandateEffectiveMotionMode;
  className?: string;
}

export function JadeSlipHelp({
  slip,
  variant = 'card',
  dismissed = false,
  onDismiss,
  onRouteAction,
  motionMode = 'medium',
  className,
}: JadeSlipHelpProps) {
  if (dismissed) return null;

  return (
    <aside
      className={classNames(
        'daoJadeSlipHelp',
        `daoJadeSlipHelp--${variant}`,
        getDaoMandateMotionClassName(motionMode),
        className,
      )}
      data-dao-motion={motionMode}
      data-slip-id={slip.id}
      aria-label={slip.title}
    >
      <div className="daoJadeSlipHelp__main">
        <span className="daoJadeSlipHelp__eyebrow">Jade slip</span>
        <strong>{slip.title}</strong>
        <p>{slip.detail}</p>
        {variant !== 'compact' ? <span className="daoJadeSlipHelp__trigger">Triggered by {slip.trigger}</span> : null}
      </div>
      <div className="daoJadeSlipHelp__actions">
        {slip.route ? (
          <DaoMandateRouteButton
            route={slip.route}
            onRouteAction={onRouteAction}
            variant="inline"
            size="compact"
          />
        ) : null}
        {onDismiss ? (
          <button
            type="button"
            className="daoJadeSlipHelp__dismiss"
            onClick={() => onDismiss(slip.id)}
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </aside>
  );
}
