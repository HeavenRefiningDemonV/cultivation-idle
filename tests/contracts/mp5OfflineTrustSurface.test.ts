import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOfflineCatchupSurface } from '../../src/systems/offline/offlineCatchupSurface.js';

test('offline trust surface exposes Training and Dao Heart detail rows from the mutating summary', () => {
  const surface = buildOfflineCatchupSurface({
    generatedAt: 1000,
    rawSeconds: 3600,
    summary: {
      offlineSeconds: 3600,
      rawOfflineSeconds: 3600,
      maxOfflineSeconds: 43200,
      offlineDuration: '1h',
      efficiency: 0.5,
      wasCapped: false,
      parts: [
        {
          kind: 'path_training',
          label: 'Training practice',
          value: '+2 rating',
          detailRows: [
            { id: 'applied_time', label: 'Applied time', value: '60m' },
            { id: 'fatigue_dampened', label: 'Fatigue dampened', value: '12 downgrades' },
          ],
        },
        {
          kind: 'dao_heart',
          label: 'Dao Heart practice',
          value: '+18.5 XP',
          detailRows: [
            { id: 'verse_mastery', label: 'Verse mastery', value: '+1.2' },
            { id: 'risk_band', label: 'Risk band', value: 'Stable' },
          ],
        },
      ],
    },
  });

  const training = surface.summaryGroups.find((group) => group.id === 'path_training');
  const daoHeart = surface.summaryGroups.find((group) => group.id === 'dao_heart');

  assert.ok(training);
  assert.ok(daoHeart);
  assert.equal(training.lines.some((line) => line.id === 'fatigue_dampened'), true);
  assert.equal(daoHeart.lines.some((line) => line.id === 'verse_mastery'), true);
  assert.equal(surface.blockedReasons.some((reason) => reason.id === 'combat_excluded'), true);
});
