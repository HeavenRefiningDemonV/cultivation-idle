export interface CultivatorStatEffectSnapshot {
  totalMultiplier: 1;
  additiveBonus: 0;
  activeEffectIds: readonly string[];
  debug: { mode: 'stub_no_gameplay_effect' };
}

export function resolveCultivatorStatEffectSnapshot(): CultivatorStatEffectSnapshot {
  return {
    totalMultiplier: 1,
    additiveBonus: 0,
    activeEffectIds: [],
    debug: { mode: 'stub_no_gameplay_effect' },
  };
}
