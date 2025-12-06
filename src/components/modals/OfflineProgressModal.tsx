import { useUIStore } from '../../stores/uiStore';
import './OfflineProgressModal.scss';

export function OfflineProgressModal() {
  const offlineProgressSummary = useUIStore((state) => state.offlineProgressSummary);
  const hideOfflineProgress = useUIStore((state) => state.hideOfflineProgress);

  if (!offlineProgressSummary) return null;

  return (
    <div className={'offline-progress-modal__overlay'}>
      <div className={'offline-progress-modal__modal'}>
        <div className={'offline-progress-modal__header'}>
          <h2 className={'offline-progress-modal__title'}>Welcome Back!</h2>
          <p className={'offline-progress-modal__subtitle'}>Your cultivation continued while you were away.</p>
        </div>

        <div className={'offline-progress-modal__summary-card'}>
          <div className={'offline-progress-modal__summary-row'}>
            <span>Time Offline</span>
            <span className={'offline-progress-modal__emphasis'}>{offlineProgressSummary.offlineDuration}</span>
          </div>
          <div className={'offline-progress-modal__summary-row'}>
            <span>Qi Gained</span>
            <span className={'offline-progress-modal__gain'}>{offlineProgressSummary.qiGained}</span>
          </div>
          <div className={`${'offline-progress-modal__summary-row'} ${'offline-progress-modal__summary-small'}`}>
            <span>Efficiency</span>
            <span>{Math.round(offlineProgressSummary.efficiency * 100)}%</span>
          </div>
          {offlineProgressSummary.wasCapped && (
            <div className={'offline-progress-modal__capped-notice'}>
              Offline time capped at 12 hours.
            </div>
          )}
        </div>

        <div className={'offline-progress-modal__actions'}>
          <button onClick={hideOfflineProgress} className={'offline-progress-modal__continue-button'}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
