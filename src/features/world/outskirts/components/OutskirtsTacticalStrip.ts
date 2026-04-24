import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { OutskirtsTacticalStrip as OutskirtsTacticalStripModel } from '../types.js';
import { OUTSKIRTS_ASSETS } from '../outskirtsAssetRegistry.js';

const ICON_MAP = OUTSKIRTS_ASSETS.icons.tactical;

export interface OutskirtsTacticalStripProps {
  strip: OutskirtsTacticalStripModel;
  onOpenCell?: (cellId: OutskirtsTacticalStripModel['cells'][number]['id']) => void;
}

export function OutskirtsTacticalStrip({ strip, onOpenCell }: OutskirtsTacticalStripProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsTopRegion__tacticalStrip', 'data-testid': 'outskirts-tactical-strip', 'aria-label': strip.ariaLabel },
    ...strip.cells.map((cell) => React.createElement(
      'button',
      {
        key: cell.id,
        type: 'button',
        className: 'outskirtsTopRegion__tacticalCell',
        'data-testid': `outskirts-tactical-cell-${cell.id}`,
        'data-tone': cell.tone,
        onClick: onOpenCell ? () => onOpenCell(cell.id) : undefined,
        disabled: !onOpenCell || (!cell.showCaret && cell.id !== 'bounty' && cell.id !== 'expedition'),
        'aria-label': `${cell.label}: ${cell.primaryText}`,
      },
      React.createElement(
        'span',
        { className: 'outskirtsTopRegion__tacticalIconDock', 'aria-hidden': 'true' },
        React.createElement('img', { src: ICON_MAP[cell.id], alt: '', className: 'outskirtsTopRegion__tacticalIcon' }),
      ),
      React.createElement(
        'div',
        { className: 'outskirtsTopRegion__tacticalText' },
        React.createElement('span', { className: 'outskirtsTopRegion__tacticalLabel' }, cell.label),
        React.createElement(
          'span',
          { className: 'outskirtsTopRegion__tacticalPrimary' },
          cell.primaryText,
          cell.secondaryText ? React.createElement('em', { className: 'outskirtsTopRegion__tacticalSecondary' }, cell.secondaryText) : null,
        ),
        cell.showUnderlineBar
          ? React.createElement(
            'span',
            { className: 'outskirtsTopRegion__tacticalUnderlineTrack', 'aria-hidden': 'true' },
            React.createElement('span', { className: 'outskirtsTopRegion__tacticalUnderlineFill', style: { width: `${cell.underlineBarPct ?? 0}%` } }),
          )
          : null,
      ),
      React.createElement('span', { className: 'outskirtsTopRegion__tacticalAdornment' },
        cell.showCaret ? React.createElement(ChevronDown, { size: 14, strokeWidth: 2, 'aria-hidden': 'true' }) : null,
      ),
      React.createElement('span', { className: 'outskirtsTopRegion__tacticalDotDock', 'aria-hidden': 'true' }, cell.showNotificationDot ? React.createElement('span', { className: 'outskirtsTopRegion__tacticalDot' }) : null),
    )),
  );
}
