import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import { buildRuinsAcceptanceAudit } from '../../src/ui/world/buildRuinsAcceptanceAudit.js';

test('ruins acceptance audit validates role clarity and deterministic trio visibility', () => {
  const result = buildRuinsAcceptanceAudit({
    ruinName: 'Hollow Log Den',
    roomCountLine: 'Rooms: 6',
    roleTag: 'Targeted Mats',
    bestUsedWhen: 'Best used when you need targeted local materials and deterministic support rewards.',
    anchorLine: 'Guaranteed anchor: Artifact Bundle',
    leadMaterialsLine: 'Lead materials: Quarry Ore • Lotus Pollen',
    rarePityLine: 'Rare pity: 2/4',
    trackedBountyVisible: true,
    primaryExitHint: {
      destination: 'forge',
      label: 'You now have enough for Forge',
      reason: 'Enough Quarry Ore 4/4 for a forge step.',
      ctaLabel: 'Open Forge',
      routeable: true,
    },
  });

  assert.equal(result.passed, true);
  assert.deepEqual(result.blockers, []);
  assert.equal(result.checklist.deterministicTrioVisible, true);
  assert.equal(result.checklist.roleClarity, true);
});

test('world-facing ruins panel keeps acceptance gate hooks and deterministic first-read composition', async () => {
  const source = await readFile(new URL('../../src/components/screens/world/buildings/RuinsBuildingPanel.tsx', import.meta.url), 'utf8');
  const summaryCard = await readFile(new URL('../../src/ui/world/RuinsSummaryCard.tsx', import.meta.url), 'utf8');

  assert.match(source, /buildRuinsAcceptanceAudit/);
  assert.match(source, /data-ruins-acceptance/);
  assert.match(source, /RuinsSummaryCard/);
  assert.match(source, /RuinsProgress/);
  assert.match(summaryCard, /Deterministic value preview/);
  assert.match(summaryCard, /ruinsSummaryCard__adjacency/);
});
