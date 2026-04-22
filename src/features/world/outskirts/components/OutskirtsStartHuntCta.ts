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
      className: `outskirtsStartHuntCta outskirtsStartHuntCta--${cta.plaqueVariant ?? 'ornate-gold'}`,
      'data-testid': 'outskirts-start-hunt-cta',
      disabled: !cta.enabled,
      'aria-label': cta.ariaLabel,
      title: cta.enabled ? undefined : cta.disabledReason,
      onClick: cta.enabled ? onStartHunt : undefined,
    },
    React.createElement('span', { className: `outskirtsStartHuntCta__ornament outskirtsStartHuntCta__ornament--left outskirtsStartHuntCta__ornament--${cta.ornamentVariant ?? 'leaf-cap'}`, 'aria-hidden': 'true' }),
    React.createElement(
      'span',
      { className: 'outskirtsStartHuntCta__plate' },
      React.createElement('span', { className: 'outskirtsStartHuntCta__label', 'data-testid': 'outskirts-start-hunt-cta-label' }, cta.label),
    ),
    React.createElement('span', { className: `outskirtsStartHuntCta__ornament outskirtsStartHuntCta__ornament--right outskirtsStartHuntCta__ornament--${cta.ornamentVariant ?? 'leaf-cap'}`, 'aria-hidden': 'true' }),
  );
}
