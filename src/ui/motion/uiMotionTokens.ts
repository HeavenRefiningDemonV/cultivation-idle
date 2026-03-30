import type { Transition } from 'framer-motion';

export type UiMotionIntent = 'hover' | 'selection' | 'drawer' | 'modal' | 'screen';

export interface UiMotionSpec {
  intent: UiMotionIntent;
  durationMs: number;
  durationS: number;
  easeCss: string;
  easeArray: [number, number, number, number];
  distancePx: number;
  scaleFrom?: number;
  opacityFrom?: number;
  opacityTo?: number;
}

interface UiMotionOptions {
  reducedMotion?: boolean;
  instant?: boolean;
}

const EASE_EMPHASIS: [number, number, number, number] = [0.2, 0.75, 0.25, 1];
const EASE_PANEL: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const uiMotionTokenTable: Record<UiMotionIntent, Omit<UiMotionSpec, 'durationS'>> = {
  hover: {
    intent: 'hover',
    durationMs: 140,
    easeCss: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
    easeArray: EASE_EMPHASIS,
    distancePx: 1,
    opacityFrom: 0.98,
    opacityTo: 1,
  },
  selection: {
    intent: 'selection',
    durationMs: 180,
    easeCss: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
    easeArray: EASE_EMPHASIS,
    distancePx: 1,
    scaleFrom: 0.995,
    opacityFrom: 0.96,
    opacityTo: 1,
  },
  drawer: {
    intent: 'drawer',
    durationMs: 250,
    easeCss: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    easeArray: EASE_PANEL,
    distancePx: 16,
    opacityFrom: 0,
    opacityTo: 1,
  },
  modal: {
    intent: 'modal',
    durationMs: 210,
    easeCss: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    easeArray: EASE_PANEL,
    distancePx: 10,
    scaleFrom: 0.99,
    opacityFrom: 0,
    opacityTo: 1,
  },
  screen: {
    intent: 'screen',
    durationMs: 280,
    easeCss: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    easeArray: EASE_PANEL,
    distancePx: 12,
    opacityFrom: 0,
    opacityTo: 1,
  },
};

function withDuration(spec: Omit<UiMotionSpec, 'durationS'>): UiMotionSpec {
  return {
    ...spec,
    durationS: Number((spec.durationMs / 1000).toFixed(3)),
  };
}

export const UI_MOTION_TOKENS: Record<UiMotionIntent, UiMotionSpec> = {
  hover: withDuration(uiMotionTokenTable.hover),
  selection: withDuration(uiMotionTokenTable.selection),
  drawer: withDuration(uiMotionTokenTable.drawer),
  modal: withDuration(uiMotionTokenTable.modal),
  screen: withDuration(uiMotionTokenTable.screen),
};

export function getUiMotionSpec(intent: UiMotionIntent, options: UiMotionOptions = {}): UiMotionSpec {
  const base = UI_MOTION_TOKENS[intent];
  if (options.instant) {
    return {
      ...base,
      durationMs: 0,
      durationS: 0,
      distancePx: 0,
      scaleFrom: undefined,
      opacityFrom: base.opacityTo ?? 1,
    };
  }

  if (!options.reducedMotion) {
    return base;
  }

  const isStructuralIntent = intent === 'drawer' || intent === 'modal' || intent === 'screen';
  const reducedDistance = isStructuralIntent ? Math.min(base.distancePx, 3) : 0;
  const reducedDurationMs = isStructuralIntent ? Math.min(base.durationMs, 180) : Math.min(base.durationMs, 120);

  return {
    ...base,
    durationMs: reducedDurationMs,
    durationS: Number((reducedDurationMs / 1000).toFixed(3)),
    distancePx: reducedDistance,
    scaleFrom: undefined,
    opacityFrom: base.opacityFrom ?? 0.96,
  };
}

export function getUiMotionTransition(intent: UiMotionIntent, options: UiMotionOptions = {}): Transition {
  const spec = getUiMotionSpec(intent, options);
  return {
    duration: spec.durationS,
    ease: spec.easeArray,
    type: 'tween',
  };
}
