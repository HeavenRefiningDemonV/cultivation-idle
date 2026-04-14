export const PHASE6_COMBAT_SURFACE_IDS = ['outskirts', 'ruins', 'gate-trial'] as const;

export type Phase6CombatSurfaceId = (typeof PHASE6_COMBAT_SURFACE_IDS)[number];

export const PHASE6_COMBAT_CAPTURE_SLOT_FILES = [
  '01-base.png',
  '02-interaction.png',
  '03-truth-states.png',
  '04-high-fx.png',
  '05-low-fx.png',
  '06-reduced-motion.png',
] as const;

export type Phase6CombatCaptureSlotFile = (typeof PHASE6_COMBAT_CAPTURE_SLOT_FILES)[number];

export const PHASE6_COMBAT_CAPTURE_SLOT_BY_FILE: Record<Phase6CombatCaptureSlotFile, string> = {
  '01-base.png': 'base',
  '02-interaction.png': 'interaction',
  '03-truth-states.png': 'truth-states',
  '04-high-fx.png': 'high-fx',
  '05-low-fx.png': 'low-fx',
  '06-reduced-motion.png': 'reduced-motion',
};
