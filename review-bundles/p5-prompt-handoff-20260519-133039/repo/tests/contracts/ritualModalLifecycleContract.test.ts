import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('RitualModalFrame focus trap scope includes Ink close button via panelRef ownership', () => {
  const ritual = read('src/ui/shell/RitualModalFrame.tsx');
  const ink = read('src/ui/ink/InkModalFrame.tsx');

  assert.match(ritual, /panelRef=\{\(node\) => \{ focusScopeRef\.current = node; \}\}/);
  assert.match(ritual, /panelOnKeyDown=\{handleKeyDown\}/);
  assert.match(ink, /panelRef\?: \(element: HTMLDivElement \| null\) => void/);
  assert.match(ink, /hostRef=\{panelRef\}/);
});

test('RitualModalFrame restore-focus and reduced-motion lifecycle are deterministic', () => {
  const ritual = read('src/ui/shell/RitualModalFrame.tsx');
  assert.match(ritual, /previous && previous\.isConnected && typeof previous\.focus === 'function'/);
  assert.match(ritual, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(ritual, /media\.addEventListener\('change', update\)/);
});

test('scrollBody ritual path has a single intended scroll owner and shadow source', () => {
  const ritual = read('src/ui/shell/RitualModalFrame.tsx');
  const inkScss = read('src/ui/ink/InkModalFrame.scss');

  assert.match(ritual, /contentScrollOwner=\{scrollBody\}/);
  assert.match(ritual, /ref=\{scrollBody \? scrollRef : undefined\}/);
  assert.match(inkScss, /inkModalFrame__panel--contentScrollOwner/);
});
