import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('player-facing live prep surfaces no longer advertise a separate Alchemy room', async () => {
  const [apothecaryPanel, exactScreen, exactBuilder, exactOwner, brewPanel, statusPanel, modalSource] = await Promise.all([
    readRepoFile('src/components/screens/ApothecaryPanel.tsx'),
    readRepoFile('src/features/apothecary/exact/ApothecaryExactScreen.tsx'),
    readRepoFile('src/features/apothecary/exact/buildApothecaryExactSurface.ts'),
    readRepoFile('src/features/apothecary/exact/ApothecaryExactScreenOwner.tsx'),
    readRepoFile('src/features/apothecary/ApothecaryBrewPanel.tsx'),
    readRepoFile('src/components/SystemStatusPanel.tsx'),
    readRepoFile('src/components/modals/WorldBuildingModal.tsx'),
  ]);

  assert.match(apothecaryPanel, /label:\s*'Brew'/);
  assert.doesNotMatch(apothecaryPanel, /label:\s*'Workshop'/);
  assert.match(brewPanel, /Convert reagents into cheaper readiness\./);
  assert.doesNotMatch(statusPanel, /Alchemy:/);
  assert.match(statusPanel, /Brew:/);
  assert.match(exactBuilder, /Buy Stock/);
  assert.match(exactBuilder, /Brew Remedies/);
  assert.match(exactBuilder, /Medicine Pouch/);
  assert.doesNotMatch(exactScreen, /primaryTabs/);
  assert.match(exactOwner, /MedicinePouchModal/);
  assert.match(modalSource, /case 'alchemy':[\s\S]*<ApothecaryExactScreenOwner[\s\S]*focus="brew"/);
  assert.doesNotMatch(modalSource, /case 'alchemy':[\s\S]*AlchemyPanel/);
});
