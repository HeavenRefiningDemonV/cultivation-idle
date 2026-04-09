import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('doctrine verse row carries a fixed-size lotus icon plus visible paired text', async () => {
  const verseSource = await readRepoFile('src/ui/cultivation/VerseMiniBar.tsx');
  const lotusStyles = await readRepoFile('src/ui/cultivation/QiLotusIcon.scss');

  assert.match(verseSource, /className="verseMiniBar__lotusGroup"/);
  assert.match(verseSource, /className="verseMiniBar__lotusText"/);
  assert.match(verseSource, /QiLotusIcon state=\{lotusState\} className="verseMiniBar__lotusIcon" fixed/);

  assert.match(lotusStyles, /\.qiLotusIcon\[data-fixed="1"\]\s*\{/);
  assert.match(lotusStyles, /width:\s*20px;/);
  assert.match(lotusStyles, /height:\s*20px;/);
  assert.match(lotusStyles, /data-fixed="1"\]\[data-state="ready"\][\s\S]*animation:\s*none;/);
});
