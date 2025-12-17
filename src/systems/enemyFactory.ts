import { D } from '../utils/numbers';
import { useContentStore } from '../stores/contentStore';
import type { EnemyDefinition, EnemyMechanic } from '../types';

interface PlayerPowerSnapshot {
  atk: string;
  def: string;
  maxHp: string;
}

interface CreateEnemyOptions {
  cityIndex: number;
  isBoss: boolean;
  playerPowerSnapshot: PlayerPowerSnapshot;
}

interface EnemyFactoryResult {
  id: string;
  name: string;
  level: number;
  hp: string;
  maxHp: string;
  atk: string;
  def: string;
  speed: number;
  critChance: number;
  dodgeChance: number;
  luck: number;
  exp: string;
  goldDrop: string;
  lootTable: unknown[];
  mechanics?: EnemyMechanic[];
  isBoss: boolean;
}

const ENEMY_ATTACK_INTERVAL_SEC = 1.5; // Mirrors ENEMY_ATTACK_COOLDOWN in combat store

function clampToMinimum(value: string, min: number): string {
  const decimal = D(value);
  if (decimal.lessThan(min)) return D(min).toFixed(0);
  return decimal.toFixed(0);
}

export function createEnemy(templateId: string, opts: CreateEnemyOptions): EnemyFactoryResult {
  const { cityIndex, isBoss, playerPowerSnapshot } = opts;
  const { maps } = useContentStore.getState();
  const template = maps.enemiesById[templateId];

  const playerAtk = D(playerPowerSnapshot.atk || '0');
  const playerMaxHp = D(playerPowerSnapshot.maxHp || '0');

  const mobTTKSeconds = 8 + cityIndex * 2;
  const bossTTKSeconds = 22 + cityIndex * 4;
  const targetTTK = isBoss ? bossTTKSeconds : mobTTKSeconds;

  const enemyMaxHp = playerAtk.times(targetTTK);

  const mobEnemyTTKSeconds = 24 + cityIndex * 3;
  const bossEnemyTTKSeconds = 34 + cityIndex * 5;
  const enemyTTK = isBoss ? bossEnemyTTKSeconds : mobEnemyTTKSeconds;

  const attacksNeeded = enemyTTK / ENEMY_ATTACK_INTERVAL_SEC;
  const enemyAtk = attacksNeeded > 0 ? playerMaxHp.dividedBy(attacksNeeded) : D(1);

  const defFraction = isBoss ? 0.12 : 0.08;
  const enemyDef = playerAtk.times(defFraction);

  const name = template?.name ?? templateId;
  const mechanics = Array.isArray(template?.mechanics)
    ? (template!.mechanics as unknown as EnemyMechanic[])
    : undefined;

  const baseCrit = isBoss ? 10 : 5;
  const baseDodge = isBoss ? 6 : 4;

  const enemy: EnemyDefinition & { mechanics?: EnemyMechanic[] } = {
    id: templateId,
    name,
    level: Math.max(1, cityIndex + 1),
    zone: 'outskirts',
    hp: clampToMinimum(enemyMaxHp.toString(), 1),
    atk: clampToMinimum(enemyAtk.toString(), 1),
    def: clampToMinimum(enemyDef.toString(), 0),
    crit: baseCrit,
    critDmg: isBoss ? 170 : 150,
    dodge: baseDodge,
    speed: 1.0,
    goldReward: '0',
    expReward: '0',
    lootTable: [],
    isBoss,
    mechanics,
  };

  return {
    id: enemy.id,
    name: enemy.name,
    level: enemy.level,
    hp: enemy.hp,
    maxHp: enemy.hp,
    atk: enemy.atk,
    def: enemy.def,
    speed: enemy.speed,
    critChance: enemy.crit,
    dodgeChance: enemy.dodge,
    luck: 0,
    exp: enemy.expReward,
    goldDrop: enemy.goldReward,
    lootTable: enemy.lootTable ?? [],
    mechanics,
    isBoss,
  };
}
