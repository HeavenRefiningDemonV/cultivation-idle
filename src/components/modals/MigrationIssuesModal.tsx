import { createPortal } from 'react-dom';
import { useUIStore } from '../../stores/uiStore.js';
import './MigrationIssuesModal.scss';

export function MigrationIssuesModal() {
  const open = useUIStore((state) => state.showMigrationIssuesModal);
  const payload = useUIStore((state) => state.migrationIssuePayload);
  const close = useUIStore((state) => state.closeMigrationIssuesModal);

  if (!open || !payload) return null;

  return createPortal(
    <div className="migrationIssuesModalOverlay" role="presentation" onMouseDown={close}>
      <div className="migrationIssuesModalCard" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <h2 className="migrationIssuesModalTitle">{payload.title}</h2>
        <p className="migrationIssuesModalSummary">{payload.summary}</p>
        {payload.items.length > 0 ? (
          <ul className="migrationIssuesModalList">
            {payload.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <div className="migrationIssuesModalActions">
          <button type="button" className="button-standard" onClick={close}>Continue</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
