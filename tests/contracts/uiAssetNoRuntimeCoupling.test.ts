import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function listFiles(dir: string): string[] {
  return fs
    .readdirSync(path.join(root, dir))
    .flatMap((entry) => {
      const rel = path.join(dir, entry);
      const abs = path.join(root, rel);
      const stat = fs.statSync(abs);
      if (stat.isDirectory()) return listFiles(rel);
      return rel;
    });
}

void test('ui asset scaffold no-runtime-coupling: screens and modals do not import src/assets/ui', () => {
  listFiles('src/components/screens')
    .filter((filePath) => filePath.endsWith('.ts') || filePath.endsWith('.tsx'))
    .forEach((filePath) => {
      const source = read(filePath);
      assert.doesNotMatch(source, /src\/assets\/ui\//);
      assert.doesNotMatch(source, /assets\/ui\//);
    });

  listFiles('src/components/modals')
    .filter((filePath) => filePath.endsWith('.ts') || filePath.endsWith('.tsx'))
    .forEach((filePath) => {
      const source = read(filePath);
      assert.doesNotMatch(source, /src\/assets\/ui\//);
      assert.doesNotMatch(source, /assets\/ui\//);
    });
});

void test('ui asset scaffold no-runtime-coupling: no image placeholders exist under src/assets/ui', () => {
  const files = listFiles('src/assets/ui');
  const imageFiles = files.filter((filePath) => /\.(png|svg|webp|jpg|jpeg)$/i.test(filePath));
  const allowedPreexistingImageFiles = new Set([
    'src/assets/ui/book_spines/spine_earth.png',
    'src/assets/ui/book_spines/spine_heaven.png',
    'src/assets/ui/book_spines/spine_martial.png',
    'src/assets/ui/book_spines/spine_neutral.png',
  ]);
  const unexpectedImageFiles = imageFiles.filter((filePath) => !allowedPreexistingImageFiles.has(filePath));
  assert.equal(
    unexpectedImageFiles.length,
    0,
    `expected no new placeholder image files, found: ${unexpectedImageFiles.join(', ')}`,
  );

  const nonPolicyFiles = files.filter(
    (filePath) =>
      !filePath.endsWith('.ts') &&
      !filePath.endsWith('.md') &&
      !allowedPreexistingImageFiles.has(filePath),
  );
  assert.equal(nonPolicyFiles.length, 0, `src/assets/ui should only contain .ts/.md files, found: ${nonPolicyFiles.join(', ')}`);
});

void test('ui asset scaffold no-runtime-coupling: docs explicitly forbid fake placeholder files', () => {
  const policyDoc = read('docs/ui/asset-scaffold-placeholder-policy.md');
  assert.match(policyDoc, /no fake image files/i);
  assert.match(policyDoc, /dummy placeholder PNGs/i);
  assert.match(policyDoc, /blank transparent files/i);
});
