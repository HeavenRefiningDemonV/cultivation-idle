import { useCallback } from 'react';
import { useUIStore } from '../../../stores/uiStore.js';
import { performDaoMandateRouteAction } from './daoMandateRouteAdapter.js';
export function useDaoMandateRouteActionHandler(source) {
    const addNotification = useUIStore((state) => state.addNotification);
    return useCallback((route) => {
        const result = performDaoMandateRouteAction(route);
        if (!result.performed) {
            addNotification('warning', result.reason ?? route.blockedReason ?? 'This route cannot be opened from here yet.', {
                source,
                dedupeKey: `${source}-${route.id}`,
            });
        }
    }, [addNotification, source]);
}
