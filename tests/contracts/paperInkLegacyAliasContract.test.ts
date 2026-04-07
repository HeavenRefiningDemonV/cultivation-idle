import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const tokenSheetPath = resolve(process.cwd(), 'src/styles/paperInkTokens.scss');
const worldScreenPath = resolve(process.cwd(), 'src/components/screens/WorldScreen.scss');
const tokenSheet = readFileSync(tokenSheetPath, 'utf8');
const worldScreen = readFileSync(worldScreenPath, 'utf8');

function expectDefinedToken(tokenName: string): void {
  assert.match(tokenSheet, new RegExp(`${tokenName}:\\s*[^;]+;`), `${tokenName} should be defined in token sheet`);
}

test('P2-04 retains documented legacy base and shell alias families', () => {
  for (const token of [
    '--paper-0',
    '--paper-1',
    '--ink-0',
    '--ink-1',
    '--seal-red',
    '--jade',
    '--gold',
    '--shadow-soft',
    '--shadow-strong',
    '--paper-shell-base',
    '--paper-shell-muted',
    '--paper-shell-border',
    '--paper-shell-outline',
    '--paper-shell-active',
    '--paper-shell-active-subtle',
    '--paper-progress-fill',
    '--paper-scrollbar-track',
    '--paper-scrollbar-thumb',
    '--paper-scrollbar-thumb-hover',
  ]) {
    expectDefinedToken(token);
  }
});

test('P2-04 retains legacy paper surface compatibility aliases', () => {
  for (const token of ['--paper-border', '--paper-outline', '--paper-bg', '--paper-bg-strong', '--paper-bg-soft', '--paper-shadow']) {
    expectDefinedToken(token);
  }
});

test('P2-04 keeps --paper-gold compatibility for live consumers', () => {
  assert.match(worldScreen, /var\(--paper-gold\b/, 'live consumer still expects --paper-gold');
  assert.match(tokenSheet, /--paper-gold:\s*var\(--paper-amber\)\s*;/, '--paper-gold should map to canonical amber role');
});
