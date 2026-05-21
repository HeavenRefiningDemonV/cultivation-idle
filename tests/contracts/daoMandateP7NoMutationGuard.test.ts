import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const P7_GUIDANCE_FILES = [
  'src/systems/ui/daoMandate/daoMandateRecentOmens.ts',
  'src/systems/ui/daoMandate/daoMandateLessons.ts',
  'src/systems/ui/daoMandate/daoMandateFailureCoaching.ts',
  'src/systems/ui/daoMandate/daoMandateOfflineReturn.ts',
  'src/systems/ui/daoMandate/daoMandateReincarnationCounsel.ts',
  'src/components/modals/OfflineProgressModal.tsx',
  'src/features/prestige/lifeSummarySurface.ts',
];

const FORBIDDEN_MUTATION_CALLS =
  /grantRewards\(|spendCurrency\(|recordFailure\(|recordClear\(|markGateTrialCleared\(|markBypassed\(|resolveCombat\(|performPrestigeReset\(|applyOfflineCatchup\(|unlockCity\(|breakthrough\(/;

test('P7 guidance read models and touched UI do not call gameplay mutation owners', () => {
  for (const filePath of P7_GUIDANCE_FILES) {
    const source = readFileSync(filePath, 'utf8');
    assert.doesNotMatch(source, FORBIDDEN_MUTATION_CALLS, `${filePath} must remain read-model or route-only UI`);
  }
});
