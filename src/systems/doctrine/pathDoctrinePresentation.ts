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
}

const PRACTICAL_ROLE_LINES: Readonly<Record<CultivationPath, string>> = Object.freeze({
  heaven: 'Qi and technique focused.',
  earth: 'Body and defense focused.',
  martial: 'Power and speed focused.',
});

const DOCTRINE_SUBTITLES: Readonly<Record<CultivationPath, string>> = Object.freeze({
  heaven: 'Refined, celestial, technique-forward.',
  earth: 'Grounded, body-tempering, durable.',
  martial: 'Decisive, aggressive, conflict-shaped.',
});

const DOCTRINAL_TAGS: Readonly<Record<CultivationPath, readonly string[]>> = Object.freeze({
  heaven: Object.freeze(['Qi Flow', 'Precision', 'Burst Pressure']),
  earth: Object.freeze(['Endurance', 'Guard', 'Steady Growth']),
  martial: Object.freeze(['Tempo', 'Kill Window', 'Pressure']),
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
    tags: DOCTRINAL_TAGS[path].slice(0, 3),
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
