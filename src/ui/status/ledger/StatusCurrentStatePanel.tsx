import type {
  StatusCauseRowSurface,
  StatusCurrentStateBlockSurface,
  StatusCurrentStateSurfaceV1,
  StatusLedgerActionSurface,
  StatusLedgerTone,
} from '../../../systems/ui/status/statusLedgerTypes.js';
import {
  SafeStatusIcon,
  StatusActionButton,
  StatusLedgerRichText,
  StatusRowSeal,
} from './StatusLedgerRows.js';

interface StatusCurrentStatePanelProps {
  surface: StatusCurrentStateSurfaceV1;
  onAction: (action: StatusLedgerActionSurface) => void;
}

const BLOCKS = [
  'cultivation',
  'daoHeart',
  'spiritRoot',
  'training',
  'buildPrep',
  'activeWork',
] as const;

function stateLabel(state: StatusCurrentStateBlockSurface['state']): string {
  switch (state) {
    case 'healthy':
      return 'Stable';
    case 'attention':
      return 'Needs work';
    case 'danger':
      return 'At risk';
    case 'locked':
      return 'Blocked';
    case 'unknown':
      return 'Unknown';
  }
}

function severityTone(severity: StatusCauseRowSurface['severity']): StatusLedgerTone {
  switch (severity) {
    case 'blocked':
    case 'danger':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'healthy':
      return 'jade';
    case 'info':
      return 'info';
  }
}

function toneForState(state: StatusCurrentStateBlockSurface['state']): StatusLedgerTone {
  switch (state) {
    case 'danger':
    case 'locked':
      return 'danger';
    case 'attention':
      return 'warning';
    case 'healthy':
      return 'jade';
    case 'unknown':
      return 'muted';
  }
}

function CauseRow({ row, onAction }: {
  row: StatusCauseRowSurface;
  onAction: (action: StatusLedgerActionSurface) => void;
}) {
  const tone = severityTone(row.severity);
  return (
    <article className={`statusCurrentStateCause statusCurrentStateCause--${tone}`} role="listitem">
      <StatusRowSeal tone={tone} icon={tone === 'danger' || tone === 'warning' ? 'inkWarning' : 'recordSlip'} />
      <span className="statusCurrentStateCause__copy">
        <span className="statusCurrentStateCause__topline">
          <strong><StatusLedgerRichText text={row.label} compact /></strong>
          <span className={`statusCurrentStateCause__value statusCurrentStateCause__value--${tone}`}>
            {row.value}
          </span>
        </span>
        <span className="statusCurrentStateCause__consequence">
          <StatusLedgerRichText text={row.consequence} />
        </span>
        <span className="statusCurrentStateCause__detail">
          <StatusLedgerRichText text={`${row.detail} Source: ${row.sourceSystem}.`} />
        </span>
      </span>
      {row.primaryFix ? <StatusActionButton action={row.primaryFix} onAction={onAction} compact /> : null}
    </article>
  );
}

function CurrentStateBlock({ block, onAction }: {
  block: StatusCurrentStateBlockSurface;
  onAction: (action: StatusLedgerActionSurface) => void;
}) {
  const tone = toneForState(block.state);
  return (
    <article
      className={`statusCurrentStateBlock statusCurrentStateBlock--${block.state}`}
      data-state={block.state}
      data-testid={`status-current-state-block-${block.id}`}
    >
      <header className="statusCurrentStateBlock__header">
        <span className={`statusCurrentStateBlock__icon statusCurrentStateBlock__icon--${tone}`} aria-hidden="true">
          <SafeStatusIcon icon={block.icon} size={22} />
        </span>
        <span className="statusCurrentStateBlock__title">
          <span>{block.title}</span>
          <strong>{block.valueLabel}</strong>
        </span>
        <span className={`statusCurrentStateBlock__state statusCurrentStateBlock__state--${tone}`}>
          {stateLabel(block.state)}
        </span>
      </header>
      <p className="statusCurrentStateBlock__consequence">
        <StatusLedgerRichText text={block.consequence} />
      </p>
      <div className="statusCurrentStateBlock__route">
        {block.route ? <StatusActionButton action={block.route} onAction={onAction} /> : null}
      </div>
      <details className="statusCurrentStateBlock__details">
        <summary>How calculated</summary>
        <div className="statusCurrentStateBlock__causeRows" role="list">
          {block.detailRows.map((row) => (
            <CauseRow key={row.id} row={row} onAction={onAction} />
          ))}
        </div>
      </details>
    </article>
  );
}

export function StatusCurrentStatePanel({ surface, onAction }: StatusCurrentStatePanelProps) {
  return (
    <section
      className="statusCurrentState"
      data-testid={surface.rootTestId}
      aria-labelledby="status-current-state-title"
    >
      <header className="statusCurrentState__header">
        <div>
          <p className="statusLedgerEyebrow">Current State</p>
          <h2 id="status-current-state-title">Current State</h2>
          <p><StatusLedgerRichText text={surface.summary.detail} /></p>
        </div>
        <aside className="statusCurrentStateBottleneck" aria-label="Current Bottleneck">
          <span>{surface.summary.label}</span>
          <strong>{surface.nextBottleneck.primary.label}</strong>
          <small>{surface.nextBottleneck.primary.detail}</small>
          <div className="statusCurrentStateBottleneck__actions">
            <StatusActionButton action={surface.nextBottleneck.primary} onAction={onAction} />
            {surface.nextBottleneck.secondary.map((action) => (
              <StatusActionButton key={action.id} action={action} onAction={onAction} compact />
            ))}
          </div>
        </aside>
      </header>

      <div className="statusCurrentState__blocks">
        {BLOCKS.map((key) => (
          <CurrentStateBlock key={key} block={surface.blocks[key]} onAction={onAction} />
        ))}
      </div>

      <details className="statusCurrentState__sharedRows">
        <summary>Shared cause rows</summary>
        <div className="statusCurrentStateBlock__causeRows" role="list">
          {surface.sharedCauseRows.map((row) => (
            <CauseRow key={row.id} row={row} onAction={onAction} />
          ))}
        </div>
      </details>
    </section>
  );
}
