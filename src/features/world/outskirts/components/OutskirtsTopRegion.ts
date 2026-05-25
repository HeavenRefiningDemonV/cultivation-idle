import React from 'react';
import { Settings } from 'lucide-react';
import type { OutskirtsExactSurfaceV2 } from '../types.js';
import { OutskirtsMacroRibbon } from './OutskirtsMacroRibbon.js';
import { OutskirtsTacticalStrip } from './OutskirtsTacticalStrip.js';
import { OutskirtsAreaPlaque } from './OutskirtsAreaPlaque.js';

export interface OutskirtsTopRegionProps {
  surface: OutskirtsExactSurfaceV2;
  onOpenSettings?: () => void;
  onOpenTacticalCell?: (cellId: OutskirtsExactSurfaceV2['tacticalStrip']['cells'][number]['id']) => void;
  onOpenAreaSelector?: () => void;
}

export function OutskirtsTopRegion({ surface, onOpenSettings, onOpenTacticalCell, onOpenAreaSelector }: OutskirtsTopRegionProps) {
  return React.createElement(
    'header',
    { className: 'outskirtsTopRegion', 'data-testid': 'outskirts-exact-top-region', 'data-legacy-testid': 'outskirts-top-region' },
    React.createElement(
      'section',
      { className: 'outskirtsTopRegion__topBand' },
      React.createElement(OutskirtsMacroRibbon, { ribbon: surface.topRibbon }),
      React.createElement(
        'button',
        {
          type: 'button',
          className: 'outskirtsTopRegion__settingsButton',
          'data-testid': 'outskirts-settings-gear',
          'aria-label': 'Open settings',
          onClick: () => onOpenSettings?.(),
        },
        React.createElement('span', { className: 'outskirtsTopRegion__settingsButtonInner', 'aria-hidden': 'true' }, React.createElement(Settings, { size: 15, strokeWidth: 1.9 })),
      ),
    ),
    React.createElement(OutskirtsTacticalStrip, { strip: surface.tacticalStrip, onOpenCell: onOpenTacticalCell }),
    React.createElement(OutskirtsAreaPlaque, { areaHeader: surface.areaHeader, onOpenAreaSelector }),
  );
}
