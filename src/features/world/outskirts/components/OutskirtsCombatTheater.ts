import React from 'react';

import { resolveOutskirtsScenicAsset } from '../resolveOutskirtsScenicAsset.js';
import type { OutskirtsCombatStage, OutskirtsEncounterIdentity, OutskirtsScenicStage } from '../types.js';
import { OutskirtsCombatHealthBars } from './OutskirtsCombatHealthBars.js';
import { OutskirtsCombatActors } from './OutskirtsCombatActors.js';
import { OutskirtsCombatFloatingHits } from './OutskirtsCombatFloatingHits.js';
import { OutskirtsCombatLogSlip } from './OutskirtsCombatLogSlip.js';

export interface OutskirtsCombatTheaterProps {
  scenic: OutskirtsScenicStage;
  identity: OutskirtsEncounterIdentity;
  combatStage: OutskirtsCombatStage;
  showCombatHpBars?: boolean;
  showCombatActors?: boolean;
  showFloatingDamage?: boolean;
  showCombatLog?: boolean;
}

export function OutskirtsCombatTheater({ scenic, identity, combatStage, showCombatHpBars = false, showCombatActors = false, showFloatingDamage = false, showCombatLog = false }: OutskirtsCombatTheaterProps) {
  const bindings = resolveOutskirtsScenicAsset({
    scenic,
    selectedEncounterId: identity.selectedEncounterId,
  });

  const baseStyle = bindings.sceneBaseSrc
    ? {
        backgroundImage: `url('${bindings.sceneBaseSrc}')`,
        backgroundPosition: bindings.sceneBasePosition,
      }
    : undefined;

  return React.createElement(
    'section',
    {
      className: 'outskirtsCombatTheater',
      'data-testid': 'outskirts-combat-theater',
      'data-stage-active': combatStage.active ? 'true' : 'false',
      'data-stage-lifecycle': combatStage.lifecycle,
      'data-stage-contract': combatStage.visualContract,
      role: 'img',
      'aria-label': `${identity.displayName} combat theater`,
      'aria-description': scenic.environmentDescriptor,
    },
    React.createElement('div', {
      className: 'outskirtsCombatTheater__base',
      'data-testid': 'outskirts-combat-theater-base',
      style: baseStyle,
      'aria-hidden': 'true',
    }),
    React.createElement('span', {
      className: 'outskirtsCombatTheater__wash',
      'aria-hidden': 'true',
    }),
    React.createElement('span', {
      className: 'outskirtsCombatTheater__mist',
      'aria-hidden': 'true',
    }),
    React.createElement('span', {
      className: 'outskirtsCombatTheater__edgeFade',
      'aria-hidden': 'true',
    }),
    React.createElement(
      'div',
      {
        className: 'outskirtsCombatTheater__hpLayer',
        'data-testid': 'outskirts-combat-theater-layer-hp',
        'aria-hidden': showCombatHpBars ? undefined : 'true',
      },
      showCombatHpBars
        ? React.createElement(OutskirtsCombatHealthBars, { combatStage })
        : null,
    ),
    React.createElement(
      'div',
      {
        className: 'outskirtsCombatTheater__actorLayer',
        'data-testid': 'outskirts-combat-theater-layer-actors',
        'aria-hidden': 'true',
      },
      showCombatActors
        ? React.createElement(OutskirtsCombatActors, { combatStage })
        : null,
    ),
    React.createElement(
      'div',
      {
        className: 'outskirtsCombatTheater__effectsLayer',
        'data-testid': 'outskirts-combat-theater-layer-effects',
        'aria-hidden': 'true',
      },
      showFloatingDamage
        ? React.createElement(OutskirtsCombatFloatingHits, { combatStage })
        : null,
    ),
    React.createElement('div', {
      className: 'outskirtsCombatTheater__chipsLayer',
      'data-testid': 'outskirts-combat-theater-layer-chips',
      'aria-hidden': 'true',
    }),
    React.createElement(
      'div',
      {
        className: 'outskirtsCombatTheater__logLayer',
        'data-testid': 'outskirts-combat-theater-layer-log',
        'aria-hidden': showCombatLog ? undefined : 'true',
      },
      showCombatLog
        ? React.createElement(OutskirtsCombatLogSlip, { combatStage })
        : null,
    ),
  );
}
