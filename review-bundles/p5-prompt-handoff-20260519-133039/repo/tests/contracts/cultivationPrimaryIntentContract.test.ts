import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('cultivate screen derives a centralized primary intent object for action-lane state hierarchy', async () => {
  const source = await readRepoFile('src/features/cultivation/exact/buildCultivationExactSurface.ts');

  assert.match(source, /function resolveCommandDeck/);
  assert.match(source, /activityState === 'content_cap'/);
  assert.match(source, /activityState === 'gate_blocked'/);
  assert.match(source, /activityState === 'breakthrough_ready'/);
  assert.match(source, /cultivateToggleButton\(snapshot\)/);
});
