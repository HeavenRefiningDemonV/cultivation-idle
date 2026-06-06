export type PrestigeMemoryDomain =
  | 'path_training'
  | 'heart_law'
  | 'spirit_root'
  | 'gate'
  | 'composite_route';

export type PrestigeMemoryStoredState = 'active' | 'dormant' | 'partial_component_only';

export type PrestigeMemoryResolvedState = PrestigeMemoryStoredState | 'at_prior_best';

export type PrestigeMemoryReasonCode =
  | 'active_exact_match'
  | 'at_prior_best'
  | 'partial_component_only'
  | 'content_unknown'
  | 'path_mismatch'
  | 'stat_mismatch'
  | 'regimen_mismatch'
  | 'realm_band_mismatch'
  | 'heart_law_mismatch'
  | 'chapter_mismatch'
  | 'verse_mismatch'
  | 'root_mismatch'
  | 'law_pair_mismatch'
  | 'gate_mismatch'
  | 'route_bundle_mismatch'
  | 'missing_current_component';

export type PrestigeMemoryPriorBest = {
  realmIndex: number;
  rating?: number;
  lawLevel?: number;
  verseMastery?: number;
  rootResonance?: number;
  gateCleared?: boolean;
};

export type PrestigeMemoryCaps = {
  multiplier: number;
  floorValue: number;
  stopsAtPriorBest: true;
};

export type PrestigeMemoryRecord = {
  memoryId: string;
  schemaVersion: 1;
  domain: PrestigeMemoryDomain;
  componentKey: string;
  routeBundleKey?: string | null;
  priorBest: PrestigeMemoryPriorBest;
  activeState: PrestigeMemoryStoredState;
  lifetimeUses: number;
  lastLifeId: string;
  reclaimCaps: PrestigeMemoryCaps;
};

export type PrestigeReclaimCurrentRoute = {
  lifeId: string;
  realmIndex: number;
  path?: {
    pathId: string;
    statId: string;
    regimenId: string;
    realmBand: string;
    currentRating: number;
    currentRealmCap: number;
  } | null;
  heartLaw?: {
    heartLawId: string;
    chapterBand: string;
    verseId: string;
    lawLevel: number;
    verseMastery: number;
    unlocked: boolean;
  } | null;
  spiritRoot?: {
    rootElement: string;
    shape: string;
    variantKey: string;
    lawPair: string | null;
    rootResonance: number;
  } | null;
  gate?: {
    trialId: string;
    gateId: string;
    cityId: string;
    gateCleared: boolean;
    reached: boolean;
  } | null;
  composite?: {
    pathId: string | null;
    heartLawId: string | null;
    rootKey: string | null;
    gateChainId: string | null;
  } | null;
};

export type PrestigeReclaimResolvedRow = {
  record: PrestigeMemoryRecord;
  state: PrestigeMemoryResolvedState;
  reasonCode: PrestigeMemoryReasonCode;
  activeMultiplier: number;
  activeFloorValue: number;
  priorBestLabel: string;
  stopConditionLabel: string;
  playerReason: string;
  routeComparison: Array<{ label: string; remembered: string; current: string; matches: boolean }>;
};

export type PrestigeReclaimResolvedState = {
  summary: {
    activeCount: number;
    dormantCount: number;
    partialCount: number;
    atPriorBestCount: number;
    exactCompositeActive: boolean;
    totalRows: number;
  };
  rows: PrestigeReclaimResolvedRow[];
  currentRouteKey: string | null;
};

const RANK_MULTIPLIER = [1, 1.45, 1.65, 1.85] as const;
const RANK_FLOOR = [0, 4, 8, 12] as const;
const COMPOSITE_ROUTE_BONUS = 0.1;

const clampNumber = (value: unknown, fallback = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return value;
};

const clampRank = (value: unknown): 0 | 1 | 2 | 3 => {
  const parsed = Math.floor(clampNumber(value));
  if (parsed <= 0) return 0;
  if (parsed >= 3) return 3;
  return parsed as 1 | 2;
};

