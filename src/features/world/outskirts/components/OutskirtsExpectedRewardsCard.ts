import React from 'react';
import type { OutskirtsExpectedRewardsCardRegion } from '../types.js';

export function OutskirtsExpectedRewardsCard(props: { card: OutskirtsExpectedRewardsCardRegion }) {
  const { card } = props;

  return React.createElement(
    'article',
    { className: 'outskirtsExpectedCard', 'data-testid': 'outskirts-expected-rewards-card', 'aria-label': 'Expected Rewards' },
    React.createElement('h3', { className: 'outskirtsExpectedCard__title' }, card.title),

    React.createElement('h4', { className: 'outskirtsExpectedCard__section' }, 'Gold'),
    React.createElement(
      'div',
      { className: 'outskirtsExpectedCard__row' },
      React.createElement('span', { className: 'outskirtsExpectedCard__icon', 'aria-hidden': 'true' }, 'G'),
      React.createElement('span', { className: 'outskirtsExpectedCard__value', 'data-testid': 'outskirts-expected-gold-range' }, card.goldRangeText),
    ),

    React.createElement('h4', { className: 'outskirtsExpectedCard__section' }, 'Common Materials'),
    React.createElement(
      'ol',
      { className: 'outskirtsExpectedCard__materials', 'data-testid': 'outskirts-expected-materials-row' },
      ...card.commonMaterials.map((entry) => React.createElement(
        'li',
        {
          key: entry.itemId,
          className: `outskirtsExpectedCard__material ${entry.isPlaceholder ? 'outskirtsExpectedCard__material--placeholder' : ''}`,
          'data-placeholder': entry.isPlaceholder ? '1' : '0',
        },
        React.createElement('span', { className: 'outskirtsExpectedCard__materialIcon', 'aria-hidden': 'true' }, entry.iconText),
        React.createElement('span', { className: 'outskirtsExpectedCard__materialLabel', title: entry.label }, entry.label),
      )),
    ),

    React.createElement('h4', { className: 'outskirtsExpectedCard__section outskirtsExpectedCard__section--divider' }, 'Tracked Bounty'),
    React.createElement(
      'div',
      { className: 'outskirtsExpectedCard__bounty', 'data-testid': 'outskirts-expected-tracked-bounty' },
      React.createElement('div', { className: 'outskirtsExpectedCard__bountyTitle' }, card.trackedBounty.title),
      React.createElement('div', { className: 'outskirtsExpectedCard__bountyObjective' }, card.trackedBounty.objectiveText),
      React.createElement(
        'div',
        { className: 'outskirtsExpectedCard__bountyProgress' },
        React.createElement('span', { className: 'outskirtsExpectedCard__bountyProgressText' }, `${card.trackedBounty.progressCurrent} / ${card.trackedBounty.progressTarget}`),
        React.createElement(
          'span',
          { className: 'outskirtsExpectedCard__bountyBar', 'aria-hidden': 'true' },
          React.createElement('span', { className: 'outskirtsExpectedCard__bountyBarFill', style: { width: `${card.trackedBounty.progressPct}%` } }),
        ),
      ),
    ),

    React.createElement('h4', { className: 'outskirtsExpectedCard__section outskirtsExpectedCard__section--divider' }, 'Estimated Efficiency'),
    React.createElement(
      'ul',
      { className: 'outskirtsExpectedCard__efficiency', 'data-testid': 'outskirts-expected-efficiency' },
      React.createElement('li', null, card.estimatedEfficiency.timePerRunText),
      React.createElement('li', null, card.estimatedEfficiency.hourlyYieldText),
    ),

    React.createElement('h4', { className: 'outskirtsExpectedCard__section outskirtsExpectedCard__section--divider' }, 'Auto-Repeat'),
    React.createElement(
      'div',
      { className: 'outskirtsExpectedCard__autoRepeat', 'data-testid': 'outskirts-expected-auto-repeat' },
      React.createElement('span', { className: 'outskirtsExpectedCard__autoRepeatLabel' }, card.autoRepeat.label),
      React.createElement('button', {
        type: 'button',
        className: `outskirtsExpectedCard__toggle ${card.autoRepeat.enabled ? 'outskirtsExpectedCard__toggle--on' : ''}`,
        'aria-pressed': card.autoRepeat.enabled ? 'true' : 'false',
        disabled: !card.autoRepeat.canToggle,
      }, card.autoRepeat.enabled ? 'On' : 'Off'),
    ),
  );
}
