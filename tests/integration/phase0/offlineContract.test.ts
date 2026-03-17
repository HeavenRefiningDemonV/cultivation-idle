import assert from 'node:assert/strict';
import test from 'node:test';

import { getOfflineContractNotes } from '../../../src/systems/progression/progressionContract.ts';
import { getProgressionDiagnostics } from '../../../src/systems/progression/progressionDiagnostics.ts';
import { loadValidatedContentFromDisk } from '../../helpers/contentHarness.ts';
import { expectCurrentlyBrokenContract } from '../../helpers/expectedFailure.ts';

function getOfflineContractSurface() {
  const content = loadValidatedContentFromDisk();
  return {
    notes: getOfflineContractNotes(),
    diagnostics: getProgressionDiagnostics(content),
  };
}

test('PHASE0 CONTRACT (expected broken): offline progression should expose only one authoritative entry path', () => {
  const { notes } = getOfflineContractSurface();

  assert.ok(notes.length > 0, 'Progression contract should publish offline contract notes.');

  expectCurrentlyBrokenContract(() => {
    const primary = notes[0];
    assert.equal(primary.activeImplementationEntryPoints.length, 1, 'Exactly one authoritative offline entry point should exist.');
    assert.equal(primary.alternateOrLegacyEntryPoints.length, 0, 'No legacy/alternate offline entry points should remain.');
  }, 'offline split-brain persists with active and legacy entry points');
});

test('PHASE0 CONTRACT: offline rule surface must explicitly define coherent cap/scope rules', () => {
  const { notes } = getOfflineContractSurface();
  const primary = notes[0];

  assert.ok(primary, 'Primary offline contract note should exist.');
  assert.ok(
    primary.inferredRules.some((entry) => entry.toLowerCase().includes('12h')),
    'Offline contract should explicitly declare the elapsed-time cap.',
  );
  assert.ok(
    primary.inferredRules.some((entry) => entry.toLowerCase().includes('expedition')),
    'Offline contract should explicitly declare expedition handling.',
  );
  assert.ok(
    primary.inferredRules.some((entry) => entry.toLowerCase().includes('combat is excluded')),
    'Offline contract should explicitly state combat exclusion.',
  );
});

test('PHASE0 CONTRACT (expected broken): offline contract should guarantee no split-brain/double-apply risk', () => {
  const { diagnostics } = getOfflineContractSurface();

  expectCurrentlyBrokenContract(() => {
    assert.equal(
      diagnostics.issues.some((entry) => entry.code === 'OFFLINE_SPLIT_BRAIN_PATHS'),
      false,
      'Diagnostics should not report split-brain offline paths once contract is unified.',
    );
  }, 'offline diagnostics still report split-brain path drift');
});
