import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('StatusSummaryHeader reserves top-fix hint and action lane even when optional state is absent', () => {
  const headerTsx = read('src/ui/status/StatusSummaryHeader.tsx');
  const headerScss = read('src/ui/status/StatusSummaryHeader.scss');

  assert.match(headerTsx, /statusBiggestShortfallHint--empty/);
  assert.match(headerTsx, /statusBiggestShortfallActionLane/);
  assert.match(headerTsx, /BadgeSlot preset="rowEnd"/);
  assert.ok(headerScss.includes('.statusBiggestShortfallHint'));
  assert.ok(headerScss.includes('min-block-size: 16px'));
  assert.ok(headerScss.includes('.statusBiggestShortfallActionLane'));
  assert.ok(headerScss.includes('min-block-size: 32px'));
});

test('WorldModuleCard reserves module-meta state slot and keeps a capped two-chip lane', () => {
  const cardTsx = read('src/ui/world/WorldModuleCard.tsx');
  const cardScss = read('src/ui/world/WorldModuleCard.scss');

  assert.match(cardTsx, /BadgeSlot preset="moduleMeta"/);
  assert.ok(cardTsx.includes('chips.slice(0, 2)'));
  assert.match(cardTsx, /worldModuleCard__chipSlot--empty/);
  assert.ok(cardScss.includes('.worldModuleCard__chips'));
  assert.ok(cardScss.includes('min-block-size: 24px'));
  assert.ok(cardScss.includes('.worldModuleCard__chipSlot--empty'));
  assert.ok(cardScss.includes('visibility: hidden'));
});
