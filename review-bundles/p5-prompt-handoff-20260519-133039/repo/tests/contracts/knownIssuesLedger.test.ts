import assert from 'node:assert/strict';
import test from 'node:test';
import { KNOWN_ISSUES_LEDGER, validateKnownIssuesLedger } from '../../src/services/diagnostics/release/knownIssuesLedger.js';
import { RELEASE_GATE_CHECK_IDS } from '../../src/services/diagnostics/release/releaseGateManifest.js';

void test('known issues ledger ids and source check ids are valid', () => {
  const ids = new Set<string>();
  KNOWN_ISSUES_LEDGER.forEach((entry) => {
    assert.equal(ids.has(entry.issueId), false);
    ids.add(entry.issueId);
    assert.equal(RELEASE_GATE_CHECK_IDS.includes(entry.sourceCheckId), true);
  });
});

void test('accepted waivers and post-semester debt entries have owner and rationale', () => {
  KNOWN_ISSUES_LEDGER.forEach((entry) => {
    if (entry.classification === 'accepted_waiver' || entry.classification === 'post_semester_debt') {
      assert.equal(entry.owner.trim().length > 0, true);
      assert.equal(entry.rationale.trim().length > 0, true);
    }
    if (entry.classification === 'accepted_waiver') {
      assert.equal(entry.evidencePaths.length > 0, true);
    }
  });
});

void test('ledger validation returns no structural errors', () => {
  const issues = validateKnownIssuesLedger(KNOWN_ISSUES_LEDGER);
  assert.deepEqual(issues, []);
});
