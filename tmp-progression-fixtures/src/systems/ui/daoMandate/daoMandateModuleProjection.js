import { useUIStore } from '../../../stores/uiStore.js';
import { buildLiveDaoMandateSurfaceV1, } from './buildDaoMandateSurfaceV1.js';
import { applyDaoMandateVisibility, } from './daoMandateVisibility.js';
import { pickDaoMandateGuidanceSettings, resolveDaoMandateEffectiveMotionMode, } from './daoMandateGuidanceSettings.js';
import { buildDaoMandateModuleSourceSinkSurface, } from './daoMandateSourceMap.js';
function variantForSourceRouteDetail(sourceRouteDetail) {
    if (sourceRouteDetail === 'never')
        return 'compact';
    if (sourceRouteDetail === 'always')
        return 'expanded';
    return 'default';
}
export function buildLiveDaoMandateModuleSourceSinkProjection(args) {
    const uiSettings = useUIStore.getState().settings;
    const guidanceSettings = pickDaoMandateGuidanceSettings(uiSettings);
    const rawMandate = buildLiveDaoMandateSurfaceV1({
        currentScreen: args.currentScreen,
        guidanceProfile: guidanceSettings.guidanceOath,
    });
    const visibleMandate = applyDaoMandateVisibility(rawMandate, { settings: guidanceSettings });
    const sourceSink = buildDaoMandateModuleSourceSinkSurface({
        mandate: visibleMandate,
        currentCityId: args.currentCityId ?? visibleMandate.milestone.currentCityId,
        currentModuleKey: args.currentModuleKey,
        guidanceProfile: guidanceSettings.guidanceOath,
    });
    if (!sourceSink)
        return null;
    if (sourceSink.relation === 'quiet' && sourceSink.entries.length === 0) {
        return null;
    }
    return {
        sourceSink,
        profile: guidanceSettings.guidanceOath,
        variant: variantForSourceRouteDetail(guidanceSettings.sourceRouteDetail),
        motionMode: resolveDaoMandateEffectiveMotionMode({
            mandateMotionMode: guidanceSettings.mandateMotionMode,
            storyMotionMode: uiSettings.storyMotionMode,
        }),
    };
}
