import React from 'react';
import { OUTSKIRTS_MOCKUP_REGION_ORDER } from './outskirtsMockupPresentation.js';
import type { OutskirtsMockupSurface } from './types.js';

export interface OutskirtsExactMockupScreenProps {
  surface: OutskirtsMockupSurface;
}

export function OutskirtsExactMockupScreen({ surface }: OutskirtsExactMockupScreenProps) {
  return React.createElement(
    'article',
    { className: 'outskirtsExactMockup', 'data-testid': 'outskirts-exact-mockup-screen' },
    React.createElement(
      'header',
      { className: 'outskirtsExactMockup__header', 'data-testid': 'outskirts-exact-header' },
      React.createElement('h1', { 'data-testid': 'outskirts-exact-page-title' }, surface.header.pageTitle),
      React.createElement('p', { 'data-testid': 'outskirts-exact-role-tag' }, surface.header.roleTag),
      React.createElement('p', { 'data-testid': 'outskirts-exact-best-used' }, surface.header.bestUsedWhen),
      React.createElement('p', { 'data-testid': 'outskirts-exact-boundary' }, surface.header.boundaryLine),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsExactMockup__topProgress', 'data-testid': 'outskirts-exact-top-progress' },
      React.createElement('h2', null, surface.topProgress.label),
      React.createElement('p', null, surface.topProgress.helperText),
      React.createElement('ol', null, ...surface.topProgress.nodes.map((node) => React.createElement('li', { key: node.id, 'data-state': node.state }, node.label))),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsExactMockup__tactical', 'data-testid': 'outskirts-exact-tactical-strip' },
      React.createElement('h2', null, 'Tactical Strip'),
      React.createElement('ul', null, ...surface.tacticalStrip.cells.map((cell) => React.createElement(
        'li',
        { key: cell.id, 'data-tone': cell.tone, 'data-visible': cell.visible ? '1' : '0' },
        React.createElement('span', null, cell.label),
        React.createElement('span', null, cell.value),
      ))),
    ),
    React.createElement('section', { className: 'outskirtsExactMockup__plaque', 'data-testid': 'outskirts-exact-area-plaque' }, surface.header.areaPlaqueLabel),
    React.createElement('p', { className: 'outskirtsExactMockup__subtitle', 'data-testid': 'outskirts-exact-subtitle' }, surface.header.subtitle),
    React.createElement(
      'section',
      { className: 'outskirtsExactMockup__body', 'data-testid': 'outskirts-exact-body' },
      React.createElement(
        'section',
        { className: 'outskirtsExactMockup__setup', 'data-testid': 'outskirts-exact-setup-card' },
        React.createElement('h2', null, surface.setupCard.title),
        React.createElement('p', null, `${surface.setupCard.loadoutSet.label}: ${surface.setupCard.loadoutSet.value}`),
        React.createElement('p', null, `${surface.setupCard.aiProfile.label}: ${surface.setupCard.aiProfile.value}`),
        React.createElement('p', null, `${surface.setupCard.attackFocus.label}: ${surface.setupCard.attackFocus.value}`),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactMockup__encounter', 'data-testid': 'outskirts-exact-encounter-hero' },
        React.createElement('p', null, surface.encounterHero.encounterDisplayName),
        React.createElement('p', null, surface.encounterHero.encounterLevelLabel),
        React.createElement('p', null, surface.encounterHero.safetyChip.label),
        React.createElement('p', null, surface.encounterHero.descriptor),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactMockup__rewards', 'data-testid': 'outskirts-exact-rewards-card' },
        React.createElement('h2', null, surface.rewardsCard.title),
        React.createElement('ul', null, ...surface.rewardsCard.expectedRewards.map((row) => React.createElement('li', { key: row.id }, `${row.label}: ${row.value}`))),
      ),
    ),
    React.createElement('section', { className: 'outskirtsExactMockup__chain', 'data-testid': 'outskirts-exact-encounter-chain' }, React.createElement('ol', null, ...surface.encounterChain.nodes.map((node) => React.createElement('li', { key: node.id, 'data-state': node.state }, node.label)))),
    React.createElement('section', { className: 'outskirtsExactMockup__action', 'data-testid': 'outskirts-exact-action-zone' }, React.createElement('button', { type: 'button', disabled: !surface.actionZone.primaryCtaEnabled }, surface.actionZone.primaryCtaLabel)),
    React.createElement('section', { className: 'outskirtsExactMockup__grind', 'data-testid': 'outskirts-exact-grind-summary' },
      React.createElement('h2', null, surface.grindSummary.title),
      React.createElement('ul', null, ...surface.grindSummary.rows.map((row) => React.createElement('li', { key: row.id }, `${row.label}: ${row.value}`))),
    ),
    React.createElement('aside', { 'data-testid': 'outskirts-exact-shell-flags', hidden: true }, JSON.stringify(surface.shell)),
    React.createElement('aside', { 'data-testid': 'outskirts-exact-region-order', hidden: true }, OUTSKIRTS_MOCKUP_REGION_ORDER.join('|')),
  );
}
