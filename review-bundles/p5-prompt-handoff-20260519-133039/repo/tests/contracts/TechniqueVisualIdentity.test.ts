import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getGradeMaterialLabel,
  getRarityFx,
  getRarityProvenanceLabel,
  resolveTechniqueVisualIdentity,
  tokenizeTechniqueName,
} from '../../src/features/techniques/techniqueVisualIdentity.js';

test('technique visual identity normalizes grade and rarity into closed presentation keys', () => {
  assert.equal(getGradeMaterialLabel('mortal'), 'paper-bound foundation');
  assert.equal(getGradeMaterialLabel('earth'), 'jade-stamped body art');
  assert.equal(getGradeMaterialLabel('heaven'), 'star-sealed doctrine');
  assert.equal(getGradeMaterialLabel('mystic'), 'void-ink transmission');
  assert.equal(getGradeMaterialLabel('invalid-grade'), 'unverified copy');

  assert.equal(getRarityProvenanceLabel('common'), 'plain copy');
  assert.equal(getRarityFx('common'), 'none');
  assert.equal(getRarityFx('uncommon'), 'bronze-thread');
  assert.equal(getRarityFx('rare'), 'jade-glint');
  assert.equal(getRarityFx('epic'), 'cinnabar-embers');
  assert.equal(getRarityFx('legendary'), 'celestial-corona');
  assert.equal(getRarityFx('bad-rarity'), 'none');
});

test('technique name tokenization highlights important words without splitting apostrophes or over-highlighting', () => {
  const heavensPulse = tokenizeTechniqueName({ name: "Heaven's Pulse", path: 'heaven', role: 'setup' });
  assert.deepEqual(heavensPulse.map((token) => token.text).join(''), "Heaven's Pulse");
  assert.equal(heavensPulse.filter((token) => token.emphasis !== 'none').length <= 2, true);
  assert.equal(heavensPulse.some((token) => token.text === "Heaven's"), true);

  const stonebreaker = tokenizeTechniqueName({ name: 'Stonebreaker Fist', path: 'earth', families: ['coreDamage'] });
  assert.deepEqual(
    stonebreaker.filter((token) => token.emphasis !== 'none').map((token) => token.text.trim()),
    ['Stonebreaker', 'Fist'],
  );

  const astralNeedle = tokenizeTechniqueName({ name: 'Astral Needle', path: 'heaven', families: ['control'] });
  assert.deepEqual(
    astralNeedle.filter((token) => token.emphasis !== 'none').map((token) => token.text.trim()),
    ['Astral', 'Needle'],
  );
});

test('resolved visual identity exposes safe data attributes and badge surfaces', () => {
  const identity = resolveTechniqueVisualIdentity({
    techId: 'tech_astral_needle',
    name: 'Astral Needle',
    path: 'heaven',
    role: 'control',
    families: ['control'],
    grade: 'heaven',
    rarity: 'epic',
  });

  assert.deepEqual(identity.cssAttrs, {
    path: 'heaven',
    role: 'control',
    grade: 'heaven',
    rarity: 'epic',
    rarityFx: 'cinnabar-embers',
  });
  assert.equal(identity.gradeDisplayLabel, 'Heaven Grade');
  assert.equal(identity.rarityProvenanceLabel, 'cinnabar-sealed art');
  assert.equal(identity.badges.role.label, 'Control Seal');
});
