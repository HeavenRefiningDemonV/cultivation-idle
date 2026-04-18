import React from 'react';
import type { OutskirtsPrimaryCtaRegion } from '../types.js';

export function OutskirtsStartHuntCta(props: { cta: OutskirtsPrimaryCtaRegion; onStartHunt?: () => void }) {
  const { cta, onStartHunt } = props;
  return React.createElement(
    'button',
    {
      type: 'button',
      className: 'outskirtsStartHuntCta',
      'data-testid': 'outskirts-start-hunt-cta',
      'aria-label': cta.ariaLabel,
      disabled: !cta.enabled,
      onClick: onStartHunt,
      title: cta.disabledReason ?? undefined,
    },
    React.createElement('span', { className: 'outskirtsStartHuntCta__label' }, cta.label),
  );
}
