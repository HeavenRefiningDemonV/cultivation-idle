import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLifeSummaryMandateMemoryBlock,
  buildLifeSummaryNextLifeFocusLines,
} from '../../src/features/prestige/lifeSummarySurface.js';

test('P7 Life Summary Mandate memory produces one concise memory block without chore framing', () => {
  const block = buildLifeSummaryMandateMemoryBlock({
    gateProofLine: 'Gate proof recorded: Novice Clearing opened.',
    reflectionLine: 'Gate Reflection: medicine reserve was corrected.',
    daoImpressionLine: 'Dao Impression: a close exchange settled into memory.',
    sourceRouteLine: 'Source route resolved: herb reserve became ready.',
    offlineLine: 'Offline settlement filled the Qi vessel.',
    reincarnationLine: 'Reincarnation Counsel: viable, not forced.',
  });

  assert.equal(block.key, 'mandate_memory');
  assert.equal(block.title, 'Mandate Memory');
  assert.equal(block.lines.length >= 4, true);
  assert.doesNotMatch(block.lines.join(' '), /daily|checklist|chore|collect|Packet|P7|debug|placeholder/i);
});

test('P7 Life Summary next-life focus stays singular', () => {
  const lines = buildLifeSummaryNextLifeFocusLines({
    focusLabel: 'Reclaim old ground',
    focusDetail: 'Choose path and doctrine, then reclaim the first gate with retained decrees.',
    diagnosisLine: 'Forge weakness remains.',
    gateLine: 'Center prep around Novice Clearing.',
    purchaseLine: 'Buy Root Memory.',
  });

  assert.deepEqual(lines, [
    'Reclaim old ground: Choose path and doctrine, then reclaim the first gate with retained decrees.',
  ]);
});
