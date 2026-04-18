import React from 'react';
import type { OutskirtsGrindSummaryCardRegion } from '../types.js';

export function OutskirtsGrindSummaryCard(props: { card: OutskirtsGrindSummaryCardRegion }) {
  const { card } = props;

  return React.createElement(
    'aside',
    { className: 'outskirtsGrindSummaryCard', 'data-testid': 'outskirts-grind-summary-card', 'aria-label': 'Grind Summary' },
    React.createElement('h4', { className: 'outskirtsGrindSummaryCard__title' }, card.title),
    React.createElement('span', { className: 'outskirtsGrindSummaryCard__scope' }, card.scopeLabel),
    React.createElement(
      'ul',
      { className: 'outskirtsGrindSummaryCard__rows' },
      ...card.rows.map((row) => React.createElement(
        'li',
        { key: row.key, className: 'outskirtsGrindSummaryCard__row' },
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__icon', 'aria-hidden': 'true' }, row.iconText),
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__label' }, row.label),
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__value' }, row.value),
      )),
    ),
  );
}
