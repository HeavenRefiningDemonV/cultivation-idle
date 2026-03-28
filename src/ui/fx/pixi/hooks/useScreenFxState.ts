import { useMemo } from 'react';

export interface ScreenFxStateInput {
  screenKey: string;
  sceneKey?: string;
  active?: boolean;
  visible?: boolean;
  emphasis?: number;
  paused?: boolean;
  density?: number;
  tags?: readonly string[];
  metadata?: Record<string, unknown>;
}

export interface ScreenFxState {
  screenKey: string;
  sceneKey: string;
  active: boolean;
  visible: boolean;
  emphasis: number;
  paused: boolean;
  density: number;
  tags: readonly string[];
  metadata: Record<string, unknown>;
  stateKey: string;
}

const normalizeUnit = (value: number | undefined, fallback: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, value));
};

const stableMetadataHash = (value: Record<string, unknown>): string => {
  const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
};

export function useScreenFxState(input: ScreenFxStateInput): ScreenFxState {
  const {
    screenKey,
    sceneKey,
    active = true,
    visible = true,
    emphasis,
    paused = false,
    density,
    tags,
    metadata,
  } = input;

  return useMemo(() => {
    const normalizedSceneKey = sceneKey ?? screenKey;
    const normalizedTags = Object.freeze([...(tags ?? [])]);
    const normalizedMetadata = Object.freeze({ ...(metadata ?? {}) });
    const normalizedEmphasis = normalizeUnit(emphasis, 0.5);
    const normalizedDensity = normalizeUnit(density, 0.5);

    const stateKey = [
      screenKey,
      normalizedSceneKey,
      active ? '1' : '0',
      visible ? '1' : '0',
      paused ? '1' : '0',
      normalizedEmphasis.toFixed(3),
      normalizedDensity.toFixed(3),
      normalizedTags.join(','),
      stableMetadataHash(normalizedMetadata),
    ].join('|');

    return {
      screenKey,
      sceneKey: normalizedSceneKey,
      active,
      visible,
      paused,
      emphasis: normalizedEmphasis,
      density: normalizedDensity,
      tags: normalizedTags,
      metadata: normalizedMetadata,
      stateKey,
    };
  }, [active, density, emphasis, metadata, paused, sceneKey, screenKey, tags, visible]);
}