const normalizeKeyPart = (value: unknown): string => {
  const raw = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : 'unknown';
  const normalized = raw.trim().toLowerCase().replace(/[^a-z0-9_.:-]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized.length > 0 ? normalized : 'unknown';
};

const joinParts = (domain: PrestigeMemoryDomain, parts: Record<string, unknown>): string =>
  `${domain}:v1:${Object.entries(parts)
    .map(([key, value]) => `${key}=${normalizeKeyPart(value)}`)
    .join('|')}`;

const parseKeyParts = (key: string): Record<string, string> => {
  const [, rawParts = ''] = key.split(':v1:');
  return Object.fromEntries(
    rawParts
      .split('|')
      .map((part) => part.split('='))
      .filter(([name, value]) => Boolean(name) && value !== undefined)
      .map(([name, value]) => [name, value]),
  );
};

export function buildPathTrainingMemoryKey(input: {
  pathId: string;
  statId: string;
  regimenId: string;
  realmBand: string;
}): string {
  return joinParts('path_training', {
    path: input.pathId,
    stat: input.statId,
    regimen: input.regimenId,
    realm: input.realmBand,
  });
}

export function buildHeartLawMemoryKey(input: {
  heartLawId: string;
  chapterBand: string;
  verseId: string;
}): string {
  return joinParts('heart_law', {
    law: input.heartLawId,
    chapter: input.chapterBand,
    verse: input.verseId,
  });
}

export function buildSpiritRootMemoryKey(input: {
  rootElement: string;
  shape: string;
  variantKey: string;
  lawPair: string | null;
}): string {
  return joinParts('spirit_root', {
    element: input.rootElement,
    shape: input.shape,
    variant: input.variantKey,
    law: input.lawPair ?? 'none',
  });
}

export function buildGateMemoryKey(input: {
  trialId: string;
  gateId: string;
  cityId: string;
}): string {
  return joinParts('gate', {
    trial: input.trialId,
    gate: input.gateId,
    city: input.cityId,
  });
}

export function buildCompositeRouteMemoryKey(input: {
  pathId: string | null;
  heartLawId: string | null;
  rootKey: string | null;
  gateChainId: string | null;
}): string {
  return joinParts('composite_route', {
    path: input.pathId ?? 'none',
    law: input.heartLawId ?? 'none',
    root: input.rootKey ?? 'none',
    gateChain: input.gateChainId ?? 'none',
  });
}

function capsForRank(rank: number): PrestigeMemoryCaps {
  const clamped = clampRank(rank);
  return {
    multiplier: RANK_MULTIPLIER[clamped],
    floorValue: RANK_FLOOR[clamped],
    stopsAtPriorBest: true,
  };
}

const strongestPriorBestScore = (priorBest: PrestigeMemoryPriorBest): number =>
  (Math.max(0, Math.floor(clampNumber(priorBest.realmIndex))) * 1_000_000)
  + Math.max(
    clampNumber(priorBest.rating),
    clampNumber(priorBest.lawLevel) * 10_000 + clampNumber(priorBest.verseMastery),
    clampNumber(priorBest.rootResonance),
    priorBest.gateCleared ? 1 : 0,
  );

const sanitizePriorBest = (raw: PrestigeMemoryPriorBest): PrestigeMemoryPriorBest => ({
  realmIndex: Math.max(0, Math.floor(clampNumber(raw.realmIndex))),
  ...(typeof raw.rating === 'number' && Number.isFinite(raw.rating) ? { rating: Math.max(0, raw.rating) } : {}),
  ...(typeof raw.lawLevel === 'number' && Number.isFinite(raw.lawLevel) ? { lawLevel: Math.max(0, raw.lawLevel) } : {}),
  ...(typeof raw.verseMastery === 'number' && Number.isFinite(raw.verseMastery) ? { verseMastery: Math.max(0, raw.verseMastery) } : {}),
  ...(typeof raw.rootResonance === 'number' && Number.isFinite(raw.rootResonance) ? { rootResonance: Math.max(0, raw.rootResonance) } : {}),
  ...(typeof raw.gateCleared === 'boolean' ? { gateCleared: raw.gateCleared } : {}),
});

export function createPrestigeMemoryRecord(input: {
  domain: PrestigeMemoryDomain;
  componentKey: string;
  routeBundleKey?: string | null;
  priorBest: PrestigeMemoryPriorBest;
  lastLifeId: string;
  reclaimRank: number;
  activeState?: PrestigeMemoryStoredState;
  lifetimeUses?: number;
}): PrestigeMemoryRecord {
  const domain = input.domain;
  const componentKey = input.componentKey.trim();
  const routeBundleKey = input.routeBundleKey?.trim() ? input.routeBundleKey.trim() : null;
  return {
    memoryId: `${domain}:${componentKey}:${routeBundleKey ?? 'component'}`,
    schemaVersion: 1,
    domain,
    componentKey,
    routeBundleKey,
    priorBest: sanitizePriorBest(input.priorBest),
    activeState: input.activeState ?? 'dormant',
    lifetimeUses: Math.max(1, Math.floor(clampNumber(input.lifetimeUses, 1))),
    lastLifeId: input.lastLifeId.trim() || 'unknown_life',
    reclaimCaps: capsForRank(input.reclaimRank),
  };
}

export function sanitizePrestigeMemoryRecord(raw: unknown): PrestigeMemoryRecord | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  if (
    typeof record.domain !== 'string'
    || typeof record.componentKey !== 'string'
    || !['path_training', 'heart_law', 'spirit_root', 'gate', 'composite_route'].includes(record.domain)
    || !record.priorBest
    || typeof record.priorBest !== 'object'
    || Array.isArray(record.priorBest)
  ) {
    return null;
  }
  const caps = record.reclaimCaps && typeof record.reclaimCaps === 'object' && !Array.isArray(record.reclaimCaps)
    ? record.reclaimCaps as Record<string, unknown>
    : {};
  const activeState = record.activeState === 'active' || record.activeState === 'partial_component_only'
    ? record.activeState
    : 'dormant';
  return {
    memoryId: typeof record.memoryId === 'string' && record.memoryId.trim().length > 0
      ? record.memoryId
      : `${record.domain}:${record.componentKey}`,
    schemaVersion: 1,
    domain: record.domain as PrestigeMemoryDomain,
    componentKey: record.componentKey.trim(),
    routeBundleKey: typeof record.routeBundleKey === 'string' && record.routeBundleKey.trim().length > 0
      ? record.routeBundleKey.trim()
      : null,
    priorBest: sanitizePriorBest(record.priorBest as PrestigeMemoryPriorBest),
    activeState,
    lifetimeUses: Math.max(1, Math.floor(clampNumber(record.lifetimeUses, 1))),
    lastLifeId: typeof record.lastLifeId === 'string' && record.lastLifeId.trim().length > 0
      ? record.lastLifeId
      : 'unknown_life',
    reclaimCaps: {
      multiplier: Math.max(1, clampNumber(caps.multiplier, 1)),
      floorValue: Math.max(0, clampNumber(caps.floorValue)),
      stopsAtPriorBest: true,
    },
  };
}

