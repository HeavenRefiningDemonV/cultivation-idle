import assert from 'node:assert/strict';
import test from 'node:test';

import { createTechniquesExactMockupFixture } from '../../src/features/techniquesExact/buildTechniquesExactSurface.js';

test('techniques exact fixture locks the Inner Palace mockup anatomy', () => {
  const surface = createTechniquesExactMockupFixture();

  assert.equal(surface.meta.rootTestId, 'techniques-exact-page');
  assert.equal(surface.meta.mode, 'fixture');
  assert.equal(surface.shell.topLevelTabPage, true);
  assert.equal(surface.shell.useExistingBottomNav, true);
  assert.equal(surface.shell.singleDominantAltar, true);
  assert.equal(surface.shell.showManualPavilionBookshelf, false);
  assert.equal(surface.page.title, 'Techniques');
  assert.equal(surface.page.subtitle, 'Inner Palace Combat Form');
  assert.equal(surface.page.loadoutBadge, 'Loadout 1');
  assert.equal(surface.page.aiSeal, 'Balanced');
  assert.equal(surface.diagnosisBanner.primaryLine, 'fill one passive slot before the next Gate.');
  assert.deepEqual(surface.diagnosisBanner.chips.map((chip) => `${chip.label}: ${chip.value}`), [
    'Target: Foundation Gate',
    'Archetype: Balanced Striker',
    'Path Alignment: 72%',
    'Mastery Floor: 25',
    'Rank Floor: I',
  ]);

  assert.equal(surface.leftRail.loadouts.length, 3);
  assert.deepEqual(surface.leftRail.loadouts.map((row) => `${row.label} · ${row.subtitle}`), [
    'Loadout 1 · Balanced Striker',
    'Loadout 2 · Defensive',
    'Loadout 3 · Farmer',
  ]);
  assert.equal(surface.leftRail.aiProfiles.length, 4);
  assert.equal(surface.leftRail.aiProfiles.find((profile) => profile.id === 'balanced')?.selected, true);
  assert.equal(surface.leftRail.aiWarning, 'Farmer is poor for Gate Trials');
  assert.deepEqual(surface.leftRail.castingPolicies.map((policy) => policy.displayLabel), [
    'Reactive',
    'Ordered',
    'Hold Ultimate',
  ]);
  assert.equal(surface.leftRail.castingPolicies.find((policy) => policy.underlyingPolicy === 'balanced')?.selected, true);

  assert.equal(surface.altar.slots.length, 6);
  assert.deepEqual(surface.altar.slots.map((slot) => `${slot.label}:${slot.techniqueName ?? slot.unlockLabel ?? 'Empty'}`), [
    'Active 1:Iron Palm',
    'Active 2:Cloudstep',
    'Passive 1:Quiet Guard',
    'Passive 2:Locked',
    'Support:Mending Breath',
    'Ultimate:Locked',
  ]);
  assert.deepEqual(surface.altar.metrics.map((row) => row.value), [
    '2 / 3 Active',
    '1 / 2 Passive',
    '0 / 1 Ultimate',
    'AI: Balanced',
    'Policy: Reactive',
  ]);

  assert.equal(surface.ownedLibrary.title, 'Owned Techniques');
  assert.deepEqual(surface.ownedLibrary.filterChips.map((chip) => chip.label), [
    'All',
    'Path Fit',
    'Damage',
    'Guard',
    'Heal',
    'Control',
    'Setup',
  ]);
  assert.deepEqual(surface.ownedLibrary.rows.map((row) => row.name), [
    'Iron Palm',
    'Quiet Guard',
    'Cloudstep',
    'Mending Breath',
  ]);
  assert.equal(surface.ownedLibrary.rows.every((row) => Boolean(row.visualIdentity)), true);
  assert.equal(surface.ownedLibrary.rows.some((row) => row.visualIdentity.cssAttrs.rarity === 'rare'), true);
  assert.equal(surface.altar.slots.filter((slot) => slot.equipped).every((slot) => Boolean(slot.visualIdentity)), true);

  assert.equal(surface.inspector.selectedName, 'Iron Palm');
  assert.deepEqual(surface.inspector.rows.map((row) => [row.label, row.value]), [
    ['Role', 'Core Damage Art'],
    ['Grade', 'Mortal Grade'],
    ['Rarity', 'Common'],
    ['Rank', 'I'],
    ['Mastery', '25 / 50'],
    ['Path Fit', 'Strong'],
    ['Traits', 'direct strike, stable opener'],
    ['Rune Sockets', '0 / 1'],
  ]);
  assert.equal(surface.inspector.heroBadges?.length, 4);
  assert.equal(surface.inspector.recommendedAction, 'raise mastery to 50');

  assert.deepEqual(surface.readinessImpact.segments.map((row) => [row.label, row.value]), [
    ['Damage', 'Adequate'],
    ['Survival', 'Thin'],
    ['Control', 'Missing'],
    ['AI', 'Good'],
    ['Medicine', 'External'],
  ]);
  assert.equal(surface.readinessImpact.applyLoadoutButton.label, 'Apply Loadout');
  assert.equal(surface.readinessImpact.goToManualPavilionButton.label, 'Go to Manual Pavilion');
});
