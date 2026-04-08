import type { FxSceneContract } from '../types.js';

export interface SelectionFxSceneProps extends FxSceneContract {}

export function SelectionFxScene(_: SelectionFxSceneProps) {
  // P2-11 contract: selection is a legal scene-kind/stage id but intentionally null until future packet rollout.
  return null;
}
