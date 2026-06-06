const BREATH_MODE_SEMANTICS = Object.freeze({
    balanced: Object.freeze({
        mode: 'balanced',
        label: 'Balanced',
        summary: 'Neutral cycle. Steady Qi flow, steady comprehension, and steady stability.',
        preferredFor: Object.freeze(['cultivate', 'recover']),
        cautions: Object.freeze(['Good default, but it will not specialize verse progress or short burst farming.']),
    }),
    safe: Object.freeze({
        mode: 'safe',
        label: 'Safe',
        summary: 'Controlled cycle. Slower Qi flow in exchange for better comprehension and better stability.',
        preferredFor: Object.freeze(['prepare_breakthrough', 'recover', 'cultivate']),
        cautions: Object.freeze(['Stay here when the foundation is shaky; leave it when raw progress is the real bottleneck.']),
    }),
    fast: Object.freeze({
        mode: 'fast',
        label: 'Fast',
        summary: 'Aggressive cycle. Faster Qi flow in exchange for worse comprehension and worse stability.',
        preferredFor: Object.freeze(['push_fast', 'cultivate']),
        cautions: Object.freeze(['Greedy use is punished while your scripture still needs chapters or your foundation still wobbles.']),
    }),
});
function hasActiveHeartLaw(snapshot) {
    return typeof snapshot.heartLawId === 'string' && snapshot.heartLawId.trim().length > 0;
}
function isHighHeartLawChapter(snapshot) {
    return hasActiveHeartLaw(snapshot) && snapshot.heartLawChapter >= 5;
}
export function getBreathModeSemantics(mode) {
    return BREATH_MODE_SEMANTICS[mode];
}
export function getRecommendedBreathModes(snapshot) {
    if (snapshot.path === 'earth' && snapshot.focusMode === 'body' && hasActiveHeartLaw(snapshot)) {
        return ['safe', 'balanced', 'fast'];
    }
    if (snapshot.path === 'heaven' && snapshot.focusMode === 'spirit' && hasActiveHeartLaw(snapshot) && snapshot.heartLawChapter < 5) {
        return ['fast', 'balanced', 'safe'];
    }
    if (snapshot.path === 'martial' && isHighHeartLawChapter(snapshot)) {
        return ['balanced', 'fast', 'safe'];
    }
    return ['balanced', 'safe', 'fast'];
}
