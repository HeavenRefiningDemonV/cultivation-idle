import type { PathId } from '../../content/types.js';

export const TRAINING_HALL_ROOT_TEST_ID = 'training-hall-page' as const;
export const TRAINING_HALL_SURFACE_VERSION = 'training-hall-v1' as const;

export const TRAINING_HALL_PATH_ROOM_COPY: Record<PathId, { title: string; subtitle: string }> = {
  heaven: {
    title: 'Heaven Star Observatory',
    subtitle: 'Trace qi, law, and perception until the path foundation stops wobbling.',
  },
  earth: {
    title: 'Earth Body Tempering Yard',
    subtitle: 'Temper body, meridians, and recovery until the gate floor can hold.',
  },
  martial: {
    title: 'Martial Sparring Court',
    subtitle: 'Drill weapon intent, rhythm, and counters without changing combat formulas.',
  },
};

export function trainingPathLabel(path: PathId | null): string {
  if (path === 'heaven') return 'Heaven Path';
  if (path === 'earth') return 'Earth Path';
  if (path === 'martial') return 'Martial Path';
  return 'Path not selected';
}