const mergeKeyFor = (record: PrestigeMemoryRecord): string =>
  `${record.domain}|${record.componentKey}|${record.routeBundleKey ?? ''}`;

export function mergePrestigeMemoryRecords(records: PrestigeMemoryRecord[]): PrestigeMemoryRecord[] {
  const merged = new Map<string, PrestigeMemoryRecord>();
  records.forEach((candidate) => {
    const record = sanitizePrestigeMemoryRecord(candidate);
    if (!record) return;
    const key = mergeKeyFor(record);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...record, priorBest: { ...record.priorBest }, reclaimCaps: { ...record.reclaimCaps } });
      return;
    }
    const candidateWins = strongestPriorBestScore(record.priorBest) >= strongestPriorBestScore(existing.priorBest);
    merged.set(key, {
      ...(candidateWins ? record : existing),
      lifetimeUses: existing.lifetimeUses + record.lifetimeUses,
      priorBest: { ...(candidateWins ? record.priorBest : existing.priorBest) },
      reclaimCaps: {
        multiplier: Math.max(existing.reclaimCaps.multiplier, record.reclaimCaps.multiplier),
        floorValue: Math.max(existing.reclaimCaps.floorValue, record.reclaimCaps.floorValue),
        stopsAtPriorBest: true,
      },
    });
  });
  return [...merged.values()];
}

