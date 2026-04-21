import React from 'react';
import type { OutskirtsTopRibbon } from '../types.js';

export interface OutskirtsMacroRibbonProps {
  ribbon: OutskirtsTopRibbon;
}

export function OutskirtsMacroRibbon({ ribbon }: OutskirtsMacroRibbonProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsTopRegion__macroRibbon', 'data-testid': 'outskirts-macro-ribbon', 'aria-label': ribbon.ariaLabel },
    React.createElement('span', { className: 'outskirtsTopRegion__macroFlourish outskirtsTopRegion__macroFlourish--left', 'aria-hidden': 'true' }),
    React.createElement('span', { className: 'outskirtsTopRegion__macroTrack', 'aria-hidden': 'true' }),
    React.createElement(
      'ol',
      { className: 'outskirtsTopRegion__macroNodes', 'aria-hidden': 'true' },
      ...ribbon.nodes.map((node) => React.createElement('li', {
        key: node.id,
        className: `outskirtsTopRegion__macroNode outskirtsTopRegion__macroNode--${node.variant}`,
        'data-state': node.state,
      })),
    ),
    React.createElement('span', { className: 'outskirtsTopRegion__macroFlourish outskirtsTopRegion__macroFlourish--right', 'aria-hidden': 'true' }),
    React.createElement('span', { className: 'outskirtsTopRegion__macroAria', 'aria-label': ribbon.ariaLabel }),
  );
}
