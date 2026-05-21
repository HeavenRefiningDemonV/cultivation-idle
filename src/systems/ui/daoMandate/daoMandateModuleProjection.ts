import { useUIStore } from '../../../stores/uiStore.js';
import {
  buildLiveDaoMandateSurfaceV1,
} from './buildDaoMandateSurfaceV1.js';
import {
  applyDaoMandateVisibility,
} from './daoMandateVisibility.js';
import {
  pickDaoMandateGuidanceSettings,
  resolveDaoMandateEffectiveMotionMode,
  type DaoMandateEffectiveMotionMode,
} from './daoMandateGuidanceSettings.js';
import {
  buildDaoMandateModuleSourceSinkSurface,
  type DaoMandateModuleSourceSinkSurface,
  type DaoMandateSourceModuleKey,
} from './daoMandateSourceMap.js';
import type { DaoMandateGuidanceProfile } from './daoMandateTypes.js';

export interface DaoMandateModuleSourceSinkProjection {
  sourceSink: DaoMandateModuleSourceSinkSurface;
  profile: DaoMandateGuidanceProfile;
  variant: 'compact' | 'default' | 'expanded';
  motionMode: DaoMandateEffectiveMotionMode;
}

export interface BuildLiveDaoMandateModuleSourceSinkProjectionArgs {
  currentCityId?: string | null;
  currentModuleKey: DaoMandateSourceModuleKey;
  currentScreen: string;
}

function variantForProfile(profile: DaoMandateGuidanceProfile): DaoMandateModuleSourceSinkProjection['variant'] {
  if (profile === 'sealed') return 'compact';
  if (profile === 'jade') return 'expanded';
  return 'default';
}

export function buildLiveDaoMandateModuleSourceSinkProjection(
  args: BuildLiveDaoMandateModuleSourceSinkProjectionArgs,
): DaoMandateModuleSourceSinkProjection | null {
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
  if (!sourceSink) return null;
  if (
    guidanceSettings.guidanceOath === 'sealed'
    && sourceSink.relation === 'quiet'
    && sourceSink.entries.length === 0
  ) {
    return null;
  }

  return {
    sourceSink,
    profile: guidanceSettings.guidanceOath,
    variant: variantForProfile(guidanceSettings.guidanceOath),
    motionMode: resolveDaoMandateEffectiveMotionMode({
      mandateMotionMode: guidanceSettings.mandateMotionMode,
      storyMotionMode: uiSettings.storyMotionMode,
    }),
  };
}
