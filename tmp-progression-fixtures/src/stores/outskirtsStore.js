import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
const createDefaultProgress = () => ({
    killsSinceBoss: 0,
    totalKills: 0,
    bossDefeated: false,
});
export const useOutskirtsStore = create()(immer((set, get) => ({
    progressByOutskirtsId: {},
    autoContinue: true,
    stopAtBoss: false,
    getProgress: (outskirtsId) => {
        const existing = get().progressByOutskirtsId[outskirtsId];
        if (existing)
            return existing;
        const defaults = createDefaultProgress();
        set((state) => {
            state.progressByOutskirtsId[outskirtsId] = defaults;
        });
        return defaults;
    },
    recordKill: (outskirtsId, isBoss) => {
        set((state) => {
            if (!state.progressByOutskirtsId[outskirtsId]) {
                state.progressByOutskirtsId[outskirtsId] = createDefaultProgress();
            }
            const progress = state.progressByOutskirtsId[outskirtsId];
            progress.totalKills += 1;
            if (isBoss) {
                progress.bossDefeated = true;
                progress.killsSinceBoss = 0;
            }
            else {
                progress.killsSinceBoss += 1;
            }
        });
    },
    shouldSpawnBoss: (outskirtsId, outskirtsDef) => {
        const progress = get().getProgress(outskirtsId);
        return progress.killsSinceBoss >= outskirtsDef.killsToBoss;
    },
    setAutoContinue: (enabled) => {
        set((state) => {
            state.autoContinue = enabled;
        });
    },
    setStopAtBoss: (enabled) => {
        set((state) => {
            state.stopAtBoss = enabled;
        });
    },
    hardResetOutskirts: () => {
        set(() => ({
            progressByOutskirtsId: {},
            autoContinue: true,
            stopAtBoss: false,
        }));
    },
})));
