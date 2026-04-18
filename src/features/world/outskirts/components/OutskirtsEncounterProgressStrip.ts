import React from 'react';
import type { OutskirtsEncounterProgressStripRegion } from '../types.js';

export function OutskirtsEncounterProgressStrip(props: { strip: OutskirtsEncounterProgressStripRegion }) {
  const { strip } = props;

  return React.createElement(
    'section',
    {
      className: 'outskirtsEncounterProgressStrip',
      'data-testid': 'outskirts-encounter-progress-strip',
      'aria-label': 'Encounter progression strip',
    },
    React.createElement(
      'button',
      {
        type: 'button',
        className: 'outskirtsEncounterProgressStrip__arrow',
        'data-testid': 'outskirts-encounter-progress-left-arrow',
        'aria-label': strip.leftArrow.ariaLabel,
        disabled: !strip.leftArrow.enabled,
      },
      '←',
    ),
    React.createElement(
      'ol',
      { className: 'outskirtsEncounterProgressStrip__nodes' },
      ...strip.nodes.map((node) => React.createElement(
        'li',
        {
          key: node.id,
          className: `outskirtsEncounterProgressStrip__node outskirtsEncounterProgressStrip__node--${node.state}`,
          'data-node-state': node.state,
          'data-selected': node.isSelected ? '1' : '0',
          'aria-label': node.ariaLabel,
        },
        React.createElement('span', { className: 'outskirtsEncounterProgressStrip__nodeArt', 'aria-hidden': 'true' }),
        React.createElement('span', { className: 'outskirtsEncounterProgressStrip__nodeLabel' }, node.label),
        React.createElement('span', { className: 'outskirtsEncounterProgressStrip__nodeLevel' }, node.displayLevelText ?? ' '),
      )),
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        className: 'outskirtsEncounterProgressStrip__arrow',
        'data-testid': 'outskirts-encounter-progress-right-arrow',
        'aria-label': strip.rightArrow.ariaLabel,
        disabled: !strip.rightArrow.enabled,
      },
      '→',
    ),
  );
}
