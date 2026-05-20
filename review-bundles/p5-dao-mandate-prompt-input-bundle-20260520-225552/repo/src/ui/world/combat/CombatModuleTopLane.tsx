import type { ReactNode } from 'react';
import { GameIcon } from '../../icons/index.js';
import { RunCompassCompact } from '../../status/RunCompassCompact.js';
import type { RunCompassCompactSurface } from '../../../systems/ui/runCompass/index.js';
import { CombatModuleHeaderPlaque } from './CombatModuleHeaderPlaque.js';

export interface CombatModuleTopLaneProps {
  moduleName: string;
  roleTag: string;
  bestUsedWhen: string;
  runCompassSurface: RunCompassCompactSurface | null;
  variant?: 'outskirts' | 'ruins' | 'gate-trial';
  chipRow?: ReactNode;
  onClose?: () => void;
}

export function CombatModuleTopLane({
  moduleName,
  roleTag,
  bestUsedWhen,
  runCompassSurface,
  variant = 'outskirts',
  chipRow,
  onClose,
}: CombatModuleTopLaneProps) {
  return (
    <div className="combatPathModule__topLane">
      <RunCompassCompact surface={runCompassSurface} tone="ink" className="combatPathModule__runCompass" />
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
