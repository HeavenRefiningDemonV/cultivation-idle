import React from 'react';
import type { OutskirtsSetupCardRegion } from '../types.js';

export function OutskirtsSetupCard(props: { card: OutskirtsSetupCardRegion }) {
  const { card } = props;

  return React.createElement(
    'article',
    { className: 'outskirtsSetupCard', 'data-testid': 'outskirts-setup-card', 'aria-label': 'Your Setup' },
    React.createElement('h3', { className: 'outskirtsSetupCard__title' }, card.title),
    React.createElement(
      'ul',
      { className: 'outskirtsSetupCard__rows', 'data-testid': 'outskirts-setup-primary-rows' },
      ...card.primaryRows.map((row) => React.createElement(
        'li',
        { key: row.id, className: 'outskirtsSetupCard__row' },
        React.createElement('span', { className: `outskirtsSetupCard__icon outskirtsSetupCard__icon--${row.iconKey}`, 'aria-hidden': 'true' }),
        React.createElement('span', { className: 'outskirtsSetupCard__label' }, row.label),
        React.createElement('span', { className: 'outskirtsSetupCard__value', title: row.value.text }, row.value.text),
        row.id === 'loadoutSet'
          ? React.createElement('span', { className: 'outskirtsSetupCard__badge', 'data-testid': 'outskirts-setup-loadout-badge' }, card.loadoutBadge.text)
          : React.createElement('span', { className: 'outskirtsSetupCard__badgeSpacer', 'aria-hidden': 'true' }),
      )),
    ),

    React.createElement('h4', { className: 'outskirtsSetupCard__section' }, 'Offense'),
    React.createElement(
      'ul',
      { className: 'outskirtsSetupCard__rows', 'data-testid': 'outskirts-setup-offense' },
      ...card.offenseRows.map((row) => React.createElement(
        'li',
        { key: row.id, className: 'outskirtsSetupCard__row outskirtsSetupCard__row--stat' },
        React.createElement('span', { className: 'outskirtsSetupCard__icon outskirtsSetupCard__icon--stat', 'aria-hidden': 'true' }),
        React.createElement('span', { className: 'outskirtsSetupCard__label' }, row.label),
        React.createElement('span', { className: 'outskirtsSetupCard__value' }, row.value.text),
        React.createElement('span', { className: 'outskirtsSetupCard__badgeSpacer', 'aria-hidden': 'true' }),
      )),
    ),

    React.createElement('h4', { className: 'outskirtsSetupCard__section' }, 'Defense'),
    React.createElement(
      'ul',
      { className: 'outskirtsSetupCard__rows', 'data-testid': 'outskirts-setup-defense' },
      ...card.defenseRows.map((row) => React.createElement(
        'li',
        { key: row.id, className: 'outskirtsSetupCard__row outskirtsSetupCard__row--stat' },
        React.createElement('span', { className: 'outskirtsSetupCard__icon outskirtsSetupCard__icon--stat', 'aria-hidden': 'true' }),
        React.createElement('span', { className: 'outskirtsSetupCard__label' }, row.label),
        React.createElement('span', { className: 'outskirtsSetupCard__value' }, row.value.text),
        React.createElement('span', { className: 'outskirtsSetupCard__badgeSpacer', 'aria-hidden': 'true' }),
      )),
    ),

    React.createElement('h4', { className: 'outskirtsSetupCard__section outskirtsSetupCard__section--divider' }, card.medicinePouchRow.label),
    React.createElement(
      'div',
      { className: 'outskirtsSetupCard__pouchRow', 'data-testid': 'outskirts-setup-medicine' },
      React.createElement('span', { className: 'outskirtsSetupCard__icon outskirtsSetupCard__icon--pouch', 'aria-hidden': 'true' }),
      React.createElement('span', { className: 'outskirtsSetupCard__pouchValue' }, card.medicinePouchRow.count.text),
      React.createElement(
        'button',
        {
          type: 'button',
          className: 'outskirtsSetupCard__pouchAffordance',
          disabled: !card.medicinePouchRow.affordanceEnabled,
          'aria-label': 'Configure medicine pouch',
        },
        card.medicinePouchRow.affordanceLabel,
      ),
    ),

    React.createElement('h4', { className: 'outskirtsSetupCard__section outskirtsSetupCard__section--divider' }, 'Equipment'),
    React.createElement(
      'ol',
      { className: 'outskirtsSetupCard__equipmentGrid', 'data-testid': 'outskirts-setup-equipment-grid' },
      ...card.equipmentSlots.map((slot) => React.createElement(
        'li',
        {
          key: slot.id,
          className: `outskirtsSetupCard__equipmentCell ${slot.isEmpty ? 'outskirtsSetupCard__equipmentCell--empty' : ''}`,
          'data-empty': slot.isEmpty ? '1' : '0',
        },
        React.createElement('span', { className: 'outskirtsSetupCard__equipmentIcon', 'aria-hidden': 'true' }, slot.iconText),
      )),
    ),
  );
}
