import React from 'react';
import { Bot, ChevronDown, FlaskConical, Heart, Mountain, ScrollText, Settings, ShieldAlert, Swords } from 'lucide-react';
import { OUTSKIRTS_MOCKUP_REGION_ORDER } from './outskirtsMockupPresentation.js';
import type { OutskirtsExactSurfaceV2 } from './types.js';
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

const ICON_MAP = {
  hp: Heart,
  danger: ShieldAlert,
  loadout: Swords,
  aiProfile: Bot,
  healing: FlaskConical,
  bounty: ScrollText,
  expedition: Mountain,
} as const;

export function OutskirtsExactMockupScreen({ surface, onStartHunt, onOpenSettings }: OutskirtsExactMockupScreenProps) {
  return React.createElement(
    'article',
    { className: 'outskirtsExactPage', 'data-testid': 'outskirts-exact-mockup-screen' },
    React.createElement('div', { className: 'outskirtsExactPage__underlay', 'aria-hidden': 'true' }),
    React.createElement(
      'header',
      { className: 'outskirtsExactPage__topCluster', 'data-testid': 'outskirts-exact-top-cluster' },
      React.createElement(
        'section',
        { className: 'outskirtsExactPage__topBand', 'data-testid': 'outskirts-exact-top-band' },
        React.createElement(
          'div',
          { className: 'outskirtsExactPage__titleAnchor', 'data-testid': 'outskirts-exact-title-row' },
          React.createElement('h1', { 'data-testid': 'outskirts-exact-page-title' }, surface.page.title),
        ),
        React.createElement(
          'section',
          { className: 'outskirtsExactPage__macroRow', 'data-testid': 'outskirts-exact-top-progress', 'aria-label': surface.topRibbon.ariaLabel },
          React.createElement('span', { className: 'outskirtsExactPage__macroLeftOrnament', 'aria-hidden': 'true' }),
          React.createElement('div', { className: 'outskirtsExactPage__macroLine', 'aria-hidden': 'true' }),
          React.createElement(
            'ol',
            { className: 'outskirtsExactPage__macroNodes', 'aria-hidden': 'true' },
            ...surface.topRibbon.nodes.map((node) => React.createElement('li', {
              key: node.id,
              'data-testid': 'outskirts-exact-macro-node',
              className: `outskirtsExactPage__macroNode outskirtsExactPage__macroNode--${node.variant}`,
              'data-state': node.state,
            })),
          ),
          React.createElement('span', { className: 'outskirtsExactPage__macroTerminalCap', 'aria-hidden': 'true' }),
          React.createElement('span', { className: 'outskirtsExactPage__macroAria', 'aria-label': `${surface.topRibbon.ariaLabel}` }),
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'outskirtsExactPage__settingsButton',
            'data-testid': 'outskirts-exact-settings-gear',
            'aria-label': 'Open settings',
            onClick: () => onOpenSettings?.(),
          },
          React.createElement(Settings, { size: 18, strokeWidth: 1.9, 'aria-hidden': 'true' }),
        ),
      ),
      React.createElement(
        'section',
        {
          className: 'outskirtsExactPage__statusBand',
          'data-testid': 'outskirts-exact-status-band',
          'data-legacy-testid': 'outskirts-exact-tactical-strip',
          'aria-label': surface.tacticalStrip.ariaLabel,
        },
        ...surface.tacticalStrip.cells.map((cell) => React.createElement(
          'div',
          {
            key: cell.id,
            className: 'outskirtsExactPage__tacticalCell',
            'data-testid': 'outskirts-exact-tactical-cell',
            'data-tone': cell.tone,
            'data-visible': cell.visible ? '1' : '0',
          },
          React.createElement(
            'span',
            { className: 'outskirtsExactPage__tacticalIconDock', 'aria-hidden': 'true' },
            React.createElement(ICON_MAP[cell.id], { size: 18, strokeWidth: 1.75 }),
          ),
          React.createElement(
            'div',
            { className: 'outskirtsExactPage__tacticalText' },
            React.createElement('span', { className: 'outskirtsExactPage__tacticalLabel' }, cell.label),
            React.createElement(
              'span',
              { className: 'outskirtsExactPage__tacticalPrimary' },
              cell.primaryText,
              cell.secondaryText ? React.createElement('em', { className: 'outskirtsExactPage__tacticalSecondary' }, cell.secondaryText) : null,
            ),
            cell.showUnderlineBar
              ? React.createElement(
                'span',
                { className: 'outskirtsExactPage__tacticalUnderlineTrack', 'aria-hidden': 'true' },
                React.createElement('span', { className: 'outskirtsExactPage__tacticalUnderlineFill', style: { width: `${cell.underlineBarPct ?? 0}%` } }),
              )
              : null,
          ),
          cell.showCaret ? React.createElement('span', { className: 'outskirtsExactPage__tacticalCaret', 'aria-hidden': 'true' }, React.createElement(ChevronDown, { size: 14, strokeWidth: 2 })) : null,
          cell.showNotificationDot ? React.createElement('span', { className: 'outskirtsExactPage__tacticalDot', 'aria-hidden': 'true' }) : null,
        )),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactPage__plaqueCluster', 'data-testid': 'outskirts-exact-plaque-cluster', 'data-legacy-testid': 'outskirts-exact-area-region' },
        React.createElement('div', { className: 'outskirtsExactPage__areaPlaque', 'data-testid': 'outskirts-exact-area-plaque' }, surface.areaHeader.plaqueLabel),
        React.createElement('p', { className: 'outskirtsExactPage__subtitle', 'data-testid': 'outskirts-exact-subtitle' }, surface.areaHeader.subtitle),
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
        React.createElement('div', { className: 'outskirtsExactPage__centerScenic' }, React.createElement(OutskirtsScenicStage, { scenic: surface.scenicStage, identity: surface.encounterIdentity })),
        React.createElement('div', { className: 'outskirtsExactPage__centerIdentity' }, React.createElement(OutskirtsEncounterIdentityRow, { identity: surface.encounterIdentity })),
        React.createElement('div', { className: 'outskirtsExactPage__centerStrip' }, React.createElement(OutskirtsEncounterProgressStrip, { strip: surface.encounterStrip })),
        React.createElement('div', { className: 'outskirtsExactPage__centerCta' }, React.createElement(OutskirtsStartHuntCta, { cta: surface.primaryAction, onStartHunt })),
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
