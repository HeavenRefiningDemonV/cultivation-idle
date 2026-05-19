import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { buildOutskirtsMockupSurface, buildOutskirtsMockupSurfaceFromStores } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createActiveOutskirtsMockupFixture, createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useCombatStore } from '../../src/stores/combatStore.js';
import { useMedicinePouchStore } from '../../src/stores/medicinePouchStore.js';
import { useOutskirtsStore } from '../../src/stores/outskirtsStore.js';

void test('C1 planning fixture has inactive combat stage', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());

  assert.equal(surface.combatStage.active, false);
  assert.equal(surface.combatStage.hasLiveCombat, false);
  assert.equal(surface.combatStage.lifecycle, 'planning');
  assert.equal(surface.combatStage.visualContract, 'outskirts-center-combat-theater-v1');
  assert.equal(surface.combatStage.player.name, 'Cultivator');
  assert.equal(surface.combatStage.player.side, 'left');
  assert.equal(surface.combatStage.enemy.side, 'right');
  assert.equal(surface.combatStage.enemy.id, null);
  assert.equal(surface.combatStage.chips.length, 0);
  assert.equal(surface.combatStage.logLines.length, 0);
  assert.equal(surface.combatStage.floatingHits.length, 0);
  assert.equal(surface.primaryAction.label, 'Start Hunt');
});

void test('C1 active fixture matches uploaded active-hunt model data', () => {
  const surface = buildOutskirtsMockupSurface(createActiveOutskirtsMockupFixture(), { activityMode: 'active' });

  assert.equal(surface.combatStage.active, true);
  assert.equal(surface.combatStage.player.name, 'Cultivator');
  assert.equal(surface.combatStage.player.hpLabel, '131 / 131');
  assert.equal(surface.combatStage.player.hpPct, 100);
  assert.equal(surface.combatStage.enemy.name, 'Snarling Wolf');
  assert.equal(surface.combatStage.enemy.levelLabel, 'Lv. 11');
  assert.equal(surface.combatStage.enemy.hpLabel, '78 / 126');
  assert.ok(Math.abs(surface.combatStage.enemy.hpPct - 61.9047619) < 0.001);
  assert.equal(surface.combatStage.versusSeal.iconKey, 'crossed-swords');
  assert.deepEqual(surface.combatStage.chips.map((chip) => chip.label), [
    'AI: Balanced',
    'Auto-use On',
    'Boss in 6',
    'Iron Palm Ready',
    'Wind Step 2.1s',
  ]);
  assert.deepEqual(surface.combatStage.logLines.map((line) => line.text), [
    'You struck Snarling Wolf.',
    'Wolf missed.',
    'Iron Palm is ready.',
  ]);
  assert.equal(surface.combatStage.floatingHits[0]?.text, '-23');
});

