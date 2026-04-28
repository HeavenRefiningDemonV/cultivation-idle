import React from 'react';

import type { OutskirtsCombatStage, OutskirtsCombatStageChip } from '../types.js';

export interface OutskirtsCombatChipsProps {
  combatStage: OutskirtsCombatStage;
}

function renderOutskirtsCombatChip(chip: OutskirtsCombatStageChip) {
  return React.createElement(
    'li',
    {
      key: chip.id,
      className: `outskirtsCombatChips__chip outskirtsCombatChips__chip--${chip.tone}`,
      'data-testid': 'outskirts-combat-chip',
      'data-chip-id': chip.id,
      'data-chip-tone': chip.tone,
      'data-chip-source': chip.source,
    },
    React.createElement('span', {
      className: 'outskirtsCombatChips__seal',
      'aria-hidden': 'true',
    }),
    React.createElement(
      'span',
      { className: 'outskirtsCombatChips__label' },
      chip.label,
    ),
  );
}

export function OutskirtsCombatChips({ combatStage }: OutskirtsCombatChipsProps) {
  if (!combatStage.active) return null;
  if (combatStage.chips.length === 0) return null;

  return React.createElement(
    'ul',
    {
      className: 'outskirtsCombatChips',
      'data-testid': 'outskirts-combat-chips',
      'aria-label': 'Combat status',
    },
    ...combatStage.chips.slice(0, 5).map(renderOutskirtsCombatChip),
  );
}
