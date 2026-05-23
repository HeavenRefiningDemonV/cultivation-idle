import { useMemo } from 'react';
import { useContentStore } from '../../../stores/contentStore.js';
import { useRuinsStore } from '../../../stores/ruinsStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { buildRuinsExactSurfaceFromStores } from './buildRuinsExactSurface.js';
import { RuinsExactMockupScreen } from './RuinsExactMockupScreen.js';
import { useRuinsExactActionController } from './useRuinsExactActionController.js';
import { routeCombatAftermathTarget } from '../../combatAftermath/index.js';
import {
  applyDaoMandateVisibility,
  buildLiveDaoMandateSurfaceV1,
  pickDaoMandateGuidanceSettings,
  resolveDaoMandateEffectiveMotionMode,
} from '../../../systems/ui/daoMandate/index.js';
import {
  applyLocalMandateLensVisibility,
  buildLocalMandateLensSurface,
} from '../../../systems/world/localMandateLensSurface.js';
import { normalizeCityModulesForLiveSlice } from '../../../systems/world/liveWorldSchema.js';
import type { RuinsMandateLensView } from './components/RuinsTopRegion.js';
import './RuinsExactMockupScreen.scss';
import '../../combatAftermath/CombatAftermathCard.scss';

export function RuinsScreenOwner(props: { cityId: string; ruinId?: string | null; forceFixture?: boolean }) {
  const { cityId, ruinId, forceFixture } = props;
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const activeRun = useRuinsStore((state) => state.activeRun);
  const autoRepeatDefault = useRuinsStore((state) => state.autoRepeatDefault);
  const progressByRuinId = useRuinsStore((state) => state.progressByRuinId);
  const uiSettings = useUIStore((state) => state.settings);
  const surface = useMemo(() => buildRuinsExactSurfaceFromStores(cityId, { mode: forceFixture ? 'fixture' : 'live', ruinId }), [cityId, forceFixture, ruinId, activeRun, autoRepeatDefault, progressByRuinId]);
  const guidanceSettings = useMemo(() => pickDaoMandateGuidanceSettings(uiSettings), [uiSettings]);
  const mandateMotionMode = useMemo(
    () => resolveDaoMandateEffectiveMotionMode({
      mandateMotionMode: guidanceSettings.mandateMotionMode,
      storyMotionMode: uiSettings.storyMotionMode,
    }),
    [guidanceSettings.mandateMotionMode, uiSettings.storyMotionMode],
  );
  const mandateLens = useMemo((): RuinsMandateLensView | null => {
    if (!city) return null;
    const rawMandate = buildLiveDaoMandateSurfaceV1({
      currentScreen: 'ruins',
      guidanceProfile: guidanceSettings.guidanceOath,
    });
    const visibleMandate = applyDaoMandateVisibility(rawMandate, { settings: guidanceSettings });
    const rawLens = buildLocalMandateLensSurface({
      mandate: visibleMandate,
      cityId,
      moduleKey: 'ruins',
      visibleModules: normalizeCityModulesForLiveSlice(city.modules),
      isModuleAvailable: surface.meta.activityMode !== 'unavailable',
      hasActiveForegroundHere: surface.meta.activityMode === 'active',
    });
    const visibleLens = applyLocalMandateLensVisibility(rawLens, visibleMandate, guidanceSettings);
    if (!visibleLens) return null;
    return {
      lens: visibleLens,
      profile: guidanceSettings.guidanceOath,
      motionMode: mandateMotionMode,
      variant: guidanceSettings.localLensBanners === 'compact'
        ? 'compact'
        : guidanceSettings.localLensBanners === 'full' ? 'full' : 'default',
    };
  }, [city, cityId, guidanceSettings, mandateMotionMode, surface.meta.activityMode]);
  const actions = useRuinsExactActionController({ cityId, ruinId: surface.meta.ruinId ?? ruinId, surface });

  return <div className="ruinsScreenOwner" data-testid="ruins-view-screen" data-activity-mode={surface.meta.activityMode}><RuinsExactMockupScreen surface={surface} mandateLens={mandateLens} {...actions} onAftermathRoute={routeCombatAftermathTarget} /></div>;
}
