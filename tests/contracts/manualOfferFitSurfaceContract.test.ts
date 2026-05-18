import assert from 'node:assert/strict';
import test from 'node:test';

import { buildManualOfferFitSurface } from '../../src/features/world/manualPavilionExact/manualOfferFitSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('ManualOfferFitSurfaceV1 tags path fit, empty slots, duplicates, and future offers', async () => {
  const content = await getValidatedEconomicContent();
  const heavenTech = content.techniques.find((tech) => tech.path === 'heaven')!;

  const currentFit = buildManualOfferFitSurface({
    content,
    manualId: `manual_${heavenTech.id}`,
    techniqueId: heavenTech.id,
    selectedPath: 'heaven',
    ownedTechniqueIds: [],
    equippedTechniqueIds: [],
    currentBlockerKind: 'manual_pavilion_gap',
  });
  assert.ok(currentFit.tags.includes('path_aligned'));
  assert.ok(currentFit.tags.includes('fills_empty_slot'));
  assert.ok(currentFit.tags.includes('current_gate_fit'));
  assert.equal(currentFit.currentBlockerFit, 'primary');

  const duplicateFit = buildManualOfferFitSurface({
    content,
    manualId: `manual_${heavenTech.id}_duplicate`,
    techniqueId: heavenTech.id,
    selectedPath: 'heaven',
    ownedTechniqueIds: [heavenTech.id],
    equippedTechniqueIds: [heavenTech.id],
    currentBlockerKind: 'build_correction_gap',
  });
  assert.ok(duplicateFit.tags.includes('rank_duplicate'));
  assert.match(duplicateFit.duplicateLine ?? '', /rank|fragment|equipped/i);
});
