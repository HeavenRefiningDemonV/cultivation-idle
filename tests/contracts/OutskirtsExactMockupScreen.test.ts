import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';

import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { OutskirtsTopRegion } from '../../src/features/world/outskirts/components/OutskirtsTopRegion.js';
import { OutskirtsEncounterProgressStrip } from '../../src/features/world/outskirts/components/OutskirtsEncounterProgressStrip.js';
import { OutskirtsRewardsCard } from '../../src/features/world/outskirts/components/OutskirtsRewardsCard.js';
import { OutskirtsSetupCard } from '../../src/features/world/outskirts/components/OutskirtsSetupCard.js';
import { OutskirtsAreaPlaque } from '../../src/features/world/outskirts/components/OutskirtsAreaPlaque.js';

function readChildren(node: unknown): unknown[] {
  return (node as { props?: { children?: unknown[] } } | undefined)?.props?.children ?? [];
}

void test('P5 top region structure renders title/ribbon/strip/plaque/subtitle/settings', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-top-region/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-page-title/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-macro-ribbon/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-tactical-strip/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-area-plaque/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-page-subtitle/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-settings-gear/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-tactical-cell-/g) ?? []).length, 7);
});

void test('P5 tactical strip order and review values are locked', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const order = ['hp', 'danger', 'loadout', 'aiProfile', 'healing', 'bounty', 'expedition'];
  const indices = order.map((id) => html.indexOf(`outskirts-tactical-cell-${id}`));
  assert.equal(indices.every((i) => i >= 0), true);
  for (let i = 1; i < indices.length; i += 1) assert.equal(indices[i] > indices[i - 1], true);

  assert.equal(html.includes('2,860 / 3,120'), true);
  assert.equal(html.includes('Low · Lv. 11'), true);
  assert.equal(html.includes('Set 2'), true);
  assert.equal(html.includes('Balanced'), true);
  assert.equal(html.includes('12 / 20'), true);
  assert.equal(html.includes('Wolf Pelt 7/15'), true);
  assert.equal(html.includes('2 Idle'), true);
});

void test('P5 plaque renders dropdown affordance', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('outskirtsTopRegion__plaqueCaret'), true);
  assert.equal(html.includes('outskirts-page-subtitle">Gold and common materials<'), true);
});

void test('P11 settings gear keeps existing real callback path contract', () => {
  let opened = 0;
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const topRegion = OutskirtsTopRegion({
    surface,
    onOpenSettings: () => {
      opened += 1;
    },
  });

  const topBand = readChildren(topRegion)[0];
  const topBandChildren = readChildren(topBand);
  const gearButton = topBandChildren[2] as { props?: { onClick?: () => void } };
  gearButton?.props?.onClick?.();
  assert.equal(opened, 1);
});

void test('P5 planning state excludes legacy combat-shell owners', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('runCompassSurface'), false);
  assert.equal(html.includes('combatPathModule__chip'), false);
  assert.equal(html.includes('utilityTrayShell'), false);
  assert.equal(html.includes('ink-combat-shell__log'), false);
  assert.equal(html.includes('ink-combat-shell__healthbar'), false);
});

void test('P6 scenic center renders as composition surface with no visible descriptor fallback text', () => {
  const fixture = createOutskirtsMockupFixture();
  const surface = buildOutskirtsMockupSurface(fixture);
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-scenic-stage/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-scenic-image/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-identity-row/g) ?? []).length, 1);
  assert.equal(html.includes('outskirtsScenicStage__plate'), true);
  assert.equal(html.includes('outskirtsScenicStage__fallback">'), false);
  assert.equal(html.includes(`>${fixture.encounterDescriptor}<`), false);
});

void test('P6 review fixture identity remains target-faithful and does not render watch control', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('outskirts-exact-encounter-name">Snarling Wolf<'), true);
  assert.equal(html.includes('outskirts-exact-encounter-level">Lv. 11<'), true);
  assert.equal(html.includes('outskirts-exact-encounter-safe-chip">Safe<'), true);
  assert.equal(html.includes('Watch'), false);
  assert.equal(html.includes('/assets/mockups/ChatGPT Image Apr 17, 2026, 04_24_04 PM.png'), true);
});

