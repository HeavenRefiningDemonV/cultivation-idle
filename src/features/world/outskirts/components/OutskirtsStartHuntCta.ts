import React from 'react';
import type { OutskirtsPrimaryAction } from '../types.js';

export interface OutskirtsStartHuntCtaProps {
  cta: OutskirtsPrimaryAction;
  onPrimaryAction?: () => void;
  onStartHunt?: () => void;
}

export function OutskirtsStartHuntCta({ cta, onPrimaryAction, onStartHunt }: OutskirtsStartHuntCtaProps) {
  if (!cta.visible) return null;
  const handlePrimaryAction = onPrimaryAction ?? onStartHunt;
  const intentClass = cta.intent === 'stop-hunt'
    ? 'outskirtsStartHuntCta--stopHunt'
    : 'outskirtsStartHuntCta--startHunt';

  return React.createElement(
    'button',
    {
      type: 'button',
      className: `outskirtsStartHuntCta outskirtsStartHuntCta--${cta.plaqueVariant ?? 'ornate-gold'} ${intentClass}`,
      'data-testid': 'outskirts-start-hunt-cta',
      'data-intent': cta.intent,
      disabled: !cta.enabled,
      'aria-label': cta.ariaLabel,
      title: cta.enabled ? undefined : cta.disabledReason,
      onClick: cta.enabled ? handlePrimaryAction : undefined,
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
