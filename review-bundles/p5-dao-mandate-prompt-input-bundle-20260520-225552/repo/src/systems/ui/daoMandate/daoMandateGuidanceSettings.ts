import type { StoryMotionMode } from '../../../features/story/storyTypes.js';
import type { DaoMandateGuidanceProfile } from './daoMandateTypes.js';

export type DaoJadeSlipLessonsSetting = 'off' | 'first_time' | 'repeat_until_learned';
export type DaoLocalLensBannersSetting = 'hidden' | 'compact' | 'full';
export type DaoSourceRouteDetailSetting = 'needed_only' | 'always' | 'never';
export type DaoAdvancedReadinessMathSetting = 'off' | 'collapsed' | 'expanded';
export type DaoFailureCoachingSetting = 'critical_only' | 'every_gate_loss' | 'full_reflection';
export type DaoBackgroundRemindersSetting = 'critical_idle_only' | 'normal' | 'full_optimization';
export type DaoRecentOmensFeedSetting = 'hidden' | 'compact' | 'full';
export type DaoMandateMotionModeSetting = 'follow_story' | 'full' | 'medium' | 'low' | 'reduced';
export type DaoMandateEffectiveMotionMode = 'full' | 'medium' | 'low' | 'reduced';

export interface DaoMandateGuidanceSettings {
  guidanceOath: DaoMandateGuidanceProfile;
  jadeSlipLessons: DaoJadeSlipLessonsSetting;
  localLensBanners: DaoLocalLensBannersSetting;
  sourceRouteDetail: DaoSourceRouteDetailSetting;
  advancedReadinessMath: DaoAdvancedReadinessMathSetting;
  failureCoaching: DaoFailureCoachingSetting;
  backgroundReminders: DaoBackgroundRemindersSetting;
  recentOmensFeed: DaoRecentOmensFeedSetting;
  mandateMotionMode: DaoMandateMotionModeSetting;
}

const DAO_GUIDANCE_OATH_VALUES = ['sealed', 'elder', 'jade'] as const;
const JADE_SLIP_LESSON_VALUES = ['off', 'first_time', 'repeat_until_learned'] as const;
const LOCAL_LENS_BANNER_VALUES = ['hidden', 'compact', 'full'] as const;
const SOURCE_ROUTE_DETAIL_VALUES = ['needed_only', 'always', 'never'] as const;
const ADVANCED_READINESS_MATH_VALUES = ['off', 'collapsed', 'expanded'] as const;
const FAILURE_COACHING_VALUES = ['critical_only', 'every_gate_loss', 'full_reflection'] as const;
const BACKGROUND_REMINDER_VALUES = ['critical_idle_only', 'normal', 'full_optimization'] as const;
const RECENT_OMENS_FEED_VALUES = ['hidden', 'compact', 'full'] as const;
const MANDATE_MOTION_MODE_VALUES = ['follow_story', 'full', 'medium', 'low', 'reduced'] as const;

