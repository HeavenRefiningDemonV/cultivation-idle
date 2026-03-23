import { buildLoadoutSnapshot } from "../builds/index.js";
import type { DoctrineSnapshot } from "../doctrine/index.js";
import type { TechRarity } from "../../types/index.js";
import type { PavilionStockSlot } from "../../features/manuals/pavilionStockTypes.js";
import type { ManualOfferBuildAnalysisLike } from "./manualOfferAnalysis.js";
import { analyzeManualOffer } from "./manualOfferAnalysis.js";

export interface PavilionCorrectionCandidate {
  techniqueId: string;
  rarity?: TechRarity;
  weight: number;
}

export interface PavilionGenerationContext {
  snapshot?: DoctrineSnapshot | null;
  buildAnalysis?: ManualOfferBuildAnalysisLike | null;
}

export interface PavilionCorrectionPassResult {
  slots: PavilionStockSlot[];
  replacedSlotIndexes: number[];
}

type Requirement = "path_aligned" | "support_offer" | "gap_fill";

const REQUIREMENT_ORDER: readonly Requirement[] = [
  "path_aligned",
  "support_offer",
  "gap_fill",
];

const SHELF_PRIORITY: Readonly<Record<PavilionStockSlot["shelf"], number>> =
  Object.freeze({
    filler: 0,
    common: 1,
    advanced: 2,
    rare: 3,
    featured: 4,
  });

function buildAnalyses(
  slots: PavilionStockSlot[],
  snapshot: DoctrineSnapshot,
  buildAnalysis: ManualOfferBuildAnalysisLike | null | undefined,
) {
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

function countMatches(
  entries: ReturnType<typeof buildAnalyses>,
  requirement: Requirement,
): number {
  if (requirement === "path_aligned")
    return entries.filter((entry) => entry.analysis.pathAligned).length;
  if (requirement === "support_offer")
    return entries.filter((entry) => entry.analysis.supportOffer).length;
  return entries.filter((entry) => entry.analysis.fillsCurrentGap).length;
}

function requirementSatisfied(
  entries: ReturnType<typeof buildAnalyses>,
  requirement: Requirement,
  snapshot: DoctrineSnapshot,
  buildAnalysis: ManualOfferBuildAnalysisLike | null | undefined,
): boolean {
  if (requirement === "path_aligned") {
    return snapshot.path === null || countMatches(entries, requirement) >= 2;
  }
  if (requirement === "support_offer") {
    return countMatches(entries, requirement) >= 1;
  }

  const needsGapFill =
    buildLoadoutSnapshot(snapshot.selectedLoadoutId ?? undefined)
      .emptyUnlockedCount > 0 ||
    (buildAnalysis?.gaps ?? []).some(
      (gap) => gap?.severity === "high" || gap?.severity === "medium",
    );
  return !needsGapFill || countMatches(entries, requirement) >= 1;
}

function badness(entry: ReturnType<typeof buildAnalyses>[number]): number {
  let score = 0;
  if (!entry.analysis.pathAligned) score += 8;
  if (!entry.analysis.supportOffer) score += 4;
  if (!entry.analysis.fillsCurrentGap) score += 2;
  if (!entry.analysis.improvesCurrentMilestone) score += 1;
  if (entry.analysis.isDuplicate) score += 1;
  return score;
}

function chooseSlot(
  entries: ReturnType<typeof buildAnalyses>,
): PavilionStockSlot | null {
  const ordered = entries
    .filter(
      (entry) => !entry.slot.sold && !entry.slot.notSold && !entry.slot.sealed,
    )
    .sort((a, b) => {
      const shelfDiff =
        SHELF_PRIORITY[a.slot.shelf] - SHELF_PRIORITY[b.slot.shelf];
      if (shelfDiff !== 0) return shelfDiff;
      const badnessDiff = badness(b) - badness(a);
      if (badnessDiff !== 0) return badnessDiff;
      return b.slot.slotIndex - a.slot.slotIndex;
    });
  return ordered[0]?.slot ?? null;
}

function candidateMatches(
  requirement: Requirement,
  analysis: ReturnType<typeof analyzeManualOffer>,
): boolean {
  if (requirement === "path_aligned") return analysis.pathAligned;
  if (requirement === "support_offer") return analysis.supportOffer;
  return analysis.fillsCurrentGap;
}

function candidateScore(
  requirement: Requirement,
  analysis: ReturnType<typeof analyzeManualOffer>,
  weight: number,
): number {
  const weightScore = weight * 0.001;
  if (requirement === "path_aligned") {
    return (
      (analysis.pathAligned ? 100 : 0) +
      (analysis.improvesCurrentMilestone ? 40 : 0) +
      (analysis.fillsCurrentGap ? 20 : 0) +
      (analysis.supportOffer ? 10 : 0) +
      analysis.fragmentProgressValue * 5 +
      weightScore
    );
  }
  if (requirement === "support_offer") {
    return (
      (analysis.supportOffer ? 100 : 0) +
      (analysis.fillsCurrentGap ? 40 : 0) +
      (analysis.improvesCurrentMilestone ? 20 : 0) +
      (analysis.pathAligned ? 10 : 0) +
      analysis.fragmentProgressValue * 5 +
      weightScore
    );
  }
  return (
    (analysis.fillsCurrentGap ? 100 : 0) +
    (analysis.improvesCurrentMilestone ? 40 : 0) +
    (analysis.supportOffer ? 20 : 0) +
    (analysis.pathAligned ? 10 : 0) +
    analysis.fragmentProgressValue * 5 +
    weightScore
  );
}

function chooseCandidate(input: {
  requirement: Requirement;
  slot: PavilionStockSlot;
  slots: PavilionStockSlot[];
  candidates: PavilionCorrectionCandidate[];
  snapshot: DoctrineSnapshot;
  buildAnalysis: ManualOfferBuildAnalysisLike | null | undefined;
}): PavilionCorrectionCandidate | null {
  const visibleIds = new Set(input.slots.map((slot) => slot.techniqueId));
  const eligible = input.candidates.filter(
    (candidate) => !candidate.rarity || candidate.rarity === input.slot.rarity,
  );

  const rank = (pool: PavilionCorrectionCandidate[]) =>
    pool
      .map((candidate) => {
        const analysis = analyzeManualOffer({
          techniqueId: candidate.techniqueId,
          manualGrade: input.slot.grade,
          manualRarity: input.slot.rarity,
          snapshot: input.snapshot,
          buildAnalysis: input.buildAnalysis,
        });
        if (!candidateMatches(input.requirement, analysis)) return null;
        return {
          candidate,
          score: candidateScore(input.requirement, analysis, candidate.weight),
        };
      })
      .filter(
        (
          entry,
        ): entry is { candidate: PavilionCorrectionCandidate; score: number } =>
          entry !== null,
      )
      .sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        return a.candidate.techniqueId.localeCompare(b.candidate.techniqueId);
      });

  const uniquePool = eligible.filter(
    (candidate) => !visibleIds.has(candidate.techniqueId),
  );
  return rank(uniquePool)[0]?.candidate ?? rank(eligible)[0]?.candidate ?? null;
}

