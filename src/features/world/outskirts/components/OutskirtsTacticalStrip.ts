import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { OutskirtsTacticalStrip as OutskirtsTacticalStripModel } from '../types.js';

const ICON_MAP = {
  hp: '/assets/icons/foundationpill.png',
  danger: '/assets/icons/dust_green.png',
  loadout: '/assets/icons/rustysword.png',
  aiProfile: '/assets/icons/book_martial.png',
  healing: '/assets/icons/hourglass_progress.png',
  bounty: '/assets/menus/scroll.png',
  expedition: '/assets/icons/task_complete.png',
} as const;

export interface OutskirtsTacticalStripProps {
  strip: OutskirtsTacticalStripModel;
}

export function OutskirtsTacticalStrip({ strip }: OutskirtsTacticalStripProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsTopRegion__tacticalStrip', 'data-testid': 'outskirts-tactical-strip', 'aria-label': strip.ariaLabel },
    ...strip.cells.map((cell) => React.createElement(
      'div',
      {
        key: cell.id,
        className: 'outskirtsTopRegion__tacticalCell',
        'data-testid': `outskirts-tactical-cell-${cell.id}`,
        'data-tone': cell.tone,
      },
      React.createElement(
        'span',
        { className: 'outskirtsTopRegion__tacticalIconDock', 'aria-hidden': 'true' },
        React.createElement('img', { src: ICON_MAP[cell.id], alt: '', className: 'outskirtsTopRegion__tacticalIcon', loading: 'lazy' }),
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
