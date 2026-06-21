import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const tokenSheet = readFileSync(resolve(process.cwd(), 'src/styles/paperInkTokens.scss'), 'utf8');

function expectTokenValue(name: string, expected: string): void {
  const matcher = new RegExp(`${name}:\\s*${expected.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*;`);
  assert.match(tokenSheet, matcher, `${name} should be defined as ${expected}`);
}

test('P2-04 structural lock tokens exist with required values', () => {
  expectTokenValue('--ui-layout-page-max-inline', '1280px');
  expectTokenValue('--ui-layout-page-pad-inline', '16px');
  expectTokenValue('--ui-layout-section-gap', '16px');
  expectTokenValue('--ui-layout-card-gap', '12px');
  expectTokenValue('--ui-space-card-pad-default', '16px');
  expectTokenValue('--ui-space-card-pad-compact', '12px');
  expectTokenValue('--ui-size-button-min-block', '36px');
  expectTokenValue('--ui-size-chip-min-block', '22px');
  expectTokenValue('--ui-size-row-min-block', '44px');
  expectTokenValue('--ui-size-progress-block', '8px');
});

test('P2-04 typography lock tokens exist with required values', () => {
  expectTokenValue('--ui-type-page-title', '20px');
  expectTokenValue('--ui-type-section-title', '18px');
  expectTokenValue('--ui-type-card-title', '16px');
  expectTokenValue('--ui-type-body', '14px');
  expectTokenValue('--ui-type-meta', '12px');
  expectTokenValue('--ui-type-button', '14px');
});

test('P2-04 semantic role tokens remain explicit and legal', () => {
  for (const token of [
    '--paper-parchment',
    '--paper-ink',
    '--paper-jade',
    '--paper-amber',
    '--paper-warning',
    '--paper-stamp',
    '--paper-danger',
    '--paper-rare',
    '--paper-bronze',
    '--paper-ink-muted',
  ]) {
    assert.match(tokenSheet, new RegExp(`${token}:\\s*[^;]+;`), `${token} should exist`);
  }

  assert.doesNotMatch(tokenSheet, /--paper-[^:\n]*blue\s*:/i, 'no blue token names should be introduced');
  assert.doesNotMatch(tokenSheet, /linear-gradient\(/i, 'token sheet should not encode gradient defaults');
});

test('F0-KIT item-language tokens resolve and respect the kit guards', () => {
  for (const token of [
    '--rarity-mortal',
    '--rarity-spirit',
    '--rarity-earth',
    '--rarity-heaven',
    '--rarity-immortal',
    '--affix-prefix-tint',
    '--affix-suffix-tint',
    '--affix-bond-tint',
    '--path-heaven-accent',
    '--path-earth-accent',
    '--path-martial-accent',
  ]) {
    assert.match(
      tokenSheet,
      new RegExp(`${token}:\\s*[^;]+;`),
      `${token} should resolve to a non-empty value`,
    );
  }

  // The deposit references existing sanctioned tokens via color-mix/var only:
  // no new raw hex, no sheet-level gradient, no blue token name. Re-assert the
  // kit guards still hold after the deposit.
  assert.doesNotMatch(tokenSheet, /--paper-[^:\n]*blue\s*:/i, 'no blue token names should be introduced');
  assert.doesNotMatch(tokenSheet, /linear-gradient\(/i, 'token sheet should not encode gradient defaults');
});
