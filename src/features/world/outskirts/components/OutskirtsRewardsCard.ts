import React from 'react';
import type { OutskirtsRewardsCard as OutskirtsRewardsCardModel } from '../types.js';

export interface OutskirtsRewardsCardProps {
  rewards: OutskirtsRewardsCardModel;
}

export function OutskirtsRewardsCard({ rewards }: OutskirtsRewardsCardProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsRewardsCard', 'data-testid': 'outskirts-rewards-card' },
    React.createElement('h3', { className: 'outskirtsRewardsCard__title' }, rewards.title),
    React.createElement('p', { className: 'outskirtsRewardsCard__row' }, React.createElement('span', { className: 'outskirtsRewardsCard__label' }, rewards.goldHeadline.label), React.createElement('span', { className: 'outskirtsRewardsCard__value' }, rewards.goldHeadline.value)),
    React.createElement('h4', { className: 'outskirtsRewardsCard__subtitle' }, rewards.commonMaterials.title),
    React.createElement('div', { className: 'outskirtsRewardsCard__group' }, ...rewards.commonMaterials.items.map((item) => React.createElement('p', { key: item.id, className: 'outskirtsRewardsCard__row' }, item.label))),
    React.createElement('h4', { className: 'outskirtsRewardsCard__subtitle' }, rewards.trackedBounty.title),
    React.createElement('div', { className: 'outskirtsRewardsCard__group' },
      React.createElement('p', { className: 'outskirtsRewardsCard__row' }, rewards.trackedBounty.itemLabel),
      React.createElement('p', { className: 'outskirtsRewardsCard__row' }, rewards.trackedBounty.helperLine),
      React.createElement('p', { className: 'outskirtsRewardsCard__row' }, rewards.trackedBounty.progressLabel),
    ),
    React.createElement('h4', { className: 'outskirtsRewardsCard__subtitle' }, rewards.estimatedEfficiency.title),
    React.createElement('div', { className: 'outskirtsRewardsCard__group' },
      React.createElement('p', { className: 'outskirtsRewardsCard__row' }, rewards.estimatedEfficiency.runTimeLabel),
      React.createElement('p', { className: 'outskirtsRewardsCard__row' }, rewards.estimatedEfficiency.hourlyLabel),
    ),
    React.createElement('p', { className: 'outskirtsRewardsCard__row' }, `${rewards.autoRepeat.label} ${rewards.autoRepeat.value}`),
  );
}
