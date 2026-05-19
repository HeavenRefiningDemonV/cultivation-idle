import type { PostFailureDiagnosisSurface, PostFailureFixSurface } from '../../systems/ui/postFailure/index.js';
import './PostFailureDiagnosisPanel.scss';

export interface PostFailureDiagnosisPanelProps {
  surface: PostFailureDiagnosisSurface | null;
  className?: string;
  tone?: 'paper' | 'ink';
  onAction?: (action: PostFailureFixSurface) => void;
}

export function PostFailureDiagnosisPanel({
  surface,
  className = '',
  tone = 'paper',
  onAction,
}: PostFailureDiagnosisPanelProps) {
  const resolved =
    surface ??
    {
      state: 'idle',
      title: 'Post-Failure Diagnosis',
      primaryLabel: null,
      secondaryBadgeLabel: null,
      headline: 'No recent defeat summary yet.',
      explanation: 'Attempt this gate once to surface focused diagnosis and fixes.',
      reasons: [],
      fixes: [],
      attemptRecap: null,
    };

  return (
    <section className={`postFailureDiagnosisPanel postFailureDiagnosisPanel--${tone} ${className}`.trim()}>
      <div className="postFailureDiagnosisPanel__header">
        <div className="postFailureDiagnosisPanel__titleWrap">
          <h3 className="postFailureDiagnosisPanel__title">{resolved.title}</h3>
          {resolved.primaryLabel ? <span className="postFailureDiagnosisPanel__badge">{resolved.primaryLabel}</span> : null}
          {resolved.secondaryBadgeLabel ? (
            <span className="postFailureDiagnosisPanel__badge postFailureDiagnosisPanel__badge--secondary">{resolved.secondaryBadgeLabel}</span>
          ) : null}
        </div>
      </div>

      <div className="postFailureDiagnosisPanel__headline">{resolved.headline}</div>
      <div className="postFailureDiagnosisPanel__explanation">{resolved.explanation}</div>

      <ul className="postFailureDiagnosisPanel__reasons">
        {resolved.reasons.length > 0 ? (
          resolved.reasons.map((reason) => (
            <li key={reason} className="postFailureDiagnosisPanel__reason">{reason}</li>
          ))
        ) : (
          <li className="postFailureDiagnosisPanel__reason postFailureDiagnosisPanel__reason--quiet">
            {resolved.state === 'resolved' ? 'Gate already resolved.' : 'No diagnosis reasons available yet.'}
          </li>
        )}
      </ul>

      <div className="postFailureDiagnosisPanel__fixes">
        {resolved.fixes.length > 0 ? (
          resolved.fixes.map((fix) => (
            <div key={fix.key} className="postFailureDiagnosisPanel__fix">
              <div className="postFailureDiagnosisPanel__fixMain">
                <div className="postFailureDiagnosisPanel__fixLabel">{fix.label}</div>
                <div className="postFailureDiagnosisPanel__fixDestination">{fix.destinationLabel}</div>
              </div>
              <div className="postFailureDiagnosisPanel__fixReason">{fix.reason}</div>
              {fix.actionLabel ? (
                <button
                  type="button"
                  className="button-standard button-standard--ghost"
                  onClick={() => onAction?.(fix)}
                  disabled={!onAction || fix.blocked}
                  title={fix.blockedReason ?? undefined}
                >
                  {fix.actionLabel}
                </button>
              ) : null}
              {fix.blockedReason ? <div className="postFailureDiagnosisPanel__blockedReason">{fix.blockedReason}</div> : null}
            </div>
          ))
        ) : (
          <div className="postFailureDiagnosisPanel__fix postFailureDiagnosisPanel__fix--quiet">No active top fixes.</div>
        )}
      </div>

      {resolved.attemptRecap ? (
        <div className="postFailureDiagnosisPanel__recap">
          {resolved.attemptRecap.bossHpRemainingLine ? <div>{resolved.attemptRecap.bossHpRemainingLine}</div> : null}
          {resolved.attemptRecap.timeSurvivedLine ? <div>{resolved.attemptRecap.timeSurvivedLine}</div> : null}
          {resolved.attemptRecap.biggestHitLine ? <div>{resolved.attemptRecap.biggestHitLine}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
