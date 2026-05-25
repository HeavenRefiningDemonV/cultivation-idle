import type { ReactNode } from 'react';
import { GameIcon } from '../../icons/index.js';
import { CombatModuleHeaderPlaque } from './CombatModuleHeaderPlaque.js';

export interface CombatModuleTopLaneProps {
  moduleName: string;
  roleTag: string;
  bestUsedWhen: string;
  variant?: 'outskirts' | 'ruins' | 'gate-trial';
  chipRow?: ReactNode;
  onClose?: () => void;
}

export function CombatModuleTopLane({
  moduleName,
  roleTag,
  bestUsedWhen,
  variant = 'outskirts',
  chipRow,
  onClose,
}: CombatModuleTopLaneProps) {
  return (
    <div className="combatPathModule__topLane">
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
