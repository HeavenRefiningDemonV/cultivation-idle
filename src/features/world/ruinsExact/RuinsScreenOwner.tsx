import { useMemo } from 'react';
import { useRuinsStore } from '../../../stores/ruinsStore.js';
import { buildRuinsExactSurfaceFromStores } from './buildRuinsExactSurface.js';
import { RuinsExactMockupScreen } from './RuinsExactMockupScreen.js';
import './RuinsExactMockupScreen.scss';

export function RuinsScreenOwner(props: { cityId: string; ruinId?: string | null; forceFixture?: boolean }) {
  const { cityId, ruinId, forceFixture } = props;
  const startRun = useRuinsStore((state) => state.startRun);
  const setAutoRepeat = useRuinsStore((state) => state.setAutoRepeat);
  const autoRepeatDefault = useRuinsStore((state) => state.autoRepeatDefault);
  const activeRun = useRuinsStore((state) => state.activeRun);
  const surface = useMemo(() => buildRuinsExactSurfaceFromStores(cityId, { mode: forceFixture ? 'fixture' : 'live', ruinId }), [cityId, forceFixture, ruinId, activeRun, autoRepeatDefault]);

  return <div className="ruinsScreenOwner" data-testid="ruins-view-screen" data-activity-mode={surface.meta.activityMode}><RuinsExactMockupScreen surface={surface} onPrimaryAction={() => { if (!surface.primaryAction.enabled) return; if (surface.primaryAction.intent === 'enter-ruins' && surface.meta.ruinId) startRun(surface.meta.ruinId); }} onToggleAutoRepeat={() => setAutoRepeat(!autoRepeatDefault)} /></div>;
}
