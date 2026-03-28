export const CULTIVATION_CONSUMABLE_FAMILY_REGISTRY = {
    circulation: {
        family: 'circulation',
        label: 'Circulation',
        shortLabel: 'Qi flow',
        description: 'Improves raw qi circulation and passive qi income.',
        sortOrder: 0,
    },
    warmth: {
        family: 'warmth',
        label: 'Meridian Warmth',
        shortLabel: 'Warmth',
        description: 'Steadies the meridians for mixed qi and stability gains.',
        sortOrder: 1,
    },
    doctrine: {
        family: 'doctrine',
        label: 'Doctrine',
        shortLabel: 'Insight',
        description: 'Sharpens study, comprehension, and insight cadence.',
        sortOrder: 2,
    },
    breakthrough: {
        family: 'breakthrough',
        label: 'Breakthrough',
        shortLabel: 'Breakthrough',
        description: 'Reduces major breakthrough cost and stores one stability surge.',
        sortOrder: 3,
    },
};
export const DEFAULT_CULTIVATION_CONSUMABLE_MODIFIERS = {
    qiRateMult: 1,
    comprehensionGainMult: 1,
    stabilityGainMult: 1,
    insightFrequencyMult: 1,
    majorBreakthroughQiCostMult: 1,
    majorBreakthroughStabilityBonus: 0,
};
