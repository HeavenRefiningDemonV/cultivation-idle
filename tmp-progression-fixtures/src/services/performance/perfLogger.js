import { DEFAULT_PERF_CONFIG, detectPerfConfig } from './perfConfig.js';
const NOOP = () => { };
const SENSITIVE_KEY_PATTERN = /(save|payload|localstorage|token|secret|password|dsn|encrypted|raw)/i;
const MAX_DETAIL_DEPTH = 2;
const MAX_DETAIL_STRING_LENGTH = 160;
let config = detectPerfConfig();
let startedAt = now();
const counters = new Map();
const measures = new Map();
const renderCounters = new Map();
const recentEvents = [];
const longTasks = [];
const longAnimationFrames = [];
const scenarios = new Map();
const observerStops = [];
const notes = [];
export function now() {
    const perf = globalThis.performance;
    return typeof perf?.now === 'function' ? perf.now() : Date.now();
}
export function getPerfConfig() {
    return config;
}
export function configurePerfForTests(overrides) {
    config = { ...DEFAULT_PERF_CONFIG, ...overrides };
}
export function isPerfEnabled() {
    return config.enabled;
}
function capMap(map, maxEntries) {
    if (maxEntries <= 0) {
        map.clear();
        return;
    }
    while (map.size > maxEntries) {
        const first = map.keys().next().value;
        if (!first)
            return;
        map.delete(first);
    }
}
function pushCapped(target, entry, maxEntries) {
    if (maxEntries <= 0)
        return;
    target.push(entry);
    while (target.length > maxEntries)
        target.shift();
}
function sanitizeDetail(value, depth = 0) {
    if (depth > MAX_DETAIL_DEPTH)
        return '[depth-limit]';
    if (value === null || value === undefined)
        return value;
    if (typeof value === 'number' || typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        return value.length > MAX_DETAIL_STRING_LENGTH
            ? `${value.slice(0, MAX_DETAIL_STRING_LENGTH)}...`
            : value;
    }
    if (Array.isArray(value)) {
        return value.slice(0, 8).map((entry) => sanitizeDetail(entry, depth + 1));
    }
    if (typeof value === 'object') {
        const clean = {};
        Object.entries(value).slice(0, 16).forEach(([key, entry]) => {
            clean[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : sanitizeDetail(entry, depth + 1);
        });
        return clean;
    }
    return String(value);
}
function counterCounts() {
    return Object.fromEntries([...counters.entries()].map(([key, value]) => [key, value.count]));
}
export function incrementCounter(name, amount = 1, detail) {
    if (!config.enabled)
        return;
    const timestamp = now();
    const current = counters.get(name) ?? { name, count: 0 };
    current.count += amount;
    current.lastIncrementAt = timestamp;
    counters.set(name, current);
    capMap(counters, config.maxMeasureEntries);
    if (detail !== undefined) {
        recordEvent(name, detail);
    }
}
export function recordMeasure(name, durationMs) {
    if (!config.enabled || !Number.isFinite(durationMs))
        return;
    const safeDuration = Math.max(0, durationMs);
    const current = measures.get(name) ?? {
        name,
        count: 0,
        totalMs: 0,
        avgMs: 0,
        maxMs: 0,
        minMs: Number.POSITIVE_INFINITY,
        lastMs: 0,
    };
    current.count += 1;
    current.totalMs += safeDuration;
    current.avgMs = current.totalMs / current.count;
    current.maxMs = Math.max(current.maxMs, safeDuration);
    current.minMs = Math.min(current.minMs, safeDuration);
    current.lastMs = safeDuration;
    measures.set(name, current);
    capMap(measures, config.maxMeasureEntries);
}
export function recordEvent(name, detail) {
    if (!config.enabled)
        return;
    pushCapped(recentEvents, {
        name,
        timestamp: now(),
        detail: detail === undefined ? undefined : sanitizeDetail(detail),
    }, config.maxEventEntries);
}
export function time(name, fn) {
    if (!config.enabled)
        return fn();
    const start = now();
    try {
        return fn();
    }
    finally {
        recordMeasure(name, now() - start);
    }
}
export async function timeAsync(name, fn) {
    if (!config.enabled)
        return fn();
    const start = now();
    try {
        return await fn();
    }
    finally {
        recordMeasure(name, now() - start);
    }
}
export function startTimer(name) {
    if (!config.enabled)
        return NOOP;
    const start = now();
    let ended = false;
    return () => {
        if (ended)
            return;
        ended = true;
        recordMeasure(name, now() - start);
    };
}
export function mark(name, detail) {
    if (!config.enabled || !config.collectMarks)
        return;
    recordEvent(name, detail);
    const perf = globalThis.performance;
    try {
        perf?.mark?.(name);
    }
    catch {
        // Browser user timing is best-effort only.
    }
}
export function measure(name, start, end) {
    if (!config.enabled || !config.collectMarks)
        return;
    const perf = globalThis.performance;
    try {
        const entry = perf?.measure?.(name, start, end);
        if (entry)
            recordMeasure(name, entry.duration);
    }
    catch {
        // Missing marks should not affect gameplay or tests.
    }
}
export function recordRender(id) {
    if (!config.enabled)
        return;
    const current = renderCounters.get(id) ?? {
        id,
        renderCount: 0,
        commitCount: 0,
        mountCount: 0,
        updateCount: 0,
        totalActualDurationMs: 0,
        maxActualDurationMs: 0,
    };
    current.renderCount += 1;
    renderCounters.set(id, current);
}
export function recordRenderCommit(input) {
    if (!config.enabled)
        return;
    const current = renderCounters.get(input.id) ?? {
        id: input.id,
        renderCount: 0,
        commitCount: 0,
        mountCount: 0,
        updateCount: 0,
        totalActualDurationMs: 0,
        maxActualDurationMs: 0,
    };
    current.commitCount += 1;
    current.totalActualDurationMs += input.actualDuration;
    current.maxActualDurationMs = Math.max(current.maxActualDurationMs, input.actualDuration);
    current.totalBaseDurationMs = (current.totalBaseDurationMs ?? 0) + (input.baseDuration ?? 0);
    current.lastPhase = input.phase;
    current.lastCommitTime = input.commitTime;
    if (input.phase === 'mount')
        current.mountCount += 1;
    if (input.phase === 'update' || input.phase === 'nested-update')
        current.updateCount += 1;
    renderCounters.set(input.id, current);
}
function recordPerformanceEntry(target, entry) {
    pushCapped(target, {
        name: entry.name || entry.entryType,
        startTime: entry.startTime,
        durationMs: entry.duration,
    }, config.maxEventEntries);
}
function startEntryObserver(entryType, target) {
    if (!config.enabled || typeof PerformanceObserver === 'undefined')
        return NOOP;
    const supported = PerformanceObserver.supportedEntryTypes ?? [];
    if (!supported.includes(entryType))
        return NOOP;
    try {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                recordPerformanceEntry(target, entry);
                recordMeasure(`ci:${entryType}:duration`, entry.duration);
                incrementCounter(`ci:${entryType}:count`);
            }
        });
        observer.observe({ type: entryType, buffered: true });
        return () => observer.disconnect();
    }
    catch {
        return NOOP;
    }
}
export function startPerformanceObservers() {
    if (!config.enabled)
        return NOOP;
    if (config.collectLongTasks)
        observerStops.push(startEntryObserver('longtask', longTasks));
    if (config.collectLongAnimationFrames)
        observerStops.push(startEntryObserver('long-animation-frame', longAnimationFrames));
    return stopPerformanceObservers;
}
export function stopPerformanceObservers() {
    while (observerStops.length > 0) {
        const stop = observerStops.pop();
        stop?.();
    }
}
export function startScenario(name) {
    if (!config.enabled)
        return;
    scenarios.set(name, {
        name,
        startedAt: now(),
        countersAtStart: counterCounts(),
        notes: [],
    });
    recordEvent(name, { phase: 'start' });
}
export function endScenario(name) {
    if (!config.enabled)
        return;
    const current = scenarios.get(name);
    if (!current) {
        notes.push(`Scenario ended without start: ${name}`);
        return;
    }
    const endedAt = now();
    current.endedAt = endedAt;
    current.durationMs = endedAt - current.startedAt;
    current.countersAtEnd = counterCounts();
    scenarios.set(name, current);
    recordEvent(name, { phase: 'end', durationMs: current.durationMs });
}
export function exportPerfSnapshot() {
    const exportedMeasures = Object.fromEntries([...measures.entries()].map(([key, value]) => [
        key,
        {
            ...value,
            minMs: Number.isFinite(value.minMs) ? value.minMs : 0,
        },
    ]));
    return {
        enabled: config.enabled,
        source: config.source,
        startedAt,
        exportedAt: now(),
        counters: Object.fromEntries(counters.entries()),
        measures: exportedMeasures,
        renderCounters: Object.fromEntries(renderCounters.entries()),
        recentEvents: [...recentEvents],
        longTasks: [...longTasks],
        longAnimationFrames: [...longAnimationFrames],
        scenarios: Object.fromEntries(scenarios.entries()),
        notes: [...notes],
    };
}
export function resetPerfSnapshot() {
    counters.clear();
    measures.clear();
    renderCounters.clear();
    recentEvents.length = 0;
    longTasks.length = 0;
    longAnimationFrames.length = 0;
    scenarios.clear();
    notes.length = 0;
    startedAt = now();
}
export function installPerfWindowDebug() {
    if (!config.enabled || !config.exposeWindowDebug || typeof window === 'undefined')
        return;
    window.__CI_PERF__ = {
        export: exportPerfSnapshot,
        reset: resetPerfSnapshot,
        markScenario: (name) => recordEvent(name, { phase: 'mark' }),
        startScenario,
        endScenario,
        isEnabled: isPerfEnabled,
    };
}
export function initializePerformanceInstrumentation() {
    if (!config.enabled)
        return;
    startPerformanceObservers();
    installPerfWindowDebug();
}
