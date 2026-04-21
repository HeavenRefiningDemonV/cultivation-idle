import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { OutskirtsAreaHeader } from '../types.js';

export interface OutskirtsAreaPlaqueProps {
  areaHeader: OutskirtsAreaHeader;
}

export function OutskirtsAreaPlaque({ areaHeader }: OutskirtsAreaPlaqueProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsTopRegion__plaqueCluster', 'data-testid': 'outskirts-exact-plaque-cluster' },
    React.createElement(
      'div',
      { className: 'outskirtsTopRegion__areaPlaque', 'data-testid': 'outskirts-area-plaque' },
      React.createElement('span', { className: 'outskirtsTopRegion__plaqueLabel' }, areaHeader.plaqueLabel),
      areaHeader.showDropdownCaret ? React.createElement('span', { className: 'outskirtsTopRegion__plaqueCaret', 'aria-hidden': 'true' }, React.createElement(ChevronDown, { size: 16, strokeWidth: 2.2 })) : null,
    ),
    React.createElement('p', { className: 'outskirtsTopRegion__subtitle', 'data-testid': 'outskirts-page-subtitle' }, areaHeader.subtitle),
  );
}
