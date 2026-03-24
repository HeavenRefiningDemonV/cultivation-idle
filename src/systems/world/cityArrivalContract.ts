export const CITY_ARRIVAL_LESSON_BY_ID = {
  city_pinewind_hamlet: 'Learn the loop.',
  city_stonecrag_town: 'Forge begins to matter.',
  city_spirit_cavern_city: 'Build correction starts to matter.',
  city_lotusford: 'Survival prep and reagents matter.',
  city_ironpeak_bastion: 'Final convergence city.',
} as const;

export const CITY_ARRIVAL_QUICK_OPEN_ORDER = ['outskirts', 'ruins', 'gateTrial'] as const;
export const CITY_ARRIVAL_QUICK_OPEN_LABELS: Record<(typeof CITY_ARRIVAL_QUICK_OPEN_ORDER)[number], string> = {
  outskirts: 'Open Outskirts',
  ruins: 'Open Ruins',
  gateTrial: 'Open Gate Trial',
};

export function getCityArrivalLesson(cityId: string): string | null {
  return CITY_ARRIVAL_LESSON_BY_ID[cityId as keyof typeof CITY_ARRIVAL_LESSON_BY_ID] ?? null;
}

export function getCityArrivalQuickOpenModules(modules: readonly string[] | null | undefined): string[] {
  if (!Array.isArray(modules) || modules.length === 0) return [];
  const available = new Set(modules.filter((moduleKey): moduleKey is string => typeof moduleKey === 'string' && moduleKey.length > 0));
  return CITY_ARRIVAL_QUICK_OPEN_ORDER.filter((moduleKey) => available.has(moduleKey));
}

export function getCityArrivalQuickOpenLabel(moduleKey: string): string | null {
  return CITY_ARRIVAL_QUICK_OPEN_LABELS[moduleKey as keyof typeof CITY_ARRIVAL_QUICK_OPEN_LABELS] ?? null;
}

export function normalizeAcknowledgedArrivalCityIds(args: {
  incoming: unknown;
  unlockedCityIds: readonly string[];
  validCityIds: readonly string[];
  fieldWasPresent: boolean;
}): string[] {
  const { incoming, unlockedCityIds, validCityIds, fieldWasPresent } = args;
  const canonicalUnlocked = unlockedCityIds.filter((cityId, index, values) => values.indexOf(cityId) == index);
  const validUnlocked = canonicalUnlocked.filter((cityId) => validCityIds.includes(cityId));

  if (!fieldWasPresent) {
    return [...validUnlocked];
  }

  const incomingIds = Array.isArray(incoming)
    ? incoming.filter((cityId): cityId is string => typeof cityId === 'string')
    : [];
  const incomingSet = new Set(incomingIds.filter((cityId) => validUnlocked.includes(cityId)));

  return validUnlocked.filter((cityId) => incomingSet.has(cityId));
}

export function getQueuedCityArrivalCandidate(args: {
  unlockedCityIds: readonly string[];
  acknowledgedArrivalCityIds: readonly string[];
  citiesById: Record<string, { index?: number | null }>;
  preferredCityId?: string | null;
}): string | null {
  const { unlockedCityIds, acknowledgedArrivalCityIds, citiesById, preferredCityId } = args;
  const unlocked = unlockedCityIds.filter((cityId, index, values) => values.indexOf(cityId) === index && cityId in citiesById);
  const acknowledged = new Set(acknowledgedArrivalCityIds);

  if (preferredCityId && unlocked.includes(preferredCityId) && !acknowledged.has(preferredCityId)) {
    return preferredCityId;
  }

  const candidates = unlocked
    .filter((cityId) => !acknowledged.has(cityId))
    .sort((left, right) => (citiesById[left]?.index ?? -1) - (citiesById[right]?.index ?? -1));

  return candidates.at(-1) ?? null;
}
