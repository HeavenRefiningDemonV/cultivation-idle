import { REALMS } from '../../constants/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { getGateTransitionItemIdForRealmIndex, hasNextLiveRealm } from '../../systems/progression/runtime/index.js';
import { buildLiveRunCompassSurfaceV2 } from '../../systems/ui/runCompass/index.js';
import { formatRealmLesson, statLabel } from './breakthroughRitualPresentation.js';
import type {
  BreakthroughRitualBuildSnapshot,
  BreakthroughRitualSurfaceV1,
  BreakthroughStatDeltaSurface,
  BreakthroughUnlockSurface,
} from './types.js';
import type { ProgressionBreakthroughCompletedEvent } from '../../services/events/GameEvents.js';
import type { RunCompassActionTarget } from '../../systems/ui/runCompass/types.js';

function numericDelta(before: string | number | undefined, after: string | number | undefined): string | null {
  const from = Number(before);
  const to = Number(after);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  const delta = Math.round((to - from) * 100) / 100;
  if (delta === 0) return '0';
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function buildStatDeltas(snapshot: BreakthroughRitualBuildSnapshot): BreakthroughStatDeltaSurface[] {
  const before = snapshot.statSnapshotBefore ?? {};
  const after = snapshot.statSnapshotAfter ?? {};
  const keys = ['maxHp', 'atk', 'def', 'regen', 'crit', 'dodge'];
  const deltas: BreakthroughStatDeltaSurface[] = [];
  keys.forEach((key) => {
      const delta = numericDelta(before[key], after[key]);
      if (!delta || delta === '0') return;
      deltas.push({
        id: key,
        label: statLabel(key),
        before: String(before[key] ?? 'unknown'),
        after: String(after[key] ?? 'unknown'),
        delta,
        tone: delta.startsWith('+') ? 'positive' : 'neutral',
      });
    });
  return deltas.slice(0, 5);
}

function buildCityHandoff(snapshot: BreakthroughRitualBuildSnapshot): BreakthroughRitualSurfaceV1['cityUnlocked'] {
  const cityId = snapshot.cityUnlockedIds?.[0] ?? null;
  if (!cityId) return null;
  const cityName = snapshot.cityNamesById?.[cityId] ?? cityId;
  const lesson = formatRealmLesson(snapshot.toRealm.name);
  const routeTarget = routeTargetForRealmHandoff(snapshot.toRealm.name, cityId, snapshot.contentCapReached === true || snapshot.method === 'cap_transition');
  return {
    cityId,
    cityName,
    ...lesson,
    routeTarget,
  };
}

function routeTargetForRealmHandoff(
  toRealmName: string,
  cityId: string,
  contentCapReached: boolean,
): RunCompassActionTarget {
  if (contentCapReached || /Spirit Severing/i.test(toRealmName)) {
    return { kind: 'tab', tab: 'prestige' };
  }
  if (/Foundation/i.test(toRealmName)) {
    return { kind: 'world_module', cityId, moduleKey: 'forge' };
  }
  if (/Core/i.test(toRealmName)) {
    return { kind: 'world_module', cityId, moduleKey: 'manualPavilion' };
  }
  if (/Nascent/i.test(toRealmName)) {
    return { kind: 'world_module', cityId, moduleKey: 'apothecary' };
  }
  if (/Soul Formation/i.test(toRealmName)) {
    return { kind: 'world_module', cityId, moduleKey: 'ruins' };
  }
  return { kind: 'tab', tab: 'adventure' };
}

function buildUnlockCascade(
  snapshot: BreakthroughRitualBuildSnapshot,
  cityUnlocked: BreakthroughRitualSurfaceV1['cityUnlocked'],
): BreakthroughUnlockSurface[] {
  const unlocks: BreakthroughUnlockSurface[] = [
    {
      id: 'realm-transition',
      title: `${snapshot.fromRealm.name} to ${snapshot.toRealm.name}`,
      detail: snapshot.mode === 'preview' ? 'Preview only; no state has changed yet.' : 'Realm state changed through the existing breakthrough path.',
      category: 'realm',
    },
  ];
  // M.II.1 sub-objective B — the revealed path meridian (the wax-seal-break flourish).
  if (snapshot.meridianRevealed) {
    unlocks.push({
      id: `meridian:${snapshot.meridianRevealed.meridianId}`,
      title: `${snapshot.meridianRevealed.label} meridian opened`,
      detail: snapshot.meridianRevealed.effectLine,
      category: 'meridian',
    });
  }
  if (cityUnlocked) {
    unlocks.push({
      id: `city:${cityUnlocked.cityId}`,
      title: `${cityUnlocked.cityName} opened`,
      detail: cityUnlocked.lessonDetail,
      category: 'city',
      routeTarget: cityUnlocked.routeTarget,
    });
  }
  if (snapshot.contentCapReached) {
    unlocks.push({
      id: 'content-cap',
      title: 'Current authored chapter complete',
      detail: 'Review Reincarnation; no future gate is exposed beyond this slice.',
      category: 'content_cap',
      routeTarget: { kind: 'tab', tab: 'prestige' },
    });
  }
  if (snapshot.heartLawLabel || snapshot.resonanceLabel) {
    unlocks.push({
      id: 'doctrine-echo',
      title: 'Doctrine echo recorded',
      detail: snapshot.resonanceLabel ?? `${snapshot.heartLawLabel} settled into the vessel.`,
      category: 'heart_law',
    });
  }
  return unlocks;
}

function buildDoctrineEcho(snapshot: BreakthroughRitualBuildSnapshot): BreakthroughRitualSurfaceV1['doctrineEcho'] {
  if (!snapshot.heartLawLabel && !snapshot.resonanceLabel) return null;
  return {
    title: 'Doctrine Echo',
    line: `${snapshot.heartLawLabel ?? 'Heart Law'} ${snapshot.resonanceLabel ? `- ${snapshot.resonanceLabel}` : 'settled around the new vessel.'}`,
    heartLawId: snapshot.heartLawId ?? null,
    heartLawLabel: snapshot.heartLawLabel ?? null,
    resonanceLabel: snapshot.resonanceLabel ?? null,
  };
}

function buildLifeMemoryLine(snapshot: BreakthroughRitualBuildSnapshot): string {
  const method = snapshot.method ?? 'unknown';
  if (snapshot.contentCapReached || method === 'cap_transition') return `Echo: ${snapshot.toRealm.name} reached the current chapter cap.`;
  if (method === 'safety_net_bypass') return `Echo: ${snapshot.toRealm.name} formed after Safety Net secured the proof.`;
  if (method === 'clean_clear') return `Echo: ${snapshot.toRealm.name} established by clean clear. This life remembers the crossing.`;
  if (method === 'strained_clear') return `Echo: ${snapshot.toRealm.name} formed after a strained gate clear.`;
  return `Echo: ${snapshot.toRealm.name} entered the life record.`;
}

export function buildBreakthroughRitualSurfaceFromSnapshot(
  snapshot: BreakthroughRitualBuildSnapshot,
): BreakthroughRitualSurfaceV1 {
  const cityUnlocked = snapshot.mode === 'result' ? buildCityHandoff(snapshot) : null;
  const unlockCascade = buildUnlockCascade(snapshot, cityUnlocked);
  const doctrineEcho = buildDoctrineEcho(snapshot);
  const scale = snapshot.toRealm.index > snapshot.fromRealm.index ? 'major_realm' : 'minor_substage';
  return {
    version: 1,
    mode: snapshot.mode,
    scale,
    id: snapshot.id ?? `breakthrough:${snapshot.mode}:${snapshot.createdAt ?? Date.now()}`,
    createdAt: snapshot.createdAt ?? Date.now(),
    fromRealm: snapshot.fromRealm,
    toRealm: snapshot.toRealm,
    proofItemSpent: snapshot.proofItemSpent ?? null,
    qi: snapshot.qi,
    stabilityDelta: snapshot.stabilityDelta ?? null,
    statDelta: buildStatDeltas(snapshot),
    unlockCascade,
    cityUnlocked,
    meridianRevealed: snapshot.meridianRevealed ?? null,
    doctrineEcho,
    lifeMemoryLine: buildLifeMemoryLine(snapshot),
    nextMilestone: snapshot.nextRoute ?? null,
    method: snapshot.method ?? 'unknown',
    warnings: snapshot.warnings ?? [],
    debugNotes: snapshot.debugNotes ?? [],
  };
}

function formatNumberLabel(value: string | number): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  if (Math.abs(numeric) >= 1_000_000) return `${Math.round(numeric / 100_000) / 10}M`;
  if (Math.abs(numeric) >= 1_000) return `${Math.round(numeric / 100) / 10}K`;
  return `${Math.round(numeric)}`;
}

