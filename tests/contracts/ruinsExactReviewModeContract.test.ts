import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { createRuinsExactMockupFixture } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';

void test('Ruins exact fixture keeps approved active review values', () => {
  const fx = createRuinsExactMockupFixture();
  assert.equal(fx.meta.mode, 'fixture');
  assert.equal(fx.meta.activityMode, 'active');
  assert.equal(fx.tacticalStrip.cells[1]?.primaryText, 'Room 2 / 5 · Lv. 11');
  assert.equal(fx.primaryAction.label, 'Continue Exploration');
  assert.equal(fx.primaryAction.intent, 'continue-exploration');
  assert.equal(fx.roomRoute.chip, 'Anchor Chest in 3');
  assert.equal(fx.roomRoute.currentNodeId, 'spirit-nest');
  assert.deepEqual(fx.roomRoute.nodes.map((n) => n.state), ['completed', 'current', 'future', 'future', 'future']);
  assert.equal(fx.targetedMaterialsCard.rarePity.valueText, '1 / 6');
  assert.equal(fx.targetedMaterialsCard.rarePity.dots.total, 6);
  assert.equal(fx.targetedMaterialsCard.rarePity.dots.filled, 1);
  assert.equal(fx.targetedMaterialsCard.autoRepeat.valueText, 'Off');
  const summaryByLabel = new Map(fx.explorationSummary.rows.map((row) => [row.label, row.value]));
  assert.equal(summaryByLabel.get('Rooms'), '2 / 5');
  assert.equal(summaryByLabel.get('Pity'), '1 / 6');
});

void test('Ruins review mode threading stays explicit and live-default safe', async () => {
  const uiStoreSource = await fs.readFile('src/stores/uiStore.ts', 'utf8');
  const modalSource = await fs.readFile('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  const panelSource = await fs.readFile('src/components/screens/world/buildings/RuinsBuildingPanel.tsx', 'utf8');
  const ownerSource = await fs.readFile('src/features/world/ruinsExact/RuinsScreenOwner.tsx', 'utf8');
  const harnessSource = await fs.readFile('src/dev/phase6CombatAudit/Phase6CombatAuditHarness.tsx', 'utf8');
  const captureSource = await fs.readFile('scripts/release/capturePhase6CombatEvidence.ts', 'utf8');
  const p0CaptureSource = await fs.readFile('scripts/release/runRuinsExactP0Capture.ts', 'utf8');

  assert.match(uiStoreSource, /ruinsExactMode\?: 'live' \| 'fixture'/);
  assert.match(uiStoreSource, /const getWorldBuildingIntentKey = \(intent: WorldBuildingModalIntent\): string => JSON\.stringify\([\s\S]*ruinsExactMode: intent\?\.ruinsExactMode \?\? null,[\s\S]*\)/);

  assert.match(modalSource, /case 'ruins':[\s\S]*<RuinsBuildingPanel cityId=\{storeCityId\} forceFixture=\{storeModalIntent\?\.ruinsExactMode === 'fixture'\} \/>/);
  assert.match(panelSource, /forceFixture\?: boolean/);
  assert.match(panelSource, /<RuinsScreenOwner cityId=\{cityId\} ruinId=\{ruinDef\.id\} forceFixture=\{forceFixture\} \/>/);
  assert.match(ownerSource, /mode: forceFixture \? 'fixture' : 'live'/);

  assert.match(harnessSource, /function parseRuinsExactModeFromQuery\(\): RuinsExactMode/);
  assert.match(harnessSource, /worldBuildingModalIntent: surface === 'ruins' \? \{ ruinsExactMode \} : null/);
  assert.match(harnessSource, /if \(surface === 'ruins' && slot === 'interaction' && ruinsExactMode === 'live'\) \{/);

  assert.match(captureSource, /ruinsExactMode: 'fixture' \| 'live' \| null/);
  assert.match(captureSource, /--ruins-exact-mode=/);
  assert.match(captureSource, /if \(url\.searchParams\.get\('surface'\) === 'ruins' && ruinsExactMode\) \{/);

  assert.match(p0CaptureSource, /--ruins-exact-mode=fixture/);
});
