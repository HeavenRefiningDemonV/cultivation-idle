import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  RITUAL_RITE_OPTIONS,
  RITUAL_RITE_STATE_OPTIONS,
  RITUAL_OUTCOME_KIND_OPTIONS,
  RITUAL_FRAME_FIXTURE_SEEDS,
  buildRitualFrameSurface,
} from '../../src/systems/ui/modals/index.js';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('F2: ritual shell exposes frozen rite/state/outcome registries', () => {
  assert.deepEqual([...RITUAL_RITE_OPTIONS], ['breakthrough', 'tribulation', 'echo', 'lifeSummary', 'rootUpgrade']);
  assert.deepEqual([...RITUAL_RITE_STATE_OPTIONS], ['default', 'prestige', 'postFailure']);
  assert.deepEqual([...RITUAL_OUTCOME_KIND_OPTIONS], ['success', 'not-yet']);
});

test('F2: the never-regress readout is present in EVERY rite (a gameplay truth)', () => {
  for (const seed of RITUAL_FRAME_FIXTURE_SEEDS) {
    const s = buildRitualFrameSurface(seed);
    assert.ok((s.neverRegress.headline ?? '').length > 0, `${seed} headline`);
    assert.ok((s.neverRegress.pityNote ?? '').length > 0, `${seed} pity note`);
  }
});

test('F2: every not-yet outcome is non-regressive (pity, never a loss) and renders the readout', () => {
  for (const seed of RITUAL_FRAME_FIXTURE_SEEDS) {
    const s = buildRitualFrameSurface(seed);
    if (s.outcome?.kind === 'not-yet') {
      assert.ok((s.outcome.pityGained ?? '').length > 0, `${seed} carries pity, not a loss`);
      assert.equal(s.outcome.result, undefined, `${seed} not-yet has no "result" loss field`);
    }
  }
  // The shell renders the never-regress readout zone and the not-yet reveal in sober neutral.
  const src = read('src/ui/shell/RitualCeremonyShell.tsx');
  assert.match(src, /data-ceremony-zone="never-regress"/);
  // the not-yet reveal uses the sober `notyet` treatment (the artifact-ported .reveal-main.notyet).
  assert.match(src, /isNotYet \? 'notyet'/);
  const scss = read('src/ui/shell/RitualCeremonyShell.scss');
  // sober neutral (bronze), NOT a cinnabar fill, for the not-yet reveal body — extract just that rule block.
  const notYetStart = scss.indexOf('.reveal-main.notyet {');
  assert.ok(notYetStart > 0, 'the not-yet reveal rule exists');
  const notYetBlock = scss.slice(notYetStart, scss.indexOf('}', notYetStart));
  // No cinnabar TOKEN is used in the not-yet reveal body — it is sober bronze.
  assert.doesNotMatch(notYetBlock, /var\(--paper-cinnabar/);
});

test('F2: the ritual shell is RENDER-ONLY (no gameplay store import, no mutation; intents forwarded)', () => {
  const src = read('src/ui/shell/RitualCeremonyShell.tsx');
  assert.doesNotMatch(src, /useGameStore|useCombatStore|useTrainingStore|usePrestigeStore|useUIStore/);
  assert.doesNotMatch(src, /\.getState\(|\.setState\(/);
  // It renders the artifact-faithful box inside the bespoke ModalShell (portal/scrim/focus-trap) and
  // forwards intents — never reaching into a store.
  assert.match(src, /ModalShell/);
  assert.match(src, /onIntent\(surface\.skipIntent\)/);
  assert.match(src, /onIntent\(surface\.exitIntent\)/);
});

test('F2: skip-to-result is always available and is a pure visual jump (no RNG)', () => {
  const src = read('src/ui/shell/RitualCeremonyShell.tsx');
  assert.match(src, /Skip to result/);
  assert.doesNotMatch(src, /Math\.random/);
});
