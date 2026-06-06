import { create } from 'zustand';
export const useBreakthroughEchoStore = create()((set) => ({
    echoes: [],
    recordEcho: (echo) => set((state) => {
        if (state.echoes.some((entry) => entry.echoId === echo.echoId))
            return state;
        return { echoes: [echo, ...state.echoes].slice(0, 8) };
    }),
    clearBreakthroughEchoes: () => set({ echoes: [] }),
    hardResetBreakthroughEchoes: () => set({ echoes: [] }),
}));
export const clearBreakthroughEchoes = () => useBreakthroughEchoStore.getState().clearBreakthroughEchoes();
export const hardResetBreakthroughEchoes = () => useBreakthroughEchoStore.getState().hardResetBreakthroughEchoes();
