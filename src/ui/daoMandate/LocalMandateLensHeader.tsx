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
    case 'primary':
      return 'Primary route';
    case 'support':
      return 'Support route';
    case 'future':
      return 'Future route';
    case 'quiet':
      return 'Quiet';
    case 'blocked':
      return 'Blocked';
  }
}

function relationTone(relation: DaoLocalLensSurface['relation']): DaoMandateTone {
  switch (relation) {
    case 'primary':
      return 'success';
    case 'support':
      return 'info';
    case 'future':
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
  if (!lens) return null;
  const showDetail = variant === 'full' || (variant !== 'compact' && profile !== 'sealed');
  const showEvidence = variant === 'full' || profile === 'jade';

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
      {lens.route ? (
        <DaoMandateRouteButton
          route={lens.route}
          onRouteAction={onRouteAction}
          variant={lens.relation === 'primary' ? 'primary' : 'secondary'}
          size={variant === 'compact' ? 'compact' : 'default'}
          showDestination={showDetail}
        />
      ) : null}
    </section>
  );
}
