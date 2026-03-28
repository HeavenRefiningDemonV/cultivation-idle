export const CURRENT_SAVE_VERSION = '2.0.0';
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;
export const parseSaveVersion = (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
        return {
            raw: null,
            kind: 'legacy-unversioned',
            normalized: '0.0.0',
            parts: [0, 0, 0],
        };
    }
    const trimmed = value.trim();
    const match = trimmed.match(SEMVER_RE);
    if (!match) {
        return {
            raw: trimmed,
            kind: 'malformed-version',
            normalized: '0.0.0',
            parts: [0, 0, 0],
        };
    }
    const parsed = [Number(match[1]), Number(match[2]), Number(match[3])];
    const normalized = `${parsed[0]}.${parsed[1]}.${parsed[2]}`;
    return {
        raw: trimmed,
        kind: normalized === CURRENT_SAVE_VERSION ? 'current' : 'legacy-versioned',
        normalized,
        parts: parsed,
    };
};
export const compareSaveVersions = (left, right) => {
    const l = parseSaveVersion(left).parts;
    const r = parseSaveVersion(right).parts;
    for (let i = 0; i < 3; i += 1) {
        if (l[i] < r[i])
            return -1;
        if (l[i] > r[i])
            return 1;
    }
    return 0;
};
export const isOlderThanCurrentSaveVersion = (value) => compareSaveVersions(parseSaveVersion(value).normalized, CURRENT_SAVE_VERSION) < 0;
