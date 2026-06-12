import assert from 'node:assert/strict';
import test from 'node:test';

import {
  arcPath,
  donutPath,
  parseExpressionCap,
  parseLeadingInt,
  polar,
} from '../../src/ui/status/observatory/observatoryAstrolabeGeometry.js';

test('polar 0deg points straight up, 90deg points right', () => {
  const [ux, uy] = polar(168, 168, 100, 0);
  assert.ok(Math.abs(ux - 168) < 1e-6);
  assert.ok(Math.abs(uy - 68) < 1e-6);
  const [rx, ry] = polar(168, 168, 100, 90);
  assert.ok(Math.abs(rx - 268) < 1e-6);
  assert.ok(Math.abs(ry - 168) < 1e-6);
});

test('arcPath starts with M and uses the radius', () => {
  const d = arcPath(168, 168, 140, -58, 58);
  assert.match(d, /^M/);
  assert.match(d, / A140,140 /);
});

test('donutPath is a closed wedge', () => {
  const d = donutPath(168, 168, 84, 104, -30, 30);
  assert.match(d, /^M/);
  assert.match(d, /Z$/);
});

test('parseLeadingInt reads a finalized label, null when absent', () => {
  assert.equal(parseLeadingInt('66%'), 66);
  assert.equal(parseLeadingInt('82 %'), 82);
  assert.equal(parseLeadingInt(null), null);
  assert.equal(parseLeadingInt('-'), null);
});

test('parseExpressionCap splits X / Y, null when malformed', () => {
  assert.deepEqual(parseExpressionCap('43 / 100'), { value: 43, max: 100 });
  assert.equal(parseExpressionCap(null), null);
  assert.equal(parseExpressionCap('n/a'), null);
});
