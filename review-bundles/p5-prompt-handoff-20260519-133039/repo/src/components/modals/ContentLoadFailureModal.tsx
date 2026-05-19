import type { ContentLoadFailureContext } from '../../services/diagnostics/buildContentLoadFailureDiagnostics.js';
import './ContentLoadFailureModal.scss';

type Props = {
  failure: ContentLoadFailureContext;
  onRetry: () => void;
  onDownloadDiagnostics: () => void;
};

export function ContentLoadFailureModal({ failure, onRetry, onDownloadDiagnostics }: Props) {
  const issueLines = failure.issueLines.slice(0, 8);

  return (
    <div className="contentLoadFailureOverlay" role="presentation">
      <div className="contentLoadFailureModal" role="dialog" aria-modal="true" aria-labelledby="content-load-failure-title">
        <h2 id="content-load-failure-title">Content Startup Failed</h2>
        <p className="contentLoadFailureSummary">{failure.message}</p>
        <p className="contentLoadFailureMeta">
          Phase: <strong>{failure.phase}</strong>
          {failure.fileName ? <> · File: <strong>{failure.fileName}</strong></> : null}
        </p>

        {issueLines.length > 0 ? (
          <ul className="contentLoadFailureIssueList">
            {issueLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="contentLoadFailureIssueFallback">No detailed issue lines were parsed. Use Download Diagnostics for raw details.</p>
        )}

        <p className="contentLoadFailureFootnote">
          The game was not started because content validation/load/bootstrap failed. Retry after fixing the content issue.
        </p>

        <div className="contentLoadFailureActions">
          <button type="button" className="button-standard" onClick={onRetry}>Retry</button>
          <button type="button" className="button-standard" onClick={onDownloadDiagnostics}>Download Diagnostics</button>
        </div>
      </div>
    </div>
  );
}
