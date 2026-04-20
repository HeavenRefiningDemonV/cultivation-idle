import React from 'react';
import { OUTSKIRTS_MOCKUP_REGION_ORDER } from './outskirtsMockupPresentation.js';
import type { OutskirtsMockupSurface } from './types.js';
import { OutskirtsScenicStage } from './components/OutskirtsScenicStage.js';
import { OutskirtsEncounterIdentityRow } from './components/OutskirtsEncounterIdentityRow.js';
import { OutskirtsSetupCard } from './components/OutskirtsSetupCard.js';
import { OutskirtsEncounterProgressStrip } from './components/OutskirtsEncounterProgressStrip.js';
import { OutskirtsStartHuntCta } from './components/OutskirtsStartHuntCta.js';
import { OutskirtsGrindSummaryCard } from './components/OutskirtsGrindSummaryCard.js';
import { OutskirtsRewardsCard } from './components/OutskirtsRewardsCard.js';

export interface OutskirtsExactMockupScreenProps {
  surface: OutskirtsMockupSurface;
  onStartHunt?: () => void;
}

export function OutskirtsExactMockupScreen({ surface, onStartHunt }: OutskirtsExactMockupScreenProps) {
  return React.createElement(
    'article',
    { className: 'outskirtsExactPage', 'data-testid': 'outskirts-exact-mockup-screen' },
    React.createElement('div', { className: 'outskirtsExactPage__underlay', 'aria-hidden': 'true' }),
    React.createElement(
      'header',
      { className: 'outskirtsExactPage__topCluster', 'data-testid': 'outskirts-exact-top-cluster' },
      React.createElement(
        'div',
        { className: 'outskirtsExactPage__titleRow', 'data-testid': 'outskirts-exact-title-row' },
        React.createElement('h1', { 'data-testid': 'outskirts-exact-page-title' }, surface.header.pageTitle),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactPage__macroRow', 'data-testid': 'outskirts-exact-top-progress', 'aria-label': surface.topProgress.label },
        React.createElement('div', { className: 'outskirtsExactPage__macroLine', 'aria-hidden': 'true' }),
        React.createElement(
          'ol',
          { className: 'outskirtsExactPage__macroNodes', 'aria-hidden': 'true' },
          ...surface.topProgress.nodes.map((node, index) => {
            const active = index === surface.topProgress.currentIndex;
            return React.createElement('li', {
              key: node.id,
              'data-testid': 'outskirts-exact-macro-node',
              className: `outskirtsExactPage__macroNode outskirtsExactPage__macroNode--${active ? 'active' : 'inactive'}`,
              'data-state': node.state,
            });
          }),
        ),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactPage__tacticalRow', 'data-testid': 'outskirts-exact-tactical-strip', 'aria-label': surface.tacticalStrip.label },
        ...surface.tacticalStrip.cells.map((cell) => React.createElement(
          'div',
          {
            key: cell.id,
            className: 'outskirtsExactPage__tacticalCell',
            'data-testid': 'outskirts-exact-tactical-cell',
            'data-tone': cell.tone,
            'data-visible': cell.visible ? '1' : '0',
          },
          React.createElement('span', { className: 'outskirtsExactPage__tacticalIcon', 'aria-hidden': 'true' }, '◦'),
          React.createElement('span', { className: 'outskirtsExactPage__tacticalLabel' }, cell.label),
          React.createElement('span', { className: 'outskirtsExactPage__tacticalValue' }, cell.value),
        )),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactPage__plaqueCluster', 'data-testid': 'outskirts-exact-area-region' },
        React.createElement('div', { className: 'outskirtsExactPage__areaPlaque', 'data-testid': 'outskirts-exact-area-plaque' }, surface.header.areaPlaqueLabel),
        React.createElement('p', { className: 'outskirtsExactPage__subtitle', 'data-testid': 'outskirts-exact-subtitle' }, surface.header.subtitle),
      ),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsExactPage__bodyCluster', 'data-testid': 'outskirts-exact-body-cluster' },
      React.createElement(
        'aside',
        { className: 'outskirtsExactPage__leftRail', 'data-testid': 'outskirts-exact-left-rail' },
        React.createElement(OutskirtsSetupCard, { setup: surface.setupCard }),
      ),
      React.createElement(
        'main',
        { className: 'outskirtsExactPage__centerColumn', 'data-testid': 'outskirts-exact-center-column' },
        React.createElement('div', { className: 'outskirtsExactPage__centerScenic' }, React.createElement(OutskirtsScenicStage, { encounter: surface.encounterHero })),
        React.createElement('div', { className: 'outskirtsExactPage__centerIdentity' }, React.createElement(OutskirtsEncounterIdentityRow, { encounter: surface.encounterHero })),
        React.createElement('div', { className: 'outskirtsExactPage__centerStrip' }, React.createElement(OutskirtsEncounterProgressStrip, { strip: surface.encounterProgressStrip })),
        React.createElement('div', { className: 'outskirtsExactPage__centerCta' }, React.createElement(OutskirtsStartHuntCta, { cta: surface.primaryCta, onStartHunt })),
      ),
      React.createElement(
        'aside',
        { className: 'outskirtsExactPage__rightRail', 'data-testid': 'outskirts-exact-right-rail' },
        React.createElement(OutskirtsRewardsCard, { rewards: surface.rewardsCard }),
      ),
      React.createElement(
        'aside',
        { className: 'outskirtsExactPage__summaryDock', 'data-testid': 'outskirts-exact-summary-dock' },
        React.createElement(OutskirtsGrindSummaryCard, { summary: surface.grindSummary }),
      ),
    ),
    React.createElement('aside', { 'data-testid': 'outskirts-exact-shell-flags', hidden: true }, JSON.stringify(surface.shell)),
    React.createElement('aside', { 'data-testid': 'outskirts-exact-region-order', hidden: true }, OUTSKIRTS_MOCKUP_REGION_ORDER.join('|')),
  );
}
