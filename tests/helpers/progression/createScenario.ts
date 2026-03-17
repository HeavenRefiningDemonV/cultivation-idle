import type { ProgressionScenario, ScenarioOverrides } from './scenarioTypes.js';

const mergeDeep = <T extends object>(base: T, overrides?: Partial<T>): T => {
  if (!overrides) return base;
  const result = { ...base } as Record<string, unknown>;

  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) {
      result[key] = value;
      continue;
    }
    const baseValue = result[key];
    if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof baseValue === 'object' &&
      baseValue != null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergeDeep(baseValue as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
};

export const createScenario = (base: ProgressionScenario, overrides?: ScenarioOverrides): ProgressionScenario =>
  mergeDeep(base, overrides as Partial<ProgressionScenario> | undefined);
