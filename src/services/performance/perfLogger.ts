import { DEFAULT_PERF_CONFIG, detectPerfConfig, type PerfConfig } from './perfConfig.js';

export type PerfMeasureRecord = {
  name: string;
  count: number;
  totalMs: number;
  avgMs: number;
  maxMs: number;
  minMs: number;
  lastMs: number;
};

export type PerfCounterRecord = {
  name: string;
  count: number;
  lastIncrementAt?: number;
};

export type PerfRenderRecord = {
  id: string;
  renderCount: number;
  commitCount: number;
  mountCount: number;
  updateCount: number;
  totalActualDurationMs: number;
  maxActualDurationMs: number;
  totalBaseDurationMs?: number;
  lastPhase?: 'mount' | 'update' | 'nested-update';
  lastCommitTime?: number;
};

export type PerfEventRecord = {
  name: string;
  timestamp: number;
  detail?: unknown;
};

export type PerfLongTaskRecord = {
  name: string;
  startTime: number;
  durationMs: number;
};

export type PerfLongAnimationFrameRecord = PerfLongTaskRecord;

export type PerfScenarioRecord = {
  name: string;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
  countersAtStart: Record<string, number>;
  countersAtEnd?: Record<string, number>;
  notes: string[];
};

export type PerfExport = {
  enabled: boolean;
  source: string;
  startedAt: number;
  exportedAt: number;
  counters: Record<string, PerfCounterRecord>;
  measures: Record<string, PerfMeasureRecord>;
  renderCounters: Record<string, PerfRenderRecord>;
  recentEvents: PerfEventRecord[];
  longTasks: PerfLongTaskRecord[];
  longAnimationFrames: PerfLongAnimationFrameRecord[];
  scenarios: Record<string, PerfScenarioRecord>;
  notes: string[];
};

type MutableMeasureRecord = PerfMeasureRecord;

const NOOP = () => {};
const SENSITIVE_KEY_PATTERN = /(save|payload|localstorage|token|secret|password|dsn|encrypted|raw)/i;
const MAX_DETAIL_DEPTH = 2;
const MAX_DETAIL_STRING_LENGTH = 160;

let config: PerfConfig = detectPerfConfig();
let startedAt = now();
const counters = new Map<string, PerfCounterRecord>();
const measures = new Map<string, MutableMeasureRecord>();
const renderCounters = new Map<string, PerfRenderRecord>();
const recentEvents: PerfEventRecord[] = [];
const longTasks: PerfLongTaskRecord[] = [];
const longAnimationFrames: PerfLongAnimationFrameRecord[] = [];
const scenarios = new Map<string, PerfScenarioRecord>();
const observerStops: Array<() => void> = [];
const notes: string[] = [];

export function now(): number {
  const perf = (globalThis as { performance?: { now?: () => number } }).performance;
  return typeof perf?.now === 'function' ? perf.now() : Date.now();
}

export function getPerfConfig(): PerfConfig {
  return config;
}

export function configurePerfForTests(overrides: Partial<PerfConfig>): void {
  config = { ...DEFAULT_PERF_CONFIG, ...overrides };
}

export function isPerfEnabled(): boolean {
  return config.enabled;
}

function capMap<T>(map: Map<string, T>, maxEntries: number): void {
  if (maxEntries <= 0) {
    map.clear();
    return;
  }
  while (map.size > maxEntries) {
    const first = map.keys().next().value as string | undefined;
    if (!first) return;
    map.delete(first);
  }
}

function pushCapped<T>(target: T[], entry: T, maxEntries: number): void {
  if (maxEntries <= 0) return;
  target.push(entry);
  while (target.length > maxEntries) target.shift();
}

function sanitizeDetail(value: unknown, depth = 0): unknown {
  if (depth > MAX_DETAIL_DEPTH) return '[depth-limit]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.length > MAX_DETAIL_STRING_LENGTH
      ? `${value.slice(0, MAX_DETAIL_STRING_LENGTH)}...`
      : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 8).map((entry) => sanitizeDetail(entry, depth + 1));
  }
  if (typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).slice(0, 16).forEach(([key, entry]) => {
      clean[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : sanitizeDetail(entry, depth + 1);
    });
    return clean;
  }
  return String(value);
}

function counterCounts(): Record<string, number> {
  return Object.fromEntries([...counters.entries()].map(([key, value]) => [key, value.count]));
}

