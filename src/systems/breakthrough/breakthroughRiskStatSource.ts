import { useTrainingStore } from '../../stores/trainingStore.js';
import type { BreakthroughRiskStatInput } from './breakthroughRiskInputs.js';

/**
 * M.II.1 — assemble a BreakthroughRiskStatInput from the LIVE training store. NOT pure (reads
 * a store), so it lives at the store/seam boundary and is wired into gameStore.breakthrough()
 * via the lazy injector (setBreakthroughRiskStatSourceGetter, from the gameLoop bootstrap),
 * exactly mirroring toDerivedStatInput / _getDerivedStatInput — to avoid the
 * gameStore↔trainingStore import cycle.
 *
 * The ratings are read by their canonical 28-stat ids (statDefinitions.ts), the same source
 * the Court and the derived engine read (courtSharedStats / derivedStatInput) — one source,
 * never two. Missing ratings default to 0 (fresh char ⇒ inert terms ⇒ today's behavior).
 */
export function toBreakthroughRiskStatInput(): BreakthroughRiskStatInput {
  const training = useTrainingStore.getState();
  const ratings = training.statRatingsById;
  return {
    qiPurity: ratings.qi_purity ?? 0,
    bodyIntegrity: ratings.body_integrity ?? 0,
    daoStability: ratings.dao_stability ?? 0,
    fatigue: training.fatigue ?? 0,
  };
}
