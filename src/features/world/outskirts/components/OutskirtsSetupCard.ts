import React from 'react';
import type { OutskirtsSetupCard as OutskirtsSetupCardModel } from '../types.js';
import { resolveEquipmentSlotIcon, resolveSetupPrimaryRowIcon, resolveSetupStatIcon } from '../resolveOutskirtsSetupIcons.js';

export interface OutskirtsSetupCardProps {
  setup: OutskirtsSetupCardModel;
}

function resolveLoadoutBadge(value: string): string {
  const match = value.match(/(\d+)/);
  return match ? match[1] : value.slice(0, 3).toUpperCase();
}

function renderStatRows(rows: OutskirtsSetupCardModel['offenseRows'] | OutskirtsSetupCardModel['defenseRows']) {
  return rows.map((row) => React.createElement(
    'div',
    { key: row.id, className: 'outskirtsSetupCard__statRow', 'data-testid': `outskirts-setup-stat-${row.id}` },
    React.createElement('span', { className: 'outskirtsSetupCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: resolveSetupStatIcon(row), alt: '', className: 'outskirtsSetupCard__icon' })),
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
      { className: 'outskirtsSetupCard__primaryRows', 'data-testid': 'outskirts-exact-setup-primary' },
      React.createElement(
        'div',
        { className: 'outskirtsSetupCard__primaryRow outskirtsSetupCard__primaryRow--loadout', 'data-testid': 'outskirts-exact-setup-row-loadout' },
        React.createElement('span', { className: 'outskirtsSetupCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: resolveSetupPrimaryRowIcon('loadoutSet'), alt: '', className: 'outskirtsSetupCard__icon' })),
        React.createElement('span', { className: 'outskirtsSetupCard__primaryLabel' }, setup.loadoutRow.label),
        React.createElement('span', { className: 'outskirtsSetupCard__loadoutBadge' }, resolveLoadoutBadge(setup.loadoutRow.value)),
      ),
      React.createElement(
        'div',
        { className: 'outskirtsSetupCard__primaryRow', 'data-testid': 'outskirts-exact-setup-row-ai' },
        React.createElement('span', { className: 'outskirtsSetupCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: resolveSetupPrimaryRowIcon('aiProfile'), alt: '', className: 'outskirtsSetupCard__icon' })),
        React.createElement('span', { className: 'outskirtsSetupCard__primaryLabel' }, setup.aiProfileRow.label),
        React.createElement('span', { className: 'outskirtsSetupCard__primaryValue' }, setup.aiProfileRow.value),
      ),
      React.createElement(
        'div',
        { className: 'outskirtsSetupCard__primaryRow', 'data-testid': 'outskirts-exact-setup-row-attack-focus' },
        React.createElement('span', { className: 'outskirtsSetupCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: resolveSetupPrimaryRowIcon('attackFocus'), alt: '', className: 'outskirtsSetupCard__icon' })),
        React.createElement('span', { className: 'outskirtsSetupCard__primaryLabel' }, setup.attackFocusRow.label),
        React.createElement('span', { className: 'outskirtsSetupCard__primaryValue' }, setup.attackFocusRow.value),
      ),
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
        React.createElement('span', { className: 'outskirtsSetupCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: resolveSetupStatIcon(setup.medicinePouchRow), alt: '', className: 'outskirtsSetupCard__icon' })),
        React.createElement('span', { className: 'outskirtsSetupCard__pouchValue' }, setup.medicinePouchRow.value),
        React.createElement('button', { type: 'button', className: 'outskirtsSetupCard__pouchAction', tabIndex: -1, 'aria-label': 'Open medicine pouch (presentation only)' }, '+'),
      ),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsSetupCard__section', 'data-testid': 'outskirts-exact-setup-equipment-grid' },
      React.createElement('h4', { className: 'outskirtsSetupCard__sectionTitle' }, 'Equipment'),
      React.createElement(
        'div',
        { className: 'outskirtsSetupCard__equipmentGrid' },
        ...setup.equipmentGrid.map((slot) => React.createElement(
          'div',
          { key: slot.slotId, className: 'outskirtsSetupCard__equipmentCell', 'data-testid': 'outskirts-exact-setup-equipment-slot' },
          React.createElement('img', { src: resolveEquipmentSlotIcon(slot), alt: '', className: 'outskirtsSetupCard__equipmentIcon', 'aria-hidden': 'true' }),
          React.createElement('span', { className: 'outskirtsSetupCard__srOnly' }, slot.label),
          React.createElement('span', { className: 'outskirtsSetupCard__srOnly' }, slot.value),
        )),
      ),
    ),
  );
}
