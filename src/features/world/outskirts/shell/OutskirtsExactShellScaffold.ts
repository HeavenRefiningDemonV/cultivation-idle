import React from 'react';
import type { OutskirtsMockupSurface } from '../types.js';

export interface OutskirtsExactShellScaffoldProps {
  surface: OutskirtsMockupSurface;
}

/**
 * P2 shell-prep scaffold only.
 *
 * This component exists as a shell composition rehearsal for the exact-mockup
 * surface and is intentionally not wired into the live World Outskirts route.
 */
export function OutskirtsExactShellScaffold({ surface }: OutskirtsExactShellScaffoldProps) {
  return React.createElement(
    'section',
    { 'data-testid': 'outskirts-exact-shell-scaffold' },
    React.createElement(
      'header',
      { className: 'plaqueHeader plaqueHeader--location', 'data-testid': 'outskirts-exact-shell-header' },
      React.createElement('p', null, surface.header.roleTag),
      React.createElement('h2', null, surface.header.pageTitle),
      React.createElement('p', null, surface.header.subtitle),
    ),
    React.createElement(
      'div',
      { 'data-testid': 'outskirts-exact-shell-grid' },
      React.createElement(
        'section',
        { className: 'frameCard frameCard--panel' },
        React.createElement('h3', null, surface.setupCard.title),
        React.createElement('p', null, `${surface.setupCard.loadoutSet.label}: ${surface.setupCard.loadoutSet.value}`),
        React.createElement('ul', null, ...surface.setupCard.offense.map((entry) => React.createElement('li', { key: entry.id }, `${entry.label}: ${entry.value}`))),
      ),
      React.createElement(
        'section',
        { className: 'frameCard frameCard--panel' },
        React.createElement('h3', null, surface.rewardsCard.title),
        React.createElement('p', null, surface.rewardsCard.cadenceSupport.value),
        React.createElement('ul', null, ...surface.rewardsCard.expectedRewards.map((entry) => React.createElement('li', { key: entry.id }, `${entry.label}: ${entry.value}`))),
      ),
      React.createElement(
        'section',
        { className: 'frameCard frameCard--panel' },
        React.createElement('h3', null, surface.grindSummary.title),
        React.createElement('p', null, surface.grindSummary.statusLine),
        React.createElement('ul', null, ...surface.grindSummary.rows.map((entry) => React.createElement('li', { key: entry.id }, `${entry.label}: ${entry.value}`))),
      ),
    ),
  );
}
