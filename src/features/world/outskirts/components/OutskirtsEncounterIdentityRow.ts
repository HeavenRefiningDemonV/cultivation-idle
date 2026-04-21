import React from 'react';
import type { OutskirtsEncounterIdentity } from '../types.js';

export interface OutskirtsEncounterIdentityRowProps {
  identity: OutskirtsEncounterIdentity;
}

export function OutskirtsEncounterIdentityRow({ identity }: OutskirtsEncounterIdentityRowProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsEncounterIdentityRow', 'data-testid': 'outskirts-exact-encounter-identity-row' },
    React.createElement('p', { className: 'outskirtsEncounterIdentityRow__name', 'data-testid': 'outskirts-exact-encounter-name' }, identity.displayName),
    React.createElement('p', { className: 'outskirtsEncounterIdentityRow__level', 'data-testid': 'outskirts-exact-encounter-level' }, identity.levelLabel),
    React.createElement(
      'span',
      {
        className: `outskirtsEncounterIdentityRow__safety outskirtsEncounterIdentityRow__safety--${identity.safetyChip.state}`,
        'data-testid': 'outskirts-exact-encounter-safe-chip',
      },
      identity.safetyChip.label,
    ),
  );
}
