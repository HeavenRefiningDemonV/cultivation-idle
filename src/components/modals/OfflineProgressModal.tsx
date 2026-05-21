import { useUIStore } from '../../stores/uiStore.js';
import { buildOfflineModalRows } from '../../systems/offline/offlineSummaryReadModel.js';
import { buildOfflineCatchupSurface } from '../../systems/offline/offlineCatchupSurface.js';
import {
  buildDaoOfflineMandateReturnSurface,
  buildLiveDaoMandateSurfaceV1,
  performDaoMandateRouteAction,
  type DaoMandateRoute,
} from '../../systems/ui/daoMandate/index.js';
import { DaoMandateRouteButton } from '../../ui/daoMandate/index.js';
import './OfflineProgressModal.scss';

export function OfflineProgressModal() {
  const offlineProgressSummary = useUIStore((state) => state.offlineProgressSummary);
  const hideOfflineProgress = useUIStore((state) => state.hideOfflineProgress);
  const settings = useUIStore((state) => state.settings);
  const addNotification = useUIStore((state) => state.addNotification);

  if (!offlineProgressSummary) return null;
  const visibleRows = buildOfflineModalRows(offlineProgressSummary);
  const surface = buildOfflineCatchupSurface({
    summary: offlineProgressSummary,
    generatedAt: Date.now(),
    rawSeconds: offlineProgressSummary.rawOfflineSeconds,
  });
  const currentMandate = buildLiveDaoMandateSurfaceV1({
    currentScreen: 'offline_return',
    guidanceProfile: settings.guidanceOath,
    settings,
  });
  const mandateAfterReturn = buildDaoOfflineMandateReturnSurface({
    summary: offlineProgressSummary,
    currentMandate,
  });

  const handleMandateRoute = (route: DaoMandateRoute) => {
    const result = performDaoMandateRouteAction(route);
    if (!result.performed && result.reason) {
      addNotification('warning', result.reason, {
        source: 'dao-mandate-offline',
        dedupeKey: `dao-mandate-offline-route-${route.id}`,
      });
    }
  };

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
          <section className={`offlineProgressModalMandate offlineProgressModalMandate--${mandateAfterReturn.state}`} aria-label="Mandate after return">
            <div className="offlineProgressModalMandate__copy">
              <span>Mandate after return</span>
              <strong>{mandateAfterReturn.label}</strong>
              <p>{mandateAfterReturn.detail}</p>
              <small>{mandateAfterReturn.evidence.find((line) => /Combat never progresses offline/i.test(line)) ?? 'Combat never progresses offline.'}</small>
            </div>
            {mandateAfterReturn.route ? (
              <DaoMandateRouteButton
                route={mandateAfterReturn.route}
                onRouteAction={handleMandateRoute}
                variant="secondary"
                size="compact"
              />
            ) : null}
          </section>
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
