import type { FxSceneContract } from '../types.js';

export interface WorldFxSceneProps extends FxSceneContract {}

export function WorldFxScene(_: WorldFxSceneProps) {
  // P2-11 contract: world remains a static-safe proof surface with an intentional null scene.
  return null;
}
