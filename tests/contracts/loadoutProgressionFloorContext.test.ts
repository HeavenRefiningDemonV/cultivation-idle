import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { formatProgressionFloorContextLabel } from '../../src/systems/builds/loadoutProgressionContract.js';

const repoRoot = process.cwd();

test('packet D.8 progression floor context formatter keeps one canonical unlock label surface', () => {
  assert.equal(
    formatProgressionFloorContextLabel(
      { majorRealmId: 'foundation_establishment', realmIndex: 1, realmName: 'Foundation Establishment', reasonText: 'Unlocks at: Foundation Establishment' },
    ),
    'Unlocks at Foundation Establishment',
  );

  assert.equal(
    formatProgressionFloorContextLabel(
      { majorRealmId: 'core_formation', realmIndex: 2, realmName: 'Core Formation', reasonText: 'Unlocks at: Core Formation' },
      { prefix: 'Unlocks at:', punctuation: '.' },
    ),
    'Unlocks at: Core Formation.',
  );

  assert.equal(formatProgressionFloorContextLabel(null), null);
});

test('packet D.8 contextual floor messaging callsites route through the canonical formatter', () => {
  const files = [
    'src/components/modals/TechniqueLearnedModal.tsx',
    'src/components/modals/TechniqueDetailModal.tsx',
    'src/components/screens/TechniqueLibraryScreen.tsx',
  ];

  files.forEach((filePath) => {
    const source = readFileSync(path.join(repoRoot, filePath), 'utf8');
    assert.equal(
      source.includes('formatProgressionFloorContextLabel('),
      true,
      `${filePath} must consume formatProgressionFloorContextLabel for unlock/floor context text.`,
    );
  });
});
