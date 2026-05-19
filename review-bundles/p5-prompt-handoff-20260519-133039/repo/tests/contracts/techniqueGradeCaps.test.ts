import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getTechniqueEffectiveRuneSockets,
  getTechniqueEffectiveTraitSlots,
  getTechniqueMaxRankForGrade,
  getTechniqueRuneSocketsForGrade,
  getTechniqueSecondaryPotencyBonusForGrade,
  getTechniqueTraitCapForGrade,
  getTechniqueTraitSlotBreakdown,
  isHigherTechniqueGrade,
  isHigherTechniqueRarity,
  normalizeManualGrade,
  normalizeTechniqueRarity,
  SEMESTER_TECHNIQUE_GRADE_POLICIES,
  TECHNIQUE_GRADE_ORDER,
  TECHNIQUE_RARITY_ORDER,
  TECHNIQUE_RARITY_TRAIT_SLOTS,
} from '../../src/systems/builds/index.js';

test('packet 4.8 grade order is exact', () => {
  assert.deepEqual(TECHNIQUE_GRADE_ORDER, ['mortal', 'earth', 'heaven', 'mystic']);
});

test('packet 4.8 semester grade policies are exact', () => {
  assert.deepEqual(SEMESTER_TECHNIQUE_GRADE_POLICIES, [
    { grade: 'mortal', maxRank: 3, traitSlots: 1, runeSockets: 0, mastery75SecondaryPotencyBonus: 0 },
    { grade: 'earth', maxRank: 5, traitSlots: 1, runeSockets: 1, mastery75SecondaryPotencyBonus: 0 },
    { grade: 'heaven', maxRank: 7, traitSlots: 2, runeSockets: 2, mastery75SecondaryPotencyBonus: 0.25 },
    { grade: 'mystic', maxRank: 10, traitSlots: 3, runeSockets: 3, mastery75SecondaryPotencyBonus: 0 },
  ]);
});

test('packet 4.8 grade normalization and comparison are exact', () => {
  assert.equal(normalizeManualGrade(undefined), 'mortal');
  assert.equal(normalizeManualGrade(null), 'mortal');
  assert.equal(normalizeManualGrade('HeAvEn'), 'heaven');
  assert.equal(normalizeManualGrade('nonsense'), 'mortal');
  assert.equal(isHigherTechniqueGrade('mortal', 'earth'), true);
  assert.equal(isHigherTechniqueGrade('heaven', 'earth'), false);
});

test('packet 4.8 grade helper accessors are exact', () => {
  assert.equal(getTechniqueMaxRankForGrade('mortal'), 3);
  assert.equal(getTechniqueMaxRankForGrade('earth'), 5);
  assert.equal(getTechniqueMaxRankForGrade('heaven'), 7);
  assert.equal(getTechniqueMaxRankForGrade('mystic'), 10);
  assert.equal(getTechniqueTraitCapForGrade('earth'), 1);
  assert.equal(getTechniqueTraitCapForGrade('heaven'), 2);
  assert.equal(getTechniqueRuneSocketsForGrade('mystic'), 3);
  assert.equal(getTechniqueSecondaryPotencyBonusForGrade('heaven'), 0.25);
  assert.equal(getTechniqueSecondaryPotencyBonusForGrade('earth'), 0);
});

test('packet 4.8 rarity trait-slot contract is exact', () => {
  assert.deepEqual(TECHNIQUE_RARITY_ORDER, ['common', 'uncommon', 'rare', 'epic', 'legendary']);
  assert.deepEqual(TECHNIQUE_RARITY_TRAIT_SLOTS, {
    common: 1,
    uncommon: 1,
    rare: 2,
    epic: 2,
    legendary: 3,
  });
  assert.equal(normalizeTechniqueRarity(undefined), 'common');
  assert.equal(normalizeTechniqueRarity('LeGeNdArY'), 'legendary');
  assert.equal(normalizeTechniqueRarity('weird'), 'common');
  assert.equal(isHigherTechniqueRarity('rare', 'epic'), true);
  assert.equal(isHigherTechniqueRarity('legendary', 'rare'), false);
});

test('packet 4.8 trait slot breakdown is exact', () => {
  assert.deepEqual(getTechniqueTraitSlotBreakdown({ grade: 'mortal', rarity: 'legendary' }), {
    raritySlots: 3,
    gradeCap: 1,
    effectiveSlots: 1,
    rarity: 'legendary',
    grade: 'mortal',
  });
  assert.deepEqual(getTechniqueTraitSlotBreakdown({ grade: 'earth', rarity: 'legendary' }), {
    raritySlots: 3,
    gradeCap: 1,
    effectiveSlots: 1,
    rarity: 'legendary',
    grade: 'earth',
  });
  assert.deepEqual(getTechniqueTraitSlotBreakdown({ grade: 'heaven', rarity: 'rare' }), {
    raritySlots: 2,
    gradeCap: 2,
    effectiveSlots: 2,
    rarity: 'rare',
    grade: 'heaven',
  });
  assert.deepEqual(getTechniqueTraitSlotBreakdown({ grade: 'mystic', rarity: 'legendary' }), {
    raritySlots: 3,
    gradeCap: 3,
    effectiveSlots: 3,
    rarity: 'legendary',
    grade: 'mystic',
  });
  assert.equal(getTechniqueEffectiveTraitSlots({ grade: 'earth', rarity: 'legendary' }), 1);
  assert.equal(getTechniqueEffectiveRuneSockets('mortal'), 0);
  assert.equal(getTechniqueEffectiveRuneSockets('heaven'), 2);
});
