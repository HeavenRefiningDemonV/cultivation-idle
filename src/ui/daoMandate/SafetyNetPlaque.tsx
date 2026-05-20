import classNames from 'classnames';

import type {
  DaoMandateEffectiveMotionMode,
  DaoMandateGuidanceProfile,
  DaoMandateTone,
  DaoSafetyNetSurface,
} from '../../systems/ui/daoMandate/index.js';
import type { DaoMandateRouteActionHandler } from './daoMandateComponentTypes.js';
import { DaoMandateRouteButton } from './DaoMandateRouteButton.js';
import { DaoMandateStatusSeal } from './DaoMandateStatusSeal.js';
import { getDaoMandateMotionClassName } from './daoMandateUiFormatters.js';
import './SafetyNetPlaque.scss';

export interface SafetyNetPlaqueProps {
  safetyNet: DaoSafetyNetSurface | null;
  profile?: DaoMandateGuidanceProfile;
  variant?: 'compact' | 'default' | 'emphasis';
  showWhenHidden?: boolean;
  onRouteAction?: DaoMandateRouteActionHandler;
  motionMode?: DaoMandateEffectiveMotionMode;
  className?: string;
}

function safetyTone(state: DaoSafetyNetSurface['state']): DaoMandateTone {
  switch (state) {
    case 'available':
    case 'resolved':
      return 'success';
    case 'progressing':
      return 'info';
    case 'blocked':
      return 'danger';
    case 'hidden':
      return 'muted';
  }
}

export function SafetyNetPlaque({
  safetyNet,
  profile = 'elder',
  variant = 'default',
  showWhenHidden = false,
  onRouteAction,
  motionMode = 'medium',
  className,
}: SafetyNetPlaqueProps) {
  if (!safetyNet || (safetyNet.state === 'hidden' && !showWhenHidden)) return null;

  const showDetail = profile !== 'sealed' && variant !== 'compact';

  return (
    <section
      className={classNames(
        'daoSafetyNetPlaque',
        `daoSafetyNetPlaque--${variant}`,
        `daoSafetyNetPlaque--state-${safetyNet.state}`,
        getDaoMandateMotionClassName(motionMode),
        className,
      )}
      data-dao-motion={motionMode}
      aria-label={safetyNet.label}
    >
      <div className="daoSafetyNetPlaque__main">
        <DaoMandateStatusSeal
          tone={safetyTone(safetyNet.state)}
          label={safetyNet.label}
          detail={safetyNet.state}
          state={safetyNet.state}
          motionMode={motionMode}
        />
        <div>
          <p className="daoSafetyNetPlaque__detail">{safetyNet.detail}</p>
          <p className="daoSafetyNetPlaque__progress">{safetyNet.progressLine}</p>
          {showDetail && safetyNet.costLine ? <p>{safetyNet.costLine}</p> : null}
          {showDetail && safetyNet.reserveLine ? <p>{safetyNet.reserveLine}</p> : null}
        </div>
      </div>
      {safetyNet.route ? (
        <div className="daoSafetyNetPlaque__route">
          <DaoMandateRouteButton
            route={safetyNet.route}
            onRouteAction={onRouteAction}
            variant={variant === 'emphasis' ? 'primary' : 'secondary'}
            size={variant === 'compact' ? 'compact' : 'default'}
            showDestination={showDetail}
          />
        </div>
      ) : null}
    </section>
  );
}
