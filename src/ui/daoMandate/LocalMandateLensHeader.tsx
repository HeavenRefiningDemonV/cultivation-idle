import classNames from 'classnames';

import type {
  DaoLocalLensSurface,
  DaoMandateEffectiveMotionMode,
  DaoMandateGuidanceProfile,
  DaoMandateTone,
} from '../../systems/ui/daoMandate/index.js';
import type { DaoMandateRouteActionHandler } from './daoMandateComponentTypes.js';
import { DaoMandateRouteButton } from './DaoMandateRouteButton.js';
import { DaoMandateStatusSeal } from './DaoMandateStatusSeal.js';
import { getDaoMandateMotionClassName } from './daoMandateUiFormatters.js';
import './LocalMandateLensHeader.scss';

export interface LocalMandateLensHeaderProps {
  lens: DaoLocalLensSurface | null;
  profile?: DaoMandateGuidanceProfile;
  variant?: 'compact' | 'default' | 'full';
  onRouteAction?: DaoMandateRouteActionHandler;
  motionMode?: DaoMandateEffectiveMotionMode;
  className?: string;
}

function relationLabel(relation: DaoLocalLensSurface['relation']): string {
  switch (relation) {
    case 'primary-evidence':
      return 'Relevant proof';
    case 'supporting-source':
      return 'Supporting source';
    case 'completed':
      return 'Proof sealed';
    case 'quiet':
      return 'Quiet';
    case 'blocked':
      return 'Source sealed';
  }
}

function relationTone(relation: DaoLocalLensSurface['relation']): DaoMandateTone {
  switch (relation) {
    case 'primary-evidence':
      return 'success';
    case 'supporting-source':
      return 'info';
    case 'completed':
      return 'success';
    case 'quiet':
      return 'muted';
    case 'blocked':
      return 'danger';
  }
}

export function LocalMandateLensHeader({
  lens,
  profile = 'elder',
  variant = 'default',
  onRouteAction,
  motionMode = 'medium',
  className,
}: LocalMandateLensHeaderProps) {
  if (!lens || lens.relation === 'quiet') return null;
  const showDetail = variant === 'full' || (variant !== 'compact' && profile !== 'sealed');
  const showEvidence = variant === 'full' || profile === 'jade';
  const route = lens.route && (lens.relation === 'primary-evidence' || lens.relation === 'blocked')
    ? lens.route
    : null;

  return (
    <section
      className={classNames(
        'daoLocalMandateLensHeader',
        `daoLocalMandateLensHeader--${variant}`,
        `daoLocalMandateLensHeader--${lens.relation}`,
        getDaoMandateMotionClassName(motionMode),
        className,
      )}
      data-dao-motion={motionMode}
      aria-label={`${lens.label} local Mandate lens`}
    >
      <div className="daoLocalMandateLensHeader__main">
        <DaoMandateStatusSeal
          tone={relationTone(lens.relation)}
          label={relationLabel(lens.relation)}
          compact={variant === 'compact'}
          motionMode={motionMode}
        />
        <div>
          <strong>{lens.label}</strong>
          {showDetail ? <p>{lens.detail}</p> : null}
          {showEvidence ? <span>{lens.evidenceIds.length} evidence links</span> : null}
        </div>
      </div>
      {route ? (
        <DaoMandateRouteButton
          route={route}
          onRouteAction={onRouteAction}
          variant={lens.relation === 'primary-evidence' ? 'primary' : 'secondary'}
          size={variant === 'compact' ? 'compact' : 'default'}
          showDestination={showDetail}
        />
      ) : null}
    </section>
  );
}
