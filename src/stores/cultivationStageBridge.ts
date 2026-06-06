let cultivationStageNumberGetter: (() => number) | null = null;

export function registerCultivationStageNumberGetter(getter: () => number): void {
  cultivationStageNumberGetter = getter;
}

export function readCultivationStageNumber(fallback = 1): number {
  if (!cultivationStageNumberGetter) return fallback;
  try {
    const value = cultivationStageNumberGetter();
    return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
  } catch {
    return fallback;
  }
}
