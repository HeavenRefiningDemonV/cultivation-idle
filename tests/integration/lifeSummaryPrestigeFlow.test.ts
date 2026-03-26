import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { useGameStore } from '../../src/stores/gameStore.ts';
import { usePrestigeStore } from '../../src/stores/prestigeStore.ts';
import { useUIStore } from '../../src/stores/uiStore.ts';
import { captureLifeSummarySnapshot } from '../../src/features/prestige/lifeSummarySurface.ts';

test('prestige stores last life summary from prepared snapshot', () => {
  const gameStore = useGameStore.getState();
  const prestigeStore = usePrestigeStore.getState();

  useGameStore.setState((state) => ({
    ...state,
    realm: {
      ...state.realm,
      index: 2,
    },
  }));
  const prepared = captureLifeSummarySnapshot({
    apForecast: prestigeStore.calculateAPGain(),
    canPrestige: true,
    runStartTime: prestigeStore.runStartTime,
    upgrades: prestigeStore.upgrades,
  });

  prestigeStore.performPrestige(prepared);
  assert.equal(usePrestigeStore.getState().lastLifeSummary?.createdAt, prepared.createdAt);
});

test('ui life summary modal mode can be opened in current and last_completed modes', () => {
  const ui = useUIStore.getState();
  ui.openLifeSummaryModal('current');
  assert.equal(useUIStore.getState().showLifeSummaryModal, true);
  assert.equal(useUIStore.getState().lifeSummaryMode, 'current');

  ui.openLifeSummaryModal('last_completed');
  assert.equal(useUIStore.getState().lifeSummaryMode, 'last_completed');

  ui.closeLifeSummaryModal();
  assert.equal(useUIStore.getState().showLifeSummaryModal, false);
});
