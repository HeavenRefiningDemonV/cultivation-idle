import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('cultivate screen derives a centralized primary intent object for action-lane state hierarchy', async () => {
  const source = await readRepoFile('src/components/screens/CultivateScreen.tsx');

  assert.match(source, /const primaryIntent = useMemo/);
  assert.match(source, /breakthroughMilestoneState === 'content_cap'/);
  assert.match(source, /breakthroughMilestoneState === 'cultivation_edge'/);
  assert.match(source, /breakthroughMilestoneState === 'gate_trial'/);
  assert.match(source, /kind: 'breakthrough_pending'/);
});
