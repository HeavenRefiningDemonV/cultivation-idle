import { useMemo } from 'react';
import { useRuinsStore } from '../../../stores/ruinsStore.js';
import { buildRuinsExactSurfaceFromStores } from './buildRuinsExactSurface.js';
import { RuinsExactMockupScreen } from './RuinsExactMockupScreen.js';
import { useRuinsExactActionController } from './useRuinsExactActionController.js';
import './RuinsExactMockupScreen.scss';

export function RuinsScreenOwner(props: { cityId: string; ruinId?: string | null; forceFixture?: boolean }) {
  const { cityId, ruinId, forceFixture } = props;
  const activeRun = useRuinsStore((state) => state.activeRun);
  const autoRepeatDefault = useRuinsStore((state) => state.autoRepeatDefault);
  const progressByRuinId = useRuinsStore((state) => state.progressByRuinId);
  const surface = useMemo(() => buildRuinsExactSurfaceFromStores(cityId, { mode: forceFixture ? 'fixture' : 'live', ruinId }), [cityId, forceFixture, ruinId, activeRun, autoRepeatDefault, progressByRuinId]);
  const actions = useRuinsExactActionController({ cityId, ruinId: surface.meta.ruinId ?? ruinId, surface });

  return <div className="ruinsScreenOwner" data-testid="ruins-view-screen" data-activity-mode={surface.meta.activityMode}><RuinsExactMockupScreen surface={surface} {...actions} /></div>;
}
