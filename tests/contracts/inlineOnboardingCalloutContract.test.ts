import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readSource = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('inline onboarding callout keeps compact contract: single optional action and always-visible dismiss', async () => {
  const source = await readSource('src/components/system/InlineOnboardingCallout.tsx');

  assert.match(source, /interface InlineOnboardingCalloutProps/);
  assert.match(source, /actionLabel\?: string \| null/);
  assert.match(source, /onAction\?: \(\) => void/);
  assert.match(source, /onDismiss\?: \(\) => void/);
  assert.match(source, /Dismiss/);
  assert.equal(/onMouseEnter|onMouseLeave/.test(source), false);
});
