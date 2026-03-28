export const cloneSave = (value) => JSON.parse(JSON.stringify(value));
export const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
export const createStepResult = (step, save, summary, extras) => ({
    stepId: step.id,
    kind: step.kind,
    ownerPacket: step.ownerPacket,
    didRun: true,
    didMutate: extras?.didMutate ?? false,
    summary,
    warnings: extras?.warnings ?? [],
    touchedFieldPaths: extras?.touchedFieldPaths ?? [],
    plannedMutations: extras?.plannedMutations ?? [],
    save,
});
export const warning = (code, message, ownerPacket, severity = 'warning', path) => ({ code, message, ownerPacket, severity, path });
export const touch = (path, action, detail) => ({
    path,
    action,
    detail,
});
export const plan = (path, ownerPacket, reason, action = 'set') => ({ path, ownerPacket, reason, action });
