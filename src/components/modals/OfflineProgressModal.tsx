import { useUIStore } from '../../stores/uiStore';
import './OfflineProgressModal.scss';

export function OfflineProgressModal() {
  const offlineProgressSummary = useUIStore((state) => state.offlineProgressSummary);
  const hideOfflineProgress = useUIStore((state) => state.hideOfflineProgress);

  if (!offlineProgressSummary) return null;

  return (
    <div className={'offlineProgressModalOverlay'}>
      <div className={'offlineProgressModalModal'}>
        <div className={'offlineProgressModalHeader'}>
          <h2 className={'offlineProgressModalTitle'}>Welcome Back!</h2>
          <p className={'offlineProgressModalSubtitle'}>Your cultivation continued while you were away.</p>
        </div>

        <div className={'offlineProgressModalSummaryCard'}>
          <div className={'offlineProgressModalSummaryRow'}>
            <span>Time Offline</span>
            <span className={'offlineProgressModalEmphasis'}>{offlineProgressSummary.offlineDuration}</span>
          </div>
          <div className={'offlineProgressModalSummaryRow'}>
            <span>Qi Gained</span>
            <span className={'offlineProgressModalGain'}>{offlineProgressSummary.qiGained}</span>
          </div>
          <div className={`${'offlineProgressModalSummaryRow'} ${'offlineProgressModalSummarySmall'}`}>
            <span>Efficiency</span>
            <span>{Math.round(offlineProgressSummary.efficiency * 100)}%</span>
          </div>
          {offlineProgressSummary.wasCapped && (
            <div className={'offlineProgressModalCappedNotice'}>
              Offline time capped at 12 hours.
            </div>
          )}
        </div>

        <div className={'offlineProgressModalActions'}>
          <button onClick={hideOfflineProgress} className={'offlineProgressModalContinueButton'}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
