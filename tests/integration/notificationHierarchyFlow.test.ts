import assert from 'node:assert/strict';
import test from 'node:test';

import { useUIStore } from '../../src/stores/uiStore.js';

test.beforeEach(() => {
  useUIStore.getState().hardResetUI();
});

test('higher-priority overlays delay generic toasts until queue flush', () => {
  useUIStore.setState((state) => ({
    ...state,
    showWorldBuildingModal: true,
  }));

  useUIStore.getState().addNotification('warning', 'Blocked while modal open', {
    dedupeKey: 'hierarchy-modal',
    source: 'test',
  });

  const blockedState = useUIStore.getState();
  assert.equal(blockedState.notifications.length, 0);
  assert.equal(blockedState.pendingNotifications.length, 1);

  useUIStore.setState((state) => ({
    ...state,
    showWorldBuildingModal: false,
  }));
  useUIStore.getState().flushNotificationQueue();

  const unblockedState = useUIStore.getState();
  assert.equal(unblockedState.notifications.length, 1);
  assert.equal(unblockedState.pendingNotifications.length, 0);
});
