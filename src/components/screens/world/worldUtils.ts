import type { CityDef } from '../../../content';

export const MODULE_REF_KEYS: Record<string, string> = {
  outskirts: 'outskirtsId',
  gateTrial: 'gateTrialId',
  ruins: 'ruinId',
  apothecary: 'apothecaryId',
  manualPavilion: 'pavilionId',
  alchemy: 'alchemyId',
  forge: 'forgeId',
  talismanStudio: 'talismanId',
  bounties: 'bountyBoardId',
  expeditions: 'expeditionsId',
};

export function pickEnemyFromPool(pool: { enemyId: string; weight: number }[]): string | null {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  const totalWeight = pool.reduce((sum, entry) => sum + (entry.weight ?? 0), 0);
  if (totalWeight <= 0) return pool[0]?.enemyId ?? null;

  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight ?? 0;
    if (roll <= 0) return entry.enemyId;
  }

  return pool[pool.length - 1]?.enemyId ?? null;
}

export function resolveModuleRef(city: CityDef | null, moduleKey: string | null) {
  if (!city || !moduleKey || !city.refs) return null;
  const explicitKey = MODULE_REF_KEYS[moduleKey];
  if (explicitKey && city.refs[explicitKey]) return city.refs[explicitKey];
  if (moduleKey === 'alchemy' && city.refs.apothecaryId) return city.refs.apothecaryId;
  if (city.refs[`${moduleKey}Id`]) return city.refs[`${moduleKey}Id`];
  if (city.refs[moduleKey]) return city.refs[moduleKey];
  return null;
}
