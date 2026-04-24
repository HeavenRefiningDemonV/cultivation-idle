import React from 'react';
import type { OutskirtsLabeledValue, OutskirtsSetupCard as OutskirtsSetupCardModel } from '../types.js';
import { OUTSKIRTS_ASSETS } from '../outskirtsAssetRegistry.js';

export interface OutskirtsSetupCardProps {
  setup: OutskirtsSetupCardModel;
  onOpenMedicinePouch?: () => void;
  onOpenLoadout?: () => void;
  onOpenAiProfile?: () => void;
  onOpenAttackFocus?: () => void;
  onOpenEquipmentSlot?: (slotId: OutskirtsSetupCardModel['equipmentGrid'][number]['slotId']) => void;
}

const PRIMARY_ROW_ICON_MAP = OUTSKIRTS_ASSETS.icons.setupPrimary;

const STAT_ICON_MAP: Record<string, string> = OUTSKIRTS_ASSETS.icons.setupStats;

const EQUIPMENT_ICON_MAP = OUTSKIRTS_ASSETS.icons.setupEquipment;

function resolveLoadoutBadge(value: string): string {
  const match = value.match(/(\d+)/);
  return match ? match[1] : value.slice(0, 3).toUpperCase();
}

function renderPrimaryRow(row: OutskirtsLabeledValue, onClick?: () => void, isLoadout = false) {
  return React.createElement(
    'button',
    {
      type: 'button',
      className: `outskirtsSetupCard__primaryRow${isLoadout ? ' outskirtsSetupCard__primaryRow--loadout' : ''}`,
      'data-testid': 'outskirts-exact-setup-primary',
      onClick,
      disabled: !onClick,
      'aria-label': `${row.label}: ${row.value}`,
    },
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
    React.createElement('span', { className: 'outskirtsSetupCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: STAT_ICON_MAP[row.id] ?? OUTSKIRTS_ASSETS.icons.setupPrimary.loadoutSet, alt: '', className: 'outskirtsSetupCard__icon' })),
    React.createElement('span', { className: 'outskirtsSetupCard__statLabel' }, row.label),
    React.createElement('span', { className: 'outskirtsSetupCard__statValue' }, row.value),
  ));
}

export function OutskirtsSetupCard({
  setup,
  onOpenMedicinePouch,
  onOpenLoadout,
  onOpenAiProfile,
  onOpenAttackFocus,
  onOpenEquipmentSlot,
}: OutskirtsSetupCardProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsSetupCard', 'data-testid': 'outskirts-exact-setup-card', 'data-legacy-testid': 'outskirts-setup-card' },
    React.createElement('h3', { className: 'outskirtsSetupCard__title', 'data-testid': 'outskirts-exact-setup-title' }, setup.title),
    React.createElement(
      'div',
      { className: 'outskirtsSetupCard__primaryRows' },
      renderPrimaryRow(setup.loadoutRow, onOpenLoadout, true),
      renderPrimaryRow(setup.aiProfileRow, onOpenAiProfile),
      renderPrimaryRow(setup.attackFocusRow, onOpenAttackFocus),
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
        React.createElement('span', { className: 'outskirtsSetupCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: OUTSKIRTS_ASSETS.icons.setupPouch, alt: '', className: 'outskirtsSetupCard__icon' })),
        React.createElement('span', { className: 'outskirtsSetupCard__pouchValue' }, setup.medicinePouchRow.value),
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'outskirtsSetupCard__pouchAction',
            disabled: !setup.medicinePouchActionEnabled,
            onClick: setup.medicinePouchActionEnabled ? onOpenMedicinePouch : undefined,
            'aria-label': setup.medicinePouchActionEnabled ? 'Open medicine pouch configuration' : 'Medicine pouch action unavailable',
          },
          '+',
        ),
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
          'button',
          {
            key: slot.slotId,
            type: 'button',
            className: `outskirtsSetupCard__equipmentCell outskirtsSetupCard__equipmentCell--${slot.source}`,
            'data-testid': 'outskirts-exact-setup-equipment-slot',
            'aria-label': `${slot.label}: ${slot.value}`,
            onClick: onOpenEquipmentSlot ? () => onOpenEquipmentSlot(slot.slotId) : undefined,
            disabled: !onOpenEquipmentSlot,
          },
          React.createElement('img', { src: EQUIPMENT_ICON_MAP[slot.slotId], alt: '', className: 'outskirtsSetupCard__equipmentIcon', 'aria-hidden': 'true' }),
          React.createElement('span', { className: 'outskirtsSetupCard__equipmentSr' }, `${slot.label} ${slot.value}`),
        )),
      ),
    ),
  );
}
