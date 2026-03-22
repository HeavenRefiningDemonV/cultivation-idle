import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('CultivateScreen builds cultivation buff read-models from stable store state instead of invoking an unstable selector getter', async () => {
  const screenSource = await readRepoFile('src/components/screens/CultivateScreen.tsx');

  assert.doesNotMatch(screenSource, /useCultivationStore\(\(state\)\s*=>\s*state\.getCultivationConsumableReadModel\(\)\)/);
  assert.match(screenSource, /useCultivationStore\(\(state\)\s*=>\s*state\.activeCultivationConsumables\)/);
  assert.match(screenSource, /buildCultivationConsumableReadModel\(activeCultivationConsumables,\s*buffNow\)/);
  assert.match(screenSource, /setInterval\(\(\)\s*=>\s*\{\s*setBuffNow\(Date\.now\(\)\);/s);
});

test('CultivateScreen computes buff summary before the rate tooltip that depends on it and keeps the cultivation buff UI copy', async () => {
  const screenSource = await readRepoFile('src/components/screens/CultivateScreen.tsx');

  const summaryIndex = screenSource.indexOf('const activeBuffSummary = useMemo');
  const tooltipIndex = screenSource.indexOf('const rateTooltip = useMemo');
  assert.ok(summaryIndex >= 0, 'expected activeBuffSummary memo to exist');
  assert.ok(tooltipIndex > summaryIndex, 'expected rateTooltip memo to be declared after activeBuffSummary');

  assert.match(screenSource, /Cultivation buffs/);
  assert.match(screenSource, /No active cultivation tonics\./);
  assert.match(screenSource, /remainingSeconds/);
});
