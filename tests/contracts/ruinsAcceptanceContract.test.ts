import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import { createRuinsExactMockupFixture } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';

test('ruins exact surface keeps deterministic targeted-material truth and CTA/summary slots', () => {
  const surface = createRuinsExactMockupFixture();

  assert.equal(surface.page.title, 'Ruins');
  assert.equal(surface.targetedMaterialsCard.title, 'Targeted Materials');
  assert.equal(surface.targetedMaterialsCard.guaranteedAnchor.label, 'Guaranteed Anchor');
  assert.equal(surface.targetedMaterialsCard.guaranteedAnchor.value, 'Core Fragment x1');
  assert.match(surface.targetedMaterialsCard.rarePity.label, /Rare Pity/);
  assert.match(surface.targetedMaterialsCard.autoRepeat.label, /Auto-Repeat/);
  assert.equal(surface.roomRoute.title, 'Hollow Log Den Route');
  assert.equal(surface.primaryAction.label, 'Continue Exploration');
  assert.equal(surface.explorationSummary.title, 'Exploration Summary');
});

test('world-facing ruins panel routes through exact owner and does not pull legacy combat-path ruins components', async () => {
  const panel = await readFile(new URL('../../src/components/screens/world/buildings/RuinsBuildingPanel.tsx', import.meta.url), 'utf8');

  assert.match(panel, /RuinsScreenOwner/);
  assert.doesNotMatch(panel, /RuinsSummaryCard/);
  assert.doesNotMatch(panel, /RuinsProgress/);
  assert.doesNotMatch(panel, /RuinsCtaZone/);
  assert.doesNotMatch(panel, /buildRuinsAcceptanceAudit/);
  assert.doesNotMatch(panel, /data-ruins-acceptance/);
});
