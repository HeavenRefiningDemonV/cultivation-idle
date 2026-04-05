export const PHASE0_CORE_SURFACE_IDS = [
  'path-life-start',
  'cultivation',
  'status',
  'world',
  'manual-pavilion',
  'techniques',
  'apothecary',
  'forge',
  'bounties-expeditions',
  'prestige',
] as const;

export type Phase0CoreSurfaceId = (typeof PHASE0_CORE_SURFACE_IDS)[number];

export const PHASE0_CORE_CAPTURE_SLOT_FILES = [
  '01-base.png',
  '02-interaction.png',
  '03-truth-states.png',
  '04-high-fx.png',
  '05-low-fx.png',
  '06-reduced-motion.png',
] as const;

export type Phase0CoreCaptureSlotFile = (typeof PHASE0_CORE_CAPTURE_SLOT_FILES)[number];

export const PHASE0_CORE_CAPTURE_SLOT_BY_FILE: Record<Phase0CoreCaptureSlotFile, string> = {
  '01-base.png': 'base',
  '02-interaction.png': 'interaction',
  '03-truth-states.png': 'truth-states',
  '04-high-fx.png': 'high-fx',
  '05-low-fx.png': 'low-fx',
  '06-reduced-motion.png': 'reduced-motion',
};
