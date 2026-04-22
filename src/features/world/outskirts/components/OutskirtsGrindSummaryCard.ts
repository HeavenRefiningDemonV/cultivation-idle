import React from 'react';
import type { OutskirtsGrindSummary } from '../types.js';
import { OUTSKIRTS_ASSETS } from '../outskirtsAssetRegistry.js';

const ICON_BY_KEY: Record<'runs' | 'gold' | 'drop', string> = OUTSKIRTS_ASSETS.icons.grindSummary;

export interface OutskirtsGrindSummaryCardProps {
  summary: OutskirtsGrindSummary;
}

export function OutskirtsGrindSummaryCard({ summary }: OutskirtsGrindSummaryCardProps) {
  if (!summary.visible) return null;
  const rows = summary.rows ?? [
    { id: 'runs', label: 'Runs', value: summary.runsText, iconKey: 'runs' as const },
    { id: 'goldPerHour', label: 'Gold / hr', value: summary.goldPerHourText, iconKey: 'gold' as const },
    { id: 'mainDrop', label: 'Main Drop', value: summary.mainDropLabel, iconKey: 'drop' as const },
  ];

  return React.createElement(
    'section',
    { className: 'outskirtsGrindSummaryCard', 'data-testid': 'outskirts-grind-summary' },
    React.createElement(
      'header',
      { className: 'outskirtsGrindSummaryCard__header' },
      React.createElement('h4', { className: 'outskirtsGrindSummaryCard__title' }, summary.title),
      React.createElement('span', { className: 'outskirtsGrindSummaryCard__chip', 'data-testid': 'outskirts-grind-summary-chip' }, summary.scopeChipLabel),
    ),
    React.createElement(
      'div',
      { className: 'outskirtsGrindSummaryCard__rows' },
      ...rows.map((row) => React.createElement(
        'p',
        { key: row.id, className: 'outskirtsGrindSummaryCard__row', 'data-testid': 'outskirts-grind-summary-row' },
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: ICON_BY_KEY[row.iconKey], alt: '', className: 'outskirtsGrindSummaryCard__icon' })),
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__label' }, row.label),
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__value' }, row.value),
      )),
    ),
  );
}
