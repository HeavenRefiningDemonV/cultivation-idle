import type {
  StatusBuildPrepGroupSurface,
  StatusLedgerActionSurface,
  StatusLedgerFactRow,
  StatusLedgerSurfaceV1,
} from '../../../systems/ui/status/statusLedgerTypes.js';
import {
  SafeStatusIcon,
  StatusActionButton,
  StatusLedgerRichText,
  StatusRowSeal,
} from './StatusLedgerRows.js';

function BuildPrepWarning({
  row,
  onAction,
}: {
  row: StatusLedgerFactRow;
  onAction: (action: StatusLedgerActionSurface) => void;
}) {
  return (
    <article className={`statusBuildPrepPanel__warning statusBuildPrepPanel__warning--${row.tone}`}>
      <StatusRowSeal tone={row.tone} icon={row.icon} size={18} />
      <span className="statusBuildPrepPanel__warningCopy">
        <span>Top Warning</span>
        <strong><StatusLedgerRichText text={row.value ?? row.label} /></strong>
        <small><StatusLedgerRichText text={row.detail} /></small>
      </span>
      {row.action ? <StatusActionButton action={row.action} onAction={onAction} /> : null}
    </article>
  );
}

function BuildPrepTile({ row }: { row: StatusLedgerFactRow }) {
  return (
    <article className={`statusBuildPrepTile statusBuildPrepTile--${row.tone}`} title={`${row.label}: ${row.value ?? row.detail}`}>
      <span className="statusBuildPrepTile__icon" aria-hidden="true">
        <SafeStatusIcon icon={row.icon} size={15} />
      </span>
      <span className="statusBuildPrepTile__copy">
        <span>{row.label}</span>
        <strong><StatusLedgerRichText text={row.value ?? row.detail} compact /></strong>
        <small><StatusLedgerRichText text={row.detail} /></small>
      </span>
    </article>
  );
}

function StatusBuildPrepGroup({ group }: { group: StatusBuildPrepGroupSurface }) {
  const detailRows = group.detailRows
    .filter((row) => !group.tiles.some((tile) => tile.id === row.id))
    .slice(0, 2);

  return (
    <section className={`statusBuildPrepGroup statusBuildPrepGroup--${group.tone}`} aria-label={group.title}>
      <header className="statusBuildPrepGroup__header">
        <span className="statusBuildPrepGroup__icon" aria-hidden="true">
          <SafeStatusIcon icon={group.icon} size={18} />
        </span>
        <span>
          <h3>{group.title}</h3>
          <p><StatusLedgerRichText text={group.headline} /></p>
        </span>
      </header>

      <div className="statusBuildPrepSummaryGrid">
        {group.tiles.map((tile) => <BuildPrepTile key={tile.id} row={tile} />)}
      </div>

      {detailRows.length > 0 ? (
        <div className="statusBuildPrepGroup__details" aria-label={`${group.title} details`}>
          {detailRows.map((row) => (
            <p key={row.id}>
              <strong>{row.label}</strong>
              <span>{row.value ?? row.detail}</span>
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function StatusBuildPreparationPanel({
  buildPreparation,
  onAction,
}: {
  buildPreparation: StatusLedgerSurfaceV1['buildPreparation'];
  onAction: (action: StatusLedgerActionSurface) => void;
}) {
  return (
    <div className="statusBuildPrepPanel">
      {buildPreparation.topWarning ? (
        <BuildPrepWarning row={buildPreparation.topWarning} onAction={onAction} />
      ) : null}
      <StatusBuildPrepGroup group={buildPreparation.build} />
      <StatusBuildPrepGroup group={buildPreparation.preparation} />
    </div>
  );
}
