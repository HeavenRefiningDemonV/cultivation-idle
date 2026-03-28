import { randFloat } from '../../utils/rng.js';
function clamp01(value) {
    if (!Number.isFinite(value))
        return 0;
    if (value < 0)
        return 0;
    if (value > 1)
        return 1;
    return value;
}
function createRng(seed) {
    let current = seed || 1;
    return () => {
        const roll = randFloat(current);
        current = roll.seed;
        return roll.value;
    };
}
function findPerformance(performances, stepId, type) {
    return performances.find((perf) => perf.stepId === stepId && perf.type === type);
}
function scoreHeatRange(targetMin, targetMax, holdMs, performance, rng) {
    const achievedMin = performance?.achievedMin ?? targetMin;
    const achievedMax = performance?.achievedMax ?? targetMax;
    const targetSpan = Math.max(1, targetMax - targetMin);
    const achievedSpan = Math.max(1, achievedMax - achievedMin);
    const overlapMin = Math.max(targetMin, achievedMin);
    const overlapMax = Math.min(targetMax, achievedMax);
    const overlap = Math.max(0, overlapMax - overlapMin);
    const overlapScore = clamp01(overlap / targetSpan);
    const centerDiff = Math.abs((targetMin + targetMax) / 2 - (achievedMin + achievedMax) / 2);
    const centerScore = clamp01(1 - centerDiff / (targetSpan * 1.5));
    const holdScore = holdMs && performance?.holdMs
        ? clamp01(performance.holdMs / holdMs)
        : rng
            ? 0.5 + rng() * 0.1
            : 0.55;
    const total = overlapScore * 0.55 + centerScore * 0.25 + holdScore * 0.2;
    return clamp01(total);
}
function scoreHeatTiming(performance, rng) {
    if (typeof performance?.timingScore === 'number')
        return clamp01(performance.timingScore);
    return rng ? 0.55 + rng() * 0.1 : 0.6;
}
function scoreHammerPattern(hits, tolerance, performance, rng) {
    if (!performance)
        return rng ? 0.5 + rng() * 0.1 : 0.55;
    const hitRatio = clamp01(performance.hitsLanded / Math.max(1, performance.hitsRequired));
    const timing = clamp01(performance.timingScore ?? (rng ? rng() * 0.2 + 0.6 : 0.65));
    const toleranceScore = clamp01(1 - Math.abs(1 - hitRatio) * (1 + tolerance));
    return clamp01(hitRatio * 0.6 + timing * 0.25 + toleranceScore * 0.15);
}
function scoreQuench(timingWindow, performance, rng) {
    if (!timingWindow)
        return rng ? 0.55 + rng() * 0.1 : 0.6;
    const timing = performance?.timingMs;
    if (typeof timing !== 'number')
        return rng ? 0.55 + rng() * 0.1 : 0.6;
    if (timing >= timingWindow.perfectMin && timing <= timingWindow.perfectMax)
        return 1;
    if (timing >= timingWindow.goodMin && timing <= timingWindow.goodMax)
        return 0.8;
    const distance = Math.min(Math.abs(timing - timingWindow.goodMin), Math.abs(timing - timingWindow.goodMax));
    const windowSpan = Math.max(1, timingWindow.goodMax - timingWindow.goodMin);
    const falloff = clamp01(1 - distance / (windowSpan * 2));
    return clamp01(0.4 + falloff * 0.4);
}
function scoreTemper(targetMin, targetMax, expectedHoldMs, performance, rng) {
    if (!performance)
        return rng ? 0.55 + rng() * 0.1 : 0.6;
    const center = (targetMin + targetMax) / 2;
    const perfCenter = ((performance.achievedMin ?? center) + (performance.achievedMax ?? center)) / 2;
    const variance = Math.abs(center - perfCenter) / Math.max(1, targetMax - targetMin);
    const holdScore = expectedHoldMs && performance.holdMs
        ? clamp01(performance.holdMs / expectedHoldMs)
        : rng
            ? 0.6 + rng() * 0.1
            : 0.6;
    return clamp01((1 - variance) * 0.7 + holdScore * 0.3);
}
function scoreEngrave(performance, rng) {
    if (!performance)
        return rng ? 0.5 + rng() * 0.1 : 0.55;
    const precision = clamp01(performance.precision ?? (rng ? rng() * 0.25 + 0.6 : 0.6));
    const success = performance.success === false ? 0.4 : 1;
    return clamp01(precision * 0.7 + success * 0.3);
}
function scoreRingQteStep(params) {
    const hitsRequired = params.hitsRequired ?? 0;
    const hitsLanded = params.hitsLanded ?? 0;
    const completionRatio = hitsRequired > 0 ? hitsLanded / hitsRequired : 0;
    const completionScore = clamp01(0.25 + 0.75 * completionRatio);
    const timingScore = clamp01(params.timingScore ?? 0);
    return clamp01(completionScore * (0.55 + 0.45 * timingScore));
}
function scoreCastOrShape(performance, rng) {
    if (!performance)
        return rng ? 0.55 + rng() * 0.1 : 0.55;
    const base = clamp01(performance.precision ?? 0.65);
    const success = performance.success === false ? 0.4 : 1;
    return clamp01(base * 0.7 + success * 0.3);
}
function scoreAlloyMix(options, performance, rng) {
    if (!performance)
        return rng ? 0.55 + rng() * 0.1 : 0.55;
    const selected = options?.find((opt) => opt.id === performance.choiceId);
    const delta = selected?.qualityDelta ?? performance.qualityDelta ?? 0;
    return clamp01(0.55 + delta);
}
function scaleBonus(value, score) {
    if (!value || value === 0)
        return 0;
    return value * clamp01(score);
}
export function computeForgeOutcome(params) {
    const rng = createRng(params.seed);
    const steps = params.script.steps;
    const heatScores = [];
    const hammerScores = [];
    const quenchScores = [];
    const temperScores = [];
    steps.forEach((step) => {
        switch (step.type) {
            case 'HEAT_MATERIAL': {
                const perf = findPerformance(params.performances, step.id, 'HEAT_MATERIAL');
                if (typeof perf?.timingScore === 'number') {
                    heatScores.push(scoreHeatTiming(perf, rng));
                }
                else {
                    heatScores.push(scoreHeatRange(step.targetMin, step.targetMax, step.holdMs, perf, rng));
                }
                break;
            }
            case 'HEAT_TO': {
                const perf = findPerformance(params.performances, step.id, 'HEAT_TO');
                heatScores.push(scoreHeatTiming(perf, rng));
                break;
            }
            case 'HAMMER_PATTERN': {
                const perf = findPerformance(params.performances, step.id, 'HAMMER_PATTERN');
                hammerScores.push(scoreHammerPattern(step.hits, step.tolerance, perf, rng));
                break;
            }
            case 'CAST_OR_SHAPE': {
                const perf = findPerformance(params.performances, step.id, 'CAST_OR_SHAPE');
                hammerScores.push(scoreCastOrShape(perf, rng));
                break;
            }
            case 'ALLOY_MIX': {
                const perf = findPerformance(params.performances, step.id, 'ALLOY_MIX');
                hammerScores.push(scoreAlloyMix(step.options, perf, rng));
                break;
            }
            case 'QUENCH': {
                const perf = findPerformance(params.performances, step.id, 'QUENCH');
                quenchScores.push(scoreQuench(step.timingWindow, perf, rng));
                break;
            }
            case 'TEMPER': {
                const perf = findPerformance(params.performances, step.id, 'TEMPER');
                const targetMin = step.targetMin ?? step.targetHeat - 20;
                const targetMax = step.targetMax ?? step.targetHeat + 20;
                heatScores.push(scoreTemper(targetMin, targetMax, step.holdMs ?? step.durationMs, perf, rng));
                temperScores.push(scoreTemper(targetMin, targetMax, step.holdMs ?? step.durationMs, perf, rng));
                break;
            }
            case 'ENGRAVE_RUNE': {
                const perf = findPerformance(params.performances, step.id, 'ENGRAVE_RUNE');
                if (perf?.hitsRequired || perf?.hitsLanded || perf?.timingScore !== undefined) {
                    temperScores.push(scoreRingQteStep(perf));
                }
                else {
                    temperScores.push(scoreEngrave(perf, rng));
                }
                break;
            }
            case 'LAY_FORMATION': {
                const perf = findPerformance(params.performances, step.id, 'LAY_FORMATION');
                temperScores.push(scoreRingQteStep(perf ?? {}));
                break;
            }
            default:
                break;
        }
    });
    const avg = (values, fallback) => {
        if (!values || values.length === 0)
            return fallback;
        return clamp01(values.reduce((sum, v) => sum + v, 0) / values.length);
    };
    const heatScore = avg(heatScores, 0.6);
    const hammerScore = avg(hammerScores, 0.6);
    const quenchScore = avg(quenchScores, 0.6);
    const temperScore = avg(temperScores, 0.6);
    const bucketScores = [
        { score: heatScore, present: heatScores.length > 0 },
        { score: hammerScore, present: hammerScores.length > 0 },
        { score: quenchScore, present: quenchScores.length > 0 },
        { score: temperScore, present: temperScores.length > 0 },
    ];
    const activeBuckets = bucketScores.filter((bucket) => bucket.present).map((bucket) => bucket.score);
    const scoreOverall = clamp01(activeBuckets.length > 0
        ? activeBuckets.reduce((sum, value) => sum + value, 0) / activeBuckets.length
        : 0.6);
    const bonus = params.handsOnBonus ?? {};
    const timeReductionPctApplied = scaleBonus(bonus.timeReductionPct, scoreOverall);
    const qualityProcChanceBonusPct = scaleBonus(bonus.qualityProcChancePct, scoreOverall);
    const masteryMultApplied = bonus.masteryMult ? 1 + (bonus.masteryMult - 1) * scoreOverall : 1;
    const temperProcChanceBonusPctApplied = scaleBonus(bonus.temperProcChancePct, scoreOverall);
    return {
        scoreOverall,
        heatScore,
        hammerScore,
        quenchScore,
        temperScore,
        timeReductionPctApplied,
        qualityProcChanceBonusPct,
        masteryMultApplied,
        temperProcChanceBonusPctApplied,
    };
}
