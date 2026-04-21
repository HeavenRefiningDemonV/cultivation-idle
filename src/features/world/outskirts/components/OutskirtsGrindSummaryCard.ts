import React from 'react';
import type { OutskirtsGrindSummary } from '../types.js';

export interface OutskirtsGrindSummaryCardProps {
  summary: OutskirtsGrindSummary;
}

export function OutskirtsGrindSummaryCard({ summary }: OutskirtsGrindSummaryCardProps) {
  if (!summary.visible) return null;

  return React.createElement(
    'section',
    { className: 'outskirtsGrindSummaryCard', 'data-testid': 'outskirts-grind-summary' },
    React.createElement('h4', { className: 'outskirtsGrindSummaryCard__title' }, summary.title),
    React.createElement(
      'div',
      { className: 'outskirtsGrindSummaryCard__rows' },
      React.createElement(
        'p',
        { className: 'outskirtsGrindSummaryCard__row' },
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__label' }, 'Runs'),
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__value' }, summary.runsText),
      ),
      React.createElement(
        'p',
        { className: 'outskirtsGrindSummaryCard__row' },
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__label' }, 'Gold / hr'),
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__value' }, summary.goldPerHourText),
      ),
      React.createElement(
        'p',
        { className: 'outskirtsGrindSummaryCard__row' },
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__label' }, 'Main Drop'),
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__value' }, summary.mainDropLabel),
      ),
      React.createElement(
        'p',
        { className: 'outskirtsGrindSummaryCard__row' },
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__label' }, 'Route'),
        React.createElement('span', { className: 'outskirtsGrindSummaryCard__value' }, summary.scopeChipLabel),
      ),
    ),
  );
}
