import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPavilionSurface } from '../../src/features/pavilion/buildPavilionSurface.js';
import { validatePavilionRecordsManifest } from '../../src/features/pavilion/pavilionContentTypes.js';
import { loadPavilionManifestFixture } from './pavilionTestFixtures.js';

test('fixture surface locks the Foundation Gate mockup contract', () => {
  const manifest = validatePavilionRecordsManifest(loadPavilionManifestFixture());
  const surface = buildPavilionSurface({
    mode: 'fixture',
    manifest,
    nowMs: 123,
  });

  assert.equal(surface.meta.mode, 'fixture');
  assert.equal(surface.meta.rootTestId, 'pavilion-exact-page');
  assert.equal(surface.meta.selectedEntryId, 'gate_trials_and_thresholds.foundation_gate');
  assert.equal(surface.meta.selectedCategoryId, 'gate-trials');
  assert.equal(surface.page.title, 'Pavilion of Ten Thousand Records');
  assert.equal(surface.page.subtitle, 'Jade Slip Archive');
  assert.equal(
    surface.currentLifeRibbon.display,
    'Qi Condensation · Heaven Path · Quiet Breath Method · Pinewind Hamlet · Prepare Foundation Gate',
  );
  assert.equal(surface.elderNote?.title, 'Elder Note');
  assert.equal(
    surface.elderNote?.body,
    'Your foundation is close. Stock healing pills before challenging the gate.',
  );

  assert.equal(surface.selectedEntry.recordBrief.quickAnswer.includes('Foundation Gate'), true);
  assert.ok(surface.selectedEntry.recordBrief.doNext.length >= 2);
  assert.ok(surface.selectedEntry.recordBrief.watch.some((chip) => chip.label.includes('Medicine')));
  assert.ok(surface.selectedEntry.guidanceGroups.some((group) => group.type === 'requirements'));
  assert.ok(surface.selectedEntry.guidanceGroups.some((group) => group.type === 'mistakes'));

  assert.equal(surface.rightRail.title, 'Threads of Karma');
  assert.ok(surface.rightRail.blocks.some((block) => block.title === 'Best Source' && block.items[0]?.label === 'Apothecary'));
  assert.ok(surface.rightRail.blocks.some((block) => block.title === 'Used For' && block.items[0]?.label === 'Foundation Breakthrough'));
  assert.ok(surface.rightRail.blocks.some((block) => block.title === 'Related Records'));
  assert.ok(surface.rightRail.blocks.some((block) => block.title === 'Current Milestone'));
  assert.ok(surface.rightRail.blocks.some((block) => block.title === 'Prior-Life Note'));
  assert.deepEqual(surface.footer.breadcrumbs, [
    'Pavilion of Ten Thousand Records',
    'Gate Trials',
    'Foundation Gate',
  ]);
});

test('fixture surface can target a specific record for readability capture', () => {
  const manifest = validatePavilionRecordsManifest(loadPavilionManifestFixture());
  const surface = buildPavilionSurface({
    mode: 'fixture',
    manifest,
    pavilionState: { selectedEntryId: 'current_life_and_doctrine.earth_path' },
    nowMs: 123,
  });

  assert.equal(surface.meta.selectedEntryId, 'current_life_and_doctrine.earth_path');
  assert.equal(surface.selectedEntry.title, 'Earth Path');
  assert.equal(surface.meta.selectedCategoryId, 'current-life');
});
