import type { BountyDifficulty, BountyInstance, BountyKind } from '../../stores/bountyStore.js';
import type { BountyDestination } from '../../utils/bountyRouting.js';
import { resolveBountyDestination } from '../../utils/bountyRouting.js';

export type LiveBountyBoardRole = 'support' | 'route' | 'challenge';

export type LiveBountyBoardSlot = {
  role: LiveBountyBoardRole;
  difficulty: BountyDifficulty;
  allowedKinds: readonly BountyKind[];
};

export const LIVE_BOUNTY_BOARD_SIZE = 3;

export const LIVE_BOUNTY_BOARD_SLOTS: readonly LiveBountyBoardSlot[] = [
  {
    role: 'support',
    difficulty: 'easy',
    allowedKinds: ['CRAFT_COMPLETE', 'EXPEDITION_COMPLETE'],
  },
  {
    role: 'route',
    difficulty: 'medium',
    allowedKinds: ['OUTSKIRTS_KILL', 'RUINS_ROOM_CLEAR'],
  },
  {
    role: 'challenge',
    difficulty: 'hard',
    allowedKinds: ['OUTSKIRTS_BOSS_KILL', 'RUINS_RUN_CLEAR'],
  },
] as const;

const LEGACY_CITY_NAME_PATTERN = /\b(Embermist|Silverkeep|Starsea)\b/i;

type InspectableBountyBoardEntry = Pick<
  BountyInstance,
  'instanceId' | 'cityId' | 'cityIndex' | 'templateId' | 'difficulty' | 'kind' | 'title' | 'description'
>;

export function isLiveBoardBountyKind(kind: string): kind is BountyKind {
  return LIVE_BOUNTY_BOARD_SLOTS.some((slot) => slot.allowedKinds.includes(kind as BountyKind));
}

export function getLiveBountyBoardSlot(index: number): LiveBountyBoardSlot | null {
  return LIVE_BOUNTY_BOARD_SLOTS[index] ?? null;
}

export function inspectLiveBountyBoard(args: {
  board: readonly InspectableBountyBoardEntry[] | null | undefined;
  cityId: string;
  cityIndex: number;
  cityModules: readonly string[] | null | undefined;
  supportTemplateCityIndexById?: Readonly<Record<string, number>>;
}): { valid: boolean; reasons: string[] } {
  const { board, cityId, cityIndex, cityModules, supportTemplateCityIndexById = {} } = args;
  const reasons: string[] = [];

  if (!Array.isArray(board)) {
    return { valid: false, reasons: ['Board is missing.'] };
  }

  if (board.length !== LIVE_BOUNTY_BOARD_SIZE) {
    reasons.push(`Board must contain exactly ${LIVE_BOUNTY_BOARD_SIZE} entries.`);
  }

  LIVE_BOUNTY_BOARD_SLOTS.forEach((slot, index) => {
    const entry = board[index];
    if (!entry) {
      reasons.push(`Missing ${slot.role} slot at index ${index}.`);
      return;
    }

    if (entry.cityId !== cityId) {
      reasons.push(`Slot ${slot.role} points at ${entry.cityId} instead of ${cityId}.`);
    }
    if (entry.cityIndex !== cityIndex) {
      reasons.push(`Slot ${slot.role} uses cityIndex ${entry.cityIndex} instead of ${cityIndex}.`);
    }
    if (entry.difficulty !== slot.difficulty) {
      reasons.push(`Slot ${slot.role} must use ${slot.difficulty} difficulty, got ${entry.difficulty}.`);
    }
    if (!slot.allowedKinds.includes(entry.kind)) {
      reasons.push(`Slot ${slot.role} rejects bounty kind ${entry.kind}.`);
    }
    if (typeof entry.description !== 'string' || entry.description.trim().length === 0) {
      reasons.push(`Slot ${slot.role} has a blank description.`);
    }
    if (LEGACY_CITY_NAME_PATTERN.test(entry.title) || LEGACY_CITY_NAME_PATTERN.test(entry.description)) {
      reasons.push(`Slot ${slot.role} still leaks legacy city naming.`);
    }

    const destination = resolveBountyDestination({
      cityId,
      bountyKind: entry.kind,
      cityModules: [...(cityModules ?? [])],
    });
    if (destination.kind !== 'module') {
      reasons.push(describeDestinationDrift(slot.role, destination));
    }

    if (slot.role === 'support') {
      const supportTemplateCityIndex = supportTemplateCityIndexById[entry.templateId];
      if (typeof supportTemplateCityIndex !== 'number') {
        reasons.push(`Support slot template ${entry.templateId} is missing authored city ownership.`);
      } else if (supportTemplateCityIndex !== cityIndex) {
        reasons.push(
          `Support slot template ${entry.templateId} belongs to city index ${supportTemplateCityIndex}, not ${cityIndex}.`,
        );
      }
    }
  });

  return { valid: reasons.length === 0, reasons };
}

function describeDestinationDrift(role: LiveBountyBoardRole, destination: BountyDestination): string {
  if (destination.kind === 'moduleChoice') {
    return `Slot ${role} leaked moduleChoice routing.`;
  }
  if (destination.kind === 'unavailable') {
    return `Slot ${role} became unavailable: ${destination.reason}`;
  }
  return `Slot ${role} failed destination validation.`;
}
