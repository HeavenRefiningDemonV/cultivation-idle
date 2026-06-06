import { useTechCollectionStore } from "../../stores/techCollectionStore.js";
import { useTechniqueStore, } from "../../stores/techniqueStore.js";
import { buildDoctrineSnapshot, getDoctrineSnapshotWarnings, getDoctrineSourceFlags, } from "../doctrine/index.js";
import { buildLoadoutSnapshot, } from "./loadoutSnapshot.js";
import { getPathAlignmentStrengthForTechnique, getTechniqueTaxonomyProfile, } from "./techniqueTaxonomy.js";
function collectAssignments(loadoutSource, loadout) {
    const assignments = [];
    loadoutSource.slots.active.forEach((techId, slotIndex) => {
        if (!techId)
            return;
        assignments.push({
            slotType: "active",
            slotIndex,
            techId,
            availability: slotIndex < loadout.unlocked.active ? "equipped" : "parked_locked",
        });
    });
    loadoutSource.slots.passive.forEach((techId, slotIndex) => {
        if (!techId)
            return;
        assignments.push({
            slotType: "passive",
            slotIndex,
            techId,
            availability: slotIndex < loadout.unlocked.passive ? "equipped" : "parked_locked",
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
export function buildTechniqueFoundationContextFromSnapshots(input) {
    const resolveTaxonomy = input.getTechniqueTaxonomyProfile ??
        ((techId) => getTechniqueTaxonomyProfile(techId));
    const resolveAlignment = input.getPathAlignmentStrength ??
        ((techId, path) => getPathAlignmentStrengthForTechnique(techId, path));
    const assignedTechniques = collectAssignments(input.loadoutSource, input.loadout).map((assignment) => ({
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
        equippedTechniques: assignedTechniques.filter((entry) => entry.availability === "equipped"),
        parkedLockedTechniques: assignedTechniques.filter((entry) => entry.availability === "parked_locked"),
        alignmentSummary: {
            strong: assignedTechniques.filter((entry) => entry.pathAlignment === "strong").length,
            neutral: assignedTechniques.filter((entry) => entry.pathAlignment === "neutral").length,
            off: assignedTechniques.filter((entry) => entry.pathAlignment === "off")
                .length,
        },
    };
}
function resolveRuntimeLoadout(loadoutId) {
    const techniqueState = useTechniqueStore.getState();
    const requested = loadoutId
        ? techniqueState.loadouts.find((loadout) => loadout.id === loadoutId)
        : undefined;
    const selected = techniqueState.getSelectedLoadout() ??
        techniqueState.loadouts.find((loadout) => loadout.id === techniqueState.selectedLoadoutId);
    const fallback = techniqueState.loadouts[0];
    return (requested ??
        selected ??
        fallback ?? {
        id: loadoutId ?? "default",
        name: "Default",
        aiProfile: "balanced",
        castingPolicy: "balanced",
        slots: { active: [], passive: [], ultimate: null },
    });
}
export function buildTechniqueFoundationContext(loadoutId) {
    const doctrine = buildDoctrineSnapshot();
    const loadout = buildLoadoutSnapshot(loadoutId);
    const loadoutSource = resolveRuntimeLoadout(loadoutId);
    const collectionState = useTechCollectionStore.getState();
    return buildTechniqueFoundationContextFromSnapshots({
        doctrine,
        loadout,
        loadoutSource,
        getTechniqueProgressionSnapshot: (techId) => collectionState.getTechniqueProgressionSnapshot(techId),
    });
}
