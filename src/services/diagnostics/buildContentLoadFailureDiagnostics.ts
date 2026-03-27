import { getContentBaseUrl } from '../../content/contentPaths.js';
import type { ContentLoadFailurePhase } from '../../content/loaders.js';

export type ContentLoadFailureContext = {
  phase: ContentLoadFailurePhase | 'validate' | 'bootstrap';
  fileName: string | null;
  message: string;
  issueLines: string[];
  rawError: string;
  baseUrl: string;
  attemptCount: number;
  createdAt: number;
};

export type ContentLoadFailureDiagnostics = {
  schemaVersion: 1;
  createdAt: number;
  phase: ContentLoadFailureContext['phase'];
  fileName: string | null;
  message: string;
  issueLines: string[];
  rawError: string;
  baseUrl: string;
  appMode: string;
  stack?: string;
};

function parseIssueLines(message: string): string[] {
  return message
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean)
    .slice(0, 12);
}

function safeGetBaseUrl(): string {
  try {
    return getContentBaseUrl();
  } catch {
    return '/cultivation_idle_content_bible_v1_config';
  }
}

export function normalizeContentLoadFailure(args: {
  phase: ContentLoadFailureContext['phase'];
  error: unknown;
  fileName?: string | null;
  attemptCount: number;
}): ContentLoadFailureContext {
  const createdAt = Date.now();
  const rawError = args.error instanceof Error
    ? `${args.error.name}: ${args.error.message}`
    : String(args.error);
  const message = args.error instanceof Error ? args.error.message : String(args.error);
  const issueLines = parseIssueLines(message);

  return {
    phase: args.phase,
    fileName: args.fileName ?? null,
    message,
    issueLines,
    rawError,
    baseUrl: safeGetBaseUrl(),
    attemptCount: args.attemptCount,
    createdAt,
  };
}

export function buildContentLoadFailureDiagnostics(context: ContentLoadFailureContext, error: unknown): ContentLoadFailureDiagnostics {
  return {
    schemaVersion: 1,
    createdAt: Date.now(),
    phase: context.phase,
    fileName: context.fileName,
    message: context.message,
    issueLines: [...context.issueLines],
    rawError: context.rawError,
    baseUrl: context.baseUrl,
    appMode: import.meta.env?.MODE ?? 'unknown',
    stack: error instanceof Error ? error.stack : undefined,
  };
}