void test('P6 scenic placeholder suppression keeps stage rendered when scenic image source is absent', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  surface.scenicStage.scenicImageSrc = null;
  surface.scenicStage.reviewFixtureImageSrc = null;
  surface.scenicStage.useApprovedMockupCrop = false;
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-scenic-stage/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-scenic-image/g) ?? []).length, 1);
  assert.equal(html.includes('outskirtsScenicStage__fallback">'), false);
  assert.equal(html.includes(`>${surface.scenicStage.environmentDescriptor}<`), false);
});

void test('P6 no-scope-widening smoke: side cards, strip, CTA, and summary owners remain mounted', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const unchangedOwners = [
    'outskirts-setup-card',
    'outskirts-rewards-card',
    'outskirts-encounter-progress-strip',
    'outskirts-start-hunt-cta',
    'outskirts-grind-summary',
  ];
  for (const token of unchangedOwners) assert.equal(html.includes(token), true);
});

void test('P7 setup-card structure renders exact ordered sections and six equipment slots', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-setup-card/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-setup-title/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-setup-primary/g) ?? []).length, 3);
  assert.equal((html.match(/outskirts-exact-setup-offense/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-setup-defense/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-setup-pouch/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-setup-equipment-grid/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-setup-equipment-slot/g) ?? []).length, 6);

  for (const token of ['Your Setup', 'Loadout Set', 'AI Profile', 'Attack Focus', 'Offense', 'Defense', 'Medicine Pouch', 'Equipment']) {
    assert.equal(html.includes(token), true);
  }
});

void test('P7 review fixture setup values remain locked to approved target', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('Loadout Set'), true);
  assert.equal(html.includes('AI Profile'), true);
  assert.equal(html.includes('Attack Focus'), true);
  assert.equal(html.includes('>2<'), true);
  assert.equal(html.includes('Balanced'), true);
  assert.equal(html.includes('>318<'), true);
  assert.equal(html.includes('>92%<'), true);
  assert.equal(html.includes('>18%<'), true);
  assert.equal(html.includes('>3,120<'), true);
  assert.equal(html.includes('>84%<'), true);
  assert.equal(html.includes('>76%<'), true);
  assert.equal(html.includes('12 / 20'), true);
});

void test('P7 equipment grid remains six icon-first slots in live partial-truth mode', () => {
  const liveLikeSurface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    sourceMode: 'stores',
    equipmentGrid: [
      { slotId: 'weapon', label: 'Weapon', iconKey: 'weapon', value: 'Rusty Sword', source: 'live' },
      { slotId: 'armor', label: 'Armor', iconKey: 'armor', value: '—', source: 'synthetic' },
      { slotId: 'ring', label: 'Ring', iconKey: 'ring', value: 'Prayer Beads', source: 'derived' },
      { slotId: 'talisman', label: 'Talisman', iconKey: 'talisman', value: '—', source: 'synthetic' },
      { slotId: 'boots', label: 'Boots', iconKey: 'boots', value: '—', source: 'synthetic' },
      { slotId: 'charm', label: 'Charm', iconKey: 'charm', value: '—', source: 'synthetic' },
    ],
  }));
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: liveLikeSurface }));

  assert.equal((html.match(/outskirts-exact-setup-equipment-slot/g) ?? []).length, 6);
  assert.equal(html.includes('outskirtsSetupCard__equipmentLabel'), false);
  assert.equal(html.includes('◦'), false);
});

void test('P8 rewards-card renders icon-first shell with ordered sections', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-rewards-card/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-rewards-title/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-rewards-gold/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-rewards-materials/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-rewards-material-item/g) ?? []).length, 4);
  assert.equal((html.match(/outskirts-exact-rewards-bounty/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-rewards-efficiency/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-rewards-auto-repeat/g) ?? []).length, 1);
});

void test('P8 review fixture reward values remain exact and visible', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  for (const token of ['Expected Rewards', 'Gold', '1,250 – 1,480', 'Common Materials', 'Wolf Pelt', 'Beast Bone', 'Green Herb', 'Spirit Stone']) {
    assert.equal(html.includes(token), true);
  }
  for (const token of ['Tracked Bounty', 'Defeat wolves in the Outskirts', '7 / 15', 'Estimated Efficiency', '~45s / run', '1,800 – 2,000 / hour', 'Auto-Repeat', '>On<']) {
    assert.equal(html.includes(token), true);
  }
  assert.equal((html.match(/outskirts-exact-rewards-bounty-progress/g) ?? []).length, 1);
  assert.match(html, /outskirtsRewardsCard__bountyProgressFill" style="width:46\.666666666666664%"/);
});

