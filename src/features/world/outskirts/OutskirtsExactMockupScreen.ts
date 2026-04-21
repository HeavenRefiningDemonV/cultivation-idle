import React from 'react';
import { OUTSKIRTS_MOCKUP_REGION_ORDER } from './outskirtsMockupPresentation.js';
import type { OutskirtsExactSurfaceV2 } from './types.js';
import { OutskirtsTopRegion } from './components/OutskirtsTopRegion.js';
import { OutskirtsScenicStage } from './components/OutskirtsScenicStage.js';
import { OutskirtsEncounterIdentityRow } from './components/OutskirtsEncounterIdentityRow.js';
import { OutskirtsSetupCard } from './components/OutskirtsSetupCard.js';
import { OutskirtsEncounterProgressStrip } from './components/OutskirtsEncounterProgressStrip.js';
import { OutskirtsStartHuntCta } from './components/OutskirtsStartHuntCta.js';
import { OutskirtsGrindSummaryCard } from './components/OutskirtsGrindSummaryCard.js';
import { OutskirtsRewardsCard } from './components/OutskirtsRewardsCard.js';

export interface OutskirtsExactMockupScreenProps {
  surface: OutskirtsExactSurfaceV2;
  onStartHunt?: () => void;
  onOpenSettings?: () => void;
}

export function OutskirtsExactMockupScreen({ surface, onStartHunt, onOpenSettings }: OutskirtsExactMockupScreenProps) {
  return React.createElement(
    'article',
    { className: 'outskirtsExactPage', 'data-testid': 'outskirts-exact-mockup-screen' },
    React.createElement('div', { className: 'outskirtsExactPage__underlay', 'aria-hidden': 'true' }),
    React.createElement(OutskirtsTopRegion, { surface, onOpenSettings }),
    React.createElement(
      'section',
      { className: 'outskirtsExactPage__bodyCluster', 'data-testid': 'outskirts-exact-body-grid' },
      React.createElement(
        'aside',
        { className: 'outskirtsExactPage__leftRail', 'data-testid': 'outskirts-exact-left-rail-slot' },
        React.createElement(OutskirtsSetupCard, { setup: surface.setupCard }),
      ),
      React.createElement(
        'main',
        { className: 'outskirtsExactPage__centerScenic', 'data-testid': 'outskirts-exact-center-slot' },
        React.createElement(OutskirtsScenicStage, { scenic: surface.scenicStage, identity: surface.encounterIdentity }),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactPage__centerIdentity', 'data-testid': 'outskirts-exact-identity-slot' },
        React.createElement(OutskirtsEncounterIdentityRow, { identity: surface.encounterIdentity }),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactPage__centerStrip', 'data-testid': 'outskirts-exact-strip-slot' },
        React.createElement(OutskirtsEncounterProgressStrip, { strip: surface.encounterStrip }),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactPage__centerCta', 'data-testid': 'outskirts-exact-cta-slot' },
        React.createElement(OutskirtsStartHuntCta, { cta: surface.primaryAction, onStartHunt }),
      ),
      React.createElement(
        'aside',
        { className: 'outskirtsExactPage__rightRail', 'data-testid': 'outskirts-exact-right-rail-slot' },
        React.createElement(OutskirtsRewardsCard, { rewards: surface.rewardsCard }),
      ),
      React.createElement(
        'aside',
        { className: 'outskirtsExactPage__summaryDock', 'data-testid': 'outskirts-exact-summary-dock-slot' },
        React.createElement(OutskirtsGrindSummaryCard, { summary: surface.grindSummary }),
      ),
    ),
    React.createElement('aside', { 'data-testid': 'outskirts-exact-shell-flags', hidden: true }, JSON.stringify(surface.shell)),
    React.createElement('aside', { 'data-testid': 'outskirts-exact-region-order', hidden: true }, OUTSKIRTS_MOCKUP_REGION_ORDER.join('|')),
  );
}
