import React from 'react';

import { useOutskirtsFloatingHits } from '../hooks/useOutskirtsFloatingHits.js';
import type { OutskirtsCombatStage } from '../types.js';

export interface OutskirtsCombatFloatingHitsProps {
  combatStage: OutskirtsCombatStage;
}

export function OutskirtsCombatFloatingHits({ combatStage }: OutskirtsCombatFloatingHitsProps) {
  const hits = useOutskirtsFloatingHits(combatStage);

  return React.createElement(
    'div',
    {
      className: 'outskirtsCombatFloatingHits',
      'data-testid': 'outskirts-combat-floating-hits',
      'aria-hidden': 'true',
    },
    ...hits.map((hit) => React.createElement(
      'span',
      {
        key: hit.id,
        className: `outskirtsCombatFloatingHits__hit outskirtsCombatFloatingHits__hit--${hit.kind} outskirtsCombatFloatingHits__hit--target-${hit.target}`,
        'data-testid': 'outskirts-combat-floating-hit',
        'data-hit-kind': hit.kind,
        'data-hit-target': hit.target,
        style: { left: `${hit.x}%`, top: `${hit.y}%` },
      },
      hit.text,
    )),
  );
}
