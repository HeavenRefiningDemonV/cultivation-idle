import type { RunCompassActionLine } from '../../systems/ui/runCompass/index.js';

type BreakthroughMilestoneState = 'cultivation_edge' | 'gate_trial' | 'breakthrough_pending' | 'content_cap';

type BreakthroughAction = {
  label: string;
  detail: string;
  action: RunCompassActionLine | null;
};

type CultivationBreakthroughPanelProps = {
  milestoneState: BreakthroughMilestoneState;
  currentRealmLabel: string;
  nextRealmLabel: string | null;
  stage: number;
  stageMax: number;
  gateLine: string;
  tokenLine: string;
  qiLine: string;
  guidance: string;
  action: BreakthroughAction | null;
  onAction: (action: RunCompassActionLine) => void;
  compact?: boolean;
};

export function CultivationBreakthroughPanel({
  milestoneState,
  currentRealmLabel,
  nextRealmLabel,
  stage,
  stageMax,
  gateLine,
  tokenLine,
  qiLine,
  guidance,
  action,
  onAction,
  compact = false,
}: CultivationBreakthroughPanelProps) {
  const stateLabel =
    milestoneState === 'content_cap'
      ? 'Content Cap'
      : milestoneState === 'breakthrough_pending'
        ? 'Breakthrough Pending'
        : milestoneState === 'gate_trial'
          ? 'Gate Trial'
          : 'Cultivation Edge';
  const keyRows = new Set(['current', 'target', 'qi']);
  const rows = [
    { id: 'current', label: 'Current', value: `${currentRealmLabel} • Stage ${stage}/${stageMax}` },
    { id: 'target', label: 'Target', value: nextRealmLabel ?? 'Current semester cap reached' },
    { id: 'gate', label: 'Gate', value: gateLine },
    { id: 'token', label: 'Token', value: tokenLine },
    { id: 'qi', label: 'Qi', value: qiLine },
  ];
  const visibleRows = compact ? rows.filter((row) => row.id === 'current' || row.id === 'target' || row.id === 'qi') : rows;

  return (
    <section className={`cultivationBreakthroughPanel cultivationCommandCard${compact ? ' cultivationBreakthroughPanel--compact' : ''}`} aria-label="Breakthrough state">
      <div className="cultivationCommandCard__header">
        <div>
          <div className="cultivationCommandCard__eyebrow">Breakthrough</div>
          <h2 className="cultivationCommandCard__title">{compact ? 'Breakthrough summary' : 'What you are becoming'}</h2>
        </div>
        <span className="cultivationCommandCard__badge">{stateLabel}</span>
      </div>

      <div className="cultivationCommandList">
        {visibleRows.map((row) => (
          <div key={row.id} className={`cultivationCommandList__row ${keyRows.has(row.id) ? 'cultivationCommandList__row--priority' : ''}`} data-row-id={row.id}>
            <span className="cultivationCommandList__label">{row.label}</span>
            <span className="cultivationCommandList__value">{row.value}</span>
          </div>
        ))}
      </div>

      {!compact ? <p className="cultivationCommandCard__guidance">{guidance}</p> : null}

      {action ? (
        <div className="cultivationBreakthroughPanel__action">
          {!compact ? <div className="cultivationBreakthroughPanel__actionDetail">{action.detail}</div> : null}
          {action.action ? (
            <button type="button" className="button-standard cultivationCommandLinkButton" onClick={() => action.action && onAction(action.action)}>
              {action.label}
            </button>
          ) : (
            <div className="cultivationBreakthroughPanel__actionHint">{action.label}</div>
          )}
        </div>
      ) : null}
    </section>
  );
}
