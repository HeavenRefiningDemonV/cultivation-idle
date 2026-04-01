import type { CultivationPath } from '../../types/index.js';
import { PATH_DOCTRINE_ORDER, getPathDoctrineProfile, getPathDoctrineSummary } from './pathDoctrineRegistry.js';

export interface PathDoctrinePresentation {
  id: CultivationPath;
  label: string;
  practicalRoleLine: string;
  doctrineSubtitle: string;
  summary: string;
  statHighlights: readonly string[];
  tags: readonly string[];
  objectiveLine?: string;
  cautionLine?: string;
}

const PRACTICAL_ROLE_LINES: Readonly<Record<CultivationPath, string>> = Object.freeze({
  heaven: 'Technique-forward burst path with high qi tempo and thinner forgiveness.',
  earth: 'Durability-first path that wins through stable pressure and discipline.',
  martial: 'Tempo-heavy combat path that spikes hardest during kill windows.',
});

const DOCTRINE_SUBTITLES: Readonly<Record<CultivationPath, string>> = Object.freeze({
  heaven: 'Refined precision with burst timing discipline.',
  earth: 'Patient body cultivation and steady inevitability.',
  martial: 'Aggressive pressure, execution, and kill-window control.',
});

const DOCTRINAL_TAGS: Readonly<Record<CultivationPath, readonly string[]>> = Object.freeze({
  heaven: Object.freeze(['Precision', 'Cycle', 'Burst Windows']),
  earth: Object.freeze(['Durability', 'Guard', 'Inevitability']),
  martial: Object.freeze(['Tempo', 'Execution', 'Pressure']),
});

const CAUTION_LINES: Readonly<Record<CultivationPath, string>> = Object.freeze({
  heaven: 'Patch one real defensive or tempo backstop before greed pushes.',
  earth: 'Do not overdefend into stall—keep one reliable finisher online.',
  martial: 'Avoid burst greed when sustain or posture discipline is collapsing.',
});

function formatPercent(multiplier: number): string {
  return `${Math.round((multiplier - 1) * 100)}%`;
}

function createStatHighlights(path: CultivationPath): readonly string[] {
  const profile = getPathDoctrineProfile(path);
  if (!profile) return Object.freeze<string[]>([]);

  const { modifierSignature } = profile;

  if (path === 'heaven') {
    return Object.freeze([
      `Qi ${formatPercent(modifierSignature.qiMultiplier)}`,
      `ATK ${formatPercent(modifierSignature.atkMultiplier)}`,
    ]);
  }

  if (path === 'earth') {
    return Object.freeze([
      `HP ${formatPercent(modifierSignature.hpMultiplier)}`,
      `DEF ${formatPercent(modifierSignature.defMultiplier)}`,
    ]);
  }

  return Object.freeze([
    `ATK ${formatPercent(modifierSignature.atkMultiplier)}`,
    `CRIT +${modifierSignature.critBonus}%`,
  ]);
}

function buildPathDoctrinePresentation(path: CultivationPath): PathDoctrinePresentation {
  const profile = getPathDoctrineProfile(path);

  return Object.freeze({
    id: path,
    label: profile?.label ?? path,
    practicalRoleLine: PRACTICAL_ROLE_LINES[path],
    doctrineSubtitle: DOCTRINE_SUBTITLES[path],
    summary: getPathDoctrineSummary(path),
    statHighlights: createStatHighlights(path),
    tags: Object.freeze([...DOCTRINAL_TAGS[path].slice(0, 3)]),
    objectiveLine: profile?.objectiveLine,
    cautionLine: CAUTION_LINES[path],
  });
}

export const PATH_DOCTRINE_PRESENTATION_BY_ID: Readonly<Record<CultivationPath, PathDoctrinePresentation>> = Object.freeze(
  Object.fromEntries(PATH_DOCTRINE_ORDER.map((path) => [path, buildPathDoctrinePresentation(path)])) as Record<CultivationPath, PathDoctrinePresentation>,
);

export function getPathDoctrinePresentation(path: CultivationPath | null): PathDoctrinePresentation | null {
  if (path === null) {
    return null;
  }

  return PATH_DOCTRINE_PRESENTATION_BY_ID[path];
}
