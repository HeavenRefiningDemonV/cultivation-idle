import { validateLoadedContent } from '../../../src/content/index.js';
import { buildAllActivityThroughputSnapshots } from '../../../src/systems/economy/activityThroughputReadModel.js';
import { getActivityThroughputTargets } from '../../../src/systems/balance/activityThroughputTargets.js';
import { loadRawProgressionContent } from '../../fixtures/progression/loadFixtureContext.js';

export async function runActivityThroughputProbe() {
  const validated = validateLoadedContent((await loadRawProgressionContent()) as never);
  return {
    targets: getActivityThroughputTargets(),
    snapshots: buildAllActivityThroughputSnapshots(validated),
  };
}
