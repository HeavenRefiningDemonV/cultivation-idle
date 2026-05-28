import { useMemo } from 'react';
import { useRuinsStore } from '../../../stores/ruinsStore.js';
import { buildRuinsExactSurfaceFromStores } from './buildRuinsExactSurface.js';
import { RuinsExactMockupScreen } from './RuinsExactMockupScreen.js';
import { useRuinsExactActionController } from './useRuinsExactActionController.js';
import { routeCombatAftermathTarget } from '../../combatAftermath/index.js';
import { PERF_LABELS, time } from '../../../services/performance/index.js';
import { PerfProfiler, useRenderCounter } from '../../../services/performance/perfReact.js';
import './RuinsExactMockupScreen.scss';
import '../../combatAftermath/CombatAftermathCard.scss';

export function RuinsScreenOwner(props: { cityId: string; ruinId?: string | null; forceFixture?: boolean }) {
  useRenderCounter(PERF_LABELS.renderRuinsScreenOwner);
  const { cityId, ruinId, forceFixture } = props;
  const activeRun = useRuinsStore((state) => state.activeRun);
  const autoRepeatDefault = useRuinsStore((state) => state.autoRepeatDefault);
  const progressByRuinId = useRuinsStore((state) => state.progressByRuinId);
  const surface = useMemo(
    () => time(PERF_LABELS.surfaceRuins, () => buildRuinsExactSurfaceFromStores(cityId, { mode: forceFixture ? 'fixture' : 'live', ruinId })),
    [cityId, forceFixture, ruinId, activeRun, autoRepeatDefault, progressByRuinId],
  );
  const actions = useRuinsExactActionController({ cityId, ruinId: surface.meta.ruinId ?? ruinId, surface });

  return (
    <PerfProfiler id={PERF_LABELS.renderRuinsScreenOwner}>
      <div className="ruinsScreenOwner" data-testid="ruins-view-screen" data-activity-mode={surface.meta.activityMode}><RuinsExactMockupScreen surface={surface} {...actions} onAftermathRoute={routeCombatAftermathTarget} /></div>
    </PerfProfiler>
  );
}
