import React from 'react';
import type { OutskirtsEncounterStrip } from '../types.js';

export interface OutskirtsEncounterProgressStripProps {
  strip: OutskirtsEncounterStrip;
}

export function OutskirtsEncounterProgressStrip({ strip }: OutskirtsEncounterProgressStripProps) {
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
        className: 'outskirtsEncounterProgressStrip__arrow outskirtsEncounterProgressStrip__arrow--left',
        'data-testid': 'outskirts-encounter-progress-left-arrow',
        disabled: !strip.leftArrow.enabled,
        'aria-label': strip.leftArrow.ariaLabel,
        'aria-hidden': strip.leftArrow.visible ? undefined : 'true',
      },
      '‹',
    ),
    React.createElement(
      'ol',
      { className: 'outskirtsEncounterProgressStrip__nodes', 'aria-hidden': 'false' },
      ...strip.nodes.map((node) => React.createElement(
        'li',
        {
          key: node.id,
          className: `outskirtsEncounterProgressStrip__node outskirtsEncounterProgressStrip__node--${node.state}${node.isSelected ? ' outskirtsEncounterProgressStrip__node--selected' : ''}`,
          'data-testid': `outskirts-encounter-progress-node-${node.id}`,
          'data-state': node.state,
          'data-selected': node.isSelected ? '1' : '0',
        },
        React.createElement('div', { className: 'outskirtsEncounterProgressStrip__thumb', 'data-testid': 'outskirts-encounter-progress-node-thumb' }),
        React.createElement(
          'div',
          { className: 'outskirtsEncounterProgressStrip__text' },
          React.createElement('span', { className: 'outskirtsEncounterProgressStrip__label' }, node.label),
          React.createElement(
            'span',
            { className: 'outskirtsEncounterProgressStrip__level' },
            node.levelLabel,
          ),
        ),
      )),
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        className: 'outskirtsEncounterProgressStrip__arrow outskirtsEncounterProgressStrip__arrow--right',
        'data-testid': 'outskirts-encounter-progress-right-arrow',
        disabled: !strip.rightArrow.enabled,
        'aria-label': strip.rightArrow.ariaLabel,
        'aria-hidden': strip.rightArrow.visible ? undefined : 'true',
      },
      '›',
    ),
  );
}
