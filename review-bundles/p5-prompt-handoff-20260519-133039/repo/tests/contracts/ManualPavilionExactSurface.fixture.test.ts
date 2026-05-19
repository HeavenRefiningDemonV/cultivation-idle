import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildManualPavilionExactSurfaceFromStores,
  createManualPavilionExactMockupFixture,
} from '../../src/features/world/manualPavilionExact/buildManualPavilionExactSurface.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useManualPavilionStore } from '../../src/stores/manualPavilionStore.js';

test('manual pavilion exact fixture locks the mockup page, six spines, inspector, and shell flags', () => {
  const surface = createManualPavilionExactMockupFixture();
  const serialized = JSON.stringify(surface);

  assert.equal(surface.meta.rootTestId, 'manual-pavilion-exact-page');
  assert.equal(surface.meta.mode, 'fixture');
  assert.equal(surface.meta.targetMockupId, 'manual-pavilion-b3a76e7b-2048x1152');
  assert.doesNotMatch(serialized, /Painted Spine Shelf/);
  assert.doesNotMatch(serialized, /Not configured/);
  assert.doesNotMatch(serialized, /path-aligned manual guaranteed/i);
  assert.doesNotMatch(serialized, /Study Later/);
  assert.equal(surface.page.title, 'Manual Pavilion');
  assert.equal(surface.page.subtitle, 'Spiritual texts \u00b7 build correction \u00b7 doctrine study');
  assert.equal(surface.page.breadcrumb, 'Pinewind Hamlet / Manual Pavilion');
  assert.equal(surface.buildGapBanner.title, 'Current Build Gap');
  assert.equal(surface.buildGapBanner.line, 'one passive slot is empty; seek support or guard doctrine.');
  assert.deepEqual(surface.buildGapBanner.chips.map((chip) => chip.label), [
    'Path-Aligned Needed',
    'Support Manual Useful',
    'Next Gate Relevance',
  ]);

  assert.equal(surface.leftLedger.rows.length, 6);
  assert.deepEqual(surface.leftLedger.rows.map((row) => [row.label, row.value]), [
    ['Stock', '6 manuals'],
    ['Recommended', '6 shown'],
    ['Refresh Bias', 'Path-aligned'],
    ['Owned', '3 / 60'],
    ['Fragments', '8'],
    ['Current Need', 'Support / Passive'],
  ]);

  assert.equal(surface.shelf.primarySlots.length, 6);
  assert.equal(surface.shelf.title, 'Recommended Shelf');
  assert.equal(surface.shelf.totalStockLabel, 'Showing 6 of 6');
  assert.equal(new Set(surface.shelf.primarySlots.map((slot) => slot.primaryReasonLabel)).size >= 4, true);
  assert.deepEqual(surface.shelf.primarySlots.map((slot) => slot.title), [
    'Iron Palm Sutra',
    'Quiet Guard Verse',
    'Cloudstep Notes',
    'Red Crane Method',
    'Stone Root Manual',
    'Mending Breath',
  ]);
  assert.deepEqual(surface.shelf.primarySlots.map((slot) => slot.displayTitle), [
    'Iron Palm Sutra',
    'Quiet Guard Verse',
    'Cloudstep Notes',
    'Red Crane Method',
    'Stone Root Manual',
    'Mending Breath',
  ]);
  assert.equal(surface.shelf.primarySlots.every((slot) => slot.shortTitle === slot.displayTitle), true);
  assert.equal(surface.shelf.primarySlots.every((slot) => slot.titleLength !== 'veryLong'), true);
  assert.equal(surface.shelf.primarySlots.every((slot) => Boolean(slot.visualIdentity)), true);
  assert.equal(surface.shelf.primarySlots.every((slot) => slot.visualIdentity.cssAttrs.rarity !== undefined), true);
  assert.equal(surface.shelf.primarySlots.some((slot) => slot.visualIdentity.cssAttrs.rarity === 'rare'), true);
  assert.match(surface.shelf.selectedSlot?.ariaLabel ?? '', /Mortal Grade/);
  assert.match(surface.shelf.selectedSlot?.ariaLabel ?? '', /Common/);
  assert.equal(surface.shelf.selectedSlot?.title, 'Iron Palm Sutra');
  assert.equal(surface.shelf.selectedSlot?.selected, true);
  assert.equal(surface.shelf.selectedSlot?.lifecycleState, 'unowned_affordable');
  assert.equal(surface.shelf.selectedSlot?.selectionState, 'selected');
  assert.equal(surface.shelf.selectedSlot?.stockState, 'new');
  assert.equal(surface.shelf.selectedSlot?.primaryReasonLabel, 'Path Fit');
  assert.equal(surface.inspector.title, 'Iron Palm Sutra');
  assert.equal(surface.inspector.stateStamp, 'New');
  assert.equal(surface.inspector.lifecycleState, 'unowned_affordable');
  assert.deepEqual(surface.inspector.rows.map((row) => [row.label, row.value]), [
    ['Grade', 'Mortal Grade'],
    ['Rarity', 'Common'],
    ['Family', 'Martial Lineage'],
    ['Role', 'Core Damage Art'],
    ['Path Fit', 'Path Fit: Strong'],
    ['State', 'New'],
  ]);
  assert.equal(surface.inspector.rows.filter((row) => row.badge).length >= 4, true);
  assert.deepEqual(surface.inspector.whyRows.map((row) => row.value), [
    'Path fit: strong match for current doctrine.',
    'Gate prep: improves next Gate readiness.',
    'Study route: can start now; no active study.',
    'Unlock route: buy and study before equipping.',
  ]);
  assert.equal(surface.inspector.costLine, '3,000 Gold \u00b7 160 Merit');
  assert.deepEqual(
    [
      surface.inspector.buyButton.label,
      surface.inspector.studyLaterButton.label,
      surface.inspector.viewTechniquesButton.label,
    ],
    ['Buy & Study', 'Buy to Satchel', 'Preview Technique'],
  );
  assert.deepEqual(
    [
      surface.inspector.buyButton.actionKind,
      surface.inspector.studyLaterButton.actionKind,
      surface.inspector.viewTechniquesButton.actionKind,
    ],
    ['buy_and_study', 'buy_to_satchel', 'preview_technique'],
  );

  assert.equal(surface.bottomStrip.refreshButton.label, 'Free Refresh');
  assert.equal(surface.bottomStrip.refreshState, 'free_ready');
  assert.equal(surface.bottomStrip.refreshCostLine, 'Free refresh ready now');
  assert.equal(surface.bottomStrip.pityLabel, 'Featured quality progress');
  assert.equal(surface.bottomStrip.pityProgressLabel, 'Epic pity: 3 / 10 \u00b7 Legendary pity: 13 / 30');
  assert.deepEqual(surface.bottomStrip.pityRows.map((row) => [row.label, row.value]), [
    ['Epic pity', '3 / 10'],
    ['Legendary pity', '13 / 30'],
  ]);
  assert.equal(surface.bottomStrip.satchelLabel, 'Manual Satchel 3 manuals');
  assert.deepEqual(surface.bottomStrip.currencyRows.map((row) => [row.label, row.value]), [
    ['Gold', '128,450'],
    ['Merit', '1,260'],
  ]);

  assert.deepEqual(surface.shell, {
    useScreenOwnedExactPage: true,
    showLegacyPanel: false,
    showGenericWorldClose: false,
    showContextStrip: false,
    showBottomNav: false,
    singleDominantShelf: true,
  });
});