export const DAO_GUIDANCE_OATH_OPTIONS = [
  {
    id: 'sealed',
    title: 'Sealed Counsel',
    subtitle: 'Low guidance',
    description: 'A quiet Mandate for discovery. Shows the current obstruction and one direct route, while hiding most lessons, source maps, optional optimizations, and background reminders.',
  },
  {
    id: 'elder',
    title: "Elder's Counsel",
    subtitle: 'Default guidance',
    description: 'A balanced Mandate for normal play. Shows the main route, concise proof rows, relevant local hints, short failure guidance, and useful background reminders.',
  },
  {
    id: 'jade',
    title: 'Jade Slip Tutor',
    subtitle: 'Maximum guidance',
    description: 'A teaching Mandate for new, returning, or testing players. Shows full ledgers, source and fallback routes, advanced readiness evidence, repeated lessons, and richer failure coaching.',
  },
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const includesValue = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (values as readonly string[]).includes(value);

export function isDaoMandateGuidanceProfile(value: unknown): value is DaoMandateGuidanceProfile {
  return includesValue(DAO_GUIDANCE_OATH_VALUES, value);
}

export function isDaoJadeSlipLessonsSetting(value: unknown): value is DaoJadeSlipLessonsSetting {
  return includesValue(JADE_SLIP_LESSON_VALUES, value);
}

export function isDaoLocalLensBannersSetting(value: unknown): value is DaoLocalLensBannersSetting {
  return includesValue(LOCAL_LENS_BANNER_VALUES, value);
}

export function isDaoSourceRouteDetailSetting(value: unknown): value is DaoSourceRouteDetailSetting {
  return includesValue(SOURCE_ROUTE_DETAIL_VALUES, value);
}

export function isDaoAdvancedReadinessMathSetting(value: unknown): value is DaoAdvancedReadinessMathSetting {
  return includesValue(ADVANCED_READINESS_MATH_VALUES, value);
}

export function isDaoFailureCoachingSetting(value: unknown): value is DaoFailureCoachingSetting {
  return includesValue(FAILURE_COACHING_VALUES, value);
}

export function isDaoBackgroundRemindersSetting(value: unknown): value is DaoBackgroundRemindersSetting {
  return includesValue(BACKGROUND_REMINDER_VALUES, value);
}

export function isDaoRecentOmensFeedSetting(value: unknown): value is DaoRecentOmensFeedSetting {
  return includesValue(RECENT_OMENS_FEED_VALUES, value);
}

export function isDaoMandateMotionModeSetting(value: unknown): value is DaoMandateMotionModeSetting {
  return includesValue(MANDATE_MOTION_MODE_VALUES, value);
}

export function createDefaultDaoMandateGuidanceSettings(): DaoMandateGuidanceSettings {
  return {
    guidanceOath: 'elder',
    jadeSlipLessons: 'first_time',
    localLensBanners: 'compact',
    sourceRouteDetail: 'needed_only',
    advancedReadinessMath: 'collapsed',
    failureCoaching: 'every_gate_loss',
    backgroundReminders: 'normal',
    recentOmensFeed: 'compact',
    mandateMotionMode: 'follow_story',
  };
}

export function sanitizeDaoMandateGuidanceSettings(input: unknown): DaoMandateGuidanceSettings {
  const defaults = createDefaultDaoMandateGuidanceSettings();
  if (!isRecord(input)) return defaults;

  return {
    guidanceOath: isDaoMandateGuidanceProfile(input.guidanceOath)
      ? input.guidanceOath
      : defaults.guidanceOath,
    jadeSlipLessons: isDaoJadeSlipLessonsSetting(input.jadeSlipLessons)
      ? input.jadeSlipLessons
      : defaults.jadeSlipLessons,
    localLensBanners: isDaoLocalLensBannersSetting(input.localLensBanners)
      ? input.localLensBanners
      : defaults.localLensBanners,
    sourceRouteDetail: isDaoSourceRouteDetailSetting(input.sourceRouteDetail)
      ? input.sourceRouteDetail
      : defaults.sourceRouteDetail,
    advancedReadinessMath: isDaoAdvancedReadinessMathSetting(input.advancedReadinessMath)
      ? input.advancedReadinessMath
      : defaults.advancedReadinessMath,
    failureCoaching: isDaoFailureCoachingSetting(input.failureCoaching)
      ? input.failureCoaching
      : defaults.failureCoaching,
    backgroundReminders: isDaoBackgroundRemindersSetting(input.backgroundReminders)
      ? input.backgroundReminders
      : defaults.backgroundReminders,
    recentOmensFeed: isDaoRecentOmensFeedSetting(input.recentOmensFeed)
      ? input.recentOmensFeed
      : defaults.recentOmensFeed,
    mandateMotionMode: isDaoMandateMotionModeSetting(input.mandateMotionMode)
      ? input.mandateMotionMode
      : defaults.mandateMotionMode,
  };
}

export function pickDaoMandateGuidanceSettings(input: unknown): DaoMandateGuidanceSettings {
  return sanitizeDaoMandateGuidanceSettings(input);
}

export function resolveDaoMandateEffectiveMotionMode(args: {
  mandateMotionMode: DaoMandateMotionModeSetting;
  storyMotionMode: StoryMotionMode;
  prefersReducedMotion?: boolean;
}): DaoMandateEffectiveMotionMode {
  if (args.prefersReducedMotion) return 'reduced';
  if (args.mandateMotionMode !== 'follow_story') return args.mandateMotionMode;
  return args.storyMotionMode === 'full' ? 'full' : 'reduced';
}
