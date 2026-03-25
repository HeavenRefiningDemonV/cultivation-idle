import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyNotificationPolicy,
  MAX_VISIBLE_NOTIFICATIONS,
  promotePendingNotifications,
} from '../../src/systems/ui/notificationPolicy.js';
import type { UINotification } from '../../src/stores/uiStore.js';

const createId = (() => {
  let seq = 0;
  return () => `notif_${++seq}`;
})();

test('dedupe cooldown suppresses repeated identical notifications', () => {
  const visible: UINotification[] = [];
  const pending: UINotification[] = [];
  const lastByKey = new Map<string, number>();

  const first = applyNotificationPolicy({
    now: 1_000,
    visible,
    pending,
    options: { source: 'unit', cooldownMs: 1500 },
    type: 'info',
    message: 'Inventory full',
    createId,
    overlayBlocked: false,
    lastTriggeredAtByKey: lastByKey,
  });

  const second = applyNotificationPolicy({
    now: 2_000,
    visible: first.visible,
    pending: first.pending,
    options: { source: 'unit', cooldownMs: 1500 },
    type: 'info',
    message: 'Inventory full',
    createId,
    overlayBlocked: false,
    lastTriggeredAtByKey: lastByKey,
  });

  assert.equal(first.visible.length, 1);
  assert.equal(second.visible.length, 1);
  assert.equal(second.accepted, false);
});

test('visible stack caps at 3 and additional notifications queue pending', () => {
  let visible: UINotification[] = [];
  let pending: UINotification[] = [];
  const lastByKey = new Map<string, number>();

  for (let i = 0; i < 6; i += 1) {
    const result = applyNotificationPolicy({
      now: 10_000 + i,
      visible,
      pending,
      options: { source: 'stack', dedupeKey: `stack-${i}` },
      type: 'info',
      message: `toast-${i}`,
      createId,
      overlayBlocked: false,
      lastTriggeredAtByKey: lastByKey,
    });
    visible = result.visible;
    pending = result.pending;
  }

  assert.equal(visible.length, MAX_VISIBLE_NOTIFICATIONS);
  assert.equal(pending.length, 3);

  const promoted = promotePendingNotifications(visible.slice(1), pending, false);
  assert.equal(promoted.visible.length, MAX_VISIBLE_NOTIFICATIONS);
  assert.equal(promoted.pending.length, 2);
});
