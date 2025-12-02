import { useUIStore } from '../../stores/uiStore';
import styles from './OfflineProgressModal.module.css';

export function OfflineProgressModal() {
  const offlineProgressSummary = useUIStore((state) => state.offlineProgressSummary);
  const hideOfflineProgress = useUIStore((state) => state.hideOfflineProgress);

  if (!offlineProgressSummary) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Welcome Back!</h2>
          <p className={styles.subtitle}>Your cultivation continued while you were away.</p>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <span>Time Offline</span>
            <span className={styles.emphasis}>{offlineProgressSummary.offlineDuration}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Qi Gained</span>
            <span className={styles.gain}>{offlineProgressSummary.qiGained}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.summarySmall}`}>
            <span>Efficiency</span>
            <span>{Math.round(offlineProgressSummary.efficiency * 100)}%</span>
          </div>
          {offlineProgressSummary.wasCapped && (
            <div className={styles.cappedNotice}>
              Offline time capped at 12 hours.
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button onClick={hideOfflineProgress} className={styles.continueButton}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
