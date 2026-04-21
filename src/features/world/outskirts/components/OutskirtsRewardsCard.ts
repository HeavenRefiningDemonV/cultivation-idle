import React from 'react';
import type { OutskirtsRewardsCard as OutskirtsRewardsCardModel } from '../types.js';

export interface OutskirtsRewardsCardProps {
  rewards: OutskirtsRewardsCardModel;
}

const MATERIAL_ICON_MAP: Record<string, string> = {
  'wolf-pelt': '/assets/icons/beastblood.png',
  'beast-bone': '/assets/icons/metalchunk.png',
  'green-herb': '/assets/icons/herbbundle.png',
  'spirit-stone': '/assets/icons/artifactshard.png',
};

function resolveMaterialIcon(id: string): string {
  return MATERIAL_ICON_MAP[id] ?? '/assets/icons/dust_brown.png';
}

export function OutskirtsRewardsCard({ rewards }: OutskirtsRewardsCardProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsRewardsCard', 'data-testid': 'outskirts-exact-rewards-card', 'data-legacy-testid': 'outskirts-rewards-card' },
    React.createElement('h3', { className: 'outskirtsRewardsCard__title', 'data-testid': 'outskirts-exact-rewards-title' }, rewards.title),
    React.createElement(
      'div',
      { className: 'outskirtsRewardsCard__goldPanel', 'data-testid': 'outskirts-exact-rewards-gold' },
      React.createElement('span', { className: 'outskirtsRewardsCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: '/assets/icons/artifactbundle.png', alt: '', className: 'outskirtsRewardsCard__icon' })),
      React.createElement('span', { className: 'outskirtsRewardsCard__label' }, rewards.goldHeadline.label),
      React.createElement('span', { className: 'outskirtsRewardsCard__value outskirtsRewardsCard__value--gold' }, rewards.goldHeadline.value),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsRewardsCard__section', 'data-testid': 'outskirts-exact-rewards-materials' },
      React.createElement('h4', { className: 'outskirtsRewardsCard__subtitle' }, rewards.commonMaterials.title),
      React.createElement(
        'div',
        { className: 'outskirtsRewardsCard__materialsGrid' },
        ...rewards.commonMaterials.items.map((item) => React.createElement(
          'div',
          { key: item.id, className: 'outskirtsRewardsCard__materialChip', 'data-testid': 'outskirts-exact-rewards-material-item' },
          React.createElement('img', { src: resolveMaterialIcon(item.id), alt: '', className: 'outskirtsRewardsCard__materialIcon', 'aria-hidden': 'true' }),
          React.createElement('span', { className: 'outskirtsRewardsCard__materialLabel' }, item.label),
        )),
      ),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsRewardsCard__section', 'data-testid': 'outskirts-exact-rewards-bounty' },
      React.createElement('h4', { className: 'outskirtsRewardsCard__subtitle' }, rewards.trackedBounty.title),
      React.createElement(
        'div',
        { className: 'outskirtsRewardsCard__detailRows' },
        React.createElement('p', { className: 'outskirtsRewardsCard__row outskirtsRewardsCard__row--compact' }, rewards.trackedBounty.itemLabel),
        React.createElement('p', { className: 'outskirtsRewardsCard__helper' }, rewards.trackedBounty.helperLine),
        React.createElement('p', { className: 'outskirtsRewardsCard__row outskirtsRewardsCard__row--accent' }, rewards.trackedBounty.progressLabel),
      ),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsRewardsCard__section', 'data-testid': 'outskirts-exact-rewards-efficiency' },
      React.createElement('h4', { className: 'outskirtsRewardsCard__subtitle' }, rewards.estimatedEfficiency.title),
      React.createElement(
        'div',
        { className: 'outskirtsRewardsCard__detailRows' },
        React.createElement('p', { className: 'outskirtsRewardsCard__row outskirtsRewardsCard__row--compact' }, rewards.estimatedEfficiency.runTimeLabel),
        React.createElement('p', { className: 'outskirtsRewardsCard__row outskirtsRewardsCard__row--compact' }, rewards.estimatedEfficiency.hourlyLabel),
      ),
    ),
    React.createElement(
      'div',
      { className: 'outskirtsRewardsCard__toggleRow', 'data-testid': 'outskirts-exact-rewards-auto-repeat' },
      React.createElement('span', { className: 'outskirtsRewardsCard__toggleLabel' }, rewards.autoRepeat.label),
      React.createElement('span', { className: `outskirtsRewardsCard__togglePill${rewards.autoRepeat.enabled ? ' outskirtsRewardsCard__togglePill--enabled' : ''}` }, rewards.autoRepeat.value),
    ),
  );
}
