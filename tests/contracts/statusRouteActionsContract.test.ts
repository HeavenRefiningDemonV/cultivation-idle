import assert from 'node:assert/strict';
import test from 'node:test';

import { useUIStore } from '../../src/stores/uiStore.js';
import {
  performStatusLedgerAction,
  performStatusRouteTarget,
} from '../../src/systems/ui/status/statusRouteActions.js';
import type { StatusLedgerActionSurface } from '../../src/systems/ui/status/statusLedgerTypes.js';

function baseAction(overrides: Partial<StatusLedgerActionSurface> = {}): StatusLedgerActionSurface {
  return {
    id: 'status-route-test',
    label: 'Open test route',
    detail: 'Routes through the Status Ledger adapter.',
    destinationLabel: 'Techniques',
    target: { kind: 'tab', tab: 'techniques' },
    disabled: false,
    disabledReason: null,
    tone: 'info',
    primary: true,
    source: 'fallback',
    ...overrides,
  };
}

test('Status route action adapter refuses disabled and none targets with reasons', () => {
  const disabled = performStatusLedgerAction(baseAction({
    disabled: true,
    disabledReason: 'This route is currently locked.',
  }));
  assert.equal(disabled.performed, false);
  assert.equal(disabled.reason, 'This route is currently locked.');

  const none = performStatusRouteTarget({ kind: 'none', reason: 'No route is available.' });
  assert.equal(none.performed, false);
  assert.equal(none.reason, 'No route is available.');
});

test('Status route action adapter navigates tab and world module targets only through UI store', () => {
  useUIStore.setState({
    activeTab: 'cultivation',
    showWorldBuildingModal: false,
    worldBuildingModalCityId: null,
    worldBuildingModalKey: null,
    worldBuildingModalIntent: null,
  });

  const tab = performStatusRouteTarget({ kind: 'tab', tab: 'techniques' });
  assert.equal(tab.performed, true);
  assert.equal(tab.reason, null);
  assert.equal(useUIStore.getState().activeTab, 'techniques');

  const world = performStatusRouteTarget({ kind: 'world_module', cityId: 'pinewind', moduleKey: 'apothecary' });
  const state = useUIStore.getState();
  assert.equal(world.performed, true);
  assert.equal(world.reason, null);
  assert.equal(state.activeTab, 'adventure');
  assert.equal(state.showWorldBuildingModal, true);
  assert.equal(state.worldBuildingModalCityId, 'pinewind');
  assert.equal(state.worldBuildingModalKey, 'apothecary');
});

