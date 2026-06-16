import type { CourtPath } from '../../systems/meridians/index.js';

/** Per-path display constants for the Court lintel/room (artifact THEME/PATHS map).
 *  Seal glyph + jade flag + subtitle + watermark are presentation, not gameplay. */
export interface CourtPathDisplay {
  label: string;
  glyph: string;
  sealGlyph: string;
  sealJade: boolean;
  subtitle: string;
  watermark: string;
}

export const COURT_PATH_DISPLAY: Record<CourtPath, CourtPathDisplay> = {
  martial: {
    label: 'Martial',
    glyph: '武',
    sealGlyph: '武',
    sealJade: false,
    subtitle: 'Circulate the fire — rhythm, blade, and the moving orbit.',
    watermark: '气',
  },
  earth: {
    label: 'Earth',
    glyph: '地',
    sealGlyph: '地',
    sealJade: false,
    subtitle: 'Temper the marrow — furnace, stone, and the deep root.',
    watermark: '精',
  },
  heaven: {
    label: 'Heaven',
    glyph: '天',
    sealGlyph: '天',
    sealJade: true,
    subtitle: 'Refine the spirit toward emptiness — stars, law, and stillness.',
    watermark: '神',
  },
};

export interface CourtIntensityDisplay {
  id: 'quiet' | 'steady' | 'harsh' | 'limit';
  glyph: string;
  label: string;
  xp: string;
  fpm: string;
  /** flame height step (1..4). */
  height: number;
}

export const COURT_INTENSITIES: readonly CourtIntensityDisplay[] = [
  { id: 'quiet', glyph: '靜', label: 'Quiet', xp: '0.70×', fpm: '0.04', height: 1 },
  { id: 'steady', glyph: '穩', label: 'Steady', xp: '1.00×', fpm: '0.14', height: 2 },
  { id: 'harsh', glyph: '烈', label: 'Harsh', xp: '1.35×', fpm: '0.35', height: 3 },
  { id: 'limit', glyph: '極', label: 'Limit', xp: '1.75×', fpm: '0.75', height: 4 },
];