void test('P8 tracked bounty section keeps progress geometry when bounty is empty', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    trackedBountyTitle: 'None',
    trackedBountyProgress: '0 / 0',
  }));
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-rewards-bounty-progress/g) ?? []).length, 1);
  assert.equal(html.includes('outskirtsRewardsCard__bountyProgress--empty'), true);
  assert.match(html, /outskirtsRewardsCard__bountyProgressFill" style="width:0%"/);
});

void test('P9 encounter strip renders one lane, arrows, six nodes, and distinct states', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-encounter-strip/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-strip-left-arrow/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-strip-right-arrow/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-strip-node/g) ?? []).length, 6);
  assert.equal((html.match(/outskirts-exact-encounter-strip-node-current/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-strip-node-completed/g) ?? []).length, 2);
  assert.equal((html.match(/outskirts-exact-encounter-strip-node-future/g) ?? []).length, 3);
  assert.equal(html.includes('data-state="completed"'), true);
  assert.equal(html.includes('data-state="current"'), true);
  assert.equal(html.includes('data-state="future"'), true);
});

void test('P9 review fixture strip order, levels, and states remain locked to approved target', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const ordered = [
    'data-node-id="quiet-glade"',
    'Quiet Glade',
    'Lv. 8',
    'data-node-id="rockjaw-boar"',
    'Rockjaw Boar',
    'Lv. 9',
    'data-node-id="snarling-wolf"',
    'Snarling Wolf',
    'Lv. 11',
    'data-node-id="venomcoil"',
    'Venomcoil',
    'Lv. 13',
    'data-node-id="shade-stalker"',
    'Shade Stalker',
    'Lv. 15',
    'data-node-id="mire-serpent"',
    'Mire Serpent',
    'Lv. 17',
  ];
  for (const token of ordered) assert.equal(html.includes(token), true);

  assert.match(html, /data-node-id="quiet-glade"[\s\S]*?data-state="completed"/);
  assert.match(html, /data-node-id="rockjaw-boar"[\s\S]*?data-state="completed"/);
  assert.match(html, /data-node-id="snarling-wolf"[\s\S]*?data-state="current"/);
  assert.match(html, /data-node-id="venomcoil"[\s\S]*?data-state="future"/);
  assert.match(html, /data-node-id="shade-stalker"[\s\S]*?data-state="future"/);
  assert.match(html, /data-node-id="mire-serpent"[\s\S]*?data-state="future"/);
});

void test('P9 encounter strip visual-state stability keeps lane footprint with mixed art availability', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  surface.encounterStrip.nodes = surface.encounterStrip.nodes.map((node, idx) => ({
    ...node,
    imageSrc: idx % 2 === 0 ? null : node.imageSrc ?? null,
    silhouetteImageSrc: idx % 2 === 1 ? null : node.silhouetteImageSrc ?? null,
  }));
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-encounter-strip-node/g) ?? []).length, 6);
  assert.equal((html.match(/outskirts-exact-encounter-strip-left-arrow/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-strip-right-arrow/g) ?? []).length, 1);
  assert.equal(html.includes('outskirtsEncounterProgressStrip__lane'), true);
  assert.equal(html.includes('outskirtsEncounterProgressStrip__thumb--current'), true);
});

void test('P9 strip includes reduced-motion guardrails without geometry drift hooks', async () => {
  const styleSource = await readFile(new URL('../../src/features/world/outskirts/OutskirtsExactMockupScreen.scss', import.meta.url), 'utf8');
  assert.match(styleSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styleSource, /outskirtsEncounterProgressStrip__node/);
  assert.match(styleSource, /outskirtsEncounterProgressStrip__arrow/);
});

void test('P11 strip separates progression state truth from preview selection state', () => {
  const snapshot = createOutskirtsMockupFixture();
  const baseSurface = buildOutskirtsMockupSurface(snapshot, { allowEncounterPreviewSelection: true });
  const previewSurface = buildOutskirtsMockupSurface(snapshot, {
    allowEncounterPreviewSelection: true,
    previewEncounterId: 'venomcoil',
  });

  const baseStateById = Object.fromEntries(baseSurface.encounterStrip.nodes.map((node) => [node.id, node.state]));
  const previewStateById = Object.fromEntries(previewSurface.encounterStrip.nodes.map((node) => [node.id, node.state]));
  assert.deepEqual(previewStateById, baseStateById);
  assert.equal(previewSurface.encounterStrip.selectedEncounterId, 'venomcoil');
  assert.equal(previewSurface.encounterIdentity.displayName, 'Venomcoil');
  assert.equal(previewSurface.encounterIdentity.levelLabel, 'Lv. 13');
});

