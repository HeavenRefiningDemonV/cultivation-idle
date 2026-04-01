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
  mode?: 'summary' | 'detail';
  onOpenDetail?: () => void;
  onCloseDetail?: () => void;
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
  mode = 'summary',
  onOpenDetail,
  onCloseDetail,
}: CultivationBreakthroughPanelProps) {
  const isSummary = mode === 'summary';
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
  const visibleRows = isSummary ? rows.filter((row) => row.id === 'target' || row.id === 'qi') : rows;
  const checklist = [
    { label: `Reach Stage ${stageMax}`, done: stage >= stageMax },
    { label: 'Fill required Qi', done: qiLine === 'ready' },
    { label: 'Clear gate', done: gateLine === 'cleared' || gateLine === 'bypassed' || gateLine === 'cap reached' },
    { label: 'Hold gate token', done: tokenLine === 'ready' },
  ];

  return (
    <section className={`cultivationBreakthroughPanel cultivationCommandCard${isSummary ? ' cultivationBreakthroughPanel--compact cultivationBreakthroughPanel--summary' : ' cultivationBreakthroughPanel--detail'}`} aria-label="Breakthrough state">
      <div className="cultivationCommandCard__header">
        <div>
          <div className="cultivationCommandCard__eyebrow">Breakthrough</div>
          <h2 className="cultivationCommandCard__title">{isSummary ? 'Breakthrough seal' : 'Breakthrough detail'}</h2>
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

      {isSummary ? <p className="cultivationCommandCard__guidance">{guidance}</p> : null}

      {!isSummary ? (
        <>
          <p className="cultivationCommandCard__guidance">{guidance}</p>
          <div className="cultivationBreakthroughChecklist" aria-label="Breakthrough checklist">
            {checklist.map((item) => (
              <div key={item.label} className="cultivationBreakthroughChecklist__row">
                <span className={`cultivationBreakthroughChecklist__state cultivationBreakthroughChecklist__state--${item.done ? 'done' : 'pending'}`}>
                  {item.done ? 'Done' : 'Pending'}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {action ? (
        <div className="cultivationBreakthroughPanel__action">
          {!isSummary ? <div className="cultivationBreakthroughPanel__actionDetail">{action.detail}</div> : <div className="cultivationBreakthroughPanel__actionDetail">Top blocker: {guidance}</div>}
          {action.action ? (
            <button type="button" className="button-standard cultivationCommandLinkButton" onClick={() => action.action && onAction(action.action)}>
              {action.label}
            </button>
          ) : (
            <div className="cultivationBreakthroughPanel__actionHint">{action.label}</div>
          )}
          {isSummary && onOpenDetail ? (
            <button type="button" className="button-standard cultivationCommandLinkButton cultivationCommandLinkButton--subtle" onClick={onOpenDetail}>
              Open breakdown
            </button>
          ) : null}
          {!isSummary && onCloseDetail ? (
            <button type="button" className="button-standard cultivationCommandLinkButton cultivationCommandLinkButton--subtle" onClick={onCloseDetail}>
              Close
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
