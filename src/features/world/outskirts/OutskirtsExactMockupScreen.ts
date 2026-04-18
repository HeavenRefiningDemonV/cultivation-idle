import React from 'react';
import { OUTSKIRTS_MOCKUP_REGION_ORDER } from './outskirtsMockupPresentation.js';
import type { OutskirtsMockupSurface } from './types.js';
import { OutskirtsScenicStage } from './components/OutskirtsScenicStage.js';
import { OutskirtsEncounterIdentityRow } from './components/OutskirtsEncounterIdentityRow.js';
import { OutskirtsSetupCard } from './components/OutskirtsSetupCard.js';

export interface OutskirtsExactMockupScreenProps {
  surface: OutskirtsMockupSurface;
}

export function OutskirtsExactMockupScreen({ surface }: OutskirtsExactMockupScreenProps) {
  return React.createElement(
    'article',
    { className: 'outskirtsExactMockup', 'data-testid': 'outskirts-exact-mockup-screen' },
    React.createElement(
      'header',
      { className: 'outskirtsExactMockup__titleRow', 'data-testid': 'outskirts-exact-title-row' },
      React.createElement('h1', { 'data-testid': 'outskirts-exact-page-title' }, surface.header.pageTitle),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsExactMockup__macroProgress', 'data-testid': 'outskirts-exact-top-progress', 'aria-label': surface.topProgress.label },
      React.createElement('div', { className: 'outskirtsExactMockup__macroLine', 'aria-hidden': 'true' }),
      React.createElement(
        'ol',
        { className: 'outskirtsExactMockup__macroNodes', 'aria-hidden': 'true' },
        ...surface.topProgress.nodes.map((node, index) => {
          const active = index === surface.topProgress.currentIndex;
          return React.createElement('li', {
            key: node.id,
            'data-testid': 'outskirts-exact-macro-node',
            className: `outskirtsExactMockup__macroNode outskirtsExactMockup__macroNode--${active ? 'active' : 'inactive'}`,
            'data-state': node.state,
          });
        }),
      ),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsExactMockup__tacticalStrip', 'data-testid': 'outskirts-exact-tactical-strip', 'aria-label': surface.tacticalStrip.label },
      ...surface.tacticalStrip.cells.map((cell) => React.createElement(
        'div',
        {
          key: cell.id,
          className: 'outskirtsExactMockup__tacticalCell',
          'data-testid': 'outskirts-exact-tactical-cell',
          'data-tone': cell.tone,
          'data-visible': cell.visible ? '1' : '0',
        },
        React.createElement('span', { className: 'outskirtsExactMockup__tacticalIcon', 'aria-hidden': 'true' }, '◦'),
        React.createElement('span', { className: 'outskirtsExactMockup__tacticalLabel' }, cell.label),
        React.createElement('span', { className: 'outskirtsExactMockup__tacticalValue' }, cell.value),
      )),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsExactMockup__area', 'data-testid': 'outskirts-exact-area-region' },
      React.createElement('div', { className: 'outskirtsExactMockup__areaPlaque', 'data-testid': 'outskirts-exact-area-plaque' }, surface.header.areaPlaqueLabel),
      React.createElement('p', { className: 'outskirtsExactMockup__subtitle', 'data-testid': 'outskirts-exact-subtitle' }, surface.header.subtitle),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsExactMockup__futureScaffold', 'data-testid': 'outskirts-exact-future-scaffold' },
      React.createElement(
        'div',
        { className: 'outskirtsExactMockup__slot outskirtsExactMockup__slot--setup', 'data-testid': 'outskirts-exact-setup-slot' },
        React.createElement(OutskirtsSetupCard, { setup: surface.setupCard }),
      ),
      React.createElement(
        'div',
        { className: 'outskirtsExactMockup__slot outskirtsExactMockup__slot--scenic', 'data-testid': 'outskirts-exact-scenic-slot' },
        React.createElement(OutskirtsScenicStage, { encounter: surface.encounterHero }),
      ),
      React.createElement('div', { className: 'outskirtsExactMockup__slot outskirtsExactMockup__slot--rewards', 'data-testid': 'outskirts-exact-rewards-slot', 'aria-hidden': 'true' }),
      React.createElement(
        'div',
        { className: 'outskirtsExactMockup__slot outskirtsExactMockup__slot--encounterIdentity', 'data-testid': 'outskirts-exact-encounter-identity-slot' },
        React.createElement(OutskirtsEncounterIdentityRow, { encounter: surface.encounterHero }),
      ),
      React.createElement('div', { className: 'outskirtsExactMockup__slot outskirtsExactMockup__slot--encounterStrip', 'data-testid': 'outskirts-exact-encounter-strip-slot', 'aria-hidden': 'true' }),
      React.createElement('div', { className: 'outskirtsExactMockup__slot outskirtsExactMockup__slot--cta', 'data-testid': 'outskirts-exact-cta-slot', 'aria-hidden': 'true' }),
      React.createElement('div', { className: 'outskirtsExactMockup__slot outskirtsExactMockup__slot--grindSummary', 'data-testid': 'outskirts-exact-grind-summary-slot', 'aria-hidden': 'true' }),
    ),
    React.createElement('aside', { 'data-testid': 'outskirts-exact-shell-flags', hidden: true }, JSON.stringify(surface.shell)),
    React.createElement('aside', { 'data-testid': 'outskirts-exact-region-order', hidden: true }, OUTSKIRTS_MOCKUP_REGION_ORDER.join('|')),
  );
}
