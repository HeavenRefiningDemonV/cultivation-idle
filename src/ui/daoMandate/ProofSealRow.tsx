import classNames from 'classnames';

import type { DaoProofSealState, DaoProofSealV1 } from '../../systems/ui/daoMandate/daoOmenProjectionTypes.js';
import './ProofSealRow.scss';

export interface ProofSealAction {
  label: string;
  ariaLabel?: string;
  onClick?: () => void;
}

export interface ProofSealRowProps {
  seals: DaoProofSealV1[];
  maxVisible?: number;
  emptyLabel?: string;
  onSealInspect?: (seal: DaoProofSealV1) => void;
  getSealAction?: (seal: DaoProofSealV1) => ProofSealAction | undefined;
  compact?: boolean;
  className?: string;
  testId?: string;
}

const STATE_LABELS: Record<DaoProofSealState, string> = {
  quiet: 'Quiet',
  unknown: 'Unknown',
  thin: 'Thin',
  strained: 'Strained',
  unsealed: 'Unsealed',
  sealed: 'Sealed',
  ready: 'Ready',
  locked: 'Locked',
  reflected: 'Reflected',
  cap: 'Cap',
};

export function ProofSealRow({
  seals,
  maxVisible = 4,
  emptyLabel = 'No proof pressure is visible.',
  onSealInspect,
  getSealAction,
  compact = false,
  className,
  testId = 'dao-proof-seal-row',
}: ProofSealRowProps) {
  const visibleSeals = seals.slice(0, maxVisible);
  const hiddenCount = Math.max(0, seals.length - visibleSeals.length);

  return (
    <section
      className={classNames('daoProofSealRow', compact && 'daoProofSealRow--compact', className)}
      aria-label="Proof seals"
      data-testid={testId}
    >
      {visibleSeals.length === 0 ? <p className="daoProofSealRow__empty">{emptyLabel}</p> : null}
      {visibleSeals.length > 0 ? (
        <div className="daoProofSealRow__list" role="list">
          {visibleSeals.map((seal) => (
            <ProofSealItem
              key={seal.id}
              seal={seal}
              action={getSealAction?.(seal)}
              onSealInspect={onSealInspect}
            />
          ))}
          {hiddenCount > 0 ? (
            <span className="daoProofSealRow__overflow" aria-label={`${hiddenCount} more proof seals`}>
              +{hiddenCount}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ProofSealItem({
  seal,
  action,
  onSealInspect,
}: {
  seal: DaoProofSealV1;
  action?: ProofSealAction;
  onSealInspect?: (seal: DaoProofSealV1) => void;
}) {
  const stateLabel = STATE_LABELS[seal.state];

  return (
    <article
      className={classNames('daoProofSeal', `daoProofSeal--${seal.state}`, `daoProofSeal--tone-${seal.tone}`)}
      role="listitem"
      aria-label={`${seal.label}: ${stateLabel}`}
    >
      <span className="daoProofSeal__icon" aria-hidden="true" data-icon-id={seal.iconId}>
        <span className="daoProofSeal__glyph" />
      </span>
      <span className="daoProofSeal__text">
        <span className="daoProofSeal__label">{seal.label}</span>
        <span className="daoProofSeal__detail">{seal.detail}</span>
      </span>
      <span className="daoProofSeal__state">{stateLabel}</span>
      <span className="daoProofSeal__actions">
        {onSealInspect ? (
          <button
            type="button"
            className="daoProofSeal__inspect"
            onClick={() => onSealInspect(seal)}
            aria-label={`Inspect proof seal: ${seal.label}`}
          >
            Inspect
          </button>
        ) : null}
        {action ? (
          <button
            type="button"
            className="daoProofSeal__inspect"
            onClick={action.onClick}
            aria-label={action.ariaLabel ?? action.label}
          >
            {action.label}
          </button>
        ) : null}
      </span>
    </article>
  );
}
