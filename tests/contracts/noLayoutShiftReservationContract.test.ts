import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getBadgeSlotStyle } from '../../src/ui/shell/badgeSpace.js';
import { getReservedBadgeSpaceStyle } from '../../src/ui/motion/layoutStability.js';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('layoutStability bridges semantic presets to canonical badge-space dimensions', () => {
  const headerTrailing = getReservedBadgeSpaceStyle('headerTrailing');
  assert.equal(headerTrailing['--ui-reserved-badge-inline-size'], getBadgeSlotStyle('headerTrailing')['--badge-slot-inline-size']);
  assert.equal(headerTrailing['--ui-reserved-badge-block-size'], getBadgeSlotStyle('headerTrailing')['--badge-slot-block-size']);

  const rowEnd = getReservedBadgeSpaceStyle('rowEndBadge');
  assert.equal(rowEnd['--ui-reserved-badge-inline-size'], getBadgeSlotStyle('rowEnd')['--badge-slot-inline-size']);
  assert.equal(rowEnd['--ui-reserved-badge-block-size'], getBadgeSlotStyle('rowEnd')['--badge-slot-block-size']);
});

test('BadgeSlot defaults to reserveWhenEmpty and consumes useReservedBadgeSpace', () => {
  const source = read('src/ui/shell/BadgeSlot.tsx');
  assert.match(source, /reserveWhenEmpty = true/);
  assert.match(source, /useReservedBadgeSpace\(preset\)/);
});
