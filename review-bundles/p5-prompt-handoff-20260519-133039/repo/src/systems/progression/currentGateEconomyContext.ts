import type { ValidatedContent } from '../../content/index.js';
import { getLiveRealmByIndex, getNextLiveRealm, isAtSemesterCap } from './runtime/liveRealmProjection.js';

export type CurrentGateEconomyContextSource = 'progression-contract' | 'run-compass' | 'trial-lifecycle' | 'fallback-city';

export interface CurrentGateEconomyContext {
  gateId: string | null;
  transitionId: string | null;
  fromRealm: string;
  toRealm: string | null;
  gateLabel: string;
  gateIndex: number | null;
  cityId: string | null;
  cityIndex: number | null;
  isContentCap: boolean;
  source: CurrentGateEconomyContextSource;
}

function compactRealmGateLabel(name: string | null | undefined): string {
  const compact = (name ?? 'Current')
    .replace(/\bEstablishment\b/giu, '')
    .replace(/\s+/gu, ' ')
    .trim();
  return `${compact || 'Current'} Gate`;
}

function fromRealmIdForTrial(trial: ValidatedContent['trials'][number]): string | null {
  const rule = trial.eligibilityRule;
  if (!rule || typeof rule === 'string') return null;
  const fromMajorRealm = (rule as { fromMajorRealm?: unknown }).fromMajorRealm;
  return typeof fromMajorRealm === 'string' ? fromMajorRealm : null;
}

export function buildCurrentGateEconomyContext(input: {
  content: Pick<ValidatedContent, 'cities' | 'economy' | 'trials'>;
  realmIndex: number;
  cityId?: string | null;
  source?: CurrentGateEconomyContextSource;
}): CurrentGateEconomyContext {
  const currentRealm = getLiveRealmByIndex(input.realmIndex);
  const nextRealm = getNextLiveRealm(input.realmIndex);
  const isContentCap = isAtSemesterCap(input.realmIndex) || !nextRealm;
  const currentRealmConfig = input.content.economy.majorRealms.find((realm) => realm.id === currentRealm.id) ?? null;
  const nextRealmConfig = nextRealm
    ? input.content.economy.majorRealms.find((realm) => realm.id === nextRealm.id) ?? null
    : null;
  const trial = input.content.trials.find((entry) => fromRealmIdForTrial(entry) === currentRealm.id) ?? null;
  const contextCityId = trial?.cityId ?? input.cityId ?? null;
  const contextCity = contextCityId ? input.content.cities.find((city) => city.id === contextCityId) ?? null : null;

  if (isContentCap) {
    return {
      gateId: null,
      transitionId: null,
      fromRealm: currentRealmConfig?.name ?? currentRealm.name,
      toRealm: null,
      gateLabel: 'Content Cap',
      gateIndex: null,
      cityId: contextCityId,
      cityIndex: contextCity?.index ?? null,
      isContentCap: true,
      source: input.source ?? 'progression-contract',
    };
  }

  return {
    gateId: trial?.id ?? null,
    transitionId: trial?.gatesToMajorRealm ? `${currentRealm.id}_to_${trial.gatesToMajorRealm}` : null,
    fromRealm: currentRealmConfig?.name ?? currentRealm.name,
    toRealm: nextRealmConfig?.name ?? nextRealm?.name ?? null,
    gateLabel: compactRealmGateLabel(nextRealmConfig?.name ?? nextRealm?.name),
    gateIndex: currentRealm.index + 1,
    cityId: contextCityId,
    cityIndex: contextCity?.index ?? null,
    isContentCap: false,
    source: input.source ?? 'progression-contract',
  };
}
