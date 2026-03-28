import { getDiagnosisLabel, getReadinessBandLabel, getWorldModuleLabel } from './playerFacingLabels.js';
import { useContentStore } from '../../stores/contentStore.js';

const PATH_LABELS: Record<string, string> = {
  heaven: 'Heaven Path',
  earth: 'Earth Path',
  martial: 'Martial Path',
};

const FALLBACK_CITY_LABEL = 'Unknown City';
const FALLBACK_TRIAL_LABEL = 'Gate Trial';

const titleCase = (value: string) => value
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/[_-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, (char) => char.toUpperCase());

export function formatPathLabel(pathId: string | null | undefined): string {
  if (!pathId) return 'Path not selected';
  return PATH_LABELS[pathId] ?? titleCase(pathId);
}

export function formatCityLabel(cityId: string | null | undefined): string {
  if (!cityId) return FALLBACK_CITY_LABEL;
  const city = useContentStore.getState().maps.citiesById[cityId];
  return city?.name ?? titleCase(cityId.replace(/^city_/, ''));
}

export function formatGateTrialLabel(trialId: string | null | undefined): string {
  if (!trialId) return FALLBACK_TRIAL_LABEL;
  const trial = useContentStore.getState().maps.trialsById[trialId] as { name?: string; title?: string } | undefined;
  return trial?.name ?? trial?.title ?? `${FALLBACK_TRIAL_LABEL} ${titleCase(trialId.replace(/^trial_/, ''))}`;
}

export function formatReadinessBandLabel(band: string | null | undefined): string {
  if (!band) return 'Readiness pending';
  try {
    return getReadinessBandLabel(band as Parameters<typeof getReadinessBandLabel>[0]);
  } catch {
    return titleCase(band);
  }
}

export function formatDiagnosisLabel(code: string | null | undefined): string {
  if (!code) return 'No active diagnosis';
  try {
    return getDiagnosisLabel(code as Parameters<typeof getDiagnosisLabel>[0]);
  } catch {
    return titleCase(code);
  }
}

export function formatWorldModuleLabel(moduleKey: string | null | undefined): string {
  if (!moduleKey) return 'World Module';
  return getWorldModuleLabel(moduleKey);
}

export function formatArchetypeLabel(archetypeId: string | null | undefined): string {
  if (!archetypeId) return 'Build posture pending';
  return titleCase(archetypeId);
}

export function formatHeartLawLabel(heartLawId: string | null | undefined): string {
  if (!heartLawId) return 'Heart Law not selected';
  const heartLaw = useContentStore.getState().maps.heartLawsById[heartLawId];
  return heartLaw?.name ?? titleCase(heartLawId.replace(/^heart_law_/, ''));
}


type SpiritRootCompactInput = {
  element?: string | null;
  grade?: string | number | null;
  purity?: number | null;
};

export function formatSpiritRootCompactLabel(input: SpiritRootCompactInput | null | undefined): string {
  if (!input?.element || !input.grade || input.purity == null) return 'Dormant Spirit Root';
  const element = titleCase(String(input.element));
  const grade = typeof input.grade === 'number' ? String(input.grade) : titleCase(String(input.grade));
  const purity = Math.max(0, Math.min(100, Math.round(input.purity)));
  return `${element} • ${grade} • ${purity}% purity`;
}
