import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ownedShellFiles = [
  'src/ui/ink/InkPanel.scss',
  'src/ui/ink/PaperCard.scss',
  'src/ui/ink/PaperChip.scss',
  'src/ui/ink/InkModalFrame.scss',
  'src/ui/shell/FrameCard.scss',
  'src/ui/shell/PlaqueHeader.scss',
  'src/ui/shell/TopRibbon.scss',
  'src/ui/shell/BottomNavDock.scss',
  'src/ui/shell/InspectorPanel.scss',
  'src/ui/shell/InspectorDrawer.scss',
  'src/ui/shell/ScenicLabel.scss',
] as const;

function getDefinedVars(filePath: string): Set<string> {
  const text = readFileSync(resolve(process.cwd(), filePath), 'utf8');
  return new Set(Array.from(text.matchAll(/(--[a-z0-9-]+)\s*:/gi), (m) => m[1]));
}

const tokenVars = getDefinedVars('src/styles/paperInkTokens.scss');
const inkThemeVars = getDefinedVars('src/ui/ink/inkTheme.scss');
const knownVars = new Set([...tokenVars, ...inkThemeVars]);

function collectVarReads(text: string): string[] {
  return Array.from(text.matchAll(/var\((--[a-z0-9-]+)/gi), (m) => m[1]);
}

test('owned shell consumers only reference defined paper/ui/ink tokens', () => {
  const missing = new Map<string, string[]>();

  for (const relPath of ownedShellFiles) {
    const text = readFileSync(resolve(process.cwd(), relPath), 'utf8');
    const fileLocalVars = new Set(Array.from(text.matchAll(/(--[a-z0-9-]+)\s*:/gi), (m) => m[1]));
    const missingInFile = collectVarReads(text)
      .filter((name) => /^(--paper-|--ui-|--ink-)/.test(name))
      .filter((name) => !knownVars.has(name))
      .filter((name) => !fileLocalVars.has(name))
      .filter((name) => name !== '--ui-safe-bottom');

    if (missingInFile.length > 0) {
      missing.set(relPath, Array.from(new Set(missingInFile)).sort());
    }
  }

  assert.equal(missing.size, 0, `undefined shared token reads: ${JSON.stringify(Object.fromEntries(missing))}`);
});

test('owned shell consumers adopt new structural token namespace', () => {
  const expectations: Array<[string, RegExp]> = [
    ['src/ui/ink/InkPanel.scss', /--ui-space-card-pad-default|--ui-layout-card-gap/],
    ['src/ui/ink/PaperCard.scss', /--ui-space-card-pad-default|--ui-space-card-pad-compact/],
    ['src/ui/ink/PaperChip.scss', /--ui-size-chip-min-block|--ui-type-meta/],
    ['src/ui/shell/BottomNavDock.scss', /--ui-layout-page-max-inline|--ui-size-button-min-block/],
    ['src/ui/shell/InspectorPanel.scss', /--ui-size-row-min-block|--ui-layout-card-gap/],
  ];

  for (const [relPath, pattern] of expectations) {
    const text = readFileSync(resolve(process.cwd(), relPath), 'utf8');
    assert.match(text, pattern, `${relPath} should consume canonical structural tokens`);
  }
});
