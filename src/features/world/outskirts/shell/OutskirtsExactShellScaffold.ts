import React from 'react';
import type { OutskirtsExactSurfaceV2 } from '../types.js';

export interface OutskirtsExactShellScaffoldProps {
  surface: OutskirtsExactSurfaceV2;
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
      React.createElement('p', null, surface.debug.supportTruth.roleTag),
      React.createElement('h2', null, surface.page.title),
      React.createElement('p', null, surface.areaHeader.subtitle),
    ),
    React.createElement(
      'div',
      { 'data-testid': 'outskirts-exact-shell-grid' },
      React.createElement(
        'section',
        { className: 'frameCard frameCard--panel' },
        React.createElement('h3', null, surface.setupCard.title),
        React.createElement('p', null, `${surface.setupCard.loadoutRow.label}: ${surface.setupCard.loadoutRow.value}`),
        React.createElement('ul', null, ...surface.setupCard.offenseRows.map((entry) => React.createElement('li', { key: entry.id }, entry.label))),
      ),
      React.createElement(
        'section',
        { className: 'frameCard frameCard--panel' },
        React.createElement('h3', null, surface.rewardsCard.title),
        React.createElement('p', null, surface.rewardsCard.autoRepeat.value),
        React.createElement('ul', null, ...surface.rewardsCard.commonMaterials.items.map((entry) => React.createElement('li', { key: entry.id }, entry.label))),
      ),
      React.createElement(
        'section',
        { className: 'frameCard frameCard--panel' },
        React.createElement('h3', null, surface.grindSummary.title),
        React.createElement('p', null, surface.grindSummary.scopeChipLabel),
        React.createElement(
          'ul',
          null,
          React.createElement('li', null, `Runs: ${surface.grindSummary.runsText}`),
          React.createElement('li', null, `Gold/hr: ${surface.grindSummary.goldPerHourText}`),
          React.createElement('li', null, `Drop: ${surface.grindSummary.mainDropLabel}`),
        ),
      ),
    ),
  );
}
