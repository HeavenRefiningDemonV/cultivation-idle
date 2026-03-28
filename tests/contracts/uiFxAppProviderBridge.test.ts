import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

void test('app fx provider bridge: imports and provider bridge contract are present', () => {
  const source = read('src/app/fx/AppFxProviderBridge.tsx');

  assert.match(source, /useUiFxSettings/);
  assert.match(source, /FxQualityProvider/);
  assert.match(source, /const \{ providerProps \} = useUiFxSettings\(\)/);
  assert.match(source, /<FxQualityProvider \{\.\.\.providerProps\}>\{children\}<\/FxQualityProvider>/);

  assert.doesNotMatch(source, /components\/screens/);
  assert.doesNotMatch(source, /components\/modals/);
});

void test('app fx provider bridge: bridge component does not add wrapper DOM', () => {
  const source = read('src/app/fx/AppFxProviderBridge.tsx');

  assert.doesNotMatch(source, /<div/);
  assert.doesNotMatch(source, /<section/);
});
