import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { STATUS_OBSERVATORY_FIXTURE_SEEDS } from '../../src/systems/ui/status/statusObservatoryFixtures.js';
import {
  STATUS_OBSERVATORY_EXPECTED_BRANCHES,
  STATUS_OBSERVATORY_FRAME_ATLAS,
  STATUS_OBSERVATORY_INSTRUMENT_ROLES,
  STATUS_OBSERVATORY_STAT_LEGEND,
} from '../../src/systems/ui/status/statusObservatoryPresentation.js';

const repoRoot = process.cwd();

function read(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

test('S0/S1 presentation atlas records the ten mockup frames as contract facts', () => {
  assert.equal(STATUS_OBSERVATORY_FRAME_ATLAS.length, 10);
  assert.deepEqual(
    STATUS_OBSERVATORY_FRAME_ATLAS.map((frame) => frame.frame),
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  );

  const implications = STATUS_OBSERVATORY_FRAME_ATLAS
    .map((frame) => `${frame.role} ${frame.surfaceImplication}`)
    .join('\n');

  for (const phrase of [
    '28 named stats',
    'Blocked state',
    'Healthy state',
    'selected stat lens',
    'Post-failure state',
    'Root/law instrument',
    'Prestige pressure',
    'Canopy',
    'Default topology',
    'six organs',
  ]) {
    assert.match(implications, new RegExp(phrase, 'i'));
  }
});

test('S0/S1 presentation constants lock instrument roles, branch counts, and node legend', () => {
  assert.deepEqual(
    STATUS_OBSERVATORY_INSTRUMENT_ROLES,
    [
      'lifeDecree',
      'vitalsRibbon',
      'rootLawInstrument',
      'meridianVessel',
      'statConstellation',
      'bottleneckCanopy',
      'buildPreparation',
      'workWheel',
      'ledgerRail',
      'drawers',
    ],
  );
  assert.deepEqual(
    Object.fromEntries(STATUS_OBSERVATORY_EXPECTED_BRANCHES.map((branch) => [branch.id, branch.expectedCount])),
    { universal: 8, heaven: 7, earth: 6, martial: 7 },
  );
  assert.equal(STATUS_OBSERVATORY_STAT_LEGEND.some((entry) => entry.nodeState === 'bridge_socket'), true);
  assert.equal(STATUS_OBSERVATORY_STAT_LEGEND.some((entry) => /not a failure/i.test(entry.detail)), true);
});

test('S2 fixture seeds cover required visual states and the fixture-safe renderer exists', () => {
  const visualStates = STATUS_OBSERVATORY_FIXTURE_SEEDS.map((seed) => seed.visualState);
  for (const expected of ['blocked', 'healthy', 'postFailure', 'prestigePressure', 'contentCap']) {
    assert.equal(visualStates.includes(expected as never), true, `${expected} fixture seed should exist.`);
  }
  assert.equal(
    STATUS_OBSERVATORY_FIXTURE_SEEDS.every((seed) => seed.canopy.centralEdict && seed.canopy.routeCharms.length > 0),
    true,
  );
  assert.equal(
    existsSync(path.join(repoRoot, 'src', 'ui', 'status', 'observatory', 'StatusLivingStateObservatory.tsx')),
    true,
    'S2 must add the Status Observatory renderer without cutting over the public Status path.',
  );
});

test('S0/S1 observatory source files stay pure and route-safe', () => {
  const source = [
    read('src/systems/ui/status/statusObservatoryTypes.ts'),
    read('src/systems/ui/status/statusObservatoryPresentation.ts'),
    read('src/systems/ui/status/statusObservatoryNoLoss.ts'),
    read('src/systems/ui/status/statusObservatoryFixtures.ts'),
    read('src/systems/ui/status/statusObservatorySurface.ts'),
  ].join('\n');

  assert.doesNotMatch(source, /from ['"].*stores\//, 'Observatory foundation must not import stores.');
  assert.doesNotMatch(source, /\.getState\s*\(/, 'Observatory foundation must not read stores.');
  assert.doesNotMatch(source, /RewardService|CombatStore|PrestigeResetService/, 'Observatory foundation must not import mutation owners.');
  assert.doesNotMatch(source, /grantRewards|spendCurrency|performPrestigeReset|breakthrough\s*\(/, 'Observatory foundation must not mutate gameplay.');
  assert.doesNotMatch(source, /from ['"]react['"]|from ['"]react\//, 'S0/S1 foundation must not add React components.');
  assert.doesNotMatch(source, /\.(css|scss)['"]/, 'S0/S1 foundation must not import styles.');
});
