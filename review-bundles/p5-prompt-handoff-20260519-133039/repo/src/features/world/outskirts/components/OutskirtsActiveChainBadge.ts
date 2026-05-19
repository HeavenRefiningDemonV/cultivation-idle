import React from 'react';
import type { OutskirtsActiveChainBadge as OutskirtsActiveChainBadgeModel } from '../types.js';

export interface OutskirtsActiveChainBadgeProps {
  badge: OutskirtsActiveChainBadgeModel;
}

export function OutskirtsActiveChainBadge({ badge }: OutskirtsActiveChainBadgeProps) {
  if (!badge.visible) return null;

  return React.createElement(
    'section',
    {
      className: 'outskirtsActiveChainBadge',
      'data-testid': 'outskirts-active-chain-badge',
      'data-boss-tone': badge.bossTone,
      'aria-label': `${badge.title}; ${badge.bossLabel}`,
    },
    React.createElement('span', {
      className: 'outskirtsActiveChainBadge__ornament outskirtsActiveChainBadge__ornament--left',
      'aria-hidden': 'true',
    }),
    React.createElement(
      'span',
      { className: 'outskirtsActiveChainBadge__plate' },
      React.createElement(
        'span',
        {
          className: 'outskirtsActiveChainBadge__title',
          'data-testid': 'outskirts-active-chain-badge-title',
        },
        badge.title,
      ),
      React.createElement(
        'span',
        {
          className: 'outskirtsActiveChainBadge__boss',
          'data-testid': 'outskirts-active-chain-badge-boss',
        },
        badge.bossLabel,
      ),
    ),
    React.createElement('span', {
      className: 'outskirtsActiveChainBadge__ornament outskirtsActiveChainBadge__ornament--right',
      'aria-hidden': 'true',
    }),
  );
}
