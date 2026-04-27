import React from 'react';

import type { OutskirtsExactSurfaceV2 } from '../types.js';
import { OutskirtsCombatTheater } from './OutskirtsCombatTheater.js';
import { OutskirtsScenicStage } from './OutskirtsScenicStage.js';

export interface OutskirtsCenterStageProps {
  scenic: OutskirtsExactSurfaceV2['scenicStage'];
  identity: OutskirtsExactSurfaceV2['encounterIdentity'];
  combatStage: OutskirtsExactSurfaceV2['combatStage'];
}

export function OutskirtsCenterStage({ scenic, identity, combatStage }: OutskirtsCenterStageProps) {
  const theaterActive = combatStage.active;

  return React.createElement(
    'section',
    {
      className: 'outskirtsCenterStage',
      'data-testid': 'outskirts-center-stage',
      'data-center-mode': theaterActive ? 'active' : 'planning',
      'data-combat-stage-active': theaterActive ? 'true' : 'false',
    },
    theaterActive
      ? React.createElement(OutskirtsCombatTheater, {
          scenic,
          identity,
          combatStage,
        })
      : React.createElement(OutskirtsScenicStage, {
          scenic,
          identity,
        }),
  );
}
