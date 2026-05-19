import type { FxSceneContract } from '../types.js';

export interface ForgeFxSceneProps extends FxSceneContract {}

export function ForgeFxScene(_: ForgeFxSceneProps) {
  // P2-11 contract: forge remains a static-safe proof surface with an intentional null scene.
  return null;
}
