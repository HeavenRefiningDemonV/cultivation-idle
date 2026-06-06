import type { CultivatorStatDef } from '../../content/types.js';

export function selectCultivatorStatById(
  stats: readonly CultivatorStatDef[],
  statId: string,
): CultivatorStatDef | null {
  return stats.find((stat) => stat.id === statId) ?? null;
}

export function selectCultivatorStatsForPath(
  stats: readonly CultivatorStatDef[],
  path: CultivatorStatDef['path'],
): CultivatorStatDef[] {
  return stats.filter((stat) => stat.path === path || stat.path === 'universal');
}
