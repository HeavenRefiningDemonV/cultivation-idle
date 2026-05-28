import { Profiler, useRef, type ProfilerOnRenderCallback, type ReactNode } from 'react';
import { isPerfEnabled, recordRender, recordRenderCommit } from './perfLogger.js';

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  _startTime,
  commitTime,
) => {
  recordRenderCommit({
    id,
    phase,
    actualDuration,
    baseDuration,
    commitTime,
  });
};

export function useRenderCounter(id: string): void {
  const renderCount = useRef(0);
  renderCount.current += 1;
  if (isPerfEnabled()) {
    recordRender(id);
  }
}

export function PerfProfiler({ id, children }: { id: string; children: ReactNode }) {
  if (!isPerfEnabled()) return <>{children}</>;
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
