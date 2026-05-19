export const SECTION_C_SURFACE_IDS = [
  'life-start-path',
  'life-start-heart-law',
  'life-start-breath-focus',
  'dao-heart-law',
  'dao-heart-study',
  'change-heart-law',
  'prestige-ritual',
  'current-chapter-exhausted',
  'life-summary',
] as const;

export type SectionCSurfaceId = (typeof SECTION_C_SURFACE_IDS)[number];
