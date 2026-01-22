import type { ForgeStepDef } from '../../../systems/crafting/craftingTypes';

type StepIconInfo = {
  icon: string;
  label: string;
  ariaLabel: string;
};

type StepKey = ForgeStepDef['type'];

const STEP_ICON_MAP: Record<StepKey, StepIconInfo> = {
  HEAT_TO: { icon: '🔥', label: 'Heat', ariaLabel: 'Heat the material' },
  HEAT_MATERIAL: { icon: '🔥', label: 'Heat', ariaLabel: 'Heat the material' },
  ALLOY_MIX: { icon: '⚗️', label: 'Alloy', ariaLabel: 'Blend alloy' },
  CAST_OR_SHAPE: { icon: '🧱', label: 'Shape', ariaLabel: 'Cast or shape the workpiece' },
  HAMMER_PATTERN: { icon: '🔨', label: 'Hammer', ariaLabel: 'Hammer pattern' },
  QUENCH: { icon: '💧', label: 'Quench', ariaLabel: 'Quench the workpiece' },
  TEMPER: { icon: '🌀', label: 'Temper', ariaLabel: 'Temper the workpiece' },
  ENGRAVE_RUNE: { icon: '✧', label: 'Inscribe', ariaLabel: 'Engrave rune' },
  LAY_FORMATION: { icon: '⭕', label: 'Form', ariaLabel: 'Lay formation' },
  FINISH: { icon: '🏷', label: 'Seal', ariaLabel: 'Finish forging' },
};

const UNKNOWN_STEP: StepIconInfo = {
  icon: '◎',
  label: 'Unknown',
  ariaLabel: 'Unknown step',
};

export const getForgeStepIconInfo = (stepType: StepKey): StepIconInfo => STEP_ICON_MAP[stepType] ?? UNKNOWN_STEP;