function buildLiveSnapshotBase(mode: 'preview' | 'result'): BreakthroughRitualBuildSnapshot {
  const game = useGameStore.getState();
  const content = useContentStore.getState();
  const currentRealm = REALMS[game.realm.index] ?? REALMS[0];
  const isFinalSubstage = game.realm.substage >= currentRealm.substages;
  const toRealmIndex = isFinalSubstage && hasNextLiveRealm(game.realm.index) ? game.realm.index + 1 : game.realm.index;
  const toRealm = REALMS[toRealmIndex] ?? currentRealm;
  const requiredQi = game.getBreakthroughRequirement();
  const gateItemId = toRealmIndex > game.realm.index
    ? getGateTransitionItemIdForRealmIndex(content.raw, game.realm.index)
    : null;
  const runCompass = buildLiveRunCompassSurfaceV2();
  const fallbackRoute = {
    title: toRealmIndex > game.realm.index ? `Enter ${toRealm.name}` : 'Continue Cultivating',
    detail: 'The Mandate route is sealed here; continue from Cultivation.',
    primaryRouteLabel: 'Continue Cultivating',
    target: { kind: 'tab' as const, tab: 'cultivation' as const },
  };

  return {
    mode,
    fromRealm: { index: game.realm.index, substage: game.realm.substage, name: currentRealm.name, realmId: currentRealm.majorRealm },
    toRealm: { index: toRealmIndex, substage: toRealmIndex > game.realm.index ? 1 : game.realm.substage + 1, name: toRealm.name, realmId: toRealm.majorRealm },
    proofItemSpent: gateItemId ? {
      itemId: gateItemId,
      name: content.maps.itemsById[gateItemId]?.name ?? gateItemId,
      qty: 1,
      source: mode === 'preview' ? 'gate_resolver' : 'fallback',
    } : null,
    qi: {
      requiredLabel: formatNumberLabel(requiredQi),
      spentLabel: mode === 'preview' ? formatNumberLabel(requiredQi) : 'resolved',
      remainingLabel: formatNumberLabel(game.qi),
      wasReady: Number(game.qi) >= Number(requiredQi),
    },
    statSnapshotBefore: { ...game.stats },
    statSnapshotAfter: { ...game.stats },
    cityUnlockedIds: [],
    cityNamesById: Object.fromEntries(Object.entries(content.maps.citiesById).map(([cityId, city]) => [cityId, city.name])),
    currentCityId: useCityStore.getState().currentCityId,
    heartLawId: useCultivationStore.getState().selectedHeartLawId,
    heartLawLabel: useCultivationStore.getState().selectedHeartLawId ?? null,
    resonanceLabel: 'Doctrine resonance steady',
    method: 'unknown',
    contentCapReached: runCompass?.milestone.state === 'content_cap' || runCompass?.prestigeHint?.state === 'cap_recommended',
    nextRoute: runCompass ? {
      title: runCompass.milestone.label,
      detail: runCompass.primaryRoute.detail,
      primaryRouteLabel: runCompass.primaryRoute.actionLabel,
      target: runCompass.primaryRoute.target,
    } : fallbackRoute,
  };
}

