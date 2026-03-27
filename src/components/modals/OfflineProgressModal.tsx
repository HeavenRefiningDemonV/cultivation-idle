import { useUIStore } from '../../stores/uiStore.js';
import { buildOfflineModalRows } from '../../systems/offline/offlineSummaryReadModel.js';
import './OfflineProgressModal.scss';

export function OfflineProgressModal() {
  const offlineProgressSummary = useUIStore((state) => state.offlineProgressSummary);
  const hideOfflineProgress = useUIStore((state) => state.hideOfflineProgress);

  if (!offlineProgressSummary) return null;
  const visibleRows = buildOfflineModalRows(offlineProgressSummary);

  return (
    <div className={'offlineProgressModalOverlay'}>
      <div className={'offlineProgressModalModal'}>
        <div className={'offlineProgressModalHeader'}>
          <h2 className={'offlineProgressModalTitle'}>Welcome Back!</h2>
          <p className={'offlineProgressModalSubtitle'}>Time passed while you were away.</p>
        </div>

        <div className={'offlineProgressModalSummaryCard'}>
          <div className={'offlineProgressModalSummaryRow'}>
            <span>Time Offline</span>
            <span className={'offlineProgressModalEmphasis'}>{offlineProgressSummary.offlineDuration}</span>
          </div>
          {visibleRows.map((row) => (
            <div key={row.kind} className={'offlineProgressModalSummaryRow'}>
              <span>{row.label}</span>
              <span className={'offlineProgressModalGain'}>{row.value}</span>
            </div>
          ))}
          {offlineProgressSummary.wasCapped && (
            <div className={'offlineProgressModalCappedNotice'}>
              Offline time capped at 12 hours.
            </div>
          )}
        </div>

        <div className={'offlineProgressModalActions'}>
          <button onClick={hideOfflineProgress} className={'button-standard uiNoShift offlineProgressModalContinueButton'}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
