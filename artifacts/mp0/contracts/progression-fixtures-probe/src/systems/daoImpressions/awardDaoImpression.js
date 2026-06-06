import { GameEvents } from '../../services/events/GameEvents.js';
import { RewardService } from '../../services/rewards/RewardService.js';
import { getDaoImpressionDefinition } from './daoImpressionDefinitions.js';
import { useDaoImpressionStore } from './daoImpressionStore.js';
function buildAwardId(candidate) {
    return `dao:${candidate.sourceEventKey.replace(/[^a-zA-Z0-9:_-]/g, '_')}`;
}
function defaultRouteHint(sourceKind) {
    switch (sourceKind) {
        case 'gate_clear':
        case 'breakthrough_resonance':
            return { kind: 'cultivation', label: 'Return to Cultivation' };
        case 'gate_close_defeat':
            return { kind: 'gate_trial', label: 'Review Gate Trial' };
        case 'technique_mastery_milestone':
            return { kind: 'techniques', label: 'Review Techniques' };
        case 'outskirts_first_boss':
        case 'ruins_completion':
        default:
            return { kind: 'heart_law', label: 'Review Dao Heart' };
    }
}
function memoryLineFor(candidate, definition, applied) {
    if (!applied) {
        return `${definition.title}: Heart Law not selected, so the spiritual trace was recorded without comprehension.`;
    }
    return definition.copy.lifeSummaryLine ?? definition.copy.heartLawLine ?? definition.copy.shortLine;
}
export function awardDaoImpression(candidate) {
    const store = useDaoImpressionStore.getState();
    if (store.hasSourceEvent(candidate.sourceEventKey))
        return null;
    const definition = getDaoImpressionDefinition(candidate.impressionId);
    if (!definition || definition.sourceKind !== candidate.sourceKind)
        return null;
    if (definition.runtimeStatus === 'future_stub_only')
        return null;
    if (definition.cooldownMs != null && definition.cooldownMs > 0) {
        const latestAward = store.latestAwardForImpression(definition.impressionId) ?? store.latestAwardForSourceKind(definition.sourceKind);
        if (latestAward && candidate.createdAt - latestAward.createdAt < definition.cooldownMs)
            return null;
    }
    if (definition.maxAwardsPerLife != null && store.countAwardsByImpressionId(definition.impressionId) >= definition.maxAwardsPerLife) {
        return null;
    }
    const reason = `dao_impression:${definition.sourceKind}:${candidate.sourceEventKey}`;
    const rewardResult = RewardService.grantRewards({ comprehension: definition.comprehensionDelta }, reason);
    const appliedComprehension = rewardResult.appliedComprehension;
    const skipped = appliedComprehension?.skippedReason;
    const award = {
        awardId: buildAwardId(candidate),
        impressionId: definition.impressionId,
        sourceKind: definition.sourceKind,
        sourceEventKey: candidate.sourceEventKey,
        createdAt: candidate.createdAt,
        title: definition.title,
        doctrineFamily: definition.doctrineFamily,
        comprehensionDelta: definition.comprehensionDelta,
        applied: appliedComprehension?.applied === true,
        targetHeartLawId: appliedComprehension?.targetHeartLawId ?? null,
        skippedReason: skipped === 'no_selected_heart_law' || skipped === 'invalid_amount' ? skipped : undefined,
        rarityBand: definition.rarityBand,
        memoryEligible: definition.memoryEligible,
        routeHint: candidate.routeHint ?? defaultRouteHint(candidate.sourceKind),
        memoryLine: memoryLineFor(candidate, definition, appliedComprehension?.applied === true),
    };
    store.recordAward(award);
    GameEvents.emit({
        type: 'dao/impression_awarded',
        payload: {
            timestamp: award.createdAt,
            awardId: award.awardId,
            impressionId: award.impressionId,
            sourceKind: award.sourceKind,
            sourceEventKey: award.sourceEventKey,
            comprehensionDelta: award.comprehensionDelta,
            applied: award.applied,
            targetHeartLawId: award.targetHeartLawId,
            memoryEligible: award.memoryEligible,
            title: award.title,
            memoryLine: award.memoryLine,
            routeKind: award.routeHint?.kind,
            routeLabel: award.routeHint?.label,
        },
    });
    return award;
}
