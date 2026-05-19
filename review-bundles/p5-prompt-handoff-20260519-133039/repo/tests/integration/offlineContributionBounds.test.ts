import test from 'node:test';

import { getOfflineProgressionContract } from '../../src/systems/progression/contract/index.js';
import { loadProgressionContract } from '../helpers/progression/index.js';
import { assertBalanceMetric } from '../helpers/balance/assertBalanceMetric.js';

test('offline contribution bounds preserve capped, non-combat contract guarantees', async () => {
  const contract = await loadProgressionContract();
  const offline = getOfflineProgressionContract(contract);

  assertBalanceMetric('offline.base_efficiency', offline.cultivationPolicy.baseEfficiency === 0.5);
  assertBalanceMetric('offline.max_efficiency', offline.cultivationPolicy.maxEfficiency === 0.9);
  assertBalanceMetric('offline.cap_seconds', offline.maxCatchupSeconds === 43_200);
  assertBalanceMetric('offline.no_combat_progress', offline.excludes.includes('combat'));
  assertBalanceMetric('offline.reclaim_run_8h_max', 8 * 60 * 60 <= offline.maxCatchupSeconds);
});
