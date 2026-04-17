import React from 'react';
import type { OutskirtsMacroTrackRegion } from '../types.js';

export function OutskirtsMacroProgressLine(props: { track: OutskirtsMacroTrackRegion }) {
  return React.createElement(
    'section',
    { className: 'outskirtsExactTop__macro', 'data-testid': 'outskirts-macro-line', 'aria-label': 'Macro progression line' },
    React.createElement(
      'ol',
      { className: 'outskirtsExactTop__macroList' },
      ...props.track.nodes.map((node) => React.createElement(
        'li',
        {
          key: node.id,
          className: `outskirtsExactTop__macroNode outskirtsExactTop__macroNode--${node.state}`,
          'data-current': node.id === props.track.currentNodeId ? '1' : '0',
        },
        React.createElement('span', { className: 'outskirtsExactTop__macroDot', 'aria-hidden': 'true' }),
        React.createElement('span', { className: 'outskirtsExactTop__macroLabel' }, node.label),
      )),
    ),
  );
}
