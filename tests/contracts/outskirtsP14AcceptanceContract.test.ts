import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';

const P14_ROOT = 'docs/release/qa/ui-cutover/outskirts-exact/p14-acceptance';

void test('P14 planning page keeps all required regions and one dominant CTA', async () => {
  const source = await readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8');

  assert.match(source, /data-testid': 'outskirts-exact-page'/);
  assert.match(source, /data-testid': 'outskirts-exact-left-rail'/);
  assert.match(source, /data-testid': 'outskirts-exact-center-scenic-slot'/);
  assert.match(source, /data-testid': 'outskirts-exact-identity-slot'/);
  assert.match(source, /data-testid': 'outskirts-exact-strip-slot'/);
  assert.match(source, /data-testid': 'outskirts-exact-cta-slot'/);
  assert.match(source, /data-testid': 'outskirts-exact-right-rail'/);
  assert.match(source, /data-testid': 'outskirts-exact-summary-dock'/);

  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  assert.equal(surface.primaryAction.singleDominantCta, true);
  assert.equal(surface.primaryAction.visible, true);
  assert.equal(surface.shell.rightCardHasPrimaryAction, false);
});

void test('P14 planning purity excludes combat-shell chrome in planning owner/surface', async () => {
  const planningOwner = await readFile('src/features/world/outskirts/OutskirtsPlanningOwner.tsx', 'utf8');
  const exactScreen = await readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8');

  const forbidden = ['RunCompass', 'combat-log', 'combat options', 'utility tray', 'hp bars', 'combatHp'];
  for (const token of forbidden) {
    assert.equal(planningOwner.toLowerCase().includes(token.toLowerCase()), false);
    assert.equal(exactScreen.toLowerCase().includes(token.toLowerCase()), false);
  }
});

void test('P14 active-contained branch remains separate from planning owner', async () => {
  const panel = await readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  assert.match(panel, /if \(viewState === 'planning'\) \{\s*return <OutskirtsPlanningOwner cityId=\{cityId\} \/>;\s*\}/);
  assert.match(panel, /<OutskirtsLegacyActiveSurface cityId=\{cityId\} \/>/);
  assert.match(panel, /outskirts-active-boundary-loading/);
});

void test('P14 acceptance docs exist with required files', async () => {
  assert.equal(fs.existsSync(P14_ROOT), true);
  assert.equal(fs.existsSync(`${P14_ROOT}/README.md`), true);
  assert.equal(fs.existsSync(`${P14_ROOT}/overlay-anchor-sheet.md`), true);
  assert.equal(fs.existsSync(`${P14_ROOT}/cleanup-decision-log.md`), true);
  assert.equal(fs.existsSync(`${P14_ROOT}/capture-manifest.json`), true);

  const manifestRaw = await readFile(`${P14_ROOT}/capture-manifest.json`, 'utf8');
  const manifest = JSON.parse(manifestRaw) as { slots: Array<{ id: string }> };
  const ids = manifest.slots.map((slot) => slot.id);
  assert.deepEqual(ids, [
    '01-review-fixture-default',
    '02-live-default',
    '03-bounty-absent',
    '04-auto-repeat-off',
    '05-expedition-none-or-changed',
    '06-low-fx',
    '07-reduced-motion',
    '08-narrow-host',
    '09-wide-host',
    '10-active-contained-proof',
    '11-overlay-composite',
  ]);
});

void test('P14 scaffold cleanup status is explicit and stale-pending docs are superseded', async () => {
  const cleanupLog = await readFile(`${P14_ROOT}/cleanup-decision-log.md`, 'utf8');
  const scaffoldExists = fs.existsSync('src/features/world/outskirts/shell/OutskirtsExactShellScaffold.ts');
  const scaffoldContractExists = fs.existsSync('tests/contracts/outskirtsExactShellScaffoldContract.test.ts');

  if (scaffoldExists) {
    assert.match(cleanupLog, /OutskirtsExactShellScaffold/);
  } else {
    assert.equal(scaffoldContractExists, false);
  }

  const p10 = await readFile('docs/release/qa/ui-cutover/outskirts-exact/p10-approval/README.md', 'utf8');
  assert.match(p10, /Supersession note/);
  assert.match(p10, /p14-acceptance\/README.md/);
});
