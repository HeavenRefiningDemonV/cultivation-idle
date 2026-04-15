import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

void test('combat theater reuses ruins progress in rail mode without world CTA zone', async () => {
  const progressPanelSource = await readFile(new URL('../../src/components/combat/theater/ProgressPanel.tsx', import.meta.url), 'utf8');
  const ruinsProgressSource = await readFile(new URL('../../src/features/ruins/ui/RuinsProgress.tsx', import.meta.url), 'utf8');

  assert.match(progressPanelSource, /RuinsProgress/);
  assert.match(progressPanelSource, /section="rail"/);
  assert.doesNotMatch(progressPanelSource, /RuinsCtaZone/);

  assert.match(ruinsProgressSource, /section\?: 'full' \| 'rail' \| 'utility'/);
  assert.match(ruinsProgressSource, /ruins-progress--railOnly/);
});
