/**
 * M.IV.3 ARTS-PORT — preserve-first flag for the live Fortune Draw screen. LEAF module: no React/SCSS/store
 * imports. The Fortune Draw is a NEW `manualPavilionExactMode` ('fortune') in WorldBuildingModal; this resolves
 * the live-vs-fixture choice for the screenshot harness (`?fortune=fixture&fortuneState=<state>`). The legacy
 * pavilion shop + the live pavilion stay reachable (the other modes).
 */

export type FortuneDrawMode = 'live' | 'fixture';

export interface FortuneDrawFlagResolution {
  mode: FortuneDrawMode;
  /** the fixture visual state to seed (harness only). */
  fixtureState: string | null;
}

export function resolveFortuneDrawFlag(search: string): FortuneDrawFlagResolution {
  const params = new URLSearchParams(search ?? '');
  if (params.get('fortune') === 'fixture') {
    return { mode: 'fixture', fixtureState: params.get('fortuneState') };
  }
  return { mode: 'live', fixtureState: null };
}
