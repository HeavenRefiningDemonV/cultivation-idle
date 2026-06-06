export { DEFAULT_PERF_CONFIG, PERF_LOCAL_STORAGE_KEY, PERF_QUERY_PARAM, detectPerfConfig, } from './perfConfig.js';
export { PERF_LABELS } from './perfLabels.js';
export { configurePerfForTests, endScenario, exportPerfSnapshot, getPerfConfig, incrementCounter, initializePerformanceInstrumentation, installPerfWindowDebug, isPerfEnabled, mark, measure, now, recordEvent, recordMeasure, resetPerfSnapshot, startPerformanceObservers, startScenario, startTimer, stopPerformanceObservers, time, timeAsync, } from './perfLogger.js';
