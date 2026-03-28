import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import { createStepResult, isRecord, plan, touch, warning } from './shared.js';
import { normalizeOfflineTimestamps } from '../../../offlineTimestampNormalization.js';
export const v2_0_0_plan_offline_unification = {
    id: 'v2_0_0_plan_offline_unification',
    title: 'Normalize offline metadata unification',
    description: 'Detect split offline timestamp aliases and reconcile them to one packet-1.8-owned canonical value.',
    kind: 'transform',
    ownerPacket: '1.8',
    fromVersionRange: { min: CURRENT_SAVE_VERSION },
    toVersion: CURRENT_SAVE_VERSION,
    priority: 85,
    appliesTo: (save) => isRecord(save.meta) || isRecord(save.gameState),
    run: (save) => {
        const result = normalizeOfflineTimestamps(save);
        const touched = [
            result.snapshot.metaLastActiveAtMs !== null ? touch('meta.lastActiveAtMs', 'inspect', String(result.snapshot.metaLastActiveAtMs)) : null,
            result.snapshot.gameLastActiveTime !== null ? touch('gameState.lastActiveTime', 'inspect', String(result.snapshot.gameLastActiveTime)) : null,
            result.snapshot.gameLastTickTime !== null ? touch('gameState.lastTickTime', 'inspect', String(result.snapshot.gameLastTickTime)) : null,
        ].filter((entry) => entry !== null);
        const warnings = [];
        const plannedMutations = [];
        if (result.hasSplit && result.normalizedTimestamp !== null) {
            warnings.push(warning('OFFLINE_STATE_SPLIT_DETECTED', 'Multiple offline timestamp surfaces disagree in the same save.', '1.8', 'warning', 'meta.lastActiveAtMs'), warning('OFFLINE_NORMALIZED_TO_CANONICAL_TIMESTAMP', `Packet 1.8 will normalize offline metadata to ${String(result.normalizedTimestamp)} using the latest valid timestamp.`, '1.8', 'info', 'meta.lastActiveAtMs'));
            plannedMutations.push(plan('meta.lastActiveAtMs', '1.8', 'Choose the latest valid offline timestamp as canonical current-save truth.'), plan('gameState.lastActiveTime', '1.8', 'Align runtime-facing offline aliases to the canonical timestamp.'), plan('gameState.lastTickTime', '1.8', 'Align runtime-facing offline aliases to the canonical timestamp.'));
            touched.push(touch('meta.lastActiveAtMs', 'set', `Canonicalized to ${String(result.normalizedTimestamp)}.`), touch('gameState.lastActiveTime', 'set', `Aligned to ${String(result.normalizedTimestamp)}.`), touch('gameState.lastTickTime', 'set', `Aligned to ${String(result.normalizedTimestamp)}.`));
        }
        return createStepResult(v2_0_0_plan_offline_unification, result.save, result.hasSplit && result.normalizedTimestamp !== null
            ? `Offline split metadata normalized to canonical timestamp ${String(result.normalizedTimestamp)}.`
            : 'Offline metadata already coherent.', { warnings, touchedFieldPaths: touched, plannedMutations, didMutate: result.mutated });
    },
};
