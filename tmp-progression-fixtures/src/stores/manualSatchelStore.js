import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { GameEvents } from "../services/events/GameEvents.js";
import { getDuplicateFragmentValue, getStudyDurationByGrade, isDuplicateManualOffer, isManualOfferQualityUpgrade, } from "../systems/manuals/index.js";
import { useContentStore } from "./contentStore.js";
import { getManualGradeFromTechnique, normalizeGrade, normalizeRarity, useTechCollectionStore, } from "./techCollectionStore.js";
import { useUIStore } from "./uiStore.js";
import { useGameStore } from "./gameStore.js";
const GRADE_TIER_ORDER = ["mortal", "earth", "heaven", "mystic"];
function generateManualId() {
    return `man_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
function sanitizeManual(manual) {
    if (!manual || typeof manual.techId !== "string")
        return null;
    const id = typeof manual.id === "string" ? manual.id : generateManualId();
    const grade = normalizeGrade(manual.grade);
    const rarity = normalizeRarity(manual.rarity);
    const acquiredAt = typeof manual.acquiredAt === "number" ? manual.acquiredAt : Date.now();
    return {
        id,
        pavilionId: manual.pavilionId ?? null,
        cityId: manual.cityId ?? null,
        techId: manual.techId,
        grade,
        rarity,
        acquiredAt,
    };
}
function sanitizeActiveStudy(study) {
    if (!study || !study.manual)
        return null;
    const manual = sanitizeManual(study.manual);
    if (!manual)
        return null;
    const startedAt = typeof study.startedAt === "number" ? study.startedAt : Date.now();
    const endsAt = typeof study.endsAt === "number" ? study.endsAt : startedAt;
    return {
        studyId: typeof study.studyId === "string" ? study.studyId : `study_${manual.id}`,
        manual,
        startedAt,
        endsAt,
        focusUsed: Boolean(study.focusUsed),
        focusReward: study.focusReward,
        focusAppliedAt: typeof study.focusAppliedAt === "number"
            ? study.focusAppliedAt
            : undefined,
        completionHandled: Boolean(study.completionHandled),
    };
}
function isTechniquePathAllowed(techniquePath, selectedPath, allowCrossPath) {
    if (allowCrossPath || !selectedPath)
        return true;
    return techniquePath === selectedPath;
}
function isTechniqueTierAllowed(grade, maxTier) {
    const tierIndex = GRADE_TIER_ORDER.indexOf(grade);
    if (tierIndex < 0)
        return false;
    return tierIndex + 1 <= maxTier;
}
function ensureMasteryAtLeast(techId, level) {
    const collection = useTechCollectionStore.getState();
    collection.ensureMasteryLevelAtLeast(techId, level);
}
export const useManualSatchelStore = create()(immer((set, get) => ({
    manuals: [],
    activeStudy: null,
    lastLearned: null,
    addManual: (manual) => {
        const sanitized = sanitizeManual(manual);
        if (!sanitized)
            return manual;
        set((state) => {
            state.manuals.push(sanitized);
        });
        GameEvents.emit({
            type: "manuals/purchased",
            payload: {
                manualId: sanitized.techId,
                techniqueId: sanitized.techId,
                quantity: 1,
            },
        });
        return sanitized;
    },
    dismantleManual: (instanceId) => {
        const currentState = get();
        if (currentState.activeStudy?.manual.id === instanceId) {
            return { ok: false, reason: "manual_in_use" };
        }
        let removed = null;
        set((state) => {
            const index = state.manuals.findIndex((manual) => manual.id === instanceId);
            if (index === -1)
                return;
            const [removedManual] = state.manuals.splice(index, 1);
            removed = removedManual ? { ...removedManual } : null;
        });
        if (!removed)
            return { ok: false, reason: "manual_not_found" };
        const manual = removed;
        const fragmentsGained = getDuplicateFragmentValue(manual.grade, manual.rarity);
        if (fragmentsGained > 0) {
            useTechCollectionStore
                .getState()
                .addFragments(manual.techId, fragmentsGained);
        }
        GameEvents.emit({
            type: "rewards/granted",
            payload: { type: "techniqueFragments", techId: manual.techId },
        });
        return { ok: true, fragmentsGained, techId: manual.techId };
    },
    startStudy: (instanceId, now = Date.now()) => {
        const currentState = get();
        if (currentState.activeStudy)
            return { ok: false, reason: "Already studying a manual." };
        let manual = null;
        set((draft) => {
            const index = draft.manuals.findIndex((entry) => entry.id === instanceId);
            if (index === -1)
                return;
            const [removedManual] = draft.manuals.splice(index, 1);
            manual = removedManual ? { ...removedManual } : null;
            const durationMs = manual ? getStudyDurationByGrade(manual.grade) : 0;
            draft.activeStudy = manual
                ? {
                    studyId: `study_${manual.id}`,
                    manual,
                    startedAt: now,
                    endsAt: now + durationMs,
                    focusUsed: false,
                }
                : draft.activeStudy;
        });
        if (!manual)
            return { ok: false, reason: "Manual not found." };
        const manualInstance = manual;
        GameEvents.emit({
            type: "manuals/focus_prompt",
            payload: { manualId: manualInstance.techId },
        });
        GameEvents.emit({
            type: "manuals/studied",
            payload: { manualId: manualInstance.techId, progress: 0 },
        });
        return { ok: true };
    },
    applyFocusReward: (now = Date.now()) => {
        const active = get().activeStudy;
        if (!active) {
            GameEvents.emit({
                type: "manuals/focus_failed",
                payload: { reason: "No active study." },
            });
            return { ok: false, reason: "No active study." };
        }
        if (active.focusUsed) {
            GameEvents.emit({
                type: "manuals/focus_failed",
                payload: {
                    manualId: active.manual.techId,
                    reason: "Focus already applied.",
                },
            });
            return { ok: false, reason: "Focus already applied." };
        }
        const rewards = ["time", "mastery", "traitQuality"];
        const roll = rewards[Math.floor(Math.random() * rewards.length)];
        set((state) => {
            const study = state.activeStudy;
            if (!study)
                return;
            study.focusUsed = true;
            study.focusReward = roll;
            study.focusAppliedAt = now;
            if (roll === "time") {
                const remaining = Math.max(0, study.endsAt - now);
                study.endsAt = now + remaining * 0.9;
            }
        });
        GameEvents.emit({
            type: "manuals/focus_applied",
            payload: { manualId: active.manual.techId, reward: roll },
        });
        GameEvents.emit({
            type: "manuals/studied",
            payload: { manualId: active.manual.techId, progress: 0.5 },
        });
        return { ok: true, reward: roll };
    },
    tick: (now = Date.now()) => {
        const active = get().activeStudy;
        if (!active || active.completionHandled)
            return;
        if (now < active.endsAt)
            return;
        set((state) => {
            if (!state.activeStudy)
                return;
            state.activeStudy.completionHandled = true;
        });
        const collection = useTechCollectionStore.getState();
        const ui = useUIStore.getState();
        const { manual, focusReward } = active;
        const owned = collection.ensureTechState(manual.techId);
        const hasTech = collection.hasTech(manual.techId);
        const qualityUpgrade = isManualOfferQualityUpgrade({
            hasTechnique: hasTech,
            ownedGrade: owned.manualGrade,
            ownedRarity: owned.rarity,
            offerGrade: manual.grade,
            offerRarity: manual.rarity,
        });
        const duplicateOffer = isDuplicateManualOffer({
            hasTechnique: hasTech,
            ownedGrade: owned.manualGrade,
            ownedRarity: owned.rarity,
            offerGrade: manual.grade,
            offerRarity: manual.rarity,
        });
        if (duplicateOffer && !qualityUpgrade) {
            const fragmentsGained = getDuplicateFragmentValue(manual.grade, manual.rarity);
            if (fragmentsGained > 0) {
                collection.addFragments(manual.techId, fragmentsGained);
            }
            set((state) => {
                state.activeStudy = null;
                state.lastLearned = null;
            });
            ui.addNotification("info", `Manual converted to fragments for ${manual.techId}`);
            GameEvents.emit({
                type: "manuals/studied",
                payload: { manualId: manual.techId, progress: 1 },
            });
            return;
        }
        collection.unlockTech(manual.techId, {
            unlocked: true,
            manualGrade: manual.grade,
            rarity: manual.rarity,
        });
        collection.setManualGrade(manual.techId, manual.grade);
        collection.setRarityIfHigher(manual.techId, manual.rarity);
        if (focusReward === "mastery") {
            ensureMasteryAtLeast(manual.techId, 10);
        }
        if (focusReward === "traitQuality") {
            collection.applyTraitQualityBoost(manual.techId, 0.05);
        }
        const learnedPayload = {
            techId: manual.techId,
            grade: manual.grade,
            rarity: manual.rarity,
            focusReward,
            learnedAt: now,
        };
        set((state) => {
            state.activeStudy = null;
            state.lastLearned = learnedPayload;
        });
        ui.openTechniqueLearned(learnedPayload);
        GameEvents.emit({
            type: "manuals/studied",
            payload: { manualId: manual.techId, progress: 1 },
        });
    },
    unlockRandomTechnique: (options) => {
        const { maxTier = 2, allowCrossPath = false, includePrestigeLocked = false, } = options ?? {};
        const content = useContentStore.getState();
        if (!content.isLoaded)
            return null;
        if (get().activeStudy)
            return null;
        const selectedPath = useGameStore.getState().selectedPath;
        const techCollection = useTechCollectionStore.getState();
        const techniques = Object.values(content.maps.techniquesById ?? {}).filter(Boolean);
        const unlockable = techniques.filter((technique) => {
            const tech = technique;
            if (techCollection.hasTech(tech.id))
                return false;
            if (!isTechniquePathAllowed(tech.path, selectedPath, allowCrossPath))
                return false;
            const grade = getManualGradeFromTechnique(tech);
            if (!isTechniqueTierAllowed(grade, maxTier))
                return false;
            if (!includePrestigeLocked && Array.isArray(tech.tags)) {
                if (tech.tags.includes("prestige_locked") ||
                    tech.tags.includes("hidden"))
                    return false;
            }
            return true;
        });
        if (unlockable.length === 0)
            return null;
        const chosen = unlockable[Math.floor(Math.random() * unlockable.length)];
        if (!chosen)
            return null;
        const manualGrade = getManualGradeFromTechnique(chosen);
        const manualRarity = normalizeRarity(chosen.rarity);
        const manualInstance = sanitizeManual({
            techId: chosen.id,
            grade: manualGrade,
            rarity: manualRarity,
        });
        if (!manualInstance)
            return null;
        set((state) => {
            state.manuals.push(manualInstance);
        });
        const startResult = get().startStudy(manualInstance.id);
        if (!startResult.ok) {
            set((state) => {
                state.manuals = state.manuals.filter((manual) => manual.id !== manualInstance.id);
            });
            return null;
        }
        const activeStudy = get().activeStudy;
        if (!activeStudy)
            return null;
        const completionTime = activeStudy.endsAt ?? Date.now();
        get().tick(completionTime);
        if (!techCollection.hasTech(chosen.id))
            return null;
        return chosen.id;
    },
    hydrate: (slice) => {
        if (!slice || typeof slice !== "object")
            return;
        const manuals = Array.isArray(slice.manuals)
            ? slice.manuals
                .map((entry) => sanitizeManual(entry))
                .filter(Boolean)
                .map((entry) => entry)
            : [];
        const activeStudy = sanitizeActiveStudy(slice.activeStudy);
        const lastLearned = slice.lastLearned ?? null;
        set({ manuals, activeStudy, lastLearned });
    },
    toSaveState: () => {
        const state = get();
        return {
            manuals: state.manuals.map((manual) => ({ ...manual })),
            activeStudy: state.activeStudy
                ? { ...state.activeStudy, manual: { ...state.activeStudy.manual } }
                : null,
            lastLearned: state.lastLearned ? { ...state.lastLearned } : null,
        };
    },
    hardReset: () => set({ manuals: [], activeStudy: null, lastLearned: null }),
    getManualCount: (techId, grade, rarity) => {
        return get().manuals.filter((manual) => manual.techId === techId &&
            manual.grade === grade &&
            manual.rarity === rarity).length;
    },
})));
