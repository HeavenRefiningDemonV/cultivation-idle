import type { BountyTemplate } from '../../content/index.js';
import type { BountyDifficulty, BountyInstance, BountyKind } from '../../stores/bountyStore.js';
import { resolveBountyDestination } from '../../utils/bountyRouting.js';
import {
  getLiveBountyBoardSlot,
  inspectLiveBountyBoard,
  LIVE_BOUNTY_BOARD_SIZE,
  LIVE_BOUNTY_BOARD_SLOTS,
} from '../world/bountyBoardContract.js';
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
  board: readonly Pick<
    BountyInstance,
    'instanceId' | 'cityId' | 'cityIndex' | 'templateId' | 'difficulty' | 'kind' | 'title' | 'description'
  >[] | null | undefined;
  cityId: string;
  cityIndex: number;
  cityModules: readonly string[] | null | undefined;
  supportTemplateCityIndexById?: Readonly<Record<string, number>>;
}): boolean {
  return inspectLiveBountyBoard(args).valid;
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
  slotIndex: number;
  cityIndex: number;
  refreshSeed: number;
}): BountyTemplate | null {
  const { templates, slotIndex, cityIndex, refreshSeed } = args;
  const slot = getLiveBountyBoardSlot(slotIndex);
  if (!slot) return null;
  if (templates.length === 0) return null;

  const pickIndex = Math.abs(cityIndex + refreshSeed + slotIndex) % templates.length;
  return templates[pickIndex];
}

export function buildLiveBountyDescription(template: BountyTemplate, target: number): string {
  return template.desc.replace(/\{target\}/g, target.toString()).trim();
}

export function getBountyKindKey(kind: string): BountyKind {
  return kind as BountyKind;
}

export function getSupportTemplateCityIndexById(
  templates: readonly Pick<BountyTemplate, 'id' | 'kind' | 'minCityIndex'>[],
): Record<string, number> {
  return Object.fromEntries(
    templates
      .filter((template) => template.kind === 'CRAFT_COMPLETE' || template.kind === 'EXPEDITION_COMPLETE')
      .map((template) => [template.id, template.minCityIndex ?? 0]),
  );
}

export function getTemplatesForLiveBountySlot(args: {
  templates: readonly BountyTemplate[];
  slotIndex: number;
  cityId: string;
  cityIndex: number;
  cityModules: readonly string[] | null | undefined;
}): BountyTemplate[] {
  const { templates, slotIndex, cityId, cityIndex, cityModules } = args;
  const slot = getLiveBountyBoardSlot(slotIndex);
  if (!slot) return [];
  const liveModules = getLiveBountyModules(cityModules);

  return templates.filter((template) => {
    if (!slot.allowedKinds.includes(template.kind as BountyKind)) return false;
    if (!template.difficulties?.includes(slot.difficulty)) return false;
    if (!isLiveBountyDescription(template.desc)) return false;

    if (slot.role === 'support') {
      if ((template.minCityIndex ?? 0) !== cityIndex) return false;
    } else if ((template.minCityIndex ?? 0) > cityIndex) {
      return false;
    }

    const destination = resolveBountyDestination({ cityId, bountyKind: template.kind, cityModules: liveModules });
    return destination.kind === 'module';
  });
}

export function getCanonicalLiveBountyDifficultyOrder(): BountyDifficulty[] {
  return LIVE_BOUNTY_BOARD_SLOTS.map((slot) => slot.difficulty);
}

export { LIVE_BOUNTY_BOARD_SIZE };
