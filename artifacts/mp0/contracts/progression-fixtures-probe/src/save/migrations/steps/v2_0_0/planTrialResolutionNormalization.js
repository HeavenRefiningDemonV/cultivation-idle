import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import { cloneSave, createStepResult, isRecord, touch, warning } from './shared.js';
const FIRST_TRIAL_ID = 'trial_novices_clearing';
const FIRST_GATE_IDS = ['gate_foundation_pill', 'foundation_pill'];
export const v2_0_0_plan_trial_resolution_normalization = {
    id: 'v2_0_0_plan_trial_resolution_normalization',
    title: 'Normalize trial/gate resolution mismatch',
    description: 'Detect legacy realm progression that contradicts first-gate proof state and normalize it to an honest bypassed resolution.',
    kind: 'transform',
    ownerPacket: '1.4',
    fromVersionRange: { min: CURRENT_SAVE_VERSION },
    toVersion: CURRENT_SAVE_VERSION,
    priority: 70,
    appliesTo: (save) => isRecord(save.gameState),
    run: (save, ctx) => {
        const next = cloneSave(save);
        const gameState = isRecord(next.gameState) ? next.gameState : {};
        const trialState = isRecord(next.trialState) ? next.trialState : {};
        const inventoryState = isRecord(next.inventoryState) ? next.inventoryState : {};
        const items = isRecord(inventoryState.items) ? inventoryState.items : {};
        const progressByTrialId = isRecord(trialState.progressByTrialId) ? trialState.progressByTrialId : {};
        const firstTrialProgress = isRecord(progressByTrialId[FIRST_TRIAL_ID]) ? progressByTrialId[FIRST_TRIAL_ID] : null;
        const currentRealmIndex = isRecord(gameState.realm) && typeof gameState.realm.index === 'number' ? gameState.realm.index : 0;
        const hasFirstGateProof = FIRST_GATE_IDS.some((itemId) => typeof items[itemId] === 'number' && items[itemId] > 0);
        const firstTrialResolution = typeof firstTrialProgress?.resolution === 'string' ? firstTrialProgress.resolution : null;
        const firstTrialCleared = typeof firstTrialProgress?.cleared === 'boolean' ? firstTrialProgress.cleared : false;
        const firstTrialResolved = firstTrialResolution === 'cleared' || firstTrialResolution === 'bypassed' || firstTrialCleared;
        const warnings = [];
        const touched = [
            touch('gameState.realm.index', 'inspect', `Detected realm index ${currentRealmIndex}.`),
            touch(`trialState.progressByTrialId.${FIRST_TRIAL_ID}`, 'inspect', `Resolution=${String(firstTrialResolution ?? (firstTrialCleared ? 'cleared' : 'none'))}.`),
        ];
        const plannedMutations = [];
        if (currentRealmIndex >= 1 && !firstTrialResolved && !hasFirstGateProof) {
            progressByTrialId[FIRST_TRIAL_ID] = {
                attempts: typeof firstTrialProgress?.attempts === 'number' ? firstTrialProgress.attempts : 0,
                sessionAttempts: typeof firstTrialProgress?.sessionAttempts === 'number' ? firstTrialProgress.sessionAttempts : 0,
                eligibleFailures: typeof firstTrialProgress?.eligibleFailures === 'number'
                    ? firstTrialProgress.eligibleFailures
                    : typeof firstTrialProgress?.attempts === 'number'
                        ? firstTrialProgress.attempts
                        : 0,
                resolution: 'bypassed',
                cleared: false,
                lastAttemptAt: typeof firstTrialProgress?.lastAttemptAt === 'number' ? firstTrialProgress.lastAttemptAt : null,
                lastClearAt: typeof firstTrialProgress?.lastClearAt === 'number' ? firstTrialProgress.lastClearAt : null,
                bypassedAt: ctx.nowMs,
                attemptStartAt: null,
                lastAttemptSummary: isRecord(firstTrialProgress?.lastAttemptSummary) ? firstTrialProgress.lastAttemptSummary : null,
            };
            trialState.progressByTrialId = progressByTrialId;
            next.trialState = trialState;
            warnings.push(warning('TRIAL_RESOLUTION_MISMATCH', 'Realm progress indicates Foundation-or-better, but first trial clear and gate proof are both missing.', '1.4', 'warning', 'trialState.progressByTrialId'), warning('LEGACY_PROGRESS_WITHOUT_GATE_PROOF', 'Legacy progression was already ahead of first-gate proof state; migration normalized the gate to an honest bypassed resolution.', '1.4', 'info', 'trialState.progressByTrialId'), warning('GATE_STATE_NORMALIZED_TO_BYPASS', 'First gate normalized to bypassed so the save stays truthful without fabricating a combat clear.', '1.4', 'info', `trialState.progressByTrialId.${FIRST_TRIAL_ID}`));
            touched.push(touch(`trialState.progressByTrialId.${FIRST_TRIAL_ID}.resolution`, 'set', 'Normalized to bypassed for legacy already-advanced progression.'), touch(`trialState.progressByTrialId.${FIRST_TRIAL_ID}.bypassedAt`, 'set', `Stamped bypass normalization time ${ctx.nowMs}.`));
        }
        return createStepResult(v2_0_0_plan_trial_resolution_normalization, next, warnings.length > 0
            ? 'Trial/gate mismatch normalized to bypassed resolution for already-advanced legacy progression.'
            : 'No trial/gate mismatch detected.', { warnings, touchedFieldPaths: touched, plannedMutations, didMutate: warnings.length > 0 });
    },
};
