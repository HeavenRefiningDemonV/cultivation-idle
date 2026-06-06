import { useUIStore } from '../../stores/uiStore.js';
import { buildOfflineModalRows } from '../../systems/offline/offlineSummaryReadModel.js';
import { buildOfflineCatchupSurface } from '../../systems/offline/offlineCatchupSurface.js';
import './OfflineProgressModal.scss';

export function OfflineProgressModal() {
  const offlineProgressSummary = useUIStore((state) => state.offlineProgressSummary);
  const hideOfflineProgress = useUIStore((state) => state.hideOfflineProgress);

  if (!offlineProgressSummary) return null;
  const visibleRows = buildOfflineModalRows(offlineProgressSummary);
  const surface = buildOfflineCatchupSurface({
    summary: offlineProgressSummary,
    generatedAt: Date.now(),
    rawSeconds: offlineProgressSummary.rawOfflineSeconds,
  });

  return (
    <div className={'offlineProgressModalOverlay'}>
      <div className={'offlineProgressModalModal'}>
        <div className={'offlineProgressModalHeader'}>
          <h2 className={'offlineProgressModalTitle'}>Welcome Back!</h2>
          <p className={'offlineProgressModalSubtitle'}>Time passed while you were away.</p>
        </div>

        <div className={'offlineProgressModalSummaryCard'}>
          <div className={'offlineProgressModalSummaryRow'}>
            <span>Time considered</span>
            <span className={'offlineProgressModalEmphasis'}>{surface.durationLabel}</span>
          </div>
          <div className={'offlineProgressModalSummaryRow'}>
            <span>Efficiency</span>
            <span className={'offlineProgressModalEmphasis'}>{surface.efficiency.label}</span>
          </div>
          {surface.foregroundFocus && (
            <>
              <div className={'offlineProgressModalSummaryRow'}>
                <span>Foreground Focus</span>
                <span className={'offlineProgressModalEmphasis'}>{surface.foregroundFocus.label}</span>
              </div>
              <div className={'offlineProgressModalSummaryRow offlineProgressModalSummaryRowStacked'}>
                <span>Paused systems</span>
                <span>{surface.foregroundFocus.pausedLabel}</span>
              </div>
            </>
          )}
          {visibleRows.map((row) => (
            <div key={row.kind} className={'offlineProgressModalSummaryRow'}>
              <span>{row.label}</span>
              <span className={'offlineProgressModalGain'}>{row.value}</span>
            </div>
          ))}
          {offlineProgressSummary.wasCapped && (
            <div className={'offlineProgressModalCappedNotice'}>
              Offline time capped at {surface.cap.maxSeconds / 3600} hours.
            </div>
          )}
          <div className={'offlineProgressModalTrustList'}>
            {surface.efficiency.sources.map((source) => (
              <div key={source.id} className={'offlineProgressModalTrustRow'}>
                <span className={'offlineProgressModalTrustLabel'}>{source.label}</span>
                <span className={'offlineProgressModalTrustValue'}>{source.value}</span>
              </div>
            ))}
            {surface.blockedReasons.map((reason) => (
              <div key={reason.id} className={'offlineProgressModalTrustRow'}>
                <span className={'offlineProgressModalTrustLabel'}>{reason.label}</span>
                <span className={'offlineProgressModalTrustDetail'}>{reason.detail}</span>
              </div>
            ))}
          </div>
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
