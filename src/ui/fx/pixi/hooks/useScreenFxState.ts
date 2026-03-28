import { useMemo } from 'react';

export type ScreenFxReadinessBand = 'cold' | 'warming' | 'ready';
export type ScreenFxRecommendationState = 'neutral' | 'suggested' | 'urgent';

/**
 * Lightweight scene-input seam for FX-only components.
 * Keep this normalized state small and avoid duplicating gameplay store logic.
 */
export interface ScreenFxStateInput {
  screenKey: string;
  activeSceneKey?: string;
  activeTabKey?: string;
  selectedCityId?: string | null;
  selectedModuleId?: string | null;
  readinessBand?: ScreenFxReadinessBand;
  heroFlags?: {
    focused?: boolean;
    empowered?: boolean;
    wounded?: boolean;
  };
  recommendationState?: ScreenFxRecommendationState;
  reducedMotion?: boolean;
  tags?: readonly string[];
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface ScreenFxState {
  screenKey: string;
  activeSceneKey: string;
  activeTabKey: string;
  selectedCityId: string | null;
  selectedModuleId: string | null;
  readinessBand: ScreenFxReadinessBand;
  heroFlags: {
    focused: boolean;
    empowered: boolean;
    wounded: boolean;
  };
  recommendationState: ScreenFxRecommendationState;
  reducedMotion: boolean;
  tags: readonly string[];
  metadata: Readonly<Record<string, string | number | boolean | null>>;
  stateKey: string;
}

function stableMetadata(
  metadata: Record<string, string | number | boolean | null | undefined> | undefined,
): Readonly<Record<string, string | number | boolean | null>> {
  const normalized = Object.entries(metadata ?? {}).reduce<Record<string, string | number | boolean | null>>(
    (acc, [key, value]) => {
      acc[key] = value ?? null;
      return acc;
    },
    {},
  );

  return Object.freeze(normalized);
}

function stableMetadataHash(value: Readonly<Record<string, string | number | boolean | null>>): string {
  return JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

export function useScreenFxState(input: ScreenFxStateInput): ScreenFxState {
  return useMemo(() => {
    const activeSceneKey = input.activeSceneKey ?? input.screenKey;
    const activeTabKey = input.activeTabKey ?? 'default';
    const selectedCityId = input.selectedCityId ?? null;
    const selectedModuleId = input.selectedModuleId ?? null;
    const readinessBand = input.readinessBand ?? 'ready';
    const recommendationState = input.recommendationState ?? 'neutral';
    const reducedMotion = input.reducedMotion ?? false;
    const tags = Object.freeze([...(input.tags ?? [])]);
    const metadata = stableMetadata(input.metadata);

    const heroFlags = Object.freeze({
      focused: !!input.heroFlags?.focused,
      empowered: !!input.heroFlags?.empowered,
      wounded: !!input.heroFlags?.wounded,
    });

    const stateKey = [
      input.screenKey,
      activeSceneKey,
      activeTabKey,
      selectedCityId ?? '-',
      selectedModuleId ?? '-',
      readinessBand,
      heroFlags.focused ? 'f1' : 'f0',
      heroFlags.empowered ? 'e1' : 'e0',
      heroFlags.wounded ? 'w1' : 'w0',
      recommendationState,
      reducedMotion ? 'rm1' : 'rm0',
      tags.join(','),
      stableMetadataHash(metadata),
    ].join('|');

    return {
      screenKey: input.screenKey,
      activeSceneKey,
      activeTabKey,
      selectedCityId,
      selectedModuleId,
      readinessBand,
      heroFlags,
      recommendationState,
      reducedMotion,
      tags,
      metadata,
      stateKey,
    };
  }, [
    input.activeSceneKey,
    input.activeTabKey,
    input.heroFlags?.empowered,
    input.heroFlags?.focused,
    input.heroFlags?.wounded,
    input.metadata,
    input.readinessBand,
    input.recommendationState,
    input.reducedMotion,
    input.screenKey,
    input.selectedCityId,
    input.selectedModuleId,
    input.tags,
  ]);
}
