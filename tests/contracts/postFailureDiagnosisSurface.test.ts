import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPostFailureDiagnosisSurface } from '../../src/systems/ui/postFailure/index.js';

function makeSummary() {
  return {
    trialId: 'trial_novices_clearing',
    startedAt: 0,
    endedAt: 10_000,
    durationSec: 10,
    bossHpPct: 37.5,
    maxHit: 1234,
    maxHitLabel: 'Boss slam',
    suggestions: ['legacy telemetry line'],
  };
}

test('post-failure diagnosis surface maps canonical labels and hides raw bypass code wording', () => {
  const surface = buildPostFailureDiagnosisSurface({
    diagnosis: {
      primary: 'underbuilt',
      secondary: 'bypassAvailable',
      reasons: ['Unlocked technique slots are still empty.'],
      topFixes: [
        { code: 'fill_slots', destination: 'techniques', reason: 'Fill unlocked technique slots before retrying this gate.' },
        { code: 'buy_fail_safe', destination: 'trial', reason: 'Spend support currency to bypass this gate once.' },
        { code: 'fix_ai_posture', destination: 'trial', reason: 'Switch to a gate-appropriate AI posture before retrying.' },
        { code: 'raise_rank', destination: 'techniques', reason: 'Spend fragments to reach the gate rank floor.' },
      ],
    },
    summary: makeSummary(),
    lifecycleResolved: false,
    context: {
      cityId: 'city_pinewind_hamlet',
      canRetry: true,
      canBuySafetyNet: true,
      gateLabel: 'Novice Clearing',
    },
  });

  assert.equal(surface.state, 'available');
  assert.equal(surface.primaryLabel, 'Underbuilt');
  assert.equal(surface.secondaryBadgeLabel, 'Safety Net Available');
  assert.equal(surface.fixes.length, 3);
  assert.equal(surface.fixes[0]?.label, 'Fill unlocked slots');
  assert.equal(surface.fixes[1]?.label, 'Use the Safety Net');
  assert.equal(surface.fixes[2]?.label, 'Correct AI posture');
  assert.equal(surface.fixes.some((fix) => fix.label.includes('bypassAvailable')), false);
  assert.equal(surface.fixes.some((fix) => fix.label.includes('fail-safe')), false);
  assert.equal(surface.secondaryBadgeLabel?.includes('bypassAvailable'), false);
  assert.equal(surface.secondaryBadgeLabel?.includes('fail-safe'), false);
});

test('post-failure diagnosis recap uses summary telemetry and resolved state stays quiet', () => {
  const available = buildPostFailureDiagnosisSurface({
    diagnosis: {
      primary: 'close',
      secondary: null,
      reasons: ['A cleaner attempt or one targeted fix should be enough.'],
      topFixes: [{ code: 'retry_clean', destination: 'trial', reason: 'Retry with cleaner execution.' }],
    },
    summary: makeSummary(),
    lifecycleResolved: false,
    context: {
      cityId: null,
      canRetry: false,
      canBuySafetyNet: false,
      gateLabel: 'Gate Trial',
    },
  });

  assert.equal(available.attemptRecap?.bossHpRemainingLine, 'Boss HP remaining: 37.5%');
  assert.equal(available.attemptRecap?.timeSurvivedLine, 'Time survived: 10.0s');
  assert.equal(available.attemptRecap?.biggestHitLine, 'Biggest hit taken: 1,234 (Boss slam)');
  assert.equal(available.fixes[0]?.blocked, true);

  const resolved = buildPostFailureDiagnosisSurface({
    diagnosis: {
      primary: 'underforged',
      secondary: null,
      reasons: ['Forge floor is still below the gate target.'],
      topFixes: [{ code: 'raise_forge_floor', destination: 'forge', reason: 'Raise forge floor.' }],
    },
    summary: makeSummary(),
    lifecycleResolved: true,
    context: {
      cityId: null,
      canRetry: true,
      canBuySafetyNet: true,
      gateLabel: 'Gate Trial',
    },
  });

  assert.equal(resolved.state, 'resolved');
  assert.equal(resolved.fixes.length, 0);
  assert.equal(resolved.attemptRecap, null);
});
