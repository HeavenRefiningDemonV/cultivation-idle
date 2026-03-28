import { CURRENT_SAVE_VERSION, compareSaveVersions } from '../../saveVersion.js';
import { cloneSave, createStepResult, isRecord, touch } from './shared.js';
export const v2_0_0_seed_version_and_meta = {
    id: 'v2_0_0_seed_version_and_meta',
    title: 'Seed version and migration metadata shell',
    description: 'Stamp save version 2.0.0 and normalize minimal meta shell for legacy saves.',
    kind: 'transform',
    ownerPacket: '0.2',
    fromVersionRange: { maxExclusive: CURRENT_SAVE_VERSION },
    toVersion: CURRENT_SAVE_VERSION,
    priority: 20,
    appliesTo: (_save, ctx) => compareSaveVersions(ctx.sourceVersion, CURRENT_SAVE_VERSION) < 0,
    run: (save, ctx) => {
        const next = cloneSave(save);
        let mutated = false;
        const touched = [];
        if (!isRecord(next.meta)) {
            next.meta = {};
            mutated = true;
            touched.push(touch('meta', 'set', 'Created meta shell for migrated save.'));
        }
        const meta = next.meta;
        const fallbackLastActiveAtMs = (typeof meta.lastActiveAtMs === 'number' ? meta.lastActiveAtMs : undefined) ??
            (isRecord(next.gameState) && typeof next.gameState.lastActiveTime === 'number' ? next.gameState.lastActiveTime : undefined) ??
            (typeof next.timestamp === 'number' ? next.timestamp : ctx.nowMs);
        if (meta.lastActiveAtMs !== fallbackLastActiveAtMs) {
            meta.lastActiveAtMs = fallbackLastActiveAtMs;
            mutated = true;
            touched.push(touch('meta.lastActiveAtMs', 'set', `Normalized to ${String(fallbackLastActiveAtMs)}.`));
        }
        if (next.version !== CURRENT_SAVE_VERSION) {
            next.version = CURRENT_SAVE_VERSION;
            mutated = true;
            touched.push(touch('version', 'set', CURRENT_SAVE_VERSION));
        }
        return createStepResult(v2_0_0_seed_version_and_meta, next, mutated ? 'Seeded version/meta normalization for semester save v2.0.0.' : 'Version/meta already normalized.', { didMutate: mutated, touchedFieldPaths: touched });
    },
};