const progressForRecord = (record: PrestigeMemoryRecord, current: PrestigeReclaimCurrentRoute): number => {
  if (record.domain === 'path_training') return clampNumber(current.path?.currentRating);
  if (record.domain === 'heart_law') {
    return record.priorBest.lawLevel !== undefined
      ? clampNumber(current.heartLaw?.lawLevel)
      : clampNumber(current.heartLaw?.verseMastery);
  }
  if (record.domain === 'spirit_root') return clampNumber(current.spiritRoot?.rootResonance);
  if (record.domain === 'gate') return current.gate?.gateCleared ? 1 : 0;
  return clampNumber(current.path?.currentRating);
};

const priorBestValueForRecord = (record: PrestigeMemoryRecord): number => {
  if (record.priorBest.rating !== undefined) return record.priorBest.rating;
  if (record.priorBest.lawLevel !== undefined) return record.priorBest.lawLevel;
  if (record.priorBest.verseMastery !== undefined) return record.priorBest.verseMastery;
  if (record.priorBest.rootResonance !== undefined) return record.priorBest.rootResonance;
  if (record.priorBest.gateCleared !== undefined) return record.priorBest.gateCleared ? 1 : 0;
  return 0;
};

const labelPriorBest = (record: PrestigeMemoryRecord): string => {
  if (record.priorBest.rating !== undefined) return `rating ${Math.floor(record.priorBest.rating)}`;
  if (record.priorBest.lawLevel !== undefined) return `law level ${Math.floor(record.priorBest.lawLevel)}`;
  if (record.priorBest.verseMastery !== undefined) return `verse ${Math.round(record.priorBest.verseMastery)}%`;
  if (record.priorBest.rootResonance !== undefined) return `root resonance ${Math.round(record.priorBest.rootResonance)}%`;
  if (record.priorBest.gateCleared) return 'gate cleared';
  return 'prior best';
};

const reasonForState = (state: PrestigeMemoryResolvedState, reasonCode: PrestigeMemoryReasonCode, priorBestLabel: string): string => {
  if (state === 'active') return `This life matches the remembered component. Catch-up applies until ${priorBestLabel}.`;
  if (state === 'at_prior_best') return `Prior best reclaimed. Future progress is new cultivation beyond ${priorBestLabel}.`;
  if (state === 'partial_component_only') return 'Some component memory matches, but the full route bundle is different this life.';
  if (reasonCode === 'content_unknown') return 'This remembered component no longer exists in loaded content, so it stays dormant and inspectable.';
  if (reasonCode === 'law_pair_mismatch') return 'The root is remembered, but it was paired with a different Heart Law.';
  if (reasonCode === 'missing_current_component') return 'This life has not selected the matching component yet.';
  return 'This memory belongs to a different component route.';
};

const comparison = (
  label: string,
  remembered: string | undefined,
  current: string | undefined | null,
): { label: string; remembered: string; current: string; matches: boolean } => ({
  label,
  remembered: remembered ?? 'none',
  current: current ?? 'none',
  matches: (remembered ?? 'none') === (current ?? 'none'),
});

