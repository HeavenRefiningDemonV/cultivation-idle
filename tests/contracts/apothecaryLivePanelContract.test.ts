import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('apothecary panel is framed around Buy, Brew, and Medicine Pouch with the locked purpose sentence', async () => {
  const [panelSource, brewSource, readModelSource] = await Promise.all([
    readRepoFile('src/components/screens/ApothecaryPanel.tsx'),
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
  assert.match(brewSource, /Buy is instant convenience\. Brew is slower/);
});
