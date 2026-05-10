import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('CultivateScreen builds cultivation buff read-models from stable store state instead of invoking an unstable selector getter', async () => {
  const builderSource = await readRepoFile('src/features/cultivation/exact/buildCultivationExactSurface.ts');
  const ownerSource = await readRepoFile('src/features/cultivation/exact/CultivationExactScreenOwner.tsx');

  assert.doesNotMatch(builderSource, /useCultivationStore\(\(state\)\s*=>\s*state\.getCultivationConsumableReadModel\(\)\)/);
  assert.match(builderSource, /cultivation\.activeCultivationConsumables/);
  assert.match(builderSource, /buildCultivationConsumableReadModel\(/);
  assert.match(ownerSource, /setInterval\(\(\)\s*=>\s*setBuffNow\(Date\.now\(\)\),\s*1000\)/s);
});

test('CultivateScreen computes buff summary before the rate tooltip that depends on it and keeps the cultivation buff UI copy', async () => {
  const builderSource = await readRepoFile('src/features/cultivation/exact/buildCultivationExactSurface.ts');

  assert.match(builderSource, /const activeBuffSummary =/);
  assert.match(builderSource, /Buffs: \$\{snapshot\.activeBuffSummary\}/);

  assert.match(builderSource, /Cultivation buffs/);
  assert.match(builderSource, /No active cultivation tonics\./);
  assert.match(builderSource, /activeCultivationConsumables/);
});
