import { useErrorLogStore } from '../../stores/errorLogStore';

let initialized = false;

const makeId = () => `err_${Date.now()}_${Math.random().toString(36).slice(2)}`;

function captureError(message: string, kind: 'error' | 'unhandledrejection', details?: { stack?: string; source?: string }): void {
  useErrorLogStore.getState().addError({
    id: makeId(),
    ts: Date.now(),
    kind,
    message,
    stack: details?.stack,
    source: details?.source,
  });
}

export function initializeErrorCapture(): void {
  if (initialized) return;
  initialized = true;

  window.addEventListener('error', (event: ErrorEvent) => {
    const message = event.message || 'Unknown error';
    const stack = event.error instanceof Error ? event.error.stack : undefined;
    const source = event.filename ? `${event.filename}:${event.lineno ?? ''}:${event.colno ?? ''}` : undefined;
    captureError(message, 'error', { stack, source });
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (reason instanceof Error) {
      captureError(reason.message, 'unhandledrejection', { stack: reason.stack });
    } else {
      captureError(String(reason), 'unhandledrejection');
    }
  });
}
