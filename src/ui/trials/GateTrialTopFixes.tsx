import { getDiagnosisLabel } from '../text/playerFacingLabels.js';
import type { FailureDiagnosis } from '../../systems/readiness/failureDiagnosisTypes.js';

export function GateTrialTopFixes(props: {
  diagnosis: FailureDiagnosis | null;
  fixes: Array<{ id: string; label: string; reason: string; onClick: () => void; disabled?: boolean }>;
  isResolved: boolean;
}) {
  const { diagnosis, fixes, isResolved } = props;
  if (isResolved) {
    return <section className="gateTrialTopFixes">Gate resolved. No active failure fixes needed.</section>;
  }
  if (!diagnosis) {
    return <section className="gateTrialTopFixes">No recent defeat summary yet.</section>;
  }
  return (
    <section className="gateTrialTopFixes">
      <div className="gateTrialTopFixes__header">
        <strong>{getDiagnosisLabel(diagnosis.primary)}</strong>
        {diagnosis.secondary === 'bypassAvailable' ? <span className="gateTrialTopFixes__badge">Safety Net Available</span> : null}
      </div>
      <ul>
        {diagnosis.reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
      <div>
        {fixes.slice(0, 3).map((fix) => (
          <div key={fix.id} className="gateTrialTopFixes__fix">
            <button className="button-standard button-standard--ghost" type="button" onClick={fix.onClick} disabled={fix.disabled}>{fix.label}</button>
            <div>{fix.reason}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
