import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import {
  buildDaoMandateSurfaceFromRunCompassV2,
} from '../../src/systems/ui/daoMandate/index.js';
import {
  buildCurrencyPurposeSourceSurface,
  buildPurposeSourceContext,
} from '../../src/systems/economy/purposeSourceSurface.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const MODULE_BUILDERS: Array<[string, string]> = [
  ['src/features/apothecary/exact/buildApothecaryExactSurface.ts', 'apothecary'],
  ['src/features/professions/forgeExact/buildForgeExactSurface.ts', 'forge'],
  ['src/features/world/manualPavilionExact/buildManualPavilionExactSurface.ts', 'manualPavilion'],
  ['src/features/techniquesExact/buildTechniquesExactSurface.ts', 'techniques'],
  ['src/features/world/bountiesExact/buildBountiesExactSurface.ts', 'bounties'],
  ['src/features/world/expeditionsExact/buildExpeditionsExactSurface.ts', 'expeditions'],
  ['src/features/pavilion/buildPavilionSurface.ts', 'records'],
];

const MODULE_SCREENS: string[] = [
  'src/features/apothecary/exact/ApothecaryExactScreen.tsx',
  'src/features/professions/forgeExact/ForgeExactScreen.tsx',
  'src/features/world/manualPavilionExact/ManualPavilionExactScreen.tsx',
  'src/features/techniquesExact/TechniquesExactScreen.tsx',
  'src/features/world/bountiesExact/BountiesExactScreen.tsx',
  'src/features/world/expeditionsExact/ExpeditionsExactScreen.tsx',
  'src/features/pavilion/PavilionExactScreen.tsx',
];

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

let validatedPromise: Promise<ValidatedContent> | null = null;
async function getValidatedContent(): Promise<ValidatedContent> {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

test('P6 exact surface builders consume the shared Dao Mandate module source/sink projection', () => {
  for (const [path, moduleKey] of MODULE_BUILDERS) {
    const source = read(path);
    assert.match(source, /buildLiveDaoMandateModuleSourceSinkProjection/);
    assert.match(source, new RegExp(`currentModuleKey:\\s*'${moduleKey}'`), `${path} should request ${moduleKey} source/sink data`);
    assert.match(source, /mandateSourceSink/);
  }
});

test('P6 exact screens render one shared source/sink panel instead of local duplicate widgets', () => {
  for (const path of MODULE_SCREENS) {
    const source = read(path);
    assert.match(source, /ModuleSourceSinkPanel/);
    assert.match(source, /surface\.mandateSourceSink/);
  }

  const sharedPanel = read('src/ui/daoMandate/ModuleSourceSinkPanel.tsx');
  assert.match(sharedPanel, /SourceRouteSlip/);
  assert.match(sharedPanel, /performDaoMandateRouteAction/);
});

test('P6 Inventory purpose callouts receive visible Mandate source/sink truth and conservative tags', () => {
  const inventory = read('src/components/screens/InventoryScreen.tsx');
  const purpose = read('src/systems/economy/purposeSourceSurface.ts');

  assert.match(inventory, /buildLiveDaoMandateSurfaceV1/);
  assert.match(inventory, /applyDaoMandateVisibility/);
  assert.match(inventory, /visibleDaoMandate/);
  assert.match(inventory, /buildItemPurposeSourceSurface\([\s\S]*visibleDaoMandate/);
  assert.match(inventory, /buildCurrencyPurposeSourceSurface\([\s\S]*visibleDaoMandate/);

  for (const label of ['Needed Now', 'Future Gate', 'Craft Input', 'Keep', 'Unknown Source', 'Quiet']) {
    assert.match(purpose, new RegExp(label));
  }
  assert.doesNotMatch(purpose, /Sellable'/, 'P6 should not add sellable advice without item-truth evidence');
});

test('P6 source/sink adapter stays below exact screens and keeps route failures player-safe', () => {
  const adapter = read('src/systems/ui/daoMandate/daoMandateSourceMap.ts');

  assert.doesNotMatch(adapter, /features\/.*Exact/i, 'central adapter must not import exact screen surfaces');
  assert.match(adapter, /This source is not open in the current city\./);
  assert.doesNotMatch(adapter, /owner not wired|Packet|deferred|TODO|implementation|scaffold/i);
});

test('P6 shared source/sink UI does not grant rewards, resolve combat, clear trials, or reset prestige', () => {
  const files = [
    'src/systems/ui/daoMandate/daoMandateSourceMap.ts',
    'src/systems/ui/daoMandate/daoMandateModuleProjection.ts',
    'src/ui/daoMandate/ModuleSourceSinkPanel.tsx',
    'src/ui/daoMandate/ModuleSourceSinkPanel.scss',
  ];
  const forbidden = /RewardService|grantRewards|resolveCombat|recordFailure|recordClear|markCleared|performPrestigeReset|unlockCity|setState\(/;

  for (const path of files) {
    assert.doesNotMatch(read(path), forbidden, `${path} should remain display/routing only`);
  }
});

test('P6 visible fallback and Merit source copy does not leak implementation vocabulary', async () => {
  const fallback = buildDaoMandateSurfaceFromRunCompassV2(null, { now: 123 });
  const fallbackVisibleText = JSON.stringify({
    milestone: fallback.milestone,
    obstruction: fallback.obstruction,
    requirementLedger: fallback.requirementLedger,
    currentWork: fallback.currentWork,
    backgroundPlan: fallback.backgroundPlan,
  });

  assert.doesNotMatch(fallbackVisibleText, /Run Compass|Packet|packet truth|source map adapter|TODO|debug/i);

  const content = await getValidatedContent();
  const context = buildPurposeSourceContext(content);
  const merit = buildCurrencyPurposeSourceSurface(content, context, 'merit');
  const meritVisibleText = JSON.stringify(merit);

  assert.doesNotMatch(meritVisibleText, /Run Compass|Packet|packet truth|source map adapter|TODO|debug/i);
});