void test('C1 same-source live combat populates combatStage and tactical HP from stores', () => {
  const cityId = 'city_pinewind_hamlet';
  const outskirtsId = 'outskirts_pinewind';

  const activityPrev = useActivityStore.getState().active;
  const combatPrev = useCombatStore.getState();
  const outskirtsPrev = useOutskirtsStore.getState();
  const pouchPrev = useMedicinePouchStore.getState();

  try {
    useActivityStore.setState({
      active: {
        type: 'outskirts',
        startedAt: Date.now(),
        cityId,
      },
    });

    useOutskirtsStore.setState({
      ...outskirtsPrev,
      progressByOutskirtsId: {
        ...outskirtsPrev.progressByOutskirtsId,
        [outskirtsId]: { killsSinceBoss: 4, totalKills: 100, bossDefeated: false },
      },
      autoContinue: true,
    });

    useMedicinePouchStore.setState({
      ...pouchPrev,
      slots: {
        ...pouchPrev.slots,
        healing: {
          ...pouchPrev.slots.healing,
          equippedItemId: 'healing-herb',
          enabled: true,
          trigger: 'hpBelowPct',
        },
      },
    });

    useCombatStore.setState({
      ...combatPrev,
      inCombat: true,
      combatContext: { type: 'outskirts', cityId, sourceId: undefined, isBoss: false },
      currentEnemy: {
        id: 'snarling-wolf',
        name: 'Snarling Wolf',
        level: 11,
        zone: 'outskirts',
        hp: '50',
        atk: '20',
        def: '10',
        crit: 5,
        critDmg: 150,
        dodge: 3,
        speed: 1,
        goldReward: '10',
        expReward: '10',
      },
      playerHP: '80',
      playerMaxHP: '100',
      enemyHP: '25',
      enemyMaxHP: '50',
      combatLog: [
        { type: 'system', text: 'Battle starts.', timestamp: 1, color: '#fff' },
        { type: 'damage', text: 'You hit Snarling Wolf for 10.', timestamp: 2, color: '#fff' },
        { type: 'enemy', text: 'Snarling Wolf strikes back.', timestamp: 3, color: '#fff' },
        { type: 'heal', text: 'You recover 2 HP.', timestamp: 4, color: '#fff' },
      ],
      isBoss: false,
    });

    const surface = buildOutskirtsMockupSurfaceFromStores(cityId);

    assert.equal(surface.combatStage.active, true);
    assert.equal(surface.combatStage.hasLiveCombat, true);
    assert.equal(surface.combatStage.player.hpLabel, '80 / 100');
    assert.equal(surface.combatStage.player.hpPct, 80);
    assert.equal(surface.combatStage.enemy.hpLabel, '25 / 50');
    assert.equal(surface.combatStage.enemy.hpPct, 50);
    assert.equal(surface.combatStage.enemy.name, 'Snarling Wolf');
    assert.equal(surface.combatStage.enemy.levelLabel, 'Lv. 11');
    assert.deepEqual(surface.combatStage.logLines.map((line) => line.text), [
      'You hit Snarling Wolf for 10.',
      'Snarling Wolf strikes back.',
      'You recover 2 HP.',
    ]);
    assert.equal(surface.tacticalStrip.cells[0].primaryText, '80 / 100');
    assert.equal(surface.tacticalStrip.cells[0].underlineBarPct, 80);
  } finally {
    useActivityStore.setState({ active: activityPrev });
    useCombatStore.setState(combatPrev);
    useOutskirtsStore.setState(outskirtsPrev);
    useMedicinePouchStore.setState(pouchPrev);
  }
});

void test('C1 mismatched combat source is ignored for combatStage and tactical HP', () => {
  const cityId = 'city_pinewind_hamlet';

  const activityPrev = useActivityStore.getState().active;
  const combatPrev = useCombatStore.getState();

  try {
    useActivityStore.setState({ active: null });
    useCombatStore.setState({
      ...combatPrev,
      inCombat: true,
      combatContext: { type: 'outskirts', cityId: 'city_ember_falls', sourceId: 'outskirts_ember', isBoss: false },
      currentEnemy: {
        id: 'ember-hound',
        name: 'Ember Hound',
        level: 12,
        zone: 'outskirts',
        hp: '999',
        atk: '20',
        def: '10',
        crit: 5,
        critDmg: 150,
        dodge: 3,
        speed: 1,
        goldReward: '10',
        expReward: '10',
      },
      playerHP: '1',
      playerMaxHP: '999',
      enemyHP: '999',
      enemyMaxHP: '999',
      combatLog: [{ type: 'enemy', text: 'Wrong fight.', timestamp: 100, color: '#fff' }],
    });

    const surface = buildOutskirtsMockupSurfaceFromStores(cityId);

    assert.equal(surface.combatStage.hasLiveCombat, false);
    assert.notEqual(surface.combatStage.enemy.name, 'Ember Hound');
    assert.notEqual(surface.tacticalStrip.cells[0].primaryText, '1 / 999');
  } finally {
    useActivityStore.setState({ active: activityPrev });
    useCombatStore.setState(combatPrev);
  }
});

void test('C1 type contract does not reintroduce legacy owner routing/imports', async () => {
  const panel = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  const owner = await fs.readFile('src/features/world/outskirts/OutskirtsScreenOwner.tsx', 'utf8');

  for (const token of [
    /OutskirtsLegacyActiveSurface/,
    /InkCombatShell/,
    /OutskirtsActiveContainment/,
  ]) {
    assert.doesNotMatch(panel, token);
    assert.doesNotMatch(owner, token);
  }
});
