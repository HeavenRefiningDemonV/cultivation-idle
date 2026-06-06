import type {
  StatusLedgerActionSurface,
  StatusLedgerSurfaceV1,
} from '../../../systems/ui/status/statusLedgerTypes.js';
import { StatusDoctrineTile } from './StatusDoctrineTiles.js';
import { StatusSpiritRootBadge } from './StatusSpiritRootBadge.js';

export function StatusIdentityDoctrinePanel({
  identity,
  onAction,
}: {
  identity: StatusLedgerSurfaceV1['identityDoctrine'];
  onAction: (action: StatusLedgerActionSurface) => void;
}) {
  return (
    <div className="statusIdentityDoctrinePanel">
      <div className="statusIdentityDoctrinePanel__crest">
        <StatusSpiritRootBadge spiritRoot={identity.spiritRoot} onAction={onAction} />
      </div>

      <div className="statusIdentityDoctrinePanel__sideTiles" aria-label="Resonance and posture">
        <StatusDoctrineTile tile={identity.resonanceTile} compact />
        <StatusDoctrineTile tile={identity.focusTile} compact />
      </div>

      <div className="statusIdentityDoctrinePanel__facts" aria-label="Doctrine facts">
        <StatusDoctrineTile tile={identity.pathTile} compact />
        <StatusDoctrineTile tile={identity.heartLawTile} compact />
        <StatusDoctrineTile tile={identity.breathTile} compact />
        <StatusDoctrineTile tile={identity.cityTile} compact />
      </div>
    </div>
  );
}
