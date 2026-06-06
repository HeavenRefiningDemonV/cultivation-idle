import { useCallback } from 'react';

import { SpiritRootObservationDrawer } from '../../features/spiritRootObservation/SpiritRootObservationDrawer.js';
import { useUIStore } from '../../stores/uiStore.js';
import { performStatusLedgerAction } from '../../systems/ui/status/statusRouteActions.js';
import type { StatusLedgerActionSurface } from '../../systems/ui/status/statusLedgerTypes.js';
import { StatusLedgerPage } from '../../ui/status/ledger/index.js';
import { useStatusDashboardSurface } from '../../ui/status/useStatusDashboardSurface.js';
import './StatusScreen.scss';

export function StatusScreen() {
  const surface = useStatusDashboardSurface();
  const addNotification = useUIStore((state) => state.addNotification);
  const spiritRootObservationOpen = useUIStore((state) => state.spiritRootObservationOpen);
  const spiritRootObservationActiveTab = useUIStore((state) => state.spiritRootObservationActiveTab);
  const setSpiritRootObservationTab = useUIStore((state) => state.setSpiritRootObservationTab);
  const closeSpiritRootObservation = useUIStore((state) => state.closeSpiritRootObservation);

  const handleLedgerAction = useCallback((action: StatusLedgerActionSurface) => {
    const result = performStatusLedgerAction(action);
    if (!result.performed && result.reason) {
      addNotification('warning', result.reason, {
        source: 'status-ledger',
        dedupeKey: `status-ledger-action-${action.id}`,
      });
    }
  }, [addNotification]);

  return (
    <>
      <StatusLedgerPage
        surface={surface.statusLedger}
        onAction={handleLedgerAction}
      />
      <SpiritRootObservationDrawer
        surface={surface.statusLedger.spiritRootObservation}
        open={spiritRootObservationOpen}
        activeTab={spiritRootObservationActiveTab}
        onTabChange={setSpiritRootObservationTab}
        onClose={closeSpiritRootObservation}
      />
    </>
  );
}
