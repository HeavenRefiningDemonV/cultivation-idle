import React from 'react';
import type { OutskirtsLabeledValue, OutskirtsSetupCard as OutskirtsSetupCardModel } from '../types.js';

export interface OutskirtsSetupCardProps {
  setup: OutskirtsSetupCardModel;
}

const PRIMARY_ROW_ICON_MAP = {
  loadoutSet: '/assets/icons/foundationpill.png',
  aiProfile: '/assets/icons/book_martial.png',
  attackFocus: '/assets/icons/rustysword.png',
} as const;

const STAT_ICON_MAP: Record<string, string> = {
  atk: '/assets/icons/rustysword.png',
  acc: '/assets/icons/foundationpill.png',
  crit: '/assets/icons/dust_brown.png',
  hp: '/assets/icons/foundationpill.png',
  eva: '/assets/icons/spiritgrass.png',
  res: '/assets/icons/metalchunk.png',
};

const EQUIPMENT_ICON_MAP = {
  weapon: '/assets/icons/rustysword.png',
  armor: '/assets/icons/book_heaven.png',
  ring: '/assets/icons/placeholder_ring_small.png',
  talisman: '/assets/icons/prayerbeads.png',
  boots: '/assets/icons/spiritgrass.png',
  charm: '/assets/icons/jadesword.png',
} as const;

function resolveLoadoutBadge(value: string): string {
  const match = value.match(/(\d+)/);
  return match ? match[1] : value.slice(0, 3).toUpperCase();
}

function renderPrimaryRow(row: OutskirtsLabeledValue, isLoadout = false) {
  return React.createElement(
    'div',
    { className: `outskirtsSetupCard__primaryRow${isLoadout ? ' outskirtsSetupCard__primaryRow--loadout' : ''}`, 'data-testid': 'outskirts-exact-setup-primary' },
    React.createElement('span', { className: 'outskirtsSetupCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: PRIMARY_ROW_ICON_MAP[row.id as keyof typeof PRIMARY_ROW_ICON_MAP], alt: '', className: 'outskirtsSetupCard__icon' })),
    React.createElement('span', { className: 'outskirtsSetupCard__primaryLabel' }, row.label),
    isLoadout
      ? React.createElement('span', { className: 'outskirtsSetupCard__loadoutBadge' }, resolveLoadoutBadge(row.value))
      : React.createElement('span', { className: 'outskirtsSetupCard__primaryValue' }, row.value),
  );
}

function renderStatRows(rows: OutskirtsSetupCardModel['offenseRows'] | OutskirtsSetupCardModel['defenseRows']) {
  return rows.map((row) => React.createElement(
    'div',
    { key: row.id, className: 'outskirtsSetupCard__statRow', 'data-testid': `outskirts-setup-stat-${row.id}` },
    React.createElement('span', { className: 'outskirtsSetupCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: STAT_ICON_MAP[row.id] ?? '/assets/icons/foundationpill.png', alt: '', className: 'outskirtsSetupCard__icon' })),
    React.createElement('span', { className: 'outskirtsSetupCard__statLabel' }, row.label),
    React.createElement('span', { className: 'outskirtsSetupCard__statValue' }, row.value),
  ));
}

export function OutskirtsSetupCard({ setup }: OutskirtsSetupCardProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsSetupCard', 'data-testid': 'outskirts-exact-setup-card', 'data-legacy-testid': 'outskirts-setup-card' },
    React.createElement('h3', { className: 'outskirtsSetupCard__title', 'data-testid': 'outskirts-exact-setup-title' }, setup.title),
    React.createElement(
      'div',
      { className: 'outskirtsSetupCard__primaryRows' },
      renderPrimaryRow(setup.loadoutRow, true),
      renderPrimaryRow(setup.aiProfileRow),
      renderPrimaryRow(setup.attackFocusRow),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsSetupCard__section', 'data-testid': 'outskirts-exact-setup-offense' },
      React.createElement('h4', { className: 'outskirtsSetupCard__sectionTitle' }, 'Offense'),
      ...renderStatRows(setup.offenseRows),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsSetupCard__section', 'data-testid': 'outskirts-exact-setup-defense' },
      React.createElement('h4', { className: 'outskirtsSetupCard__sectionTitle' }, 'Defense'),
      ...renderStatRows(setup.defenseRows),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsSetupCard__section', 'data-testid': 'outskirts-exact-setup-pouch' },
      React.createElement('h4', { className: 'outskirtsSetupCard__sectionTitle' }, 'Medicine Pouch'),
      React.createElement(
        'div',
        { className: 'outskirtsSetupCard__pouchRow' },
        React.createElement('span', { className: 'outskirtsSetupCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: '/assets/icons/hourglass_empty.png', alt: '', className: 'outskirtsSetupCard__icon' })),
        React.createElement('span', { className: 'outskirtsSetupCard__pouchValue' }, setup.medicinePouchRow.value),
        React.createElement('button', { type: 'button', className: 'outskirtsSetupCard__pouchAction', tabIndex: -1, 'aria-label': 'Medicine pouch quick action (display only)' }, '+'),
      ),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsSetupCard__section', 'data-testid': 'outskirts-exact-setup-equipment-grid' },
      React.createElement('h4', { className: 'outskirtsSetupCard__sectionTitle' }, 'Equipment'),
      React.createElement(
        'div',
        { className: 'outskirtsSetupCard__equipmentGrid', 'data-testid': 'outskirts-exact-setup-equipment-wrap' },
        ...setup.equipmentGrid.map((slot) => React.createElement(
          'div',
          {
            key: slot.slotId,
            className: `outskirtsSetupCard__equipmentCell outskirtsSetupCard__equipmentCell--${slot.source}`,
            'data-testid': 'outskirts-exact-setup-equipment-slot',
            'aria-label': `${slot.label}: ${slot.value}`,
          },
          React.createElement('img', { src: EQUIPMENT_ICON_MAP[slot.slotId], alt: '', className: 'outskirtsSetupCard__equipmentIcon', 'aria-hidden': 'true' }),
          React.createElement('span', { className: 'outskirtsSetupCard__equipmentSr' }, `${slot.label} ${slot.value}`),
        )),
      ),
    ),
  );
}
