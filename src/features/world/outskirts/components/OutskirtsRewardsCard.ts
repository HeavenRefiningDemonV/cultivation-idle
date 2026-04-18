import React from 'react';
import type { OutskirtsMockupRewardsCard } from '../types.js';

export interface OutskirtsRewardsCardProps {
  rewards: OutskirtsMockupRewardsCard;
}

function renderRows(rows: OutskirtsMockupRewardsCard['expectedRewards'] | OutskirtsMockupRewardsCard['guaranteedOrLikely'] | OutskirtsMockupRewardsCard['efficiency']) {
  return rows.map((row) => React.createElement(
    'p',
    { key: row.id, className: 'outskirtsRewardsCard__row' },
    React.createElement('span', { className: 'outskirtsRewardsCard__label' }, row.label),
    React.createElement('span', { className: 'outskirtsRewardsCard__value' }, row.value),
  ));
}

export function OutskirtsRewardsCard({ rewards }: OutskirtsRewardsCardProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsRewardsCard', 'data-testid': 'outskirts-rewards-card' },
    React.createElement('h3', { className: 'outskirtsRewardsCard__title' }, rewards.title),
    React.createElement('div', { className: 'outskirtsRewardsCard__group' }, ...renderRows(rewards.expectedRewards)),
    React.createElement('div', { className: 'outskirtsRewardsCard__group' }, ...renderRows(rewards.guaranteedOrLikely)),
    React.createElement(
      'div',
      { className: 'outskirtsRewardsCard__group' },
      React.createElement(
        'p',
        { className: 'outskirtsRewardsCard__row' },
        React.createElement('span', { className: 'outskirtsRewardsCard__label' }, rewards.bountyOverlap.label),
        React.createElement('span', { className: 'outskirtsRewardsCard__value' }, rewards.bountyOverlap.value),
      ),
      ...renderRows(rewards.efficiency),
      React.createElement(
        'p',
        { className: 'outskirtsRewardsCard__row' },
        React.createElement('span', { className: 'outskirtsRewardsCard__label' }, rewards.cadenceSupport.label),
        React.createElement('span', { className: 'outskirtsRewardsCard__value' }, rewards.cadenceSupport.value),
      ),
    ),
  );
}
