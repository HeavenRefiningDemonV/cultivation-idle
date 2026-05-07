import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('apothecary live contract preserves Buy, Brew, and Medicine Pouch while exact cutover removes primary tabs', async () => {
  const [panelSource, exactScreenSource, exactBuilderSource, exactOwnerSource, brewSource, readModelSource] = await Promise.all([
    readRepoFile('src/components/screens/ApothecaryPanel.tsx'),
    readRepoFile('src/features/apothecary/exact/ApothecaryExactScreen.tsx'),
    readRepoFile('src/features/apothecary/exact/buildApothecaryExactSurface.ts'),
    readRepoFile('src/features/apothecary/exact/ApothecaryExactScreenOwner.tsx'),
    readRepoFile('src/features/apothecary/ApothecaryBrewPanel.tsx'),
    readRepoFile('src/features/apothecary/apothecaryPrepReadModel.ts'),
  ]);

  assert.match(readModelSource, /Use Apothecary to convert gold and reagents into immediate readiness\./);
  assert.match(panelSource, /label:\s*'Buy'/);
  assert.match(panelSource, /label:\s*'Brew'/);
  assert.match(panelSource, /label:\s*'Medicine Pouch'/);
  assert.match(panelSource, /Prep Warnings/);
  assert.match(panelSource, /Recommended Package/);
  assert.match(panelSource, /Medicine Pouch Summary/);
  assert.doesNotMatch(panelSource, /label:\s*'Services'/);
  assert.doesNotMatch(panelSource, /label:\s*'Bundles'/);
  assert.match(exactBuilderSource, /Buy Stock/);
  assert.match(exactBuilderSource, /Brew Remedies/);
  assert.match(exactBuilderSource, /Medicine Pouch/);
  assert.doesNotMatch(exactScreenSource, /label:\s*'Buy'/);
  assert.doesNotMatch(exactScreenSource, /label:\s*'Brew'/);
  assert.doesNotMatch(exactScreenSource, /label:\s*'Medicine Pouch'/);
  assert.match(exactOwnerSource, /MedicinePouchModal/);
  assert.match(brewSource, /Buy is instant convenience\. Brew is slower/);
});
