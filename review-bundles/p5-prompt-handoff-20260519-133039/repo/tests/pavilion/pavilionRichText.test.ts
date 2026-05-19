import assert from 'node:assert/strict';
import test from 'node:test';

import { parsePavilionRichText } from '../../src/features/pavilion/pavilionRichText.js';
import type { PavilionRichTextToken } from '../../src/features/pavilion/pavilionRichText.js';

function isSemanticToken(
  token: PavilionRichTextToken,
): token is Extract<PavilionRichTextToken, { type: 'semantic' }> {
  return token.type === 'semantic';
}

test('parsePavilionRichText preserves text while parsing bold and semantic tokens', () => {
  const tokens = parsePavilionRichText(
    'Choose {path|Earth Path} when **survival** needs {stat|Defense}.',
  );

  assert.deepEqual(tokens, [
    { type: 'text', text: 'Choose ' },
    { type: 'semantic', kind: 'path', text: 'Earth Path' },
    { type: 'text', text: ' when ' },
    { type: 'bold', text: 'survival' },
    { type: 'text', text: ' needs ' },
    { type: 'semantic', kind: 'stat', text: 'Defense' },
    { type: 'text', text: '.' },
  ]);
});

test('parsePavilionRichText leaves unknown and malformed tokens as plain text', () => {
  const tokens = parsePavilionRichText(
    '{unknown|Mystery} {term|Qi Cap} **open bold {warning|missing end',
  );

  assert.deepEqual(tokens, [
    { type: 'text', text: '{unknown|Mystery} ' },
    { type: 'semantic', kind: 'term', text: 'Qi Cap' },
    { type: 'text', text: ' **open bold {warning|missing end' },
  ]);
});

test('parsePavilionRichText supports all Pavilion semantic roles', () => {
  const roles = ['term', 'item', 'stat', 'route', 'warning', 'success', 'action', 'path', 'realm'] as const;
  const input = roles.map((role) => `{${role}|${role} label}`).join(' ');
  const tokens = parsePavilionRichText(input);

  assert.deepEqual(
    tokens
      .filter(isSemanticToken)
      .map((token) => token.kind),
    roles,
  );
});
