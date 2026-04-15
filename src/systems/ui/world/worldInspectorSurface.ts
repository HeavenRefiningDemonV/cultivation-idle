export function resolveWorldInspectorBoundaryLine(args: {
  moduleKey: string | null;
  boundaryLineFromHandoff: string | null;
}): string | null {
  const { moduleKey, boundaryLineFromHandoff } = args;
  if (moduleKey !== 'outskirts') {
    return null;
  }
  if (typeof boundaryLineFromHandoff !== 'string' || boundaryLineFromHandoff.trim().length === 0) {
    return null;
  }
  return boundaryLineFromHandoff;
}
