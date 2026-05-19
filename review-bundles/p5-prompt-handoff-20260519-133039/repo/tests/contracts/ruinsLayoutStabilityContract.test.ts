import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.2I layout stability reserves key Ruins state slots', () => {
  const styles = read('src/components/screens/world/buildings/CombatStyles.scss');

  assert.match(styles, /\.ruinsSummaryCard__supportRow\s*\{[\s\S]*min-height: 36px;/);
  assert.match(styles, /\.ruinsSummaryCard__trackedBounty\s*\{[\s\S]*min-height: 34px;/);
  assert.match(styles, /\.ruinsSummaryCard__adjacency\s*\{[\s\S]*min-height: 84px;/);
  assert.match(styles, /\.ruinsSummaryCard__exitHint\s*\{[\s\S]*min-height: 56px;/);
  assert.match(styles, /\.ruinsCtaZone__secondary\s*\{[\s\S]*min-height: 38px;/);
});
