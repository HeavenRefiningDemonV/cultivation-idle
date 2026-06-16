import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

/**
 * W1 — Tokens-only law for the Tempering Court. `check:icons` lints emoji only, not
 * hex, so this contract enforces the palette discipline: NO raw 6-digit hex in any
 * Court component .tsx/.scss/.ts — every colour resolves to a --court-* token. The
 * single sanctioned exception is the shared <CourtDefs/> sprite (SVG gradient stops
 * + filter primitives, which cannot reference CSS custom properties reliably). This
 * is the guard the artifact's "grep #[0-9a-f]{6} returns only <defs> hits" requires.
 */

const COURT_DIR = path.resolve(process.cwd(), 'src', 'ui', 'court');
// Hex-allowed zones: the SVG sprite <defs>, the Court palette file, and the Room
// scene/figure/channel sprite art (decorative sprite data, not UI-state colour).
const ALLOWED_HEX_FILES = new Set(['CourtDefs.tsx', 'courtTokens.scss', 'courtRoomSprites.ts']);
const CHECKED_EXT = new Set(['.ts', '.tsx', '.scss']);
const HEX_RE = /#[0-9a-fA-F]{6}\b/;

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (CHECKED_EXT.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

test('no raw 6-digit hex in Court component source outside the CourtDefs sprite', async () => {
  const files = await walk(COURT_DIR);
  assert.ok(files.length > 0, 'expected Court source files under src/ui/court');

  const offenders: string[] = [];
  for (const file of files) {
    if (ALLOWED_HEX_FILES.has(path.basename(file))) continue;
    const content = await fs.readFile(file, 'utf8');
    content.split(/\r?\n/).forEach((line, i) => {
      if (HEX_RE.test(line)) {
        offenders.push(`${path.relative(process.cwd(), file)}:${i + 1}: ${line.trim()}`);
      }
    });
  }

  assert.deepEqual(
    offenders,
    [],
    `raw hex found outside the allowed zones (${[...ALLOWED_HEX_FILES].join(', ')}) — route through a --court-* token:\n${offenders.join('\n')}`,
  );
});

test('the allowed hex zones (CourtDefs sprite + courtTokens palette) do carry raw hex', async () => {
  const defs = await fs.readFile(path.join(COURT_DIR, 'CourtDefs.tsx'), 'utf8');
  assert.ok(HEX_RE.test(defs), 'CourtDefs sprite is expected to contain raw gradient-stop hex');
  const tokens = await fs.readFile(path.join(COURT_DIR, 'courtTokens.scss'), 'utf8');
  assert.ok(HEX_RE.test(tokens), 'courtTokens palette is expected to contain raw literal hex');
});