void test('P11 strip arrows and nodes expose safe preview-interaction callbacks only', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture(), {
    allowEncounterPreviewSelection: true,
    previewEncounterId: 'rockjaw-boar',
  });
  let movedLeft = 0;
  let movedRight = 0;
  let selected: string | null = null;
  const strip = OutskirtsEncounterProgressStrip({
    strip: surface.encounterStrip,
    onPreviewPrevious: () => {
      movedLeft += 1;
    },
    onPreviewNext: () => {
      movedRight += 1;
    },
    onSelectEncounter: (encounterId) => {
      selected = encounterId;
    },
  });

  const stripChildren = readChildren(strip);
  const leftArrow = stripChildren[1] as { props?: { onClick?: () => void } };
  const nodeList = stripChildren[2] as { props?: { children?: unknown[] } };
  const nodes = nodeList?.props?.children as Array<{ props?: { children?: unknown[]; ['data-node-id']?: string } }>;
  const targetNode = nodes.find((node) => node.props?.['data-node-id'] === 'venomcoil');
  const targetThumbButton = readChildren(targetNode)[0] as { props?: { onClick?: () => void } };
  const rightArrow = stripChildren[3] as { props?: { onClick?: () => void } };

  leftArrow?.props?.onClick?.();
  rightArrow?.props?.onClick?.();
  targetThumbButton?.props?.onClick?.();

  assert.equal(movedLeft, 1);
  assert.equal(movedRight, 1);
  assert.equal(selected, 'venomcoil');
});

void test('P10 bottom-zone structure renders one strip, one dominant CTA, and one grind summary with chip + three rows', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-encounter-strip/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-start-hunt-cta/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-grind-summary/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-grind-summary-chip/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-grind-summary-row/g) ?? []).length, 3);
  assert.equal(html.includes('Route'), false);
});

void test('P10 review fixture CTA and grind summary values remain exact', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  for (const token of ['Start Hunt', 'Grind Summary', 'This Area', '>128<', '1,900', 'Wolf Pelt']) {
    assert.equal(html.includes(token), true);
  }
});

void test('P10 single-dominant CTA is preserved and rewards card stays CTA-free', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-start-hunt-cta/g) ?? []).length, 1);
  assert.equal(surface.primaryAction.singleDominantCta, true);
  assert.equal(surface.shell.rightCardHasPrimaryAction, false);
  assert.equal(html.includes('outskirts-exact-rewards-auto-repeat'), true);
  assert.equal(html.includes('Stop'), false);
});

void test('P11 auto-repeat pill reflects boolean state and dispatches toggle callback', () => {
  let toggled = 0;
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ autoRepeatEnabled: false, autoRepeatLabel: 'Off' }));
  const card = OutskirtsRewardsCard({
    rewards: surface.rewardsCard,
    onToggleAutoRepeat: () => {
      toggled += 1;
    },
  });
  const toggleRow = readChildren(card).at(-1) as { props?: { children?: unknown[] } };
  const toggleButton = readChildren(toggleRow)[1] as { props?: { onClick?: () => void; ['aria-pressed']?: boolean } };
  toggleButton?.props?.onClick?.();
  assert.equal(toggleButton?.props?.['aria-pressed'], false);
  assert.equal(toggled, 1);
});

void test('P11 medicine pouch affordance can use grounded callback route', () => {
  let opened = 0;
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture(), { medicinePouchActionEnabled: true });
  const card = OutskirtsSetupCard({
    setup: surface.setupCard,
    onOpenMedicinePouch: () => {
      opened += 1;
    },
  });
  const sections = readChildren(card);
  const pouchSection = sections[5] as { props?: { children?: unknown[] } };
  const pouchRow = readChildren(pouchSection)[1] as { props?: { children?: unknown[] } };
  const pouchActionButton = readChildren(pouchRow)[2] as { props?: { onClick?: () => void } };
  pouchActionButton?.props?.onClick?.();
  assert.equal(opened, 1);
});

