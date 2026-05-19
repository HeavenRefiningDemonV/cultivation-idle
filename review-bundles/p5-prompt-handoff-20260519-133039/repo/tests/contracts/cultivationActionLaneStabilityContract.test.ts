import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('cultivation action lane reserves stable slots for chips, support copy, and button widths', async () => {
  const styles = await readRepoFile('src/features/cultivation/exact/CultivationExactScreen.scss');

  assert.match(styles, /\.cultivationExactCommandDeck\s*\{[\s\S]*width:\s*var\(--cult-exact-command-w\)/);
  assert.match(styles, /\.cultivationExactCommandButton--primary\s*\{[\s\S]*min-height:/);
  assert.match(styles, /\.cultivationExactCommandDeck__support\s*\{/);
  assert.match(styles, /\.cultivationExactCommandButton__label\s*\{[\s\S]*white-space:\s*nowrap/);
});
