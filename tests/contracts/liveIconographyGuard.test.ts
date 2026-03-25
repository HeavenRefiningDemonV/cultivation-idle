import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readSource = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

const NO_GLYPH_TARGETS = [
  'src/components/techniques/TechniqueSpine.tsx',
  'src/components/techniques/InnerPalaceEquipAltar.tsx',
  'src/components/screens/ManualPavilionPanel.tsx',
  'src/components/screens/TechniqueLibraryScreen.tsx',
];

const NO_WIP_ICON_TARGETS = [
  'src/components/screens/TechniqueLibraryScreen.tsx',
  'src/features/manuals/manualIconMap.ts',
  'src/features/professions/forge/ForgeWorkshop.tsx',
];

test('critical live semester technique/manual surfaces avoid ◎ placeholder glyphs', async () => {
  for (const file of NO_GLYPH_TARGETS) {
    const source = await readSource(file);
    assert.doesNotMatch(source, /◎/, `${file} should not use ◎ placeholder glyphs`);
  }
});

test('critical live semester icon surfaces avoid inkWip placeholder icon', async () => {
  for (const file of NO_WIP_ICON_TARGETS) {
    const source = await readSource(file);
    assert.doesNotMatch(source, /inkWip/, `${file} should not use inkWip in live UI state`);
  }
});
