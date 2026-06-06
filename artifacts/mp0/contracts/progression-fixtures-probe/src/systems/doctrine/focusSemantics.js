const FOCUS_MODE_SEMANTICS = Object.freeze({
    balanced: Object.freeze({
        mode: 'balanced',
        label: 'Balanced',
        summary: 'Neutral posture. Keep Qi growth and combat stats on their baseline when you do not need a deliberate skew.',
        preferredFor: Object.freeze(['heaven', 'earth', 'martial']),
        cautions: Object.freeze(['It does not patch fragility or accelerate cultivation by itself.']),
    }),
    body: Object.freeze({
        mode: 'body',
        label: 'Body',
        summary: 'Durability posture. Trade cultivation speed for a heavier body and firmer defense without changing attack.',
        preferredFor: Object.freeze(['earth', 'martial']),
        cautions: Object.freeze(['Use it to survive or stabilize; it is not the fast answer for raw Qi farming.']),
    }),
    spirit: Object.freeze({
        mode: 'spirit',
        label: 'Spirit',
        summary: 'Qi-first posture. Push cultivation harder and accept a thinner body while you do it.',
        preferredFor: Object.freeze(['heaven']),
        cautions: Object.freeze(['Greed is punished here when your real problem is surviving, not cultivating faster.']),
    }),
});
const FOCUS_RECOMMENDATIONS_BY_PATH = Object.freeze({
    none: Object.freeze(['balanced', 'body', 'spirit']),
    heaven: Object.freeze(['spirit', 'balanced', 'body']),
    earth: Object.freeze(['body', 'balanced', 'spirit']),
    martial: Object.freeze(['balanced', 'body', 'spirit']),
});
export function getFocusModeSemantics(mode) {
    return FOCUS_MODE_SEMANTICS[mode];
}
export function getRecommendedFocusModes(snapshot) {
    const key = snapshot.path ?? 'none';
    return [...FOCUS_RECOMMENDATIONS_BY_PATH[key]];
}
