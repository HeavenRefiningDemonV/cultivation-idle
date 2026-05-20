import React from 'react';
import { Swords } from 'lucide-react';

import { OUTSKIRTS_ASSETS } from '../outskirtsAssetRegistry.js';
import type { OutskirtsCombatStage } from '../types.js';

export interface OutskirtsCombatHealthBarsProps {
  combatStage: OutskirtsCombatStage;
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function formatNameWithLevel(name: string, levelLabel: string): string {
  const safeName = name.trim().length > 0 ? name : 'Seeking foe';
  return levelLabel.trim().length > 0 ? `${safeName} · ${levelLabel}` : safeName;
}

function resolveEnemySealSrc(combatStage: OutskirtsCombatStage): string {
  const key = `${combatStage.enemy.actorImageKey} ${combatStage.enemy.id ?? ''} ${combatStage.enemy.name}`.toLowerCase();

  if (key.includes('boar')) return OUTSKIRTS_ASSETS.stripArt.boarEnemy;
  if (key.includes('slime')) return OUTSKIRTS_ASSETS.stripArt.slimeEnemy;
  if (key.includes('rabbit')) return OUTSKIRTS_ASSETS.stripArt.forestRabbitEnemy;
  if (key.includes('deer')) return OUTSKIRTS_ASSETS.stripArt.spiritDeerEnemy;
  if (key.includes('wolf')) return OUTSKIRTS_ASSETS.stripArt.wolfEnemy;

  return OUTSKIRTS_ASSETS.icons.rewards.materialsFallback;
}

export function OutskirtsCombatHealthBars({ combatStage }: OutskirtsCombatHealthBarsProps) {
  const playerName = combatStage.player.name.trim().length > 0 ? combatStage.player.name : 'Cultivator';
  const enemyNameWithLevel = formatNameWithLevel(combatStage.enemy.name, combatStage.enemy.levelLabel);
  const playerHpLabel = combatStage.player.hpLabel;
  const enemyHpLabel = combatStage.enemy.hpLabel;
  const playerMeterMax = Math.max(1, combatStage.player.hpMax);
  const enemyMeterMax = Math.max(1, combatStage.enemy.hpMax);
  const playerMeterNow = Math.max(0, Math.min(playerMeterMax, combatStage.player.hpCurrent));
  const enemyMeterNow = Math.max(0, Math.min(enemyMeterMax, combatStage.enemy.hpCurrent));
  const playerPct = clampPct(combatStage.player.hpPct);
  const enemyPct = clampPct(combatStage.enemy.hpPct);

  return React.createElement(
    'section',
    {
      className: 'outskirtsCombatHealthBars',
      'data-testid': 'outskirts-combat-health-bars',
      'data-has-live-combat': combatStage.hasLiveCombat ? 'true' : 'false',
      'aria-label': `Combat health: ${playerName} ${playerHpLabel}; ${combatStage.enemy.name.trim().length > 0 ? combatStage.enemy.name : 'Seeking foe'} ${combatStage.enemy.levelLabel} ${enemyHpLabel}`,
    },
    React.createElement(
      'div',
      {
        className: 'outskirtsCombatHealthBars__unit outskirtsCombatHealthBars__unit--player',
        'data-testid': 'outskirts-combat-health-player',
      },
      React.createElement(
        'span',
        { className: 'outskirtsCombatHealthBars__seal outskirtsCombatHealthBars__seal--player', 'aria-hidden': 'true' },
        React.createElement('img', {
          className: 'outskirtsCombatHealthBars__sealImage',
          src: OUTSKIRTS_ASSETS.icons.tactical.danger,
          alt: '',
          'aria-hidden': 'true',
          loading: 'lazy',
          decoding: 'async',
        }),
      ),
      React.createElement(
        'div',
        {
          className: 'outskirtsCombatHealthBars__plaque outskirtsCombatHealthBars__plaque--player',
          role: 'meter',
          'aria-label': `${playerName} HP ${playerHpLabel}`,
          'aria-valuemin': 0,
          'aria-valuemax': playerMeterMax,
          'aria-valuenow': playerMeterNow,
        },
        React.createElement('span', { className: 'outskirtsCombatHealthBars__name' }, playerName),
        React.createElement(
          'span',
          { className: 'outskirtsCombatHealthBars__track' },
          React.createElement('span', {
            className: 'outskirtsCombatHealthBars__fill outskirtsCombatHealthBars__fill--player',
            style: { width: `${playerPct}%` },
          }),
          React.createElement('span', { className: 'outskirtsCombatHealthBars__hpText' }, playerHpLabel),
        ),
      ),
    ),
    React.createElement(
      'div',
      {
        className: 'outskirtsCombatHealthBars__versus',
        'data-testid': 'outskirts-combat-versus-seal',
        'aria-hidden': 'true',
      },
      React.createElement(Swords, { 'aria-hidden': 'true' }),
    ),
    React.createElement(
      'div',
      {
        className: 'outskirtsCombatHealthBars__unit outskirtsCombatHealthBars__unit--enemy',
        'data-testid': 'outskirts-combat-health-enemy',
      },
      React.createElement(
        'div',
        {
          className: 'outskirtsCombatHealthBars__plaque outskirtsCombatHealthBars__plaque--enemy',
          role: 'meter',
          'aria-label': `${combatStage.enemy.name.trim().length > 0 ? combatStage.enemy.name : 'Seeking foe'} ${combatStage.enemy.levelLabel} HP ${enemyHpLabel}`,
          'aria-valuemin': 0,
          'aria-valuemax': enemyMeterMax,
          'aria-valuenow': enemyMeterNow,
        },
        React.createElement('span', { className: 'outskirtsCombatHealthBars__name' }, enemyNameWithLevel),
        React.createElement(
          'span',
          { className: 'outskirtsCombatHealthBars__track' },
          React.createElement('span', {
            className: 'outskirtsCombatHealthBars__fill outskirtsCombatHealthBars__fill--enemy',
            style: { width: `${enemyPct}%` },
          }),
          React.createElement('span', { className: 'outskirtsCombatHealthBars__hpText' }, enemyHpLabel),
        ),
      ),
      React.createElement(
        'span',
        { className: 'outskirtsCombatHealthBars__seal outskirtsCombatHealthBars__seal--enemy', 'aria-hidden': 'true' },
        React.createElement('img', {
          className: 'outskirtsCombatHealthBars__sealImage',
          src: resolveEnemySealSrc(combatStage),
          alt: '',
          'aria-hidden': 'true',
          loading: 'lazy',
          decoding: 'async',
        }),
      ),
    ),
  );
}
