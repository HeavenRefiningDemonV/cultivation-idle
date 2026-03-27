import { readFileSync } from 'node:fs';
import path from 'node:path';
import { LIVE_SURFACE_TRACKED_FILES } from '../../src/services/diagnostics/release/liveSurfaceManifest.js';

export interface PlaceholderFinding {
  file: string;
  line: number;
  phrase: string;
  excerpt: string;
}

const FORBIDDEN: Array<{ phrase: string; pattern: RegExp }> = [
  { phrase: 'coming soon', pattern: /coming soon/i },
  { phrase: 'under development', pattern: /under development/i },
  { phrase: 'not implemented yet', pattern: /not implemented yet/i },
  { phrase: 'debug wording', pattern: /\(debug\)|for debugging|debug tools/i },
  { phrase: 'todo', pattern: /\btodo\b/i },
  { phrase: 'wip', pattern: /\bwip\b/i },
];

const STRING_LITERAL = /['"`][^'"`]*['"`]/g;

export function findPlaceholderStrings(): PlaceholderFinding[] {
  const root = process.cwd();
  const findings: PlaceholderFinding[] = [];

  LIVE_SURFACE_TRACKED_FILES.forEach((file) => {
    const lines = readFileSync(path.resolve(root, file), 'utf8').split('\n');
    lines.forEach((line, index) => {
      const literals = line.match(STRING_LITERAL) ?? [];
      literals.forEach((literal) => {
        FORBIDDEN.forEach((entry) => {
          if (!entry.pattern.test(literal)) return;
          findings.push({ file, line: index + 1, phrase: entry.phrase, excerpt: literal.slice(0, 200) });
        });
      });
    });
  });

  return findings;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const findings = findPlaceholderStrings();
  if (findings.length === 0) {
    console.log('No placeholder/stale strings found in tracked live surfaces.');
    process.exit(0);
  }
  findings.forEach((finding) => {
    console.log(`${finding.file}:${finding.line} [${finding.phrase}] ${finding.excerpt}`);
  });
  process.exit(1);
}
