import type {
  StatusLedgerActionSurface,
  StatusLedgerFactRow,
  StatusLedgerSurfaceV1,
} from '../../../systems/ui/status/statusLedgerTypes.js';
import { SafeStatusIcon, StatusFactRows, StatusLedgerRichText } from './StatusLedgerRows.js';

function ActivityTile({ row }: { row: StatusLedgerFactRow }) {
  return (
    <article className={`statusCurrentWorkTile statusCurrentWorkTile--${row.tone}`} title={`${row.label}: ${row.value ?? row.detail}`}>
      <span className="statusCurrentWorkTile__icon" aria-hidden="true">
        <SafeStatusIcon icon={row.icon} size={16} />
      </span>
      <span>
        <span>{row.label}</span>
        <strong><StatusLedgerRichText text={row.value ?? row.detail} compact /></strong>
      </span>
    </article>
  );
}

export function StatusCurrentWorkPanel({
  currentWork,
  onAction,
}: {
  currentWork: StatusLedgerSurfaceV1['currentWork'];
  onAction: (action: StatusLedgerActionSurface) => void;
}) {
  return (
    <div className="statusCurrentWorkPanel">
      <div className="statusCurrentWorkLane" aria-label="Current work activity lane">
        {currentWork.activityTiles.map((tile) => <ActivityTile key={tile.id} row={tile} />)}
      </div>
      <StatusFactRows rows={currentWork.rows.slice(0, 2)} onAction={onAction} compact />
    </div>
  );
}
