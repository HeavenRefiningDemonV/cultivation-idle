import React from 'react';

import type { OutskirtsCombatStage } from '../types.js';

export interface OutskirtsCombatLogSlipProps {
  combatStage: OutskirtsCombatStage;
}

export function OutskirtsCombatLogSlip({ combatStage }: OutskirtsCombatLogSlipProps) {
  const lines = combatStage.logLines.slice(0, 3);
  if (lines.length === 0) return null;

  return React.createElement(
    'aside',
    {
      className: 'outskirtsCombatLogSlip',
      'data-testid': 'outskirts-combat-log-slip',
      'aria-label': 'Recent combat events',
      'aria-live': 'polite',
      'aria-atomic': 'false',
    },
    React.createElement(
      'ol',
      { className: 'outskirtsCombatLogSlip__lines' },
      ...lines.map((line) => React.createElement(
        'li',
        {
          key: line.id,
          className: `outskirtsCombatLogSlip__line outskirtsCombatLogSlip__line--${line.tone}`,
          'data-testid': 'outskirts-combat-log-line',
        },
        line.text,
      )),
    ),
    React.createElement('span', { className: 'outskirtsCombatLogSlip__seal', 'aria-hidden': 'true' }),
  );
}
