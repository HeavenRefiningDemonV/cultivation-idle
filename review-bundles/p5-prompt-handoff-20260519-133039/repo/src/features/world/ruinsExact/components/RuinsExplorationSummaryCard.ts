import React from 'react';
import type { RuinsExplorationSummarySurface } from '../types.js';
import { RUINS_EXACT_ASSETS } from '../ruinsExactAssetRegistry.js';

export function RuinsExplorationSummaryCard({ summary }: { summary: RuinsExplorationSummarySurface }) {
  if (!summary.visible) return null;
  return React.createElement('section', { className: 'ruinsExplorationSummaryCard', 'data-testid': 'ruins-exploration-summary', 'aria-label': summary.title },
    React.createElement('header', { className: 'ruinsExplorationSummaryCard__header' }, React.createElement('h4', { className: 'ruinsExplorationSummaryCard__title' }, summary.title)),
    React.createElement('div', { className: 'ruinsExplorationSummaryCard__rows' }, ...summary.rows.map((row) => React.createElement('p', { key: row.id, className: `ruinsExplorationSummaryCard__row ruinsExplorationSummaryCard__row--${row.id}`, 'data-testid': 'ruins-exploration-summary-row' },
      React.createElement('span', { className: 'ruinsExplorationSummaryCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: RUINS_EXACT_ASSETS.icons.summary[row.iconKey], alt: '' })),
      React.createElement('span', { className: 'ruinsExplorationSummaryCard__label' }, row.label),
      React.createElement('span', { className: 'ruinsExplorationSummaryCard__value' }, row.value),
    ))),
  );
}
