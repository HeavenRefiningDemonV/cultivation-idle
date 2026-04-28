import React from 'react';

import { OUTSKIRTS_ASSETS } from '../outskirtsAssetRegistry.js';
import type { OutskirtsCombatStage } from '../types.js';
import { useOutskirtsCombatMotion } from '../hooks/useOutskirtsCombatMotion.js';

export interface OutskirtsCombatActorsProps {
  combatStage: OutskirtsCombatStage;
}

function resolveOutskirtsEnemyActorSrc(combatStage: OutskirtsCombatStage): string | null {
  const key = `${combatStage.enemy.actorImageKey} ${combatStage.enemy.id ?? ''} ${combatStage.enemy.name}`.toLowerCase();

  if (key.includes('wolf') || key.includes('snarling')) return OUTSKIRTS_ASSETS.actors.enemies.wolf;
  if (key.includes('boar')) return OUTSKIRTS_ASSETS.actors.enemies.boar;
  if (key.includes('slime')) return OUTSKIRTS_ASSETS.actors.enemies.slime;
  if (key.includes('rabbit')) return OUTSKIRTS_ASSETS.actors.enemies.rabbit;
  if (key.includes('deer')) return OUTSKIRTS_ASSETS.actors.enemies.deer;
  return null;
}

export function OutskirtsCombatActors({ combatStage }: OutskirtsCombatActorsProps) {
  const motion = useOutskirtsCombatMotion(combatStage);
  const enemySrc = resolveOutskirtsEnemyActorSrc(combatStage);
  const enemyPresent = Boolean(enemySrc);
  const enemyPresence = enemyPresent
    ? 'live'
    : combatStage.enemy.name.trim().length > 0 || combatStage.enemy.id
      ? 'missing-art'
      : 'seeking';

  return React.createElement(
    'section',
    {
      className: 'outskirtsCombatActors',
      'data-testid': 'outskirts-combat-actors',
      'data-has-live-combat': combatStage.hasLiveCombat ? 'true' : 'false',
      'data-enemy-present': enemyPresent ? 'true' : 'false',
      'aria-hidden': 'true',
    },
    React.createElement(
      'div',
      {
        className: 'outskirtsCombatActors__slot outskirtsCombatActors__slot--player',
        'data-testid': 'outskirts-combat-actor-player',
        'data-motion': motion.playerMotion,
      },
      React.createElement('span', { className: 'outskirtsCombatActors__shadow outskirtsCombatActors__shadow--player' }),
      React.createElement('img', {
        className: 'outskirtsCombatActors__image outskirtsCombatActors__image--player',
        'data-testid': 'outskirts-combat-actor-player-image',
        src: OUTSKIRTS_ASSETS.actors.cultivator,
        alt: '',
        'aria-hidden': 'true',
        draggable: false,
      }),
    ),
    React.createElement(
      'div',
      {
        className: 'outskirtsCombatActors__slot outskirtsCombatActors__slot--enemy',
        'data-testid': 'outskirts-combat-actor-enemy',
        'data-motion': motion.enemyMotion,
        'data-is-boss': combatStage.enemy.isBoss ? 'true' : 'false',
        'data-presence': enemyPresence,
      },
      React.createElement('span', { className: 'outskirtsCombatActors__shadow outskirtsCombatActors__shadow--enemy' }),
      enemyPresent
        ? React.createElement('img', {
            className: 'outskirtsCombatActors__image outskirtsCombatActors__image--enemy',
            'data-testid': 'outskirts-combat-actor-enemy-image',
            src: enemySrc,
            alt: '',
            'aria-hidden': 'true',
            draggable: false,
          })
        : React.createElement('span', {
            className: 'outskirtsCombatActors__missingEnemyMist',
            'data-testid': 'outskirts-combat-actor-enemy-missing-art',
            'aria-hidden': 'true',
          }),
    ),
  );
}
