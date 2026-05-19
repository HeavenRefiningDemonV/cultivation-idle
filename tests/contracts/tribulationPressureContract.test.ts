import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildTribulationPressureSurface,
  isTribulationPressurePreviewEnabled,
  resetTribulationPressurePreviewFlagForTests,
  setTribulationPressurePreviewEnabledForTests,
} from '../../src/systems/tribulationPressure/index.js';

test.afterEach(() => {
  resetTribulationPressurePreviewFlagForTests();
});

test('tribulation pressure preview is disabled by default and returns hidden surface', () => {
  assert.equal(isTribulationPressurePreviewEnabled(), false);

  const surface = buildTribulationPressureSurface({
    stabilityPct: 30,
    heartLawMismatch: true,
    missingBreakthroughSupport: true,
  });

  assert.equal(surface.enabled, false);
  assert.equal(surface.state, 'hidden');
  assert.equal(surface.pressureScore, 0);
  assert.equal(surface.sourceLines.length, 0);
  assert.equal(surface.reliefRoutes.length, 0);
});

test('enabled tribulation pressure is deterministic for the same inputs', () => {
  setTribulationPressurePreviewEnabledForTests(true);

  const input = {
    stabilityPct: 32,
    rushedThreshold: true,
    heartLawMismatch: true,
    missingBreakthroughSupport: true,
  };
  const first = buildTribulationPressureSurface(input);
  const second = buildTribulationPressureSurface(input);

  assert.deepEqual(second, first);
  assert.equal(first.enabled, true);
  assert.equal(first.state, 'fracturing');
  assert.equal(first.sourceLines.some((line) => line.code === 'low_stability'), true);
  assert.equal(first.reliefRoutes.some((route) => route.target === 'heart_law'), true);
  assert.match(first.deterministicOutcomeLine, /no random/i);
});

test('tribulation pressure builder does not use random chance or mutate breakthrough', () => {
  const source = readFileSync('src/systems/tribulationPressure/buildTribulationPressureSurface.ts', 'utf8');
  assert.equal(source.includes('Math.random'), false);
  assert.equal(source.includes('setState'), false);
  assert.equal(source.includes('breakthrough('), false);
});
