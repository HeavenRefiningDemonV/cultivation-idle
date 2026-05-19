import type { TechniqueSlotType } from "../../types/index.js";
import { useTechCollectionStore } from "../../stores/techCollectionStore.js";
import {
  useTechniqueStore,
  type TechniqueLoadout,
} from "../../stores/techniqueStore.js";
import {
  buildDoctrineSnapshot,
  getDoctrineSnapshotWarnings,
  getDoctrineSourceFlags,
  type DoctrineSnapshot,
  type DoctrineSnapshotWarnings,
  type DoctrineSourceFlags,
} from "../doctrine/index.js";
import {
  buildLoadoutSnapshot,
  type LoadoutSnapshot,
  type LoadoutSnapshotSource,
} from "./loadoutSnapshot.js";
import type { PathAlignmentStrength } from "./pathAlignment.js";
import {
  getPathAlignmentStrengthForTechnique,
  getTechniqueTaxonomyProfile,
  type TechniqueTaxonomyProfile,
} from "./techniqueTaxonomy.js";
import type { TechniqueProgressionSnapshot } from "./techniqueProgressionContract.js";

export interface TechniqueFoundationSlotAssignment {
  slotType: TechniqueSlotType;
  slotIndex: number;
  techId: string;
  availability: "equipped" | "parked_locked";
  progression: TechniqueProgressionSnapshot;
  taxonomy: TechniqueTaxonomyProfile | null;
  pathAlignment: PathAlignmentStrength;
}

export interface TechniqueFoundationContext {
  doctrine: DoctrineSnapshot;
  doctrineFlags: DoctrineSourceFlags;
  doctrineWarnings: DoctrineSnapshotWarnings;
  loadout: LoadoutSnapshot;
  assignedTechniques: TechniqueFoundationSlotAssignment[];
  equippedTechniques: TechniqueFoundationSlotAssignment[];
  parkedLockedTechniques: TechniqueFoundationSlotAssignment[];
  alignmentSummary: {
    strong: number;
    neutral: number;
    off: number;
  };
}

function collectAssignments(
  loadoutSource: Pick<LoadoutSnapshotSource, "slots">,
  loadout: LoadoutSnapshot,
): Array<{
  slotType: TechniqueSlotType;
  slotIndex: number;
  techId: string;
  availability: "equipped" | "parked_locked";
}> {
  const assignments: Array<{
    slotType: TechniqueSlotType;
    slotIndex: number;
    techId: string;
    availability: "equipped" | "parked_locked";
  }> = [];

  loadoutSource.slots.active.forEach((techId, slotIndex) => {
    if (!techId) return;
    assignments.push({
      slotType: "active",
      slotIndex,
      techId,
      availability:
        slotIndex < loadout.unlocked.active ? "equipped" : "parked_locked",
    });
  });

  loadoutSource.slots.passive.forEach((techId, slotIndex) => {
    if (!techId) return;
    assignments.push({
      slotType: "passive",
      slotIndex,
      techId,
      availability:
        slotIndex < loadout.unlocked.passive ? "equipped" : "parked_locked",
    });
  });

  if (loadoutSource.slots.ultimate) {
    assignments.push({
      slotType: "ultimate",
      slotIndex: 0,
      techId: loadoutSource.slots.ultimate,
      availability: loadout.unlocked.ultimate ? "equipped" : "parked_locked",
    });
  }

  return assignments;
}

export function buildTechniqueFoundationContextFromSnapshots(input: {
  doctrine: DoctrineSnapshot;
  loadout: LoadoutSnapshot;
  loadoutSource: Pick<LoadoutSnapshotSource, "slots">;
  getTechniqueProgressionSnapshot: (
    techId: string,
  ) => TechniqueProgressionSnapshot;
  getTechniqueTaxonomyProfile?: (
    techId: string,
  ) => TechniqueTaxonomyProfile | null;
  getPathAlignmentStrength?: (
    techId: string,
    path: DoctrineSnapshot["path"],
  ) => PathAlignmentStrength;
}): TechniqueFoundationContext {
  const resolveTaxonomy =
    input.getTechniqueTaxonomyProfile ??
    ((techId: string) => getTechniqueTaxonomyProfile(techId));
  const resolveAlignment =
    input.getPathAlignmentStrength ??
    ((techId: string, path: DoctrineSnapshot["path"]) =>
      getPathAlignmentStrengthForTechnique(techId, path));

  const assignedTechniques = collectAssignments(
    input.loadoutSource,
    input.loadout,
  ).map((assignment) => ({
    ...assignment,
    progression: input.getTechniqueProgressionSnapshot(assignment.techId),
    taxonomy: resolveTaxonomy(assignment.techId),
    pathAlignment: resolveAlignment(assignment.techId, input.doctrine.path),
  }));

  return {
    doctrine: input.doctrine,
    doctrineFlags: getDoctrineSourceFlags(input.doctrine),
    doctrineWarnings: getDoctrineSnapshotWarnings(input.doctrine),
    loadout: input.loadout,
    assignedTechniques,
    equippedTechniques: assignedTechniques.filter(
      (entry) => entry.availability === "equipped",
    ),
    parkedLockedTechniques: assignedTechniques.filter(
      (entry) => entry.availability === "parked_locked",
    ),
    alignmentSummary: {
      strong: assignedTechniques.filter(
        (entry) => entry.pathAlignment === "strong",
      ).length,
      neutral: assignedTechniques.filter(
        (entry) => entry.pathAlignment === "neutral",
      ).length,
      off: assignedTechniques.filter((entry) => entry.pathAlignment === "off")
        .length,
    },
  };
}

function resolveRuntimeLoadout(loadoutId?: string): TechniqueLoadout {
  const techniqueState = useTechniqueStore.getState();
  const requested = loadoutId
    ? techniqueState.loadouts.find((loadout) => loadout.id === loadoutId)
    : undefined;
  const selected =
    techniqueState.getSelectedLoadout() ??
    techniqueState.loadouts.find(
      (loadout) => loadout.id === techniqueState.selectedLoadoutId,
    );
  const fallback = techniqueState.loadouts[0];

  return (
    requested ??
    selected ??
    fallback ?? {
      id: loadoutId ?? "default",
      name: "Default",
      aiProfile: "balanced",
      castingPolicy: "balanced",
      slots: { active: [], passive: [], ultimate: null },
    }
  );
}

export function buildTechniqueFoundationContext(
  loadoutId?: string,
): TechniqueFoundationContext {
  const doctrine = buildDoctrineSnapshot();
  const loadout = buildLoadoutSnapshot(loadoutId);
  const loadoutSource = resolveRuntimeLoadout(loadoutId);
  const collectionState = useTechCollectionStore.getState();

  return buildTechniqueFoundationContextFromSnapshots({
    doctrine,
    loadout,
    loadoutSource,
    getTechniqueProgressionSnapshot: (techId) =>
      collectionState.getTechniqueProgressionSnapshot(techId),
  });
}
