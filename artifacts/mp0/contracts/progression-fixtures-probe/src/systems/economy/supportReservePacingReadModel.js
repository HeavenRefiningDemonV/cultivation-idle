import { resolveTrialFailSafeConfig } from '../progression/runtime/trialLifecycle.js';
import { getPrepEconomyTargets } from '../balance/prepEconomyTargets.js';
import { getAllPrepBudgetRegistryEntries } from './prepBudgetRegistry.js';
import { getGateFailureMeritPolicyByGateIndex } from './gateFailureMeritPolicy.js';
import { getProblemDestinationPolicy } from './problemDestinationPolicy.js';
import { buildBountySupportThroughputSnapshot } from './supportThroughputReadModel.js';
import { getSupportReserveTargetsByGateIndex } from './supportCurrencyTargets.js';
export function buildSupportReservePacingReport(content, gateIndex, starting = {}) {
    const entry = getAllPrepBudgetRegistryEntries().find((candidate) => candidate.gateIndex === gateIndex);
    if (!entry)
        throw new Error(`[SupportReservePacingReadModel] Missing prep entry for gate ${gateIndex}`);
    const throughput = buildBountySupportThroughputSnapshot(content, entry.cityId);
    const reserveTargets = getSupportReserveTargetsByGateIndex(gateIndex);
    const gatePolicy = getGateFailureMeritPolicyByGateIndex(gateIndex);
    const trial = content.trials.find((candidate) => candidate.cityId === entry.cityId) ?? null;
    const failSafe = resolveTrialFailSafeConfig(trial);
    const failSafeCost = {
        gold: Number(failSafe.cost?.gold ?? 0),
        merit: Number(failSafe.cost?.merit ?? 0),
        spiritStones: Number(failSafe.cost?.spiritStones ?? 0),
    };
    const meritStart = Math.max(0, starting.merit ?? 0);
    const spiritStart = Math.max(0, starting.spiritStones ?? 0);
    const meritAfterLowBand = meritStart + throughput.supportPayoutByExpectedBand.minClaims.merit;
    const meritAfterHighBand = meritStart + throughput.supportPayoutByExpectedBand.maxClaims.merit;
    const meritAfterLowBandPlusDefeats = meritAfterLowBand + gatePolicy.eligibleDefeatMerit * failSafe.threshold;
    const meritAfterHighBandPlusDefeats = meritAfterHighBand + gatePolicy.eligibleDefeatMerit * failSafe.threshold;
    const spiritAfterLowBand = spiritStart + throughput.supportPayoutByExpectedBand.minClaims.spiritStones;
    const spiritAfterHighBand = spiritStart + throughput.supportPayoutByExpectedBand.maxClaims.spiritStones;
    const policy = getPrepEconomyTargets();
    const spiritIdealProgressRatioAtHighBand = spiritAfterHighBand / Math.max(1, reserveTargets.spiritStoneIdealReserve);
    const reserveGapRoutesToBountiesFirst = getProblemDestinationPolicy('belowMeritReserve').primaryDestinations[0] === 'bounties'
        && getProblemDestinationPolicy('belowSpiritStoneMinimum').primaryDestinations[0] === 'bounties';
    const canAfford = (merit, spiritStones) => merit >= failSafeCost.merit && spiritStones >= failSafeCost.spiritStones;
    const verdicts = {
        reachesMinimumMeritReserveWithLowBandPlusDefeats: meritAfterLowBandPlusDefeats >= gatePolicy.minimumMeritReserveLow,
        reachesTargetMeritReserveWithHighBandPlusDefeats: meritAfterHighBandPlusDefeats >= reserveTargets.meritIdealReserve,
        reachesFailSafeMeritCostWithHighBandPlusDefeats: meritAfterHighBandPlusDefeats >= failSafeCost.merit,
        reachesMinimumSpiritReserveWithHighBand: spiritAfterHighBand >= reserveTargets.spiritStoneMinimumReserve,
        spiritIdealProgressRatioAtHighBand,
        failSafeAffordableAfterLowBand: canAfford(meritAfterLowBand, spiritAfterLowBand),
        failSafeAffordableAfterHighBand: canAfford(meritAfterHighBand, spiritAfterHighBand),
        failSafeAffordableAfterHighBandPlusDefeats: canAfford(meritAfterHighBandPlusDefeats, spiritAfterHighBand),
        reserveGapRoutesToBountiesFirst,
    };
    const blockers = [
        verdicts.reachesMinimumMeritReserveWithLowBandPlusDefeats ? null : 'minimum_merit_low_band_with_defeats_not_reached',
        verdicts.reachesTargetMeritReserveWithHighBandPlusDefeats ? null : 'target_merit_high_band_with_defeats_not_reached',
        verdicts.reachesMinimumSpiritReserveWithHighBand ? null : 'minimum_spirit_high_band_not_reached',
        spiritIdealProgressRatioAtHighBand >= policy.supportReservePacingTargetsByGate[gateIndex].spiritStoneFromZero.idealReserveApproachRatioTarget ? null : 'spirit_ideal_progress_too_low',
        reserveGapRoutesToBountiesFirst ? null : 'reserve_route_not_bounties_first',
    ].filter((entry) => Boolean(entry));
    return {
        gateIndex,
        cityId: entry.cityId,
        transitionId: entry.transitionId,
        expectedClaimBand: throughput.expectedClaimBand,
        eligibleDefeatMeritReward: gatePolicy.eligibleDefeatMerit,
        failSafeThreshold: failSafe.threshold,
        failSafeCost,
        startingState: {
            merit: meritStart,
            spiritStones: spiritStart,
            meritMinimumReserveLow: gatePolicy.minimumMeritReserveLow,
            meritMinimumReserveHigh: gatePolicy.minimumMeritReserveHigh,
            targetMeritReserve: reserveTargets.meritIdealReserve,
            spiritStoneMinimumReserve: reserveTargets.spiritStoneMinimumReserve,
            spiritStoneIdealReserve: reserveTargets.spiritStoneIdealReserve,
        },
        projections: {
            meritAfterLowBand,
            meritAfterHighBand,
            meritAfterLowBandPlusDefeats,
            meritAfterHighBandPlusDefeats,
            spiritAfterLowBand,
            spiritAfterHighBand,
        },
        verdicts,
        blockers,
    };
}
export function buildAllSupportReservePacingReports(content, starting = {}) {
    return getAllPrepBudgetRegistryEntries().map((entry) => buildSupportReservePacingReport(content, entry.gateIndex, starting));
}
