import assert from 'node:assert/strict';
import test from 'node:test';
import { findPlaceholderStrings } from '../../scripts/release/findPlaceholderStrings.js';

void test('tracked live semester files have no placeholder/prototype/debug player-facing strings', () => {
  const findings = findPlaceholderStrings();
  assert.deepEqual(findings, []);
});
