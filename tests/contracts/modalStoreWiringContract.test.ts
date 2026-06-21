import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('F2-S5: useUIStore brokers open/close + an intent payload for both shared modals', () => {
  const store = read('src/stores/uiStore.ts');
  // The open/close pairs exist (mirroring the existing open*/close* pattern).
  assert.match(store, /openItemDetailInspector: \(payload: ItemDetailIntent\) => void/);
  assert.match(store, /closeItemDetailInspector: \(\) => void/);
  assert.match(store, /openRitualCeremony: \(payload: RitualCeremonyIntent\) => void/);
  assert.match(store, /closeRitualCeremony: \(\) => void/);
  // The payloads carry WHAT to show, not the resolved surface.
  assert.match(store, /export type ItemDetailIntent = \{/);
  assert.match(store, /export type RitualCeremonyIntent = \{/);
  // Initial state + reset: the new fields are in INITIAL_UI_STATE (so hardResetUI clears them).
  assert.match(store, /showItemDetailInspector: false/);
  assert.match(store, /itemDetailPayload: null/);
  assert.match(store, /showRitualCeremony: false/);
  assert.match(store, /ritualCeremonyPayload: null/);
  assert.match(store, /Object\.assign\(state, INITIAL_UI_STATE\)/);
});

test('F2-S5: the open/close action impls mutate NO gameplay (only the modal open/close + payload)', () => {
  const store = read('src/stores/uiStore.ts');
  // Isolate the four IMPL bodies (the impl uses `=> {`; the interface uses `=> void`).
  const start = store.indexOf('openItemDetailInspector: (payload: ItemDetailIntent) => {');
  const end = store.indexOf('hardResetUI: () => {');
  assert.ok(start > 0 && end > start, 'the impl block is locatable');
  const block = store.slice(start, end);
  assert.doesNotMatch(block, /useGameStore|useCombatStore|\.calculatePlayerStats|grantRewards|spendCurrency/);
  assert.match(block, /state\.showItemDetailInspector = true/);
  assert.match(block, /state\.itemDetailPayload = payload/);
  assert.match(block, /state\.showRitualCeremony = true/);
});

test('F2-S5: both shared modals are in the notification overlay-block guard', () => {
  const policy = read('src/systems/ui/notificationPolicy.ts');
  assert.match(policy, /showItemDetailInspector\?: boolean/);
  assert.match(policy, /showRitualCeremony\?: boolean/);
  assert.match(policy, /state\.showItemDetailInspector === true/);
  assert.match(policy, /state\.showRitualCeremony === true/);
  // ...and the store passes them into both isNotificationOverlayBlocked call sites.
  const store = read('src/stores/uiStore.ts');
  const calls = store.match(/showItemDetailInspector: snapshot\.showItemDetailInspector/g) ?? [];
  assert.equal(calls.length, 2, 'both addNotification and flushNotificationQueue pass the modal state');
});
