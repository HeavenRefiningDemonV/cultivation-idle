const DAO_GUIDANCE_OATH_VALUES = ['sealed', 'elder', 'jade'];
const JADE_SLIP_LESSON_VALUES = ['off', 'first_time', 'repeat_until_learned'];
const LOCAL_LENS_BANNER_VALUES = ['hidden', 'compact', 'full'];
const SOURCE_ROUTE_DETAIL_VALUES = ['needed_only', 'always', 'never'];
const ADVANCED_READINESS_MATH_VALUES = ['off', 'collapsed', 'expanded'];
const FAILURE_COACHING_VALUES = ['critical_only', 'every_gate_loss', 'full_reflection'];
const BACKGROUND_REMINDER_VALUES = ['critical_idle_only', 'normal', 'full_optimization'];
const RECENT_OMENS_FEED_VALUES = ['hidden', 'compact', 'full'];
const MANDATE_MOTION_MODE_VALUES = ['follow_story', 'full', 'medium', 'low', 'reduced'];
export const DAO_MANDATE_STANDARD_SPARSE_GUIDANCE_PROFILE = 'elder';
const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const includesValue = (values, value) => typeof value === 'string' && values.includes(value);
export function isDaoMandateGuidanceProfile(value) {
    return includesValue(DAO_GUIDANCE_OATH_VALUES, value);
}
export function isDaoJadeSlipLessonsSetting(value) {
    return includesValue(JADE_SLIP_LESSON_VALUES, value);
}
export function isDaoLocalLensBannersSetting(value) {
    return includesValue(LOCAL_LENS_BANNER_VALUES, value);
}
export function isDaoSourceRouteDetailSetting(value) {
    return includesValue(SOURCE_ROUTE_DETAIL_VALUES, value);
}
export function isDaoAdvancedReadinessMathSetting(value) {
    return includesValue(ADVANCED_READINESS_MATH_VALUES, value);
}
export function isDaoFailureCoachingSetting(value) {
    return includesValue(FAILURE_COACHING_VALUES, value);
}
export function isDaoBackgroundRemindersSetting(value) {
    return includesValue(BACKGROUND_REMINDER_VALUES, value);
}
export function isDaoRecentOmensFeedSetting(value) {
    return includesValue(RECENT_OMENS_FEED_VALUES, value);
}
export function isDaoMandateMotionModeSetting(value) {
    return includesValue(MANDATE_MOTION_MODE_VALUES, value);
}
export function createDefaultDaoMandateGuidanceSettings() {
    return {
        guidanceOath: DAO_MANDATE_STANDARD_SPARSE_GUIDANCE_PROFILE,
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
export function sanitizeDaoMandateGuidanceSettings(input) {
    const defaults = createDefaultDaoMandateGuidanceSettings();
    if (!isRecord(input))
        return defaults;
    return {
        guidanceOath: DAO_MANDATE_STANDARD_SPARSE_GUIDANCE_PROFILE,
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
export function pickDaoMandateGuidanceSettings(input) {
    return sanitizeDaoMandateGuidanceSettings(input);
}
export function resolveDaoMandateEffectiveMotionMode(args) {
    if (args.prefersReducedMotion)
        return 'reduced';
    if (args.mandateMotionMode !== 'follow_story')
        return args.mandateMotionMode;
    return args.storyMotionMode === 'full' ? 'full' : 'reduced';
}
