import React from 'react';
import type { OutskirtsMockupEncounterHero } from '../types.js';

export interface OutskirtsEncounterIdentityRowProps {
  encounter: OutskirtsMockupEncounterHero;
}

export function OutskirtsEncounterIdentityRow({ encounter }: OutskirtsEncounterIdentityRowProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsEncounterIdentityRow', 'data-testid': 'outskirts-exact-encounter-identity-row' },
    React.createElement('p', { className: 'outskirtsEncounterIdentityRow__name', 'data-testid': 'outskirts-exact-encounter-name' }, encounter.encounterDisplayName),
    React.createElement('p', { className: 'outskirtsEncounterIdentityRow__level', 'data-testid': 'outskirts-exact-encounter-level' }, encounter.encounterLevelLabel),
    React.createElement(
      'span',
      {
        className: `outskirtsEncounterIdentityRow__safety outskirtsEncounterIdentityRow__safety--${encounter.safetyChip.state}`,
        'data-testid': 'outskirts-exact-encounter-safe-chip',
      },
      encounter.safetyChip.label,
    ),
  );
}