function resolvePathRecord(record: PrestigeMemoryRecord, current: PrestigeReclaimCurrentRoute): Pick<PrestigeReclaimResolvedRow, 'reasonCode' | 'routeComparison'> {
  const remembered = parseKeyParts(record.componentKey);
  if (!current.path) return { reasonCode: 'missing_current_component', routeComparison: [] };
  const routeComparison = [
    comparison('Path', remembered.path, normalizeKeyPart(current.path.pathId)),
    comparison('Stat', remembered.stat, normalizeKeyPart(current.path.statId)),
    comparison('Regimen', remembered.regimen, normalizeKeyPart(current.path.regimenId)),
    comparison('Realm band', remembered.realm, normalizeKeyPart(current.path.realmBand)),
  ];
  if (remembered.path !== normalizeKeyPart(current.path.pathId)) return { reasonCode: 'path_mismatch', routeComparison };
  if (remembered.stat !== normalizeKeyPart(current.path.statId)) return { reasonCode: 'stat_mismatch', routeComparison };
  if (remembered.regimen !== normalizeKeyPart(current.path.regimenId)) return { reasonCode: 'regimen_mismatch', routeComparison };
  if (remembered.realm !== normalizeKeyPart(current.path.realmBand)) return { reasonCode: 'realm_band_mismatch', routeComparison };
  return { reasonCode: 'active_exact_match', routeComparison };
}

function resolveHeartLawRecord(record: PrestigeMemoryRecord, current: PrestigeReclaimCurrentRoute): Pick<PrestigeReclaimResolvedRow, 'reasonCode' | 'routeComparison'> {
  const remembered = parseKeyParts(record.componentKey);
  if (!current.heartLaw) return { reasonCode: 'missing_current_component', routeComparison: [] };
  const routeComparison = [
    comparison('Heart Law', remembered.law, normalizeKeyPart(current.heartLaw.heartLawId)),
    comparison('Chapter', remembered.chapter, normalizeKeyPart(current.heartLaw.chapterBand)),
    comparison('Verse', remembered.verse, normalizeKeyPart(current.heartLaw.verseId)),
  ];
  if (remembered.law !== normalizeKeyPart(current.heartLaw.heartLawId)) return { reasonCode: 'heart_law_mismatch', routeComparison };
  if (remembered.chapter !== normalizeKeyPart(current.heartLaw.chapterBand)) return { reasonCode: 'chapter_mismatch', routeComparison };
  if (remembered.verse !== normalizeKeyPart(current.heartLaw.verseId)) return { reasonCode: 'verse_mismatch', routeComparison };
  return { reasonCode: 'active_exact_match', routeComparison };
}

function resolveSpiritRootRecord(record: PrestigeMemoryRecord, current: PrestigeReclaimCurrentRoute): Pick<PrestigeReclaimResolvedRow, 'reasonCode' | 'routeComparison'> {
  const remembered = parseKeyParts(record.componentKey);
  if (!current.spiritRoot) return { reasonCode: 'missing_current_component', routeComparison: [] };
  const routeComparison = [
    comparison('Root element', remembered.element, normalizeKeyPart(current.spiritRoot.rootElement)),
    comparison('Shape', remembered.shape, normalizeKeyPart(current.spiritRoot.shape)),
    comparison('Variant', remembered.variant, normalizeKeyPart(current.spiritRoot.variantKey)),
    comparison('Heart Law pair', remembered.law, normalizeKeyPart(current.spiritRoot.lawPair ?? 'none')),
  ];
  if (
    remembered.element === normalizeKeyPart(current.spiritRoot.rootElement)
    && remembered.shape === normalizeKeyPart(current.spiritRoot.shape)
    && remembered.variant === normalizeKeyPart(current.spiritRoot.variantKey)
    && remembered.law !== normalizeKeyPart(current.spiritRoot.lawPair ?? 'none')
  ) {
    return { reasonCode: 'law_pair_mismatch', routeComparison };
  }
  if (routeComparison.some((row) => !row.matches)) return { reasonCode: 'root_mismatch', routeComparison };
  return { reasonCode: 'active_exact_match', routeComparison };
}

