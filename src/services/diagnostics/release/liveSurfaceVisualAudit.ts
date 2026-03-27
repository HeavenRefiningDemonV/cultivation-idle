import { readFileSync } from 'node:fs';
import path from 'node:path';
import { LIVE_SURFACE_VISUAL_MANIFEST } from './liveSurfaceVisualManifest.js';

export interface LiveSurfaceVisualFinding {
  file: string;
  line: number;
  category: 'blue_remnant' | 'layout_shift_risk' | 'icon_consistency';
  reason: string;
  excerpt: string;
}

export interface LiveSurfaceVisualAuditReport {
  schemaVersion: '7.5d-live-surface-visual-audit';
  generatedAt: number;
  overallPass: boolean;
  trackedSurfaces: string[];
  trackedStyleFiles: string[];
  trackedIconFiles: string[];
  findings: LiveSurfaceVisualFinding[];
  notes: string[];
}

const EMOJI_PATTERN = /[\u{1F000}-\u{1FAFF}\u2600-\u26FF\u2700-\u27BF]/u;
const STATE_BLOCK_PATTERN = /(^|\n)\s*([^{\n]+(?:\:hover|:focus-visible|:active|--active|--selected|\.is-selected|\.is-active)[^{\n]*)\{([^}]*)\}/g;

const getLine = (source: string, index: number): number => source.slice(0, index).split('\n').length;

const isException = (file: string, excerpt: string): boolean => {
  return LIVE_SURFACE_VISUAL_MANIFEST.narrowExceptions.some((entry) => {
    if (entry.file !== file) return false;
    return entry.pattern.test(excerpt);
  });
};

export function runLiveSurfaceVisualAudit(): LiveSurfaceVisualAuditReport {
  const root = process.cwd();
  const findings: LiveSurfaceVisualFinding[] = [];

  LIVE_SURFACE_VISUAL_MANIFEST.trackedStyleFiles.forEach((file) => {
    const source = readFileSync(path.resolve(root, file), 'utf8');
    const lines = source.split('\n');

    lines.forEach((line, idx) => {
      LIVE_SURFACE_VISUAL_MANIFEST.bannedBlueRemnants.forEach((entry) => {
        if (!entry.pattern.test(line)) return;
        if (isException(file, line)) return;
        findings.push({
          file,
          line: idx + 1,
          category: 'blue_remnant',
          reason: entry.key,
          excerpt: line.trim().slice(0, 240),
        });
      });
    });

    const stateMatches = source.matchAll(STATE_BLOCK_PATTERN);
    for (const match of stateMatches) {
      const body = match[3] ?? '';
      const riskyProperty = LIVE_SURFACE_VISUAL_MANIFEST.disallowedLayoutShiftProperties.find((prop) =>
        new RegExp(`\\b${prop}\\s*:`).test(body),
      );
      if (!riskyProperty) continue;
      findings.push({
        file,
        line: getLine(source, match.index ?? 0),
        category: 'layout_shift_risk',
        reason: `state_block_changes_${riskyProperty}`,
        excerpt: `${match[2].trim()} { ${body.trim().slice(0, 180)} }`,
      });
    }
  });

  LIVE_SURFACE_VISUAL_MANIFEST.noShiftControlTargets.forEach((target) => {
    if (!target.requiresUiNoShift) return;
    const source = readFileSync(path.resolve(root, target.file), 'utf8');
    if (source.includes('uiNoShift') && source.includes(target.selector)) return;
    findings.push({
      file: target.file,
      line: 1,
      category: 'layout_shift_risk',
      reason: `missing_uiNoShift_hook_for_${target.selector}`,
      excerpt: `${target.selector} missing uiNoShift class hook`,
    });
  });

  LIVE_SURFACE_VISUAL_MANIFEST.trackedIconFiles.forEach((file) => {
    const source = readFileSync(path.resolve(root, file), 'utf8');
    const lines = source.split('\n');
    lines.forEach((line, idx) => {
      if (EMOJI_PATTERN.test(line)) {
        findings.push({
          file,
          line: idx + 1,
          category: 'icon_consistency',
          reason: 'emoji_icon_usage',
          excerpt: line.trim().slice(0, 240),
        });
      }
      if (/from\s+['"]lucide-react['"]/.test(line)) {
        findings.push({
          file,
          line: idx + 1,
          category: 'icon_consistency',
          reason: 'non_registry_icon_import',
          excerpt: line.trim().slice(0, 240),
        });
      }
    });
  });

  return {
    schemaVersion: '7.5d-live-surface-visual-audit',
    generatedAt: Date.now(),
    overallPass: findings.length === 0,
    trackedSurfaces: [...LIVE_SURFACE_VISUAL_MANIFEST.trackedSurfaces],
    trackedStyleFiles: [...LIVE_SURFACE_VISUAL_MANIFEST.trackedStyleFiles],
    trackedIconFiles: [...LIVE_SURFACE_VISUAL_MANIFEST.trackedIconFiles],
    findings,
    notes: [
      'Audit is scoped to live semester surfaces and immediate shell chrome.',
      'Layout-shift audit is source-structure based and flags risky state block size mutations.',
      'Icon audit complements scripts/checkNoEmojiIcons.ts with live-surface scoped registry checks.',
    ],
  };
}