export function buildLiveBreakthroughRitualPreviewSurface(): BreakthroughRitualSurfaceV1 {
  return buildBreakthroughRitualSurfaceFromSnapshot(buildLiveSnapshotBase('preview'));
}

export function buildLiveBreakthroughRitualResultSurface(
  event?: ProgressionBreakthroughCompletedEvent | null,
): BreakthroughRitualSurfaceV1 {
  const base = buildLiveSnapshotBase('result');
  const content = useContentStore.getState();
  const payload = event?.payload;
  if (!payload) return buildBreakthroughRitualSurfaceFromSnapshot(base);
  return buildBreakthroughRitualSurfaceFromSnapshot({
    ...base,
    createdAt: payload.timestamp,
    fromRealm: {
      index: payload.fromRealmIndex,
      substage: payload.fromSubstage,
      name: payload.fromRealmName ?? REALMS[payload.fromRealmIndex]?.name ?? 'Unknown Realm',
      realmId: REALMS[payload.fromRealmIndex]?.majorRealm,
    },
    toRealm: {
      index: payload.toRealmIndex,
      substage: payload.toSubstage,
      name: payload.toRealmName ?? REALMS[payload.toRealmIndex]?.name ?? 'Unknown Realm',
      realmId: REALMS[payload.toRealmIndex]?.majorRealm,
    },
    proofItemSpent: payload.gateItemIdSpent ? {
      itemId: payload.gateItemIdSpent,
      name: payload.gateItemNameSpent ?? content.maps.itemsById[payload.gateItemIdSpent]?.name ?? payload.gateItemIdSpent,
      qty: 1,
      source: 'event',
    } : null,
    qi: {
      ...base.qi,
      spentLabel: payload.qiSpent ? formatNumberLabel(payload.qiSpent) : base.qi.spentLabel,
    },
    statSnapshotBefore: payload.statSnapshotBefore ?? base.statSnapshotBefore,
    statSnapshotAfter: payload.statSnapshotAfter ?? base.statSnapshotAfter,
    cityUnlockedIds: payload.cityUnlockedIds ?? [],
    cityNamesById: {
      ...base.cityNamesById,
      ...Object.fromEntries((payload.cityUnlockedIds ?? []).map((cityId, index) => [cityId, payload.cityUnlockedNames?.[index] ?? content.maps.citiesById[cityId]?.name])),
    },
    currentCityId: payload.currentCityId ?? base.currentCityId,
    method: payload.method ?? 'unknown',
    contentCapReached: payload.method === 'cap_transition' || base.contentCapReached,
    // M.II.1 — carry the revealed meridian from the success event into the ritual result.
    meridianRevealed: payload.meridianRevealed ?? null,
  });
}
