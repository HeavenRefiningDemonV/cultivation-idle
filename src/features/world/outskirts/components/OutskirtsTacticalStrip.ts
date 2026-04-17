import React from 'react';
import type { OutskirtsTacticalStripRegion } from '../types.js';

export function OutskirtsTacticalStrip(props: { strip: OutskirtsTacticalStripRegion }) {
  return React.createElement(
    'section',
    { className: 'outskirtsExactTop__tactical', 'data-testid': 'outskirts-tactical-strip', 'aria-label': 'Tactical strip' },
    React.createElement(
      'ul',
      { className: 'outskirtsExactTop__tacticalList' },
      ...props.strip.cells.map((cell) => React.createElement(
        'li',
        { key: cell.id, className: 'outskirtsExactTop__tacticalCell', 'data-cell-id': cell.id },
        React.createElement('span', { className: 'outskirtsExactTop__tacticalLabel' }, cell.label),
        React.createElement('span', { className: 'outskirtsExactTop__tacticalValue', title: cell.value.text }, cell.value.text),
      )),
    ),
  );
}
