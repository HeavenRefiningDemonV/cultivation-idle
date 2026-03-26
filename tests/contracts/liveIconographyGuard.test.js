import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const techniqueModal = read('src/components/modals/TechniqueDetailModal.tsx');
const manualModal = read('src/components/modals/ManualDetailModal.tsx');
const cultivateScss = read('src/components/screens/CultivateScreen.scss');
const worldScss = read('src/components/screens/WorldScreen.scss');

test('critical detail modals do not regress to placeholder glyph fallback', () => {
  assert.equal(techniqueModal.includes('◎'), false);
  assert.equal(manualModal.includes('◎'), false);
});

test('critical cultivation no-shift controls do not use translateY hover motion', () => {
  assert.equal(/translateY\(-1px\)/.test(cultivateScss), false);
});

test('live world route cards avoid cold indigo accent tokens', () => {
  assert.equal(/99, 102, 241|c084fc|38bdf8/i.test(worldScss), false);
});

test('touched detail modals do not introduce emoji icon fallback', () => {
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u;
  assert.equal(emojiRegex.test(techniqueModal), false);
  assert.equal(emojiRegex.test(manualModal), false);
});
