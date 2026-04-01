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

  return (
    <section className="cultivationBreakthroughPanel cultivationCommandCard" aria-label="Breakthrough state">
      <div className="cultivationCommandCard__header">
        <div>
          <div className="cultivationCommandCard__eyebrow">Breakthrough</div>
          <h2 className="cultivationCommandCard__title">What you are becoming</h2>
        </div>
        <span className="cultivationCommandCard__badge">{stateLabel}</span>
      </div>

      <div className="cultivationCommandList">
        <div className={`cultivationCommandList__row ${keyRows.has('current') ? 'cultivationCommandList__row--priority' : ''}`} data-row-id="current">
          <span className="cultivationCommandList__label">Current</span>
          <span className="cultivationCommandList__value">{currentRealmLabel} • Stage {stage}/{stageMax}</span>
        </div>
        <div className={`cultivationCommandList__row ${keyRows.has('target') ? 'cultivationCommandList__row--priority' : ''}`} data-row-id="target">
          <span className="cultivationCommandList__label">Target</span>
          <span className="cultivationCommandList__value">{nextRealmLabel ?? 'Current semester cap reached'}</span>
        </div>
        <div className="cultivationCommandList__row" data-row-id="gate">
          <span className="cultivationCommandList__label">Gate</span>
          <span className="cultivationCommandList__value">{gateLine}</span>
        </div>
        <div className="cultivationCommandList__row" data-row-id="token">
          <span className="cultivationCommandList__label">Token</span>
          <span className="cultivationCommandList__value">{tokenLine}</span>
        </div>
        <div className={`cultivationCommandList__row ${keyRows.has('qi') ? 'cultivationCommandList__row--priority' : ''}`} data-row-id="qi">
          <span className="cultivationCommandList__label">Qi</span>
          <span className="cultivationCommandList__value">{qiLine}</span>
        </div>
      </div>

      <p className="cultivationCommandCard__guidance">{guidance}</p>

      {action ? (
        <div className="cultivationBreakthroughPanel__action">
          <div className="cultivationBreakthroughPanel__actionDetail">{action.detail}</div>
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
