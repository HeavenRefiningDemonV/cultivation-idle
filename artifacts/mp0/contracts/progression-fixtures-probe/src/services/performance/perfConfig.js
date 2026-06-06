export const PERF_QUERY_PARAM = 'ciPerf';
export const PERF_LOCAL_STORAGE_KEY = 'ci:perf:enabled';
export const DEFAULT_PERF_CONFIG = Object.freeze({
    enabled: false,
    source: 'disabled',
    maxMeasureEntries: 240,
    maxEventEntries: 240,
    collectLongTasks: true,
    collectLongAnimationFrames: true,
    collectMarks: false,
    exposeWindowDebug: true,
    logToConsole: false,
});
const readProcessEnv = (key) => {
    const processLike = globalThis.process;
    return processLike?.env?.[key];
};
export function detectPerfConfig() {
    const envEnabled = readProcessEnv('CI_PERF') === '1';
    const nodeEnv = readProcessEnv('NODE_ENV');
    if (typeof window === 'undefined') {
        return envEnabled
            ? { ...DEFAULT_PERF_CONFIG, enabled: true, source: nodeEnv === 'test' ? 'test' : 'script', exposeWindowDebug: false }
            : { ...DEFAULT_PERF_CONFIG };
    }
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get(PERF_QUERY_PARAM) === '1') {
            return { ...DEFAULT_PERF_CONFIG, enabled: true, source: 'query' };
        }
    }
    catch {
        // Ignore malformed URLs or unusual browser contexts.
    }
    try {
        if (window.localStorage?.getItem(PERF_LOCAL_STORAGE_KEY) === '1') {
            return { ...DEFAULT_PERF_CONFIG, enabled: true, source: 'localStorage' };
        }
    }
    catch {
        // localStorage can be blocked; disabled instrumentation should never crash.
    }
    if (envEnabled) {
        return { ...DEFAULT_PERF_CONFIG, enabled: true, source: 'development' };
    }
    return { ...DEFAULT_PERF_CONFIG };
}
