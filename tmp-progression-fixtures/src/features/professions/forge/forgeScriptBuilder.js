import { isRuneBlueprint } from '../../../content/forge.js';
const DEFAULT_HEAT_TARGETS = [600, 640, 680];
const DEFAULT_HEAT_TOLERANCES = [20, 18, 16];
const DEFAULT_HAMMER_HITS = [3, 3];
const DEFAULT_SPECIAL_HITS = 4;
const RING_QTE_TYPES = new Set(['HAMMER_PATTERN', 'ENGRAVE_RUNE', 'LAY_FORMATION']);
const resolvePatternId = (blueprintId, stepType, index) => `${blueprintId}:${stepType}:${index}`;
const applyPatternIds = (steps, blueprintId) => steps.map((step, index) => {
    if (!RING_QTE_TYPES.has(step.type))
        return step;
    if ('patternId' in step && typeof step.patternId === 'string' && step.patternId.length > 0) {
        return step;
    }
    return { ...step, patternId: resolvePatternId(blueprintId, step.type, index) };
});
const resolveSpecialStep = (blueprint) => {
    if (blueprint.type === 'service') {
        if (blueprint.service === 'temper')
            return { blueprintId: blueprint.id, specialStep: 'TEMPER' };
        if (blueprint.service === 'refine')
            return { blueprintId: blueprint.id, specialStep: 'TEMPER' };
    }
    if (isRuneBlueprint(blueprint)) {
        return {
            blueprintId: blueprint.id,
            specialStep: 'ENGRAVE_RUNE',
            runeFamily: blueprint.output?.itemId?.replace('rune_', '') ?? 'rune',
        };
    }
    if (blueprint.id.includes('formation')) {
        return {
            blueprintId: blueprint.id,
            specialStep: 'LAY_FORMATION',
            formationId: blueprint.output?.itemId,
        };
    }
    return { blueprintId: blueprint.id, specialStep: 'TEMPER' };
};
export function buildDefaultForgeScript(args) {
    const steps = [
        {
            id: 'heat_1',
            type: 'HEAT_TO',
            targetHeat: DEFAULT_HEAT_TARGETS[0],
            tolerance: DEFAULT_HEAT_TOLERANCES[0],
        },
        {
            id: 'strike_1',
            type: 'HAMMER_PATTERN',
            hits: DEFAULT_HAMMER_HITS[0],
            shrinkMs: 700,
            tolerance: 0.22,
            difficulty: 1,
            patternId: resolvePatternId(args.blueprintId, 'HAMMER_PATTERN', 1),
        },
        {
            id: 'heat_2',
            type: 'HEAT_TO',
            targetHeat: DEFAULT_HEAT_TARGETS[1],
            tolerance: DEFAULT_HEAT_TOLERANCES[1],
        },
        {
            id: 'strike_2',
            type: 'HAMMER_PATTERN',
            hits: DEFAULT_HAMMER_HITS[1],
            shrinkMs: 680,
            tolerance: 0.2,
            difficulty: 1,
            patternId: resolvePatternId(args.blueprintId, 'HAMMER_PATTERN', 3),
        },
        {
            id: 'heat_3',
            type: 'HEAT_TO',
            targetHeat: DEFAULT_HEAT_TARGETS[2],
            tolerance: DEFAULT_HEAT_TOLERANCES[2],
        },
    ];
    switch (args.specialStep) {
        case 'ENGRAVE_RUNE':
            steps.push({
                id: 'engrave_rune',
                type: 'ENGRAVE_RUNE',
                hits: DEFAULT_SPECIAL_HITS,
                difficulty: 1,
                patternId: resolvePatternId(args.blueprintId, 'ENGRAVE_RUNE', 5),
                runeFamily: args.runeFamily,
                optional: false,
            });
            break;
        case 'LAY_FORMATION':
            steps.push({
                id: 'lay_formation',
                type: 'LAY_FORMATION',
                hits: DEFAULT_SPECIAL_HITS,
                difficulty: 1,
                patternId: resolvePatternId(args.blueprintId, 'LAY_FORMATION', 5),
                formationId: args.formationId,
                optional: false,
            });
            break;
        case 'QUENCH':
            steps.push({
                id: 'quench',
                type: 'QUENCH',
                medium: 'water',
                mediumOptions: ['water', 'oil'],
                timingWindow: { goodMin: 800, goodMax: 1400, perfectMin: 950, perfectMax: 1200 },
            });
            break;
        case 'TEMPER':
        default:
            steps.push({
                id: 'temper',
                type: 'TEMPER',
                targetHeat: 495,
                durationMs: 3000,
                targetMin: 430,
                targetMax: 560,
                holdMs: 3000,
            });
            break;
    }
    steps.push({ id: 'finish', type: 'FINISH', uiLabel: 'Finish forging' });
    return applyPatternIds(steps, args.blueprintId);
}
export function resolveForgeStepScript(blueprint) {
    const base = blueprint.stepScript?.length
        ? blueprint.stepScript
        : buildDefaultForgeScript(resolveSpecialStep(blueprint));
    return applyPatternIds(base, blueprint.id);
}
