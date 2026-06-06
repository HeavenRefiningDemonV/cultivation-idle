import { buildSupportEconomyReadModelFromState } from './supportEconomyReadModel.js';
import { GATE_SUPPORT_LABELS } from '../../ui/text/playerFacingLabels.js';
function formatMeritBand(model) {
    return `${model.meritMinimumReserveLow}–${model.meritMinimumReserveHigh}`;
}
export function buildSupportEconomySurfaceModelFromReadModel(readModel) {
    const reserveTone = readModel.meritReserveStatus === 'at_ideal'
        ? 'ready'
        : readModel.meritReserveStatus === 'between_minimum_and_ideal'
            ? 'steady'
            : 'warning';
    const reserveHeadline = readModel.meritReserveStatus === 'at_ideal'
        ? 'Merit reserve on target'
        : readModel.meritReserveStatus === 'between_minimum_and_ideal'
            ? 'Merit reserve above the minimum band'
            : 'Merit reserve below the safe band';
    return {
        readModel,
        reserveHeadline,
        reserveTone,
        meritReserveLine: `Merit ${readModel.currentMerit} • safe band ${formatMeritBand(readModel)} • target ${readModel.targetMeritReserve}`,
        spiritReserveLine: `Spirit Stones ${readModel.currentSpiritStones} • minimum ${readModel.spiritStoneMinimumReserve} • ideal ${readModel.spiritStoneIdealReserve}`,
        failSafeLine: readModel.nextGateFailSafeCost
            ? `Next ${GATE_SUPPORT_LABELS.support} costs ${readModel.nextGateFailSafeCost.merit ?? '0'} Merit and ${readModel.nextGateFailSafeCost.spiritStones ?? '0'} Spirit Stones.`
            : `Next ${GATE_SUPPORT_LABELS.support} cost is unavailable.`,
        reserveGapLine: readModel.meritReserveStatus === 'at_ideal'
            ? `Reserve gap closed. After 3 eligible defeats you would hold ${readModel.expectedMeritAfterThreeEligibleDefeats} Merit.`
            : `Reserve gap: ${readModel.meritReserveGap} Merit to target and ${readModel.spiritStoneMinimumGap} Spirit Stones to minimum.`,
        eligibleDefeatRewardLine: `Eligible defeat reward: +${readModel.eligibleDefeatMeritReward} Merit • after 3 eligible defeats: ${readModel.expectedMeritAfterThreeEligibleDefeats} Merit.`,
    };
}
export function buildSupportEconomySurfaceModel(input) {
    return buildSupportEconomySurfaceModelFromReadModel(buildSupportEconomyReadModelFromState({
        content: input.content,
        currencies: input.currencies,
        cityId: input.cityId,
    }));
}
