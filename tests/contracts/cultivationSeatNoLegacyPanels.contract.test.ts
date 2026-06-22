import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/**
 * M.II.3 — the render-only proof + the five-space-thieves proof. The Seat screen reads a typed
 * surface and emits intents; it performs NO store reads and NO gameplay math. The dense panels
 * (ladder / readiness / idle ledger / focus / mechanic) live in the conditional scroll host or
 * the at-Peak threshold block, never as always-on default-scene chrome.
 */
const SCREEN = readFileSync('src/ui/cultivation/seat/CultivationSeatScreen.tsx', 'utf8');
const SCENE = readFileSync('src/ui/cultivation/seat/scene/CultivationScene.tsx', 'utf8');
const SCROLLS = readFileSync('src/ui/cultivation/seat/scrolls/CultivationSeatScrolls.tsx', 'utf8');

const FORBIDDEN_STORE_TOKENS = [
  'useGameStore',
  'useCultivationStore',
  'useActivityStore',
  'usePrestigeStore',
  'useContentStore',
  'useTrialStore',
  'useUIStore',
  'useHeartLawStore',
  '.getState(',
  'RewardService',
  'readCultivationSeatRawInput',
  'buildCultivationSeatSurface',
];

void test('M.II.3 — the screen, scene, and scrolls import no store and never read store state', () => {
  for (const token of FORBIDDEN_STORE_TOKENS) {
    assert.equal(SCREEN.includes(token), false, `screen must not contain "${token}" (render-only)`);
    assert.equal(SCENE.includes(token), false, `scene must not contain "${token}" (render-only)`);
    assert.equal(SCROLLS.includes(token), false, `scrolls must not contain "${token}" (render-only)`);
  }
});

void test('M.II.3 — the screen renders the surface contract regions and the root testId', () => {
  assert.match(SCREEN, /data-testid=\{(?:surface\.)?meta\.rootTestId\}/);
  // the scene + scroll host moved into their own components (Wave 2 / Wave 5)
  assert.match(SCREEN, /<CultivationScene surface=\{surface\}/);
  assert.ok(SCENE.includes('data-region="scene"'), 'the scene component owns the scene region');
  assert.ok(SCROLLS.includes('data-region="scroll-host"'), 'the scrolls component owns the scroll host');
  for (const region of ['lintel', 'breath-line', 'instruments']) {
    assert.ok(SCREEN.includes(`data-region="${region}"`), `region ${region} present`);
  }
});

void test('M.II.3 — the dense panels live in the conditional scroll host, not the always-on scene', () => {
  // the scroll host only renders when a scroll is selected
  assert.match(SCREEN, /\{scroll && <CultivationSeatScrolls/);
  // the gate-readiness diagnosis only renders at the Peak
  assert.match(SCREEN, /\{gate && \(/);
  // the dense scroll bodies are gated behind the open-scroll id in the scrolls component
  assert.match(SCROLLS, /scroll === 'ledger'/);
  assert.match(SCROLLS, /scroll === 'focus'/);
  assert.match(SCROLLS, /scroll === 'ascent'/);
  assert.match(SCROLLS, /scroll === 'gatereadiness'/);
});

void test('M.II.3 — the Focus Dial renders no "Body" spoke (R-1) and the seal carries the diegetic action', () => {
  assert.equal(/>\s*Body\s*</.test(SCREEN), false, 'no Body spoke label in the screen');
  assert.ok(SCREEN.includes('data-instrument="cultivate-seal"'));
  assert.ok(SCREEN.includes('onSetForeground'));
});
