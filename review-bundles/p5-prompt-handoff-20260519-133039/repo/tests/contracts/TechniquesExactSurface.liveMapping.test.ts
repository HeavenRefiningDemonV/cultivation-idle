import assert from 'node:assert/strict';
import test from 'node:test';

import { buildTechniquesExactSurfaceFromStores } from '../../src/features/techniquesExact/buildTechniquesExactSurface.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useTechCollectionStore } from '../../src/stores/techCollectionStore.js';
import { useTechniqueStore } from '../../src/stores/techniqueStore.js';

test('techniques exact live mapping uses store loadouts, casting display labels, slots, and learned rows', () => {
  const previousContent = useContentStore.getState();
  const previousGame = useGameStore.getState();
  const previousTechnique = useTechniqueStore.getState();
  const previousCollection = useTechCollectionStore.getState();

  const techniques = [
    { id: 'tech_iron_palm_test', name: 'Iron Palm', path: 'martial' as const, type: 'active', role: 'offense', rarity: 'common', tier: 'mortal', tags: ['damage'] },
    { id: 'tech_cloudstep_test', name: 'Cloudstep', path: 'martial' as const, type: 'active', role: 'utility', rarity: 'common', tier: 'mortal', tags: ['mobility'] },
    { id: 'tech_quiet_guard_test', name: 'Quiet Guard', path: 'earth' as const, type: 'passive', role: 'defense', rarity: 'common', tier: 'mortal', tags: ['guard', 'passive'] },
  ];

  useContentStore.setState({
    isLoaded: true,
    maps: {
      ...previousContent.maps,
      techniquesById: Object.fromEntries(techniques.map((technique) => [technique.id, technique])),
      citiesById: {
        city_pinewind_hamlet: {
          id: 'city_pinewind_hamlet',
          index: 0,
          name: 'Pinewind Hamlet',
          unlockMajorRealm: 'qi_condensation',
          modules: ['manualPavilion'],
          refs: {
            outskirtsId: 'outskirts_pinewind_test',
            gateTrialId: 'gate_pinewind_test',
            ruinId: 'ruin_pinewind_test',
            pavilionId: 'pavilion_pinewind_manual',
            apothecaryId: 'apothecary_pinewind_test',
          },
        },
      },
    },
    citiesSorted: [
      {
        id: 'city_pinewind_hamlet',
        index: 0,
        name: 'Pinewind Hamlet',
        unlockMajorRealm: 'qi_condensation',
        modules: ['manualPavilion'],
        refs: {
          outskirtsId: 'outskirts_pinewind_test',
          gateTrialId: 'gate_pinewind_test',
          ruinId: 'ruin_pinewind_test',
          pavilionId: 'pavilion_pinewind_manual',
          apothecaryId: 'apothecary_pinewind_test',
        },
      },
    ],
    raw: {
      ...(previousContent.raw ?? {}),
      techniques,
    } as NonNullable<typeof previousContent.raw>,
  });
  useGameStore.setState({ selectedPath: 'martial', realm: { ...previousGame.realm, index: 0 } });
  useTechniqueStore.setState({
    selectedLoadoutId: 'loadout_test_1',
    activeSlots: 2,
    passiveSlots: 1,
    loadouts: [
      {
        id: 'loadout_test_1',
        name: 'Trial Form',
        aiProfile: 'burst',
        castingPolicy: 'aggressive',
        slots: {
          active: ['tech_iron_palm_test', 'tech_cloudstep_test', '', ''],
          passive: ['tech_quiet_guard_test', '', ''],
          ultimate: null,
        },
      },
      {
        id: 'loadout_test_2',
        name: 'Recovery Form',
        aiProfile: 'survivor',
        castingPolicy: 'defensive',
        slots: { active: ['', '', '', ''], passive: ['', '', ''], ultimate: null },
      },
    ],
  });
  useTechCollectionStore.setState({
    unlockedTechs: {
      tech_iron_palm_test: { unlocked: true, masteryXp: 75, rank: 2, manualGrade: 'mortal', rarity: 'common', traits: [], runes: [] },
      tech_cloudstep_test: { unlocked: true, masteryXp: 15, rank: 1, manualGrade: 'mortal', rarity: 'common', traits: [], runes: [] },
      tech_quiet_guard_test: { unlocked: true, masteryXp: 30, rank: 1, manualGrade: 'mortal', rarity: 'common', traits: [], runes: [] },
    },
    fragments: {},
  });

  try {
    const surface = buildTechniquesExactSurfaceFromStores({
      mode: 'live',
      selectedTechniqueId: 'tech_quiet_guard_test',
      selectedSlotKey: 'passive-0',
      selectedFilter: 'all',
    });

    assert.equal(surface.meta.mode, 'live');
    assert.equal(surface.page.loadoutBadge, 'Trial Form');
    assert.equal(surface.page.aiSeal, 'Burst');
    assert.equal(surface.leftRail.loadouts[0]?.selected, true);
    assert.equal(surface.leftRail.aiProfiles.find((profile) => profile.id === 'burst')?.selected, true);
    assert.equal(surface.leftRail.castingPolicies.find((policy) => policy.displayLabel === 'Ordered')?.selected, true);
    assert.equal(surface.altar.slots.find((slot) => slot.key === 'active-0')?.techniqueName, 'Iron Palm');
    assert.equal(surface.altar.slots.find((slot) => slot.key === 'passive-0')?.selected, true);
    assert.equal(surface.ownedLibrary.rows.length, 3);
    assert.equal(surface.ownedLibrary.rows.find((row) => row.id === 'tech_iron_palm_test')?.equipped, true);
    assert.equal(surface.inspector.selectedName, 'Quiet Guard');
    assert.ok(surface.inspector.rows.some((row) => row.label === 'Mastery'));
    assert.ok(surface.readinessImpact.segments.some((row) => row.label === 'AI'));
  } finally {
    useContentStore.setState({
      isLoaded: previousContent.isLoaded,
      maps: previousContent.maps,
      citiesSorted: previousContent.citiesSorted,
      raw: previousContent.raw,
      economy: previousContent.economy,
    });
    useGameStore.setState({
      selectedPath: previousGame.selectedPath,
      realm: previousGame.realm,
    });
    useTechniqueStore.setState({
      loadouts: previousTechnique.loadouts,
      selectedLoadoutId: previousTechnique.selectedLoadoutId,
      activeSlots: previousTechnique.activeSlots,
      passiveSlots: previousTechnique.passiveSlots,
    });
    useTechCollectionStore.setState({
      unlockedTechs: previousCollection.unlockedTechs,
      fragments: previousCollection.fragments,
      rngSeed: previousCollection.rngSeed,
    });
  }
});
