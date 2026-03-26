import { getValidatedEconomicContent, primeContentStore, resetEconomicRuntimeStores } from '../economy/setupEconomicRuntimeScenario.js';
import { runPhaseTimingProbe } from './runPhaseTimingProbe.js';

export async function createPrestigeProbeScenario() {
  const content = await getValidatedEconomicContent();
  resetEconomicRuntimeStores();
  primeContentStore(content);
  const phaseProbe = await runPhaseTimingProbe();
  return {
    content,
    phaseProbe,
  };
}
