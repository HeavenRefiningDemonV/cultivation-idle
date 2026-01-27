import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['src', 'app'];
const EXCLUDE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.next',
  '.turbo',
]);
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.scss',
  '.md',
]);

const emojiRangeRegex = /[\u{1F000}-\u{1FAFF}\u2600-\u26FF\u2700-\u27BF]/gu;
const explicitEmojiRegex = new RegExp(
  [
    '\\u2601',
    '\\u26F0',
    '\\u2694',
    '\\u26A0',
    '\\u26A1',
    '\\u2705',
    '\\u2764',
    '\\u2728',
    '\\u{1F300}',
    '\\u{1F4A5}',
    '\\u{1F4AB}',
    '\\u{1F4B0}',
    '\\u{1F4E6}',
    '\\u{1F48E}',
    '\\u{1F504}',
    '\\u{1F512}',
    '\\u{1F6A7}',
    '\\u{1F6E1}',
  ].join('|'),
  'gu',
);

const matchesEmoji = (value: string) => {
  emojiRangeRegex.lastIndex = 0;
  explicitEmojiRegex.lastIndex = 0;
  return emojiRangeRegex.test(value) || explicitEmojiRegex.test(value);
};

const walkDir = async (dir: string, results: string[]) => {
  const entries = await readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.has(entry.name)) {
          await walkDir(fullPath, results);
        }
        return;
      }
      if (!entry.isFile()) return;
      if (!TEXT_EXTENSIONS.has(path.extname(entry.name))) return;
      const content = await readFile(fullPath, 'utf8');
      if (!matchesEmoji(content)) return;
      results.push(fullPath);
    }),
  );
};

const reportFileMatches = async (filePath: string) => {
  const content = await readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const failures: string[] = [];

  lines.forEach((line, index) => {
    if (matchesEmoji(line)) {
      failures.push(`${filePath}:${index + 1}: ${line.trim()}`);
    }
  });

  return failures;
};

const run = async () => {
  const targetPaths = TARGET_DIRS
    .map((dir) => path.join(ROOT, dir))
    .filter((dir) => dir && dir.length > 0);

  const candidateFiles: string[] = [];
  await Promise.all(
    targetPaths.map(async (dir) => {
      try {
        await walkDir(dir, candidateFiles);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    }),
  );

  const failures = (
    await Promise.all(candidateFiles.map((filePath) => reportFileMatches(filePath)))
  ).flat();

  if (failures.length > 0) {
    console.error('Emoji icon usage detected in UI source files:');
    failures.forEach((line) => console.error(`  ${line}`));
    process.exit(1);
  }

  console.log('No emoji icon usage found in UI source files.');
};

run().catch((error) => {
  console.error('Failed to run emoji icon check:', error);
  process.exit(1);
});
