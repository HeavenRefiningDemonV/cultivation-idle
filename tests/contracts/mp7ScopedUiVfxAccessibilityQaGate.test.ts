import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function source(relPath: string): Promise<string> {
  return fs.readFile(path.resolve(process.cwd(), relPath), 'utf8');
}

test('MP7 scoped UI/VFX/accessibility gate covers new-system roots and reduced-motion contracts', async () => {
  const [
    trainingScreen,
    trainingCss,
    daoScreen,
    daoCss,
    statusCurrentState,
    statusCss,
    spiritRootDrawer,
    cultivationScreen,
    gateScreen,
    gateCss,
    prestigeScreen,
    prestigeCss,
  ] = await Promise.all([
    source('src/features/trainingHall/TrainingHallScreen.tsx'),
    source('src/features/trainingHall/TrainingHallScreen.scss'),
    source('src/features/daoHeartSanctuary/DaoHeartSanctuaryView.tsx'),
    source('src/features/daoHeartSanctuary/DaoHeartSanctuaryView.scss'),
    source('src/ui/status/ledger/StatusCurrentStatePanel.tsx'),
    source('src/ui/status/ledger/StatusLedgerPage.scss'),
    source('src/features/spiritRootObservation/SpiritRootObservationDrawer.tsx'),
    source('src/features/cultivation/exact/CultivationExactScreen.tsx'),
    source('src/features/world/gateTrialExact/GateTrialExactScreen.ts'),
    source('src/features/world/gateTrialExact/GateTrialExactScreen.scss'),
    source('src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.tsx'),
    source('src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.scss'),
  ]);

  assert.match(trainingScreen, /data-testid=\{surface\.meta\.rootTestId\}/);
  assert.match(trainingScreen, /data-fx-particle-budget/);
  assert.match(trainingCss, /--training-hall-mote-opacity:\s*0\.18/);
  assert.match(trainingCss, /@media \(prefers-reduced-motion: reduce\)/);

  assert.match(daoScreen, /data-ui="dao-heart-sanctuary"/);
  assert.match(daoScreen, /data-fx-particle-budget/);
  assert.match(daoCss, /--dao-heart-mote-opacity:\s*0\.18/);
  assert.match(daoCss, /@media \(prefers-reduced-motion: reduce\)/);

  assert.match(statusCurrentState, /data-testid=\{surface\.rootTestId\}/);
  assert.match(statusCurrentState, /Current Bottleneck/);
  assert.match(statusCss, /@media \(prefers-reduced-motion: reduce\)/);

  assert.match(spiritRootDrawer, /data-testid="spirit-root-observation-drawer"/);
  assert.match(spiritRootDrawer, /aria-label="Elemental VFX state"/);

  assert.match(cultivationScreen, /data-testid=\{surface\.meta\.rootTestId\}/);
  assert.match(cultivationScreen, /data-risk-band/);

  assert.match(gateScreen, /data-testid': 'gate-trial-exact-readiness-rail'/);
  assert.match(gateScreen, /data-status/);
  assert.match(gateCss, /@media \(prefers-reduced-motion: reduce\)/);

  assert.match(prestigeScreen, /data-testid=\{surface\.reclaimMemory\.rootTestId\}/);
  assert.match(prestigeScreen, /Open Reclaim Memory/);
  assert.match(prestigeScreen, /Active: \{surface\.reclaimMemory\.summary\.activeCount\}/);
  assert.match(prestigeScreen, /Effect/);
  assert.match(prestigeScreen, /Stop/);
  assert.match(prestigeCss, /min-height:\s*138px/);
  assert.match(prestigeCss, /@media \(prefers-reduced-motion: reduce\)/);
});

test('MP7 Reclaim UI stays Prestige-owned and has no claim action or global nav route', async () => {
  const [bottomTabBar, reclaimSurface, prestigeScreen] = await Promise.all([
    source('src/components/BottomTabBar.tsx'),
    source('src/features/prestigeReclaim/buildReclaimMemorySurface.ts'),
    source('src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.tsx'),
  ]);

  assert.doesNotMatch(bottomTabBar, /label:\s*['"]Reclaim/i);
  assert.doesNotMatch(bottomTabBar, /tabId:\s*['"]reclaim/i);
  assert.doesNotMatch(reclaimSurface, /Claim Memory|Claim Reclaim|claimAction/);
  assert.doesNotMatch(prestigeScreen, /Claim Memory|Claim Reclaim/);
  assert.match(prestigeScreen, /aria-label="Prestige Reclaim Memory"/);
});
