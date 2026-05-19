import React from 'react';
import { CheckCircle2, RotateCw, ShieldX } from 'lucide-react';

import type { OutskirtsCombatResultTransition } from '../types.js';

export interface OutskirtsCombatResultOverlayProps {
  transition: OutskirtsCombatResultTransition;
}

export function OutskirtsCombatResultOverlay({ transition }: OutskirtsCombatResultOverlayProps) {
  if (!transition.visible) return null;

  const showSecondaryStatusGlyph = transition.kind === 'victory-auto-repeat' || transition.kind === 'defeat-retry';
  const mainIcon = transition.outcome === 'defeat'
    ? React.createElement(ShieldX, { 'aria-hidden': 'true' })
    : React.createElement(CheckCircle2, { 'aria-hidden': 'true' });

  return React.createElement(
    'div',
    {
      className: `outskirtsCombatResultOverlay outskirtsCombatResultOverlay--${transition.kind}`,
      'data-testid': 'outskirts-combat-result-overlay',
      'data-result-kind': transition.kind,
      'data-result-outcome': transition.outcome,
      'data-result-tone': transition.tone,
      'data-auto-repeat-state': transition.autoRepeatState,
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
      'aria-label': `${transition.title}. ${transition.subtitle}. ${transition.detailLine}. ${transition.countdownLabel}`,
      style: {
        '--outskirts-result-progress': `${transition.progressPct}%`,
        '--outskirts-result-duration-ms': `${transition.durationMs}ms`,
      } as React.CSSProperties,
    },
    React.createElement('span', { className: 'outskirtsCombatResultOverlay__aura', 'aria-hidden': 'true' }),
    React.createElement(
      'div',
      {
        className: 'outskirtsCombatResultOverlay__plaque',
        'data-testid': 'outskirts-combat-result-plaque',
      },
      React.createElement(
        'span',
        {
          className: 'outskirtsCombatResultOverlay__seal',
          'data-testid': 'outskirts-combat-result-seal',
          'aria-hidden': 'true',
        },
        mainIcon,
      ),
      React.createElement(
        'span',
        { className: 'outskirtsCombatResultOverlay__copy' },
        React.createElement(
          'strong',
          {
            className: 'outskirtsCombatResultOverlay__title',
            'data-testid': 'outskirts-combat-result-title',
          },
          transition.title,
        ),
        React.createElement(
          'span',
          {
            className: 'outskirtsCombatResultOverlay__subtitle',
            'data-testid': 'outskirts-combat-result-subtitle',
          },
          transition.subtitle,
        ),
        React.createElement(
          'span',
          {
            className: 'outskirtsCombatResultOverlay__detail',
            'data-testid': 'outskirts-combat-result-detail',
          },
          transition.detailLine,
        ),
        React.createElement(
          'span',
          {
            className: 'outskirtsCombatResultOverlay__countdown',
            'data-testid': 'outskirts-combat-result-countdown',
          },
          showSecondaryStatusGlyph ? React.createElement(RotateCw, { 'aria-hidden': 'true' }) : null,
          transition.countdownLabel,
        ),
        React.createElement(
          'span',
          {
            className: 'outskirtsCombatResultOverlay__thread',
            'aria-hidden': 'true',
          },
          React.createElement('span', { className: 'outskirtsCombatResultOverlay__threadFill' }),
        ),
      ),
    ),
  );
}