export function incrementCounter(name: string, amount = 1, detail?: unknown): void {
  if (!config.enabled) return;
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

export function recordMeasure(name: string, durationMs: number): void {
  if (!config.enabled || !Number.isFinite(durationMs)) return;
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

export function recordEvent(name: string, detail?: unknown): void {
  if (!config.enabled) return;
  pushCapped(
    recentEvents,
    {
      name,
      timestamp: now(),
      detail: detail === undefined ? undefined : sanitizeDetail(detail),
    },
    config.maxEventEntries,
  );
}

export function time<T>(name: string, fn: () => T): T {
  if (!config.enabled) return fn();
  const start = now();
  try {
    return fn();
  } finally {
    recordMeasure(name, now() - start);
  }
}

export async function timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (!config.enabled) return fn();
  const start = now();
  try {
    return await fn();
  } finally {
    recordMeasure(name, now() - start);
  }
}

export function startTimer(name: string): () => void {
  if (!config.enabled) return NOOP;
  const start = now();
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    recordMeasure(name, now() - start);
  };
}

export function mark(name: string, detail?: unknown): void {
  if (!config.enabled || !config.collectMarks) return;
  recordEvent(name, detail);
  const perf = (globalThis as { performance?: { mark?: (name: string) => void } }).performance;
  try {
    perf?.mark?.(name);
  } catch {
    // Browser user timing is best-effort only.
  }
}

export function measure(name: string, start: string, end: string): void {
  if (!config.enabled || !config.collectMarks) return;
  const perf = (globalThis as { performance?: { measure?: (name: string, start: string, end: string) => PerformanceMeasure } }).performance;
  try {
    const entry = perf?.measure?.(name, start, end);
    if (entry) recordMeasure(name, entry.duration);
  } catch {
    // Missing marks should not affect gameplay or tests.
  }
}

export function recordRender(id: string): void {
  if (!config.enabled) return;
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

export function recordRenderCommit(input: {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration?: number;
  commitTime: number;
}): void {
  if (!config.enabled) return;
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
  if (input.phase === 'mount') current.mountCount += 1;
  if (input.phase === 'update' || input.phase === 'nested-update') current.updateCount += 1;
  renderCounters.set(input.id, current);
}

function recordPerformanceEntry(target: PerfLongTaskRecord[], entry: PerformanceEntry): void {
  pushCapped(
    target,
    {
      name: entry.name || entry.entryType,
      startTime: entry.startTime,
      durationMs: entry.duration,
    },
    config.maxEventEntries,
  );
}

function startEntryObserver(entryType: 'longtask' | 'long-animation-frame', target: PerfLongTaskRecord[]): () => void {
  if (!config.enabled || typeof PerformanceObserver === 'undefined') return NOOP;
  const supported = PerformanceObserver.supportedEntryTypes ?? [];
  if (!supported.includes(entryType)) return NOOP;
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
  } catch {
    return NOOP;
  }
}

export function startPerformanceObservers(): () => void {
  if (!config.enabled) return NOOP;
  if (config.collectLongTasks) observerStops.push(startEntryObserver('longtask', longTasks));
  if (config.collectLongAnimationFrames) observerStops.push(startEntryObserver('long-animation-frame', longAnimationFrames));
  return stopPerformanceObservers;
}

export function stopPerformanceObservers(): void {
  while (observerStops.length > 0) {
    const stop = observerStops.pop();
    stop?.();
  }
}

export function startScenario(name: string): void {
  if (!config.enabled) return;
  scenarios.set(name, {
    name,
    startedAt: now(),
    countersAtStart: counterCounts(),
    notes: [],
  });
  recordEvent(name, { phase: 'start' });
}

export function endScenario(name: string): void {
  if (!config.enabled) return;
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

export function exportPerfSnapshot(): PerfExport {
  const exportedMeasures = Object.fromEntries(
    [...measures.entries()].map(([key, value]) => [
      key,
      {
        ...value,
        minMs: Number.isFinite(value.minMs) ? value.minMs : 0,
      },
    ]),
  );
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

export function resetPerfSnapshot(): void {
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

export function installPerfWindowDebug(): void {
  if (!config.enabled || !config.exposeWindowDebug || typeof window === 'undefined') return;
  window.__CI_PERF__ = {
    export: exportPerfSnapshot,
    reset: resetPerfSnapshot,
    markScenario: (name: string) => recordEvent(name, { phase: 'mark' }),
    startScenario,
    endScenario,
    isEnabled: isPerfEnabled,
  };
}

export function initializePerformanceInstrumentation(): void {
  if (!config.enabled) return;
  startPerformanceObservers();
  installPerfWindowDebug();
}

declare global {
  interface Window {
    __CI_PERF__?: {
      export: () => PerfExport;
      reset: () => void;
      markScenario: (name: string) => void;
      startScenario: (name: string) => void;
      endScenario: (name: string) => void;
      isEnabled: () => boolean;
    };
  }
}
