export const OFFLINE_PROGRESSION_CONTRACT = {
    pipelineId: 'offline_progression_v1',
    appliesTo: ['cultivation', 'queued_actions', 'expeditions'],
    excludes: ['combat'],
    maxCatchupSeconds: 43200,
    cultivationPolicy: {
        mode: 'passive_scaled_efficiency',
        baseEfficiency: 0.5,
        prestigeEfficiencyPerLevel: 0.08,
        maxEfficiency: 0.9,
        meditatingOnly: false,
    },
    timerAdvancedSystems: ['queued_actions', 'expeditions'],
    summaryParts: ['qi_gained', 'queued_actions', 'expeditions'],
};
