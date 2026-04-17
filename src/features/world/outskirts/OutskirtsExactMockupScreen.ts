import React from 'react';
import type { OutskirtsMockupSurface } from './types.js';
import { OutskirtsTopTitle } from './components/OutskirtsTopTitle.js';
import { OutskirtsMacroProgressLine } from './components/OutskirtsMacroProgressLine.js';
import { OutskirtsTacticalStrip } from './components/OutskirtsTacticalStrip.js';
import { OutskirtsAreaPlaque } from './components/OutskirtsAreaPlaque.js';

export interface OutskirtsExactMockupScreenProps {
  surface: OutskirtsMockupSurface;
}

/**
 * P3 scope: exact top-region rebuild only (A-D), with muted lower scaffolds for E-K.
 */
export function OutskirtsExactMockupScreen({ surface }: OutskirtsExactMockupScreenProps) {
  return React.createElement(
    'article',
    { className: 'outskirtsExactScreen', 'data-testid': 'outskirts-exact-screen' },
    React.createElement(
      'section',
      { className: 'outskirtsExactTop', 'data-testid': 'outskirts-exact-top-region' },
      React.createElement(OutskirtsTopTitle, { title: surface.page.title }),
      React.createElement(OutskirtsMacroProgressLine, { track: surface.macroTrack }),
      React.createElement(OutskirtsTacticalStrip, { strip: surface.tacticalStrip }),
      React.createElement(OutskirtsAreaPlaque, { plaque: surface.selectorPlaque }),
    ),
    React.createElement(
      'section',
      { className: 'outskirtsExactScaffold', 'data-testid': 'outskirts-exact-lower-scaffold', 'aria-label': 'Pending lower regions scaffold' },
      React.createElement('div', { className: 'outskirtsExactScaffold__lane outskirtsExactScaffold__lane--field', 'aria-hidden': 'true' }),
      React.createElement('div', { className: 'outskirtsExactScaffold__lane outskirtsExactScaffold__lane--cards', 'aria-hidden': 'true' }),
      React.createElement('div', { className: 'outskirtsExactScaffold__lane outskirtsExactScaffold__lane--footer', 'aria-hidden': 'true' }),
    ),
  );
}
