import React from 'react';
import type { RuinsPrimaryActionSurface } from '../types.js';

export function RuinsPrimaryCta({ action, onPrimaryAction }: { action: RuinsPrimaryActionSurface; onPrimaryAction?: () => void }) {
  if (!action.visible) return null;
  return React.createElement('button', { type: 'button', className: `ruinsPrimaryCta ruinsPrimaryCta--${action.plaqueVariant}`, 'data-testid': 'ruins-primary-cta', 'data-intent': action.intent, disabled: !action.enabled, 'aria-label': action.ariaLabel, title: action.enabled ? undefined : action.disabledReason, onClick: action.enabled ? onPrimaryAction : undefined },
    React.createElement('span', { className: 'ruinsPrimaryCta__ornament ruinsPrimaryCta__ornament--left', 'aria-hidden': 'true' }),
    React.createElement('span', { className: 'ruinsPrimaryCta__plate' }, React.createElement('span', { className: 'ruinsPrimaryCta__label', 'data-testid': 'ruins-primary-cta-label' }, action.label)),
    React.createElement('span', { className: 'ruinsPrimaryCta__ornament ruinsPrimaryCta__ornament--right', 'aria-hidden': 'true' }),
  );
}