function resolveGateRecord(record: PrestigeMemoryRecord, current: PrestigeReclaimCurrentRoute): Pick<PrestigeReclaimResolvedRow, 'reasonCode' | 'routeComparison'> {
  const remembered = parseKeyParts(record.componentKey);
  if (!current.gate) return { reasonCode: 'missing_current_component', routeComparison: [] };
  const routeComparison = [
    comparison('Trial', remembered.trial, normalizeKeyPart(current.gate.trialId)),
    comparison('Gate', remembered.gate, normalizeKeyPart(current.gate.gateId)),
    comparison('City', remembered.city, normalizeKeyPart(current.gate.cityId)),
  ];
  if (routeComparison.some((row) => !row.matches)) return { reasonCode: 'gate_mismatch', routeComparison };
  return { reasonCode: 'active_exact_match', routeComparison };
}

const buildCurrentCompositeKey = (current: PrestigeReclaimCurrentRoute): string | null =>
  current.composite
    ? buildCompositeRouteMemoryKey(current.composite)
    : null;

function resolveNonCompositeRecord(record: PrestigeMemoryRecord, current: PrestigeReclaimCurrentRoute): Pick<PrestigeReclaimResolvedRow, 'reasonCode' | 'routeComparison'> {
  if (record.domain === 'path_training') return resolvePathRecord(record, current);
  if (record.domain === 'heart_law') return resolveHeartLawRecord(record, current);
  if (record.domain === 'spirit_root') return resolveSpiritRootRecord(record, current);
  if (record.domain === 'gate') return resolveGateRecord(record, current);
  return { reasonCode: 'route_bundle_mismatch', routeComparison: [] };
}

function makeRow(
  record: PrestigeMemoryRecord,
  state: PrestigeMemoryResolvedState,
  reasonCode: PrestigeMemoryReasonCode,
  routeComparison: PrestigeReclaimResolvedRow['routeComparison'],
): PrestigeReclaimResolvedRow {
  const priorBestLabel = labelPriorBest(record);
  return {
    record,
    state,
    reasonCode,
    activeMultiplier: state === 'active' ? record.reclaimCaps.multiplier : 1,
    activeFloorValue: state === 'active' && record.domain !== 'composite_route' ? record.reclaimCaps.floorValue : 0,
    priorBestLabel,
    stopConditionLabel: `Catch-up stops at ${priorBestLabel}.`,
    playerReason: reasonForState(state, reasonCode, priorBestLabel),
    routeComparison,
  };
}

function stateForExactRecord(record: PrestigeMemoryRecord, current: PrestigeReclaimCurrentRoute): PrestigeMemoryResolvedState {
  const currentValue = progressForRecord(record, current);
  const priorBestValue = priorBestValueForRecord(record);
  if (priorBestValue > 0 && currentValue >= priorBestValue) return 'at_prior_best';
  return 'active';
}

