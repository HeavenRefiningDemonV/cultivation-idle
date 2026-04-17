import React from 'react';
import type { OutskirtsSelectorPlaqueRegion } from '../types.js';

export function OutskirtsAreaPlaque(props: { plaque: OutskirtsSelectorPlaqueRegion }) {
  return React.createElement(
    'section',
    { className: 'outskirtsExactTop__plaqueWrap', 'data-testid': 'outskirts-area-plaque', 'aria-label': 'Area plaque' },
    React.createElement('div', { className: 'outskirtsExactTop__plaque' }, props.plaque.selectorLabel),
    React.createElement('p', { className: 'outskirtsExactTop__subtitle' }, props.plaque.subtitle),
  );
}
