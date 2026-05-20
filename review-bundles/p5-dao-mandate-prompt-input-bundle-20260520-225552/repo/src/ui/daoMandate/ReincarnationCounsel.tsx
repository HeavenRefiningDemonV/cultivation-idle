import classNames from 'classnames';

import type {
  DaoMandateEffectiveMotionMode,
  DaoMandateGuidanceProfile,
  DaoMandateTone,
  DaoReincarnationCounselSurface,
} from '../../systems/ui/daoMandate/index.js';
import type { DaoMandateRouteActionHandler } from './daoMandateComponentTypes.js';
import { DaoMandateRouteButton } from './DaoMandateRouteButton.js';
import { DaoMandateStatusSeal } from './DaoMandateStatusSeal.js';
import { getDaoMandateMotionClassName } from './daoMandateUiFormatters.js';
import './ReincarnationCounsel.scss';

export interface ReincarnationCounselProps {
  counsel: DaoReincarnationCounselSurface | null;
  profile?: DaoMandateGuidanceProfile;
  variant?: 'compact' | 'default' | 'full';
  onRouteAction?: DaoMandateRouteActionHandler;
  motionMode?: DaoMandateEffectiveMotionMode;
  className?: string;
}

function counselTone(state: DaoReincarnationCounselSurface['state']): DaoMandateTone {
  switch (state) {
    case 'recommended':
    case 'cap_recommended':
      return 'success';
    case 'viable':
      return 'info';
    case 'blocked':
      return 'danger';
    case 'hidden':
    case 'too_early':
      return 'muted';
  }
}

export function ReincarnationCounsel({
  counsel,
  profile = 'elder',
  variant = 'default',
  onRouteAction,
  motionMode = 'medium',
  className,
}: ReincarnationCounselProps) {
  if (!counsel || counsel.state === 'hidden') return null;
  const showDetail = profile !== 'sealed' && variant !== 'compact';

  return (
    <section
      className={classNames(
        'daoReincarnationCounsel',
        `daoReincarnationCounsel--${variant}`,
        `daoReincarnationCounsel--state-${counsel.state}`,
        getDaoMandateMotionClassName(motionMode),
        className,
      )}
      data-dao-motion={motionMode}
      aria-label={counsel.label}
    >
      <div className="daoReincarnationCounsel__main">
        <DaoMandateStatusSeal
          tone={counselTone(counsel.state)}
          label={counsel.label}
          detail={counsel.state}
          state={counsel.state}
          motionMode={motionMode}
        />
        <div>
          <p>{counsel.detail}</p>
          {showDetail && counsel.forecastLine ? <strong>{counsel.forecastLine}</strong> : null}
        </div>
      </div>
      {counsel.route ? (
        <DaoMandateRouteButton
          route={counsel.route}
          onRouteAction={onRouteAction}
          variant={counsel.state === 'recommended' || counsel.state === 'cap_recommended' ? 'primary' : 'secondary'}
          size={variant === 'compact' ? 'compact' : 'default'}
          showDestination={showDetail}
        />
      ) : null}
    </section>
  );
}
