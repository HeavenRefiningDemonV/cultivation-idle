import { GameClock, type GameClockType } from './GameClock.js';
import {
  PERF_LABELS,
  incrementCounter,
  startTimer,
} from '../performance/index.js';

export type ScheduledJobName =
  | 'cultivation-authoritative'
  | 'cultivation-display'
  | 'combat-fixed-step'
  | 'queues-and-expeditions'
  | 'progression-diagnostics'
  | 'housekeeping'
  | 'autosave'
  | 'save-flush';

export type ScheduledJobRunContext = {
  name: ScheduledJobName | string;
  elapsedMs: number;
  stepMs: number;
  nowWall: number;
  nowMono: number;
  tickIndex: number;
  catchupTicks: number;
  reason: 'timer' | 'manual-drain' | 'resume' | 'startup' | 'test';
};

export type ScheduledJob = {
  name: ScheduledJobName | string;
  intervalMs: number;
  run: (context: ScheduledJobRunContext) => void;
  enabled?: () => boolean;
  maxCatchupMs?: number;
  maxStepsPerDrain?: number;
  runWhenHidden?: boolean;
  priority?: 'critical' | 'normal' | 'background';
};

export type ScheduledJobDiagnostics = {
  name: string;
  intervalMs: number;
  enabled: boolean;
  runCount: number;
  skippedCount: number;
  errorCount: number;
  catchupClampCount: number;
  lastRunWall: number | null;
  lastRunMono: number | null;
  lastElapsedMs: number | null;
  totalElapsedMs: number;
  maxElapsedMs: number;
  averageElapsedMs: number;
};

type SchedulerHostTimer = ReturnType<typeof globalThis.setTimeout>;

type ScheduledJobState = {
  job: ScheduledJob;
  accumulatorMs: number;
  lastDrainMono: number | null;
  runCount: number;
  skippedCount: number;
  errorCount: number;
  catchupClampCount: number;
  lastRunWall: number | null;
  lastRunMono: number | null;
  lastElapsedMs: number | null;
  totalElapsedMs: number;
  maxElapsedMs: number;
};

export type SimulationSchedulerOptions = {
  clock?: GameClockType;
  autoStartHost?: boolean;
  drainIntervalMs?: number;
};

function createInitialState(job: ScheduledJob): ScheduledJobState {
  return {
    job,
    accumulatorMs: 0,
    lastDrainMono: null,
    runCount: 0,
    skippedCount: 0,
    errorCount: 0,
    catchupClampCount: 0,
    lastRunWall: null,
    lastRunMono: null,
    lastElapsedMs: null,
    totalElapsedMs: 0,
    maxElapsedMs: 0,
  };
}

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function jobSpecificLabel(name: string): string | null {
  switch (name) {
    case 'cultivation-authoritative':
      return PERF_LABELS.schedulerJobCultivationAuthoritative;
    case 'combat-fixed-step':
      return PERF_LABELS.schedulerJobCombatFixedStep;
    case 'queues-and-expeditions':
      return PERF_LABELS.schedulerJobQueuesAndExpeditions;
    case 'housekeeping':
      return PERF_LABELS.schedulerJobHousekeeping;
    case 'progression-diagnostics':
      return PERF_LABELS.schedulerJobProgressionDiagnostics;
    case 'autosave':
      return PERF_LABELS.schedulerJobAutosave;
    default:
      return null;
  }
}

export class SimulationScheduler {
  private readonly clock: GameClockType;
  private readonly autoStartHost: boolean;
  private readonly drainIntervalMs: number;
  private readonly jobs = new Map<string, ScheduledJobState>();
  private active = false;
  private hidden = false;
  private timerId: SchedulerHostTimer | null = null;

