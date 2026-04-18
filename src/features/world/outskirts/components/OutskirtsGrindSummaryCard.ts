import React from 'react';
import type { OutskirtsMockupGrindSummary } from '../types.js';

export interface OutskirtsGrindSummaryCardProps {
  summary: OutskirtsMockupGrindSummary;
}

export function OutskirtsGrindSummaryCard({ summary }: OutskirtsGrindSummaryCardProps) {
  if (!summary.visible) return null;

  return React.createElement(
    'section',
    { className: 'outskirtsGrindSummaryCard', 'data-testid': 'outskirts-grind-summary' },
    React.createElement('h4', { className: 'outskirtsGrindSummaryCard__title' }, summary.title ?? 'Grind Summary'),
    React.createElement(
      'div',
      { className: 'outskirtsGrindSummaryCard__rows' },
      React.createElement(
        'p',
        { className: 'outskirtsGrindSummaryCard__row' },
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__label' }, 'Runs'),
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__value' }, summary.runsText ?? 'Steady loop'),
      ),
      React.createElement(
        'p',
        { className: 'outskirtsGrindSummaryCard__row' },
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__label' }, 'Gold / hr'),
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__value' }, summary.goldPerHourText ?? 'Est. stable income'),
      ),
      React.createElement(
        'p',
        { className: 'outskirtsGrindSummaryCard__row' },
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__label' }, 'Main Drop'),
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__value' }, summary.mainDropLabel ?? 'Broad field drops'),
      ),
      React.createElement(
        'p',
        { className: 'outskirtsGrindSummaryCard__row' },
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__label' }, 'Route'),
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__value' }, summary.areaFilterText ?? summary.progressText ?? 'Outskirts baseline lane'),
      ),
    ),
  );
}
