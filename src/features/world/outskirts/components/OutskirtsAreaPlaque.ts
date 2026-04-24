import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { OutskirtsAreaHeader } from '../types.js';

export interface OutskirtsAreaPlaqueProps {
  areaHeader: OutskirtsAreaHeader;
  onOpenAreaSelector?: () => void;
}

export function OutskirtsAreaPlaque({ areaHeader, onOpenAreaSelector }: OutskirtsAreaPlaqueProps) {
  const isInteractive = areaHeader.hasGroundedSelector === true && Boolean(onOpenAreaSelector);
  return React.createElement(
    'section',
    { className: 'outskirtsTopRegion__plaqueCluster', 'data-testid': 'outskirts-exact-plaque-cluster' },
    React.createElement(
      isInteractive ? 'button' : 'div',
      {
        type: isInteractive ? 'button' : undefined,
        className: 'outskirtsTopRegion__areaPlaque',
        'data-testid': 'outskirts-area-plaque',
        'aria-disabled': areaHeader.hasGroundedSelector === false ? 'true' : undefined,
        onClick: isInteractive ? onOpenAreaSelector : undefined,
        'aria-label': isInteractive ? 'Open area selector' : undefined,
      },
      React.createElement('span', { className: 'outskirtsTopRegion__plaqueLabel' }, areaHeader.plaqueLabel),
      areaHeader.showDropdownCaret ? React.createElement('span', { className: 'outskirtsTopRegion__plaqueCaret', 'aria-hidden': 'true' }, React.createElement(ChevronDown, { size: 16, strokeWidth: 2.2 })) : null,
    ),
    React.createElement('p', { className: 'outskirtsTopRegion__subtitle', 'data-testid': 'outskirts-page-subtitle' }, areaHeader.subtitle),
  );
}