  constructor(options: SimulationSchedulerOptions = {}) {
    this.clock = options.clock ?? GameClock;
    this.autoStartHost = options.autoStartHost ?? true;
    this.drainIntervalMs = Math.max(16, options.drainIntervalMs ?? 50);
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    incrementCounter(PERF_LABELS.schedulerStart);
    if (this.autoStartHost) {
      this.scheduleNextDrain();
    }
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    incrementCounter(PERF_LABELS.schedulerStop);
    if (this.timerId !== null) {
      globalThis.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  register(job: ScheduledJob): void {
    if (!job.name) {
      throw new Error('[SimulationScheduler] Job name is required.');
    }
    if (!Number.isFinite(job.intervalMs) || job.intervalMs <= 0) {
      throw new Error(`[SimulationScheduler] Job ${job.name} must have a positive intervalMs.`);
    }
    this.jobs.set(String(job.name), createInitialState(job));
  }

  unregister(name: ScheduledJobName | string): void {
    this.jobs.delete(String(name));
  }

  clearJobs(): void {
    this.jobs.clear();
  }

  drain(nowMono = this.clock.nowMono(), reason: ScheduledJobRunContext['reason'] = 'timer'): void {
    if (!this.active) return;
    const endDrain = startTimer(PERF_LABELS.schedulerDrain);
    try {
      incrementCounter(PERF_LABELS.schedulerDrain);
      const safeNowMono = clampNonNegative(nowMono);
      const nowWall = this.clock.nowWall();
      for (const state of this.jobs.values()) {
        this.drainJob(state, safeNowMono, nowWall, reason);
      }
    } finally {
      endDrain();
    }
  }

  getDiagnostics(): Record<string, ScheduledJobDiagnostics> {
    return Object.fromEntries(
      [...this.jobs.entries()].map(([name, state]) => [
        name,
        {
          name,
          intervalMs: state.job.intervalMs,
          enabled: this.isJobEnabled(state),
          runCount: state.runCount,
          skippedCount: state.skippedCount,
          errorCount: state.errorCount,
          catchupClampCount: state.catchupClampCount,
          lastRunWall: state.lastRunWall,
          lastRunMono: state.lastRunMono,
          lastElapsedMs: state.lastElapsedMs,
          totalElapsedMs: state.totalElapsedMs,
          maxElapsedMs: state.maxElapsedMs,
          averageElapsedMs: state.runCount > 0 ? state.totalElapsedMs / state.runCount : 0,
        },
      ]),
    );
  }

  resetDiagnostics(): void {
    for (const state of this.jobs.values()) {
      state.runCount = 0;
      state.skippedCount = 0;
      state.errorCount = 0;
      state.catchupClampCount = 0;
      state.lastRunWall = null;
      state.lastRunMono = null;
      state.lastElapsedMs = null;
      state.totalElapsedMs = 0;
      state.maxElapsedMs = 0;
    }
  }

  markDirty(channel: string, detail?: unknown): void {
    incrementCounter(`ci:scheduler:dirty:${channel}`, 1, detail);
  }

  setHidden(hidden: boolean): void {
    if (this.hidden === hidden) return;
    this.hidden = hidden;
    incrementCounter(hidden ? PERF_LABELS.schedulerVisibilityHidden : PERF_LABELS.schedulerVisibilityVisible);
    const nowMono = this.clock.nowMono();
    for (const state of this.jobs.values()) {
      if (state.job.runWhenHidden === false) {
        state.accumulatorMs = 0;
        state.lastDrainMono = nowMono;
      }
    }
  }

  isHidden(): boolean {
    return this.hidden;
  }

  private scheduleNextDrain(): void {
    if (!this.active || !this.autoStartHost) return;
    this.timerId = globalThis.setTimeout(() => {
      this.timerId = null;
      this.drain(this.clock.nowMono(), 'timer');
      this.scheduleNextDrain();
    }, this.drainIntervalMs);
  }

  private drainJob(
    state: ScheduledJobState,
    nowMono: number,
    nowWall: number,
    reason: ScheduledJobRunContext['reason'],
  ): void {
    const { job } = state;
    const rawElapsed = state.lastDrainMono === null ? 0 : nowMono - state.lastDrainMono;
    state.lastDrainMono = nowMono;
    const elapsedSinceLastDrain = clampNonNegative(rawElapsed);

    if (!this.isJobEnabled(state)) {
      this.skipIfDue(state, elapsedSinceLastDrain);
      return;
    }

    if (this.hidden && job.runWhenHidden === false) {
      this.skipIfDue(state, elapsedSinceLastDrain);
      state.accumulatorMs = 0;
      return;
    }

    const maxCatchupMs = Math.max(0, job.maxCatchupMs ?? job.intervalMs);
    const elapsedMs = Math.min(elapsedSinceLastDrain, maxCatchupMs);
    if (elapsedSinceLastDrain > maxCatchupMs) {
      state.catchupClampCount += 1;
      incrementCounter(PERF_LABELS.schedulerCatchupClamped, 1, {
        name: job.name,
        rawElapsedMs: elapsedSinceLastDrain,
        maxCatchupMs,
      });
    }

    state.accumulatorMs += elapsedMs;
    const maxSteps = Math.max(1, Math.floor(job.maxStepsPerDrain ?? 1));
    let steps = 0;

    while (state.accumulatorMs >= job.intervalMs && steps < maxSteps) {
      const context: ScheduledJobRunContext = {
        name: job.name,
        elapsedMs: job.intervalMs,
        stepMs: job.intervalMs,
        nowWall,
        nowMono,
        tickIndex: state.runCount + 1,
        catchupTicks: steps,
        reason,
      };
      this.runJob(state, context);
      state.accumulatorMs -= job.intervalMs;
      steps += 1;
    }

    if (steps >= maxSteps && state.accumulatorMs >= job.intervalMs) {
      state.accumulatorMs = Math.max(0, job.intervalMs - 1);
    }
  }

  private runJob(state: ScheduledJobState, context: ScheduledJobRunContext): void {
    const { job } = state;
    const specificLabel = jobSpecificLabel(String(job.name));
    try {
      incrementCounter(PERF_LABELS.schedulerJobRun, 1, { name: job.name });
      if (specificLabel) incrementCounter(specificLabel);
      job.run(context);
    } catch (error) {
      state.errorCount += 1;
      incrementCounter(PERF_LABELS.schedulerJobError, 1, {
        name: job.name,
        message: error instanceof Error ? error.message : String(error),
      });
      console.error(`[SimulationScheduler] Job failed: ${job.name}`, error);
    } finally {
      state.runCount += 1;
      state.lastRunWall = context.nowWall;
      state.lastRunMono = context.nowMono;
      state.lastElapsedMs = context.elapsedMs;
      state.totalElapsedMs += context.elapsedMs;
      state.maxElapsedMs = Math.max(state.maxElapsedMs, context.elapsedMs);
    }
  }

  private skipIfDue(state: ScheduledJobState, elapsedMs: number): void {
    state.accumulatorMs += elapsedMs;
    if (state.accumulatorMs >= state.job.intervalMs) {
      state.skippedCount += 1;
      incrementCounter(PERF_LABELS.schedulerJobSkipped, 1, { name: state.job.name });
      state.accumulatorMs = 0;
    }
  }

  private isJobEnabled(state: ScheduledJobState): boolean {
    try {
      return state.job.enabled ? state.job.enabled() : true;
    } catch (error) {
      state.errorCount += 1;
      incrementCounter(PERF_LABELS.schedulerJobError, 1, {
        name: state.job.name,
        message: error instanceof Error ? error.message : String(error),
      });
      console.error(`[SimulationScheduler] Enabled predicate failed: ${state.job.name}`, error);
      return false;
    }
  }
}
