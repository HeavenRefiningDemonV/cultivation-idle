import { buildLoadoutSnapshot, getPathAlignmentStrengthForTechnique, getTechniqueTaxonomyProfile, isHigherTechniqueGrade, isHigherTechniqueRarity, } from "../builds/index.js";
import { useContentStore } from "../../stores/contentStore.js";
import { useTechCollectionStore } from "../../stores/techCollectionStore.js";
import { getDuplicateFragmentValue } from "./studyContract.js";
const SUPPORT_FAMILIES = new Set([
    "guard",
    "heal",
    "cleanse",
    "buff",
    "setup",
    "control",
]);
const RELEVANT_GAP_SEVERITIES = new Set(["high", "medium"]);
function clamp01(value) {
    if (!Number.isFinite(value))
        return 0;
    return Math.max(0, Math.min(1, value));
}
function dedupe(values) {
    return Array.from(new Set(values));
}
function resolveOfferSlotType(techniqueType) {
    if (techniqueType === "active" ||
        techniqueType === "passive" ||
        techniqueType === "ultimate") {
        return techniqueType;
    }
    return null;
}
function hasRelevantGap(gaps, code) {
    return (gaps ?? []).some((gap) => gap?.code === code && RELEVANT_GAP_SEVERITIES.has(gap?.severity ?? "low"));
}
export function isManualOfferQualityUpgrade(input) {
    if (!input.hasTechnique) {
        return false;
    }
    return (isHigherTechniqueGrade(input.ownedGrade ?? "mortal", input.offerGrade ?? "mortal") ||
        isHigherTechniqueRarity(input.ownedRarity ?? "common", input.offerRarity ?? "common"));
}
export function isDuplicateManualOffer(input) {
    return input.hasTechnique && !isManualOfferQualityUpgrade(input);
}
export function analyzeManualOfferFromContext(input) {
    const hasTechnique = Boolean(input.ownedState?.hasTechnique);
    const isDuplicate = isDuplicateManualOffer({
        hasTechnique,
        ownedGrade: input.ownedState?.ownedGrade,
        ownedRarity: input.ownedState?.ownedRarity,
        offerGrade: input.manualGrade,
        offerRarity: input.manualRarity,
    });
    const isQualityUpgrade = isManualOfferQualityUpgrade({
        hasTechnique,
        ownedGrade: input.ownedState?.ownedGrade,
        ownedRarity: input.ownedState?.ownedRarity,
        offerGrade: input.manualGrade,
        offerRarity: input.manualRarity,
    });
    const currentFragments = Math.max(0, Number(input.ownedState?.currentFragments ?? 0));
    const nextRankCostFragments = input.ownedState?.nextRankCostFragments;
    const fragmentProgressValue = isDuplicate &&
        typeof nextRankCostFragments === "number" &&
        nextRankCostFragments > 0
        ? clamp01((currentFragments +
            getDuplicateFragmentValue(input.manualGrade, input.manualRarity)) /
            nextRankCostFragments)
        : 0;
    const pathAligned = input.pathFit === "strong";
    const supportOffer = input.pathFit === "neutral" ||
        input.supportFlags.includes("survival") ||
        input.supportFlags.includes("tempo") ||
        input.families.some((family) => SUPPORT_FAMILIES.has(family));
    const offerSlotType = resolveOfferSlotType(input.techniqueType);
    const emptyUnlockedSlotMatch = Boolean(offerSlotType) &&
        (input.loadoutSnapshot?.emptyUnlockedSlots ?? []).some((slot) => slot.slotType === offerSlotType);
    const survivalGapFill = !input.currentEquippedSupportFlags.includes("survival") &&
        input.supportFlags.includes("survival");
    const buildAnalysisGapFill = (hasRelevantGap(input.buildAnalysis?.gaps, "missing_survival_tool") &&
        input.supportFlags.includes("survival")) ||
        (hasRelevantGap(input.buildAnalysis?.gaps, "missing_setup_tool") &&
            input.families.some((family) => family === "setup" || family === "control")) ||
        (hasRelevantGap(input.buildAnalysis?.gaps, "low_alignment") &&
            pathAligned) ||
        (hasRelevantGap(input.buildAnalysis?.gaps, "low_rank") &&
            isDuplicate &&
            fragmentProgressValue > 0);
    const fillsCurrentGap = emptyUnlockedSlotMatch || survivalGapFill || buildAnalysisGapFill;
    return {
        techniqueId: input.techniqueId,
        pathAligned,
        supportOffer,
        fillsCurrentGap,
        improvesCurrentMilestone: !hasTechnique ||
            isQualityUpgrade ||
            (isDuplicate && fragmentProgressValue >= 0.5),
        isDuplicate,
        fragmentProgressValue,
    };
}
export function analyzeManualOffer(input) {
    const contentState = useContentStore.getState();
    const technique = contentState.maps.techniquesById[input.techniqueId] ?? null;
    const taxonomy = getTechniqueTaxonomyProfile(input.techniqueId);
    const pathFit = taxonomy === null
        ? "off"
        : getPathAlignmentStrengthForTechnique(input.techniqueId, input.snapshot.path);
    let loadoutSnapshot = null;
    try {
        loadoutSnapshot = buildLoadoutSnapshot(input.snapshot.selectedLoadoutId ?? undefined);
    }
    catch {
        loadoutSnapshot = null;
    }
    const equippedTechIds = dedupe([
        ...(loadoutSnapshot?.equipped.active ?? []),
        ...(loadoutSnapshot?.equipped.passive ?? []),
        ...(loadoutSnapshot?.equipped.ultimate
            ? [loadoutSnapshot.equipped.ultimate]
            : []),
    ]);
    const equippedTaxonomies = equippedTechIds
        .map((techId) => getTechniqueTaxonomyProfile(techId))
        .filter((entry) => entry !== null);
    const currentEquippedFamilies = dedupe(equippedTaxonomies.flatMap((entry) => entry.families));
    const currentEquippedSupportFlags = dedupe(equippedTaxonomies.flatMap((entry) => entry.supportFlags));
    const techCollection = useTechCollectionStore.getState();
    const hasTechnique = techCollection.hasTech(input.techniqueId);
    const progression = hasTechnique
        ? techCollection.getTechniqueProgressionSnapshot(input.techniqueId)
        : null;
    const currentFragments = techCollection.getFragments(input.techniqueId) ?? 0;
    const nextRankCostFragments = hasTechnique
        ? (techCollection.getNextRankCost(input.techniqueId)?.cost
            .fragmentsRequired ?? null)
        : null;
    return analyzeManualOfferFromContext({
        techniqueId: input.techniqueId,
        techniqueType: technique?.type ?? "",
        pathFit,
        families: taxonomy?.families ?? [],
        supportFlags: taxonomy?.supportFlags ?? [],
        snapshot: input.snapshot,
        loadoutSnapshot,
        currentEquippedFamilies,
        currentEquippedSupportFlags,
        ownedState: {
            hasTechnique,
            ownedGrade: progression?.grade ?? "mortal",
            ownedRarity: progression?.rarity ?? "common",
            currentFragments,
            nextRankCostFragments,
        },
        manualGrade: input.manualGrade,
        manualRarity: input.manualRarity,
        buildAnalysis: input.buildAnalysis ?? null,
    });
}
export function buildManualOfferTags(input) {
    const tags = [];
    if (input.analysis.fillsCurrentGap)
        tags.push('Build Fix');
    if (input.analysis.pathAligned)
        tags.push('Path-Aligned');
    if (input.analysis.supportOffer)
        tags.push('Support');
    if (input.isNewTechnique)
        tags.push('New');
    if (input.analysis.isDuplicate)
        tags.push('Duplicate');
    if (input.analysis.fragmentProgressValue > 0)
        tags.push('Fragment Progress');
    if (input.includeMilestoneValue && input.analysis.improvesCurrentMilestone) {
        tags.push('Milestone Value');
    }
    const max = Math.max(1, input.maxTags ?? 3);
    return Array.from(new Set(tags)).slice(0, max);
}
