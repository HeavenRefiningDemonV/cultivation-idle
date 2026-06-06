import { CURRENT_SAVE_VERSION, parseSaveVersion } from './saveVersion.js';
export const createMigrationContext = ({ mode, save, targetVersion = CURRENT_SAVE_VERSION, normalizeToCurrent, nowMs = Date.now(), }) => {
    const parsed = parseSaveVersion(save.version);
    return {
        mode,
        sourceVersion: parsed.normalized,
        sourceVersionKind: parsed.kind,
        targetVersion,
        nowMs,
        normalizeToCurrent,
    };
};
