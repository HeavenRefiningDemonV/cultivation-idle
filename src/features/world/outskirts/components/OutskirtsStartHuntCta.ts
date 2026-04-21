import React from 'react';
import type { OutskirtsPrimaryAction } from '../types.js';

export interface OutskirtsStartHuntCtaProps {
  cta: OutskirtsPrimaryAction;
  onStartHunt?: () => void;
}

export function OutskirtsStartHuntCta({ cta, onStartHunt }: OutskirtsStartHuntCtaProps) {
  if (!cta.visible) return null;

  return React.createElement(
    'button',
    {
      type: 'button',
      className: 'outskirtsStartHuntCta',
      'data-testid': 'outskirts-start-hunt-cta',
      disabled: !cta.enabled,
      'aria-label': cta.ariaLabel,
      title: cta.enabled ? undefined : cta.disabledReason,
      onClick: cta.enabled ? onStartHunt : undefined,
    },
    React.createElement('span', { className: 'outskirtsStartHuntCta__label' }, cta.label),
  );
}
