import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { buildUiFxProviderProps } from '../../src/app/fx/buildUiFxProviderProps.js';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

void test('ui fx settings bridge: pure builder maps uiFx settings to provider props', () => {
  const result = buildUiFxProviderProps({
    enabled: false,
    quality: 'high',
    allowAtmosphere: false,
    allowHeroFx: true,
  }, 'force-on');

  assert.equal(result.enabled, false);
  assert.equal(result.requestedQuality, 'high');
  assert.equal(result.allowAtmosphere, false);
  assert.equal(result.allowHeroFx, true);
  assert.equal(result.respectReducedMotion, true);
  assert.equal(result.debugReducedMotionOverride, 'force-on');
});

void test('ui fx settings bridge: hook source exposes required contract shape', () => {
  const source = read('src/app/fx/useUiFxSettings.ts');

  assert.match(source, /useUIStore/);
  assert.match(source, /uiFxSettings/);
  assert.match(source, /setUiFxSettings/);
  assert.match(source, /resetUiFxSettings/);
  assert.match(source, /providerProps/);
  assert.match(source, /buildUiFxProviderProps/);
});
