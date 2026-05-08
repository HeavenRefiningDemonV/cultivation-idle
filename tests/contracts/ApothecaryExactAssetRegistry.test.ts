import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { APOTHECARY_EXACT_ASSETS, getApothecaryExactAssetWarnings } from '../../src/features/apothecary/exact/apothecaryExactAssetRegistry.js';
import { APOTHECARY_EXACT_REQUIRED_ASSET_KEYS } from '../../src/features/apothecary/exact/apothecaryExactPresentation.js';

void test('Apothecary Exact asset registry resolves every required approved asset role', () => {
  assert.deepEqual(getApothecaryExactAssetWarnings(), []);

  for (const key of APOTHECARY_EXACT_REQUIRED_ASSET_KEYS) {
    const descriptor = APOTHECARY_EXACT_ASSETS[key];
    assert.ok(descriptor, `missing registry descriptor for ${key}`);
    assert.equal(descriptor.key, key);
    assert.equal(descriptor.required, true);
    assert.equal(descriptor.status, 'ready');
    assert.equal(descriptor.allowedAsFlattenedMockupSubstitute, false);
    assert.equal(descriptor.src.length > 0, true);
    assert.equal(descriptor.sourcePath.includes('apothecary mockup.png'), false);
    assert.equal(existsSync(resolve(process.cwd(), descriptor.sourcePath)), true, `asset source missing on disk: ${descriptor.sourcePath}`);
  }
});

void test('Apothecary Exact heavy raster backplates are optional historical assets', () => {
  for (const key of [
    'room.scenicPlate',
    'frames.prescription',
    'frames.primaryCta',
    'frames.laneDefault',
    'frames.laneReady',
    'frames.laneWarning',
    'frames.laneDisabled',
  ] as const) {
    assert.equal(APOTHECARY_EXACT_REQUIRED_ASSET_KEYS.includes(key), false, `${key} should no longer be required`);
    assert.equal(APOTHECARY_EXACT_ASSETS[key]?.required, false, `${key} should be optional after CSS declutter`);
    assert.equal(APOTHECARY_EXACT_ASSETS[key]?.status, 'ready', `${key} can stay registered for history/compatibility`);
  }
});

void test('Apothecary Exact registry is the only screen asset import surface', () => {
  const screen = readFileSync('src/features/apothecary/exact/ApothecaryExactScreen.tsx', 'utf8');
  const owner = readFileSync('src/features/apothecary/exact/ApothecaryExactScreenOwner.tsx', 'utf8');
  const builder = readFileSync('src/features/apothecary/exact/buildApothecaryExactSurface.ts', 'utf8');

  for (const source of [screen, owner]) {
    assert.equal(source.includes('.png'), false, 'rendering files must not ad hoc import PNG assets');
    assert.equal(source.includes('apothecary mockup.png'), false, 'runtime files must not use the flattened mockup');
  }

  assert.equal(builder.includes('APOTHECARY_EXACT_ASSETS'), true);
  assert.equal(builder.includes('getApothecaryExactAssetWarnings'), true);
});
