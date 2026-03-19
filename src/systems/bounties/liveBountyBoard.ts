import type { BountyTemplate } from '../../content/index.js';
import type { BountyDifficulty, BountyInstance, BountyKind } from '../../stores/bountyStore.js';
import { resolveBountyDestination } from '../../utils/bountyRouting.js';
import { normalizeCityModulesForLiveSlice } from '../world/liveWorldSchema.js';

export const LIVE_BOUNTY_DIFFICULTIES: BountyDifficulty[] = ['easy', 'medium', 'hard'];

export function getLiveBountyModules(cityModules: readonly string[] | null | undefined): string[] {
  return normalizeCityModulesForLiveSlice(cityModules);
}

export function isLiveBountyDescription(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isLiveBountyBoardEntry(args: {
  bounty: Pick<BountyInstance, 'cityId' | 'cityIndex' | 'difficulty' | 'kind' | 'description'>;
  cityId: string;
  cityIndex: number;
  cityModules: readonly string[] | null | undefined;
  difficulty: BountyDifficulty;
}): boolean {
  const { bounty, cityId, cityIndex, cityModules, difficulty } = args;
  if (bounty.cityId !== cityId || bounty.cityIndex !== cityIndex || bounty.difficulty !== difficulty) return false;
  if (!isLiveBountyDescription(bounty.description)) return false;

  const destination = resolveBountyDestination({
    cityId,
    bountyKind: bounty.kind,
    cityModules: getLiveBountyModules(cityModules),
  });

  return destination.kind !== 'unavailable';
}

export function isLiveBountyBoard(args: {
  board: readonly Pick<BountyInstance, 'cityId' | 'cityIndex' | 'difficulty' | 'kind' | 'description'>[] | null | undefined;
  cityId: string;
  cityIndex: number;
  cityModules: readonly string[] | null | undefined;
}): boolean {
  const { board, cityId, cityIndex, cityModules } = args;
  if (!Array.isArray(board) || board.length !== LIVE_BOUNTY_DIFFICULTIES.length) return false;

  return LIVE_BOUNTY_DIFFICULTIES.every((difficulty, index) =>
    isLiveBountyBoardEntry({
      bounty: board[index],
      cityId,
      cityIndex,
      cityModules,
      difficulty,
    }),
  );
}

export function getAvailableLiveBountyTemplates(args: {
  templates: readonly BountyTemplate[];
  cityId: string;
  cityIndex: number;
  cityModules: readonly string[] | null | undefined;
}): BountyTemplate[] {
  const { templates, cityId, cityIndex, cityModules } = args;
  const liveModules = getLiveBountyModules(cityModules);

  return templates.filter((template) => {
    if ((template.minCityIndex ?? 0) > cityIndex) return false;
    if (!isLiveBountyDescription(template.desc)) return false;
    const destination = resolveBountyDestination({ cityId, bountyKind: template.kind, cityModules: liveModules });
    return destination.kind !== 'unavailable';
  });
}

export function selectLiveBountyTemplate(args: {
  templates: readonly BountyTemplate[];
  difficulty: BountyDifficulty;
  usedTemplateIds: Set<string>;
  cityIndex: number;
  refreshSeed: number;
}): BountyTemplate | null {
  const { templates, difficulty, usedTemplateIds, cityIndex, refreshSeed } = args;
  const eligible = templates.filter((template) => template.difficulties?.includes(difficulty));
  if (eligible.length === 0) return null;

  const unused = eligible.filter((template) => !usedTemplateIds.has(template.id));
  const pool = unused.length > 0 ? unused : eligible;
  const difficultyOffset = LIVE_BOUNTY_DIFFICULTIES.indexOf(difficulty);
  const pickIndex = Math.abs(cityIndex + refreshSeed + difficultyOffset) % pool.length;
  const pick = pool[pickIndex];
  usedTemplateIds.add(pick.id);
  return pick;
}

export function buildLiveBountyDescription(template: BountyTemplate, target: number): string {
  return template.desc.replace(/\{target\}/g, target.toString()).trim();
}

export function getBountyKindKey(kind: string): BountyKind {
  return kind as BountyKind;
}