test('manual pavilion exact live builder returns stable fallback surfaces without mutating stock', () => {
  const missing = buildManualPavilionExactSurfaceFromStores('missing-city', {
    mode: 'live',
    pavilionId: 'missing-pavilion',
    nowMs: 1000,
  });

  assert.equal(missing.meta.mode, 'live');
  assert.equal(missing.meta.rootTestId, 'manual-pavilion-exact-page');
  assert.equal(missing.shell.useScreenOwnedExactPage, true);
  assert.equal(missing.shelf.primarySlots.length, 6);
  assert.equal(missing.page.title, 'Manual Pavilion');
  assert.ok((missing.debug?.missingDataFallbacks.length ?? 0) > 0);
  assert.match(missing.page.stockRefreshLabel, /Stock Refresh/);
});

test('manual pavilion exact live builder surfaces six primary stock slots while preserving real slot indices', () => {
  const previousContent = useContentStore.getState();
  const previousPavilion = useManualPavilionStore.getState();

  const techniques = Array.from({ length: 8 }, (_, index) => ({
    id: `tech_test_${index + 1}`,
    name: `Test Manual ${index + 1}`,
    path: 'heaven' as const,
    type: index % 2 === 0 ? 'active' : 'passive',
    role: index % 2 === 0 ? 'offense' : 'utility',
    rarity: 'common',
    tier: 'mortal',
  }));
  const city = {
    id: 'city_test_manual_pavilion',
    index: 0,
    name: 'Test City',
    unlockMajorRealm: 'qi_condensation',
    modules: ['manualPavilion'],
    refs: {
      outskirtsId: 'outskirts_test',
      gateTrialId: 'gate_test',
      ruinId: 'ruin_test',
      pavilionId: 'pavilion_test_manual',
      apothecaryId: 'apothecary_test',
    },
  };
  const pavilion = {
    id: 'pavilion_test_manual',
    cityId: city.id,
    cityIndex: 0,
    gradeSold: 'mortal',
    poolByPath: { heaven: [], earth: [], martial: [] },
    cost: { gold: '100' },
  };

  useContentStore.setState({
    isLoaded: true,
    maps: {
      ...previousContent.maps,
      citiesById: { [city.id]: city },
      pavilionsById: { [pavilion.id]: pavilion },
      techniquesById: Object.fromEntries(techniques.map((technique) => [technique.id, technique])),
    },
    citiesSorted: [city],
  });
  useManualPavilionStore.setState({
    stockByPavilionId: {
      [pavilion.id]: {
        pavilionId: pavilion.id,
        cityId: city.id,
        cityIndex: 0,
        generatedAt: 1000,
        nextRefreshAt: 2000,
        rngSeed: 1,
        pity: { featuredEpic: 7, featuredLegendary: 2 },
        history: [],
        slots: techniques.map((technique, index) => ({
          slotIndex: index + 1,
          shelf: 'common' as const,
          techniqueId: technique.id,
          grade: 'mortal' as const,
          rarity: 'common' as const,
          price: { gold: '100' },
        })),
      },
    },
  });

  try {
    const surface = buildManualPavilionExactSurfaceFromStores(city.id, {
      pavilionId: pavilion.id,
      selectedSlotIndex: 8,
      nowMs: 1500,
    });

    assert.equal(surface.shelf.primarySlots.length, 6);
    assert.deepEqual(surface.shelf.primarySlots.map((slot) => slot.slotIndex), [1, 2, 3, 4, 5, 6]);
    assert.equal(surface.shelf.primarySlots.every((slot) => slot.displayTitle.length <= 18), true);
    assert.equal(surface.meta.selectedSlotIndex, 1);
    assert.equal(surface.shelf.primarySlots.every((slot) => typeof slot.stockId === 'number'), true);
    assert.equal(surface.shelf.title, 'Recommended Shelf');
    assert.equal(surface.shelf.totalStockLabel, 'Showing 6 of 8');
    assert.deepEqual(surface.leftLedger.rows.slice(0, 2).map((row) => [row.label, row.value]), [
      ['Stock', '8 manuals'],
      ['Recommended', '6 shown'],
    ]);
    assert.equal(surface.bottomStrip.refreshButton.label, 'Refresh Locked');
    assert.equal(surface.bottomStrip.refreshButton.enabled, false);
    assert.match(surface.bottomStrip.refreshCostLine, /Free refresh ready in/);
    assert.equal(surface.bottomStrip.pityProgressLabel, 'Epic pity: 7 / 10 \u00b7 Legendary pity: 2 / 30');
  } finally {
    useContentStore.setState({
      isLoaded: previousContent.isLoaded,
      maps: previousContent.maps,
      citiesSorted: previousContent.citiesSorted,
      raw: previousContent.raw,
      economy: previousContent.economy,
    });
    useManualPavilionStore.setState({
      stockByPavilionId: previousPavilion.stockByPavilionId,
    });
  }
});