void test('P11 area plaque remains intentionally inert when no grounded selector exists', () => {
  const element = OutskirtsAreaPlaque({
    areaHeader: {
      plaqueLabel: 'Outskirts',
      subtitle: 'Gold and common materials',
      showDropdownCaret: true,
      hasGroundedSelector: false,
    },
  });
  const plaque = readChildren(element)[0] as { props?: Record<string, string> };
  const html = renderToStaticMarkup(element);
  assert.equal(plaque?.props?.['aria-disabled'], 'true');
  assert.equal(html.includes('<button'), false);
});

void test('P11 no-layout-shift smoke keeps key slots stable across auto-repeat and preview variants', () => {
  const baseSurface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture(), { previewEncounterId: 'snarling-wolf' });
  const variantSurface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    sourceMode: 'stores',
    autoRepeatEnabled: false,
    autoRepeatLabel: 'Off',
  }), {
    previewEncounterId: 'venomcoil',
    allowEncounterPreviewSelection: true,
  });
  const baseHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: baseSurface }));
  const variantHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: variantSurface }));
  for (const token of [
    'outskirts-exact-left-rail-slot',
    'outskirts-exact-center-slot',
    'outskirts-exact-strip-slot',
    'outskirts-exact-cta-slot',
    'outskirts-exact-right-rail-slot',
    'outskirts-exact-summary-dock-slot',
  ]) {
    assert.equal((baseHtml.match(new RegExp(token, 'g')) ?? []).length, 1);
    assert.equal((variantHtml.match(new RegExp(token, 'g')) ?? []).length, 1);
  }
});

void test('P10 summary fallback stability preserves chip and row geometry with partial live values', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    sourceMode: 'stores',
  }));
  surface.grindSummary.rows = [
    { id: 'runs', label: 'Runs', value: '—', iconKey: 'runs' },
    { id: 'goldPerHour', label: 'Gold / hr', value: '—', iconKey: 'gold' },
    { id: 'mainDrop', label: 'Main Drop', value: '—', iconKey: 'drop' },
  ];
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-grind-summary/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-grind-summary-chip/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-grind-summary-row/g) ?? []).length, 3);
  assert.equal(html.includes('outskirtsGrindSummaryCard__row'), true);
});

void test('P5 top region element count remains stable across fixture/live and bounty/expedition shifts', () => {
  const fixtureSurface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const liveLikeSurface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    sourceMode: 'stores',
    bountyLabel: null,
    expeditionLabel: 'No expedition',
  }));
  const fixtureHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: fixtureSurface }));
  const liveLikeHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: liveLikeSurface }));

  const tokens = ['outskirts-top-region', 'outskirts-page-title', 'outskirts-macro-ribbon', 'outskirts-tactical-strip', 'outskirts-area-plaque', 'outskirts-page-subtitle', 'outskirts-settings-gear'];
  for (const token of tokens) {
    assert.equal((fixtureHtml.match(new RegExp(token, 'g')) ?? []).length, 1);
    assert.equal((liveLikeHtml.match(new RegExp(token, 'g')) ?? []).length, 1);
  }
  assert.equal((fixtureHtml.match(/outskirts-tactical-cell-/g) ?? []).length, 7);
  assert.equal((liveLikeHtml.match(/outskirts-tactical-cell-/g) ?? []).length, 7);
});

void test('P4/P5 route preservation: World modal route still mounts Outskirts planning owner', async () => {
  const modalSource = await readFile(new URL('../../src/components/modals/WorldBuildingModal.tsx', import.meta.url), 'utf8');
  const panelSource = await readFile(new URL('../../src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', import.meta.url), 'utf8');

  assert.match(modalSource, /case 'outskirts':\s*content = <OutskirtsBuildingPanel cityId=\{storeCityId\} \/>/);
  assert.match(panelSource, /OutskirtsPlanningOwner/);
});

void test('P11 planning owner keeps grounded settings/start semantics and routes pouch via apothecary intent', async () => {
  const ownerSource = await readFile(new URL('../../src/features/world/outskirts/OutskirtsPlanningOwner.tsx', import.meta.url), 'utf8');
  assert.match(ownerSource, /startActivity\('outskirts', \{ cityId, sourceId: outskirtsDef.id \}\)/);
  assert.match(ownerSource, /setAutoAttack\(true\)/);
  assert.match(ownerSource, /startCombat\(nextEnemyId,/);
  assert.match(ownerSource, /setActiveTab\('settings'\)/);
  assert.match(ownerSource, /openWorldBuildingModal\(\{\s*cityId,\s*buildingKey: 'apothecary',\s*intent: \{ apothecarySurface: 'pouch' \}/);
});
