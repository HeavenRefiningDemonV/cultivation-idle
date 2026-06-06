import { buildLoadoutSnapshot } from "../builds/index.js";
import { analyzeManualOffer } from "./manualOfferAnalysis.js";
const REQUIREMENT_ORDER = [
    "path_aligned",
    "support_offer",
    "gap_fill",
];
const SHELF_PRIORITY = Object.freeze({
    filler: 0,
    common: 1,
    advanced: 2,
    rare: 3,
    featured: 4,
});
function buildAnalyses(slots, snapshot, buildAnalysis) {
    return slots.map((slot) => ({
        slot,
        analysis: analyzeManualOffer({
            techniqueId: slot.techniqueId,
            manualGrade: slot.grade,
            manualRarity: slot.rarity,
            snapshot,
            buildAnalysis,
        }),
    }));
}
function countMatches(entries, requirement) {
    if (requirement === "path_aligned")
        return entries.filter((entry) => entry.analysis.pathAligned).length;
    if (requirement === "support_offer")
        return entries.filter((entry) => entry.analysis.supportOffer).length;
    return entries.filter((entry) => entry.analysis.fillsCurrentGap).length;
}
function requirementSatisfied(entries, requirement, snapshot, buildAnalysis) {
    if (requirement === "path_aligned") {
        return snapshot.path === null || countMatches(entries, requirement) >= 2;
    }
    if (requirement === "support_offer") {
        return countMatches(entries, requirement) >= 1;
    }
    const needsGapFill = buildLoadoutSnapshot(snapshot.selectedLoadoutId ?? undefined)
        .emptyUnlockedCount > 0 ||
        (buildAnalysis?.gaps ?? []).some((gap) => gap?.severity === "high" || gap?.severity === "medium");
    return !needsGapFill || countMatches(entries, requirement) >= 1;
}
function badness(entry) {
    let score = 0;
    if (!entry.analysis.pathAligned)
        score += 8;
    if (!entry.analysis.supportOffer)
        score += 4;
    if (!entry.analysis.fillsCurrentGap)
        score += 2;
    if (!entry.analysis.improvesCurrentMilestone)
        score += 1;
    if (entry.analysis.isDuplicate)
        score += 1;
    return score;
}
function chooseSlot(entries) {
    const ordered = entries
        .filter((entry) => !entry.slot.sold && !entry.slot.notSold && !entry.slot.sealed)
        .sort((a, b) => {
        const shelfDiff = SHELF_PRIORITY[a.slot.shelf] - SHELF_PRIORITY[b.slot.shelf];
        if (shelfDiff !== 0)
            return shelfDiff;
        const badnessDiff = badness(b) - badness(a);
        if (badnessDiff !== 0)
            return badnessDiff;
        return b.slot.slotIndex - a.slot.slotIndex;
    });
    return ordered[0]?.slot ?? null;
}
function candidateMatches(requirement, analysis) {
    if (requirement === "path_aligned")
        return analysis.pathAligned;
    if (requirement === "support_offer")
        return analysis.supportOffer;
    return analysis.fillsCurrentGap;
}
function candidateScore(requirement, analysis, weight) {
    const weightScore = weight * 0.001;
    if (requirement === "path_aligned") {
        return ((analysis.pathAligned ? 100 : 0) +
            (analysis.improvesCurrentMilestone ? 40 : 0) +
            (analysis.fillsCurrentGap ? 20 : 0) +
            (analysis.supportOffer ? 10 : 0) +
            analysis.fragmentProgressValue * 5 +
            weightScore);
    }
    if (requirement === "support_offer") {
        return ((analysis.supportOffer ? 100 : 0) +
            (analysis.fillsCurrentGap ? 40 : 0) +
            (analysis.improvesCurrentMilestone ? 20 : 0) +
            (analysis.pathAligned ? 10 : 0) +
            analysis.fragmentProgressValue * 5 +
            weightScore);
    }
    return ((analysis.fillsCurrentGap ? 100 : 0) +
        (analysis.improvesCurrentMilestone ? 40 : 0) +
        (analysis.supportOffer ? 20 : 0) +
        (analysis.pathAligned ? 10 : 0) +
        analysis.fragmentProgressValue * 5 +
        weightScore);
}
function chooseCandidate(input) {
    const visibleIds = new Set(input.slots.map((slot) => slot.techniqueId));
    const eligible = input.candidates.filter((candidate) => !candidate.rarity || candidate.rarity === input.slot.rarity);
    const rank = (pool) => pool
        .map((candidate) => {
        const analysis = analyzeManualOffer({
            techniqueId: candidate.techniqueId,
            manualGrade: input.slot.grade,
            manualRarity: input.slot.rarity,
            snapshot: input.snapshot,
            buildAnalysis: input.buildAnalysis,
        });
        if (!candidateMatches(input.requirement, analysis))
            return null;
        return {
            candidate,
            score: candidateScore(input.requirement, analysis, candidate.weight),
        };
    })
        .filter((entry) => entry !== null)
        .sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0)
            return scoreDiff;
        return a.candidate.techniqueId.localeCompare(b.candidate.techniqueId);
    });
    const uniquePool = eligible.filter((candidate) => !visibleIds.has(candidate.techniqueId));
    return rank(uniquePool)[0]?.candidate ?? rank(eligible)[0]?.candidate ?? null;
}
export function applyPavilionCorrectionPass(input) {
    void input.pavilionId;
    const snapshot = input.context?.snapshot ?? null;
    if (snapshot === null) {
        return {
            slots: input.slots.map((slot) => ({ ...slot })),
            replacedSlotIndexes: [],
        };
    }
    const nextSlots = input.slots.map((slot) => ({ ...slot }));
    const replaced = new Set();
    for (const requirement of REQUIREMENT_ORDER) {
        const analyses = buildAnalyses(nextSlots, snapshot, input.context?.buildAnalysis);
        if (requirementSatisfied(analyses, requirement, snapshot, input.context?.buildAnalysis))
            continue;
        const slot = chooseSlot(analyses);
        if (!slot)
            continue;
        const candidate = chooseCandidate({
            requirement,
            slot,
            slots: nextSlots,
            candidates: input.candidates,
            snapshot,
            buildAnalysis: input.context?.buildAnalysis,
        });
        if (!candidate || candidate.techniqueId === slot.techniqueId)
            continue;
        const idx = nextSlots.findIndex((entry) => entry.slotIndex === slot.slotIndex);
        if (idx === -1)
            continue;
        nextSlots[idx] = { ...nextSlots[idx], techniqueId: candidate.techniqueId };
        replaced.add(nextSlots[idx].slotIndex);
    }
    return {
        slots: nextSlots,
        replacedSlotIndexes: [...replaced].sort((a, b) => a - b),
    };
}