export function resolvePrestigeReclaimState(input: {
  records: PrestigeMemoryRecord[];
  current: PrestigeReclaimCurrentRoute;
  reclaimRank: number;
  knownComponentKeys?: ReadonlySet<string>;
}): PrestigeReclaimResolvedState {
  const currentCompositeKey = buildCurrentCompositeKey(input.current);
  const mergedRecords = mergePrestigeMemoryRecords(input.records).map((record) => ({
    ...record,
    reclaimCaps: capsForRank(input.reclaimRank),
  }));
  const rowsByKey = new Map<string, PrestigeReclaimResolvedRow>();
  const orderedKeys: string[] = [];

  mergedRecords
    .filter((record) => record.domain !== 'composite_route')
    .forEach((record) => {
      const mapKey = mergeKeyFor(record);
      orderedKeys.push(mapKey);
      if (input.knownComponentKeys && !input.knownComponentKeys.has(record.componentKey)) {
        rowsByKey.set(mapKey, makeRow(record, 'dormant', 'content_unknown', []));
        return;
      }
      const resolved = resolveNonCompositeRecord(record, input.current);
      const state = resolved.reasonCode === 'active_exact_match'
        ? stateForExactRecord(record, input.current)
        : 'dormant';
      rowsByKey.set(mapKey, makeRow(
        record,
        state,
        state === 'at_prior_best' ? 'at_prior_best' : resolved.reasonCode,
        resolved.routeComparison,
      ));
    });

  const hasActiveComponent = [...rowsByKey.values()].some((row) => row.state === 'active');

  mergedRecords
    .filter((record) => record.domain === 'composite_route')
    .forEach((record) => {
      const mapKey = mergeKeyFor(record);
      orderedKeys.push(mapKey);
      if (input.knownComponentKeys && !input.knownComponentKeys.has(record.componentKey)) {
        rowsByKey.set(mapKey, makeRow(record, 'dormant', 'content_unknown', []));
        return;
      }
      const remembered = record.componentKey;
      if (!currentCompositeKey) {
        rowsByKey.set(mapKey, makeRow(record, 'dormant', 'missing_current_component', []));
        return;
      }
      if (remembered === currentCompositeKey) {
        const state = stateForExactRecord(record, input.current);
        rowsByKey.set(mapKey, makeRow(
          record,
          state,
          state === 'at_prior_best' ? 'at_prior_best' : 'active_exact_match',
          [comparison('Full route', remembered, currentCompositeKey)],
        ));
        return;
      }
      rowsByKey.set(mapKey, makeRow(
        record,
        hasActiveComponent ? 'partial_component_only' : 'dormant',
        hasActiveComponent ? 'partial_component_only' : 'route_bundle_mismatch',
        [comparison('Full route', remembered, currentCompositeKey)],
      ));
    });

  const exactCompositeActive = [...rowsByKey.values()].some((row) =>
    row.record.domain === 'composite_route' && row.state === 'active');
  const adjustedRows = orderedKeys.flatMap((key) => {
    const row = rowsByKey.get(key);
    if (!row) return [];
    if (
      !exactCompositeActive
      || row.record.domain === 'composite_route'
      || row.state !== 'active'
      || !currentCompositeKey
      || row.record.routeBundleKey !== currentCompositeKey
    ) {
      return [row];
    }
    return [{
      ...row,
      activeMultiplier: Number((row.activeMultiplier + COMPOSITE_ROUTE_BONUS).toFixed(2)),
    }];
  });

  return {
    summary: {
      activeCount: adjustedRows.filter((row) => row.state === 'active' && row.record.domain !== 'composite_route').length,
      dormantCount: adjustedRows.filter((row) => row.state === 'dormant').length,
      partialCount: adjustedRows.filter((row) => row.state === 'partial_component_only').length,
      atPriorBestCount: adjustedRows.filter((row) => row.state === 'at_prior_best').length,
      exactCompositeActive,
      totalRows: adjustedRows.length,
    },
    rows: adjustedRows,
    currentRouteKey: currentCompositeKey,
  };
}

export function applyReclaimDeltaUntilPriorBest(input: {
  currentValue: number;
  baseDelta: number;
  priorBestValue: number;
  multiplier: number;
  active: boolean;
}): { delta: number; reachedPriorBest: boolean } {
  const currentValue = clampNumber(input.currentValue);
  const baseDelta = Math.max(0, clampNumber(input.baseDelta));
  const priorBestValue = clampNumber(input.priorBestValue);
  const multiplier = Math.max(1, clampNumber(input.multiplier, 1));
  if (!input.active || baseDelta <= 0 || multiplier <= 1 || currentValue >= priorBestValue) {
    return { delta: baseDelta, reachedPriorBest: currentValue >= priorBestValue };
  }
  const remainingToPriorBest = Math.max(0, priorBestValue - currentValue);
  const boostedDelta = baseDelta * multiplier;
  if (boostedDelta <= remainingToPriorBest) {
    return { delta: boostedDelta, reachedPriorBest: false };
  }
  const baseDeltaToBoundary = remainingToPriorBest / multiplier;
  const overflowBaseDelta = Math.max(0, baseDelta - baseDeltaToBoundary);
  return {
    delta: remainingToPriorBest + overflowBaseDelta,
    reachedPriorBest: true,
  };
}