export function applyPavilionCorrectionPass(input: {
  pavilionId: string;
  slots: PavilionStockSlot[];
  candidates: PavilionCorrectionCandidate[];
  context?: PavilionGenerationContext;
}): PavilionCorrectionPassResult {
  void input.pavilionId;

  const snapshot = input.context?.snapshot ?? null;
  if (snapshot === null) {
    return {
      slots: input.slots.map((slot) => ({ ...slot })),
      replacedSlotIndexes: [],
    };
  }

  const nextSlots = input.slots.map((slot) => ({ ...slot }));
  const replaced = new Set<number>();

  for (const requirement of REQUIREMENT_ORDER) {
    const analyses = buildAnalyses(
      nextSlots,
      snapshot,
      input.context?.buildAnalysis,
    );
    if (
      requirementSatisfied(
        analyses,
        requirement,
        snapshot,
        input.context?.buildAnalysis,
      )
    )
      continue;

    const slot = chooseSlot(analyses);
    if (!slot) continue;

    const candidate = chooseCandidate({
      requirement,
      slot,
      slots: nextSlots,
      candidates: input.candidates,
      snapshot,
      buildAnalysis: input.context?.buildAnalysis,
    });
    if (!candidate || candidate.techniqueId === slot.techniqueId) continue;

    const idx = nextSlots.findIndex(
      (entry) => entry.slotIndex === slot.slotIndex,
    );
    if (idx === -1) continue;
    nextSlots[idx] = { ...nextSlots[idx], techniqueId: candidate.techniqueId };
    replaced.add(nextSlots[idx].slotIndex);
  }

  return {
    slots: nextSlots,
    replacedSlotIndexes: [...replaced].sort((a, b) => a - b),
  };
}
