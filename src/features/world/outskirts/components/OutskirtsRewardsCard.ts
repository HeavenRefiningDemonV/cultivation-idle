import React from 'react';
import type { OutskirtsRewardsCard as OutskirtsRewardsCardModel } from '../types.js';
import { OUTSKIRTS_ASSETS } from '../outskirtsAssetRegistry.js';

export interface OutskirtsRewardsCardProps {
  rewards: OutskirtsRewardsCardModel;
  onToggleAutoRepeat?: () => void;
  onOpenTrackedBounties?: () => void;
}

const MATERIAL_ICON_MAP: Record<string, string> = OUTSKIRTS_ASSETS.icons.rewards.materials;

function resolveMaterialIcon(id: string): string {
  return MATERIAL_ICON_MAP[id] ?? OUTSKIRTS_ASSETS.icons.rewards.materialsFallback;
}

export function OutskirtsRewardsCard({ rewards, onToggleAutoRepeat, onOpenTrackedBounties }: OutskirtsRewardsCardProps) {
  const bountyTarget = Math.max(0, rewards.trackedBounty.progressTarget);
  const bountyCurrent = Math.max(0, rewards.trackedBounty.progressCurrent);
  const bountyFillPct = bountyTarget > 0 ? Math.max(0, Math.min(100, (bountyCurrent / bountyTarget) * 100)) : 0;
  const hasTrackedBounty = bountyTarget > 0 && rewards.trackedBounty.itemLabel.trim().toLowerCase() !== 'none';

  return React.createElement(
    'section',
    { className: 'outskirtsRewardsCard', 'data-testid': 'outskirts-exact-rewards-card', 'data-legacy-testid': 'outskirts-rewards-card' },
    React.createElement('h3', { className: 'outskirtsRewardsCard__title', 'data-testid': 'outskirts-exact-rewards-title' }, rewards.title),
    React.createElement(
      'div',
      { className: 'outskirtsRewardsCard__goldPanel', 'data-testid': 'outskirts-exact-rewards-gold' },
      React.createElement('span', { className: 'outskirtsRewardsCard__iconDock', 'aria-hidden': 'true' }, React.createElement('img', { src: OUTSKIRTS_ASSETS.icons.rewards.goldHeadline, alt: '', className: 'outskirtsRewardsCard__icon' })),
      React.createElement('span', { className: 'outskirtsRewardsCard__label' }, rewards.goldHeadline.label),
      React.createElement('span', { className: 'outskirtsRewardsCard__value outskirtsRewardsCard__value--gold' }, rewards.goldHeadline.value),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsRewardsCard__section outskirtsRewardsCard__section--materials', 'data-testid': 'outskirts-exact-rewards-materials' },
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
      'button',
      {
        className: 'outskirtsRewardsCard__section outskirtsRewardsCard__section--bounty',
        'data-testid': 'outskirts-exact-rewards-bounty',
        type: 'button',
        onClick: onOpenTrackedBounties,
        disabled: !onOpenTrackedBounties,
        'aria-label': 'Open bounties',
      },
      React.createElement('h4', { className: 'outskirtsRewardsCard__subtitle' }, rewards.trackedBounty.title),
      React.createElement(
        'div',
        { className: 'outskirtsRewardsCard__detailRows' },
        React.createElement('p', { className: 'outskirtsRewardsCard__row outskirtsRewardsCard__row--compact' }, rewards.trackedBounty.itemLabel),
        React.createElement('p', { className: 'outskirtsRewardsCard__helper' }, rewards.trackedBounty.helperLine),
        React.createElement(
          'div',
          {
            className: `outskirtsRewardsCard__bountyProgress${hasTrackedBounty ? '' : ' outskirtsRewardsCard__bountyProgress--empty'}`,
            'data-testid': 'outskirts-exact-rewards-bounty-progress',
            role: 'meter',
            'aria-valuemin': 0,
            'aria-valuemax': bountyTarget || 1,
            'aria-valuenow': hasTrackedBounty ? Math.min(bountyCurrent, bountyTarget) : 0,
            'aria-valuetext': rewards.trackedBounty.progressLabel,
            'aria-label': 'Tracked bounty progress',
          },
          React.createElement('span', { className: 'outskirtsRewardsCard__bountyProgressFill', style: { width: `${bountyFillPct}%` } }),
        ),
        React.createElement('p', { className: 'outskirtsRewardsCard__row outskirtsRewardsCard__row--accent' }, rewards.trackedBounty.progressLabel),
      ),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsRewardsCard__section outskirtsRewardsCard__section--efficiency', 'data-testid': 'outskirts-exact-rewards-efficiency' },
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
      React.createElement(
        'button',
        {
          type: 'button',
          className: `outskirtsRewardsCard__togglePill${rewards.autoRepeat.enabled ? ' outskirtsRewardsCard__togglePill--enabled' : ''}`,
          onClick: onToggleAutoRepeat,
          'aria-pressed': rewards.autoRepeat.enabled,
          'aria-label': `${rewards.autoRepeat.label}: ${rewards.autoRepeat.value}`,
        },
        rewards.autoRepeat.value,
      ),
    ),
  );
}
