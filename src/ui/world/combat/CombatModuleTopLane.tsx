import type { ReactNode } from 'react';
import { GameIcon } from '../../icons/index.js';
import { LocalMandateLensHeader } from '../../daoMandate/index.js';
import type {
  DaoLocalLensSurface,
  DaoMandateEffectiveMotionMode,
  DaoMandateGuidanceProfile,
} from '../../../systems/ui/daoMandate/index.js';
import { CombatModuleHeaderPlaque } from './CombatModuleHeaderPlaque.js';

export interface CombatModuleTopLaneProps {
  moduleName: string;
  roleTag: string;
  bestUsedWhen: string;
  localMandateLens?: DaoLocalLensSurface | null;
  guidanceProfile?: DaoMandateGuidanceProfile;
  motionMode?: DaoMandateEffectiveMotionMode;
  variant?: 'outskirts' | 'ruins' | 'gate-trial';
  chipRow?: ReactNode;
  onClose?: () => void;
}

export function CombatModuleTopLane({
  moduleName,
  roleTag,
  bestUsedWhen,
  localMandateLens,
  guidanceProfile = 'elder',
  motionMode = 'low',
  variant = 'outskirts',
  chipRow,
  onClose,
}: CombatModuleTopLaneProps) {
  const displayLens = localMandateLens ? { ...localMandateLens, route: null } : null;

  return (
    <div className="combatPathModule__topLane">
      <LocalMandateLensHeader
        lens={displayLens}
        profile={guidanceProfile}
        variant="compact"
        motionMode={motionMode}
        className="combatPathModule__mandateLens"
      />
      <CombatModuleHeaderPlaque
        moduleName={moduleName}
        roleTag={roleTag}
        bestUsedWhen={bestUsedWhen}
        variant={variant}
        chipRow={chipRow}
      />
      {onClose ? (
        <button type="button" className="combatPathModule__close" onClick={onClose} aria-label="Close">
          <GameIcon icon="inkX" size={14} decorative />
        </button>
      ) : null}
    </div>
  );
}
