import type { RewardBundle } from '../../../services/rewards/index.js';
import { adaptProgressionAuthoredContent } from '../contract/contentAdapter.js';
import {
  getGateItemForTransition,
  getProgressionContract,
  getTransitionByTrialId,
} from '../contract/progressionContract.js';
import { type MajorRealmId } from '../contract/contractTypes.js';
import { getLiveRealmByIndex } from './liveRealmProjection.js';
import type { TrialDef } from '../../../content/types.js';
import type { ValidatedContent } from '../../../content/index.js';

const DEFAULT_GATE_ITEM_QTY = 1;

const getContract = (content: ValidatedContent | null | undefined) => {
  if (!content) return null;
  try {
    return getProgressionContract(adaptProgressionAuthoredContent(content));
  } catch (error) {
    console.warn('[GateResolver] Failed to load progression contract', error);
    return null;
  }
};

export const getGateTransitionItemIdForRealmIndex = (
  content: ValidatedContent | null | undefined,
  fromRealmIndex: number,
): string | null => {
  const contract = getContract(content);
  const fromRealmId = getLiveRealmByIndex(fromRealmIndex).id as MajorRealmId;
  if (contract) {
    const resolved = getGateItemForTransition(contract, { fromRealmId });
    if (resolved) return resolved;
  }
  return null;
};

export const getTrialGateItemId = (
  content: ValidatedContent | null | undefined,
  trial: Pick<TrialDef, 'id' | 'gateItemId'> | null | undefined,
): string | null => {
  if (!trial) return null;
  const contract = getContract(content);
  if (contract) {
    const transition = getTransitionByTrialId(contract, trial.id);
    if (transition?.gateItemId) return transition.gateItemId;
  }
  return trial.gateItemId ?? null;
};

export const getTrialGateRewardBundle = (
  content: ValidatedContent | null | undefined,
  trial: Pick<TrialDef, 'id' | 'gateItemId'> | null | undefined,
): RewardBundle => {
  const gateItemId = getTrialGateItemId(content, trial);
  if (!gateItemId) return {};
  return { items: [{ itemId: gateItemId, qty: DEFAULT_GATE_ITEM_QTY }] };
};

export const hasRequiredGateProof = (
  content: ValidatedContent | null | undefined,
  fromRealmIndex: number,
  getItemCount: (itemId: string) => number,
): boolean => {
  const gateItemId = getGateTransitionItemIdForRealmIndex(content, fromRealmIndex);
  if (!gateItemId) return true;
  return getItemCount(gateItemId) > 0;
};
