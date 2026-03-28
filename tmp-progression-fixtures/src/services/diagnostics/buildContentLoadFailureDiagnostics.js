import { getContentBaseUrl } from '../../content/contentPaths.js';
function parseIssueLines(message) {
    return message
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .map((line) => line.slice(2).trim())
        .filter(Boolean)
        .slice(0, 12);
}
function safeGetBaseUrl() {
    try {
        return getContentBaseUrl();
    }
    catch {
        return '/cultivation_idle_content_bible_v1_config';
    }
}
export function normalizeContentLoadFailure(args) {
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
export function buildContentLoadFailureDiagnostics(context, error) {
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
