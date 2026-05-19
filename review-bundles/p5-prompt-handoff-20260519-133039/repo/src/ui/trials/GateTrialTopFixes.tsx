import type { PostFailureDiagnosisSurface, PostFailureFixSurface } from '../../systems/ui/postFailure/index.js';
import { PostFailureDiagnosisPanel } from '../status/PostFailureDiagnosisPanel.js';

export function GateTrialTopFixes(props: {
  surface: PostFailureDiagnosisSurface | null;
  onAction?: (fix: PostFailureFixSurface) => void;
}) {
  const { surface, onAction } = props;
  return (
    <PostFailureDiagnosisPanel
      className="gateTrialTopFixes"
      tone="ink"
      surface={surface}
      onAction={onAction}
    />
  );
}
