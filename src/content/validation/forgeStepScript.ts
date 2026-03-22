import type { ForgeStepDef } from '../../systems/crafting/craftingTypes.js';

export type ForgeStepScriptValidation = {
  ok: boolean;
  errors: string[];
};

const HEAT_STEPS = new Set<ForgeStepDef['type']>(['HEAT_TO', 'HEAT_MATERIAL']);
const STRIKE_STEPS = new Set<ForgeStepDef['type']>(['HAMMER_PATTERN']);
const SPECIAL_STEPS = new Set<ForgeStepDef['type']>(['ENGRAVE_RUNE', 'LAY_FORMATION', 'QUENCH', 'TEMPER']);
const RING_QTE_STEPS = new Set<ForgeStepDef['type']>(['HAMMER_PATTERN', 'ENGRAVE_RUNE', 'LAY_FORMATION']);
const FINISH_STEPS = new Set<ForgeStepDef['type']>(['FINISH']);
const ALLOWED_STEPS = new Set<ForgeStepDef['type']>([
  ...HEAT_STEPS,
  ...STRIKE_STEPS,
  ...SPECIAL_STEPS,
  ...FINISH_STEPS,
]);

const MIN_HAMMER_HITS = 2;
const MAX_HAMMER_HITS = 12;
const MIN_SPECIAL_HITS = 2;
const MAX_SPECIAL_HITS = 8;
const MAX_TOTAL_HAMMER_HITS = 20;

export function validateForgeStepScript(stepScript: ForgeStepDef[]): ForgeStepScriptValidation {
  const errors: string[] = [];

  if (!stepScript || stepScript.length === 0) {
    return { ok: false, errors: ['Forge step script is empty.'] };
  }

  const expectedSteps = ['HEAT', 'STRIKE', 'HEAT', 'STRIKE', 'HEAT'] as const;
  const totalSteps = stepScript.length;
  const lastStep = stepScript[totalSteps - 1];

  if (!lastStep || lastStep.type !== 'FINISH') {
    errors.push('Forge step script must end with FINISH.');
  }

  if (totalSteps < 6 || totalSteps > 7) {
    errors.push('Forge step script must include 6 steps (no special) or 7 steps (with special).');
  }

  expectedSteps.forEach((expected, index) => {
    const step = stepScript[index];
    if (!step) {
      errors.push(`Missing ${expected.toLowerCase()} step at index ${index}.`);
      return;
    }
    if (expected === 'HEAT' && !HEAT_STEPS.has(step.type)) {
      errors.push(`Expected a heat step at index ${index}, found "${step.type}".`);
    }
    if (expected === 'STRIKE' && !STRIKE_STEPS.has(step.type)) {
      errors.push(`Expected a hammer step at index ${index}, found "${step.type}".`);
    }
  });

  if (totalSteps >= 6 && totalSteps <= 7) {
    const specialStep = stepScript[5];
    if (totalSteps === 6) {
      if (specialStep && specialStep.type !== 'FINISH') {
        errors.push('Step 6 must be FINISH when no special step is present.');
      }
    } else if (totalSteps === 7) {
      if (specialStep && !SPECIAL_STEPS.has(specialStep.type)) {
        errors.push(`Expected a special step at index 5, found "${specialStep.type}".`);
      }
      if (lastStep && lastStep.type !== 'FINISH') {
        errors.push('FINISH step must be the last step.');
      }
    }
  }

  let totalHammerHits = 0;
  stepScript.forEach((step, index) => {
    if (!ALLOWED_STEPS.has(step.type)) {
      errors.push(`Unexpected step type "${step.type}" at index ${index}.`);
      return;
    }

    if (RING_QTE_STEPS.has(step.type)) {
      const patternId = (step as { patternId?: unknown }).patternId;
      if (typeof patternId !== 'string' || patternId.length === 0) {
        errors.push(`Step "${step.type}" at index ${index} must include a patternId.`);
      }
    }

    if (step.type === 'HAMMER_PATTERN') {
      const hits = Math.floor(step.hits);
      if (!Number.isFinite(hits)) {
        errors.push(`Hammer step at index ${index} must define hits.`);
      } else {
        if (hits < MIN_HAMMER_HITS || hits > MAX_HAMMER_HITS) {
          errors.push(`Hammer step at index ${index} has hits outside ${MIN_HAMMER_HITS}-${MAX_HAMMER_HITS}.`);
        }
        totalHammerHits += hits;
      }
    }

    if (step.type === 'ENGRAVE_RUNE' || step.type === 'LAY_FORMATION') {
      const hits = Math.floor(step.hits ?? 0);
      if (!Number.isFinite(hits) || hits <= 0) {
        errors.push(`Special step at index ${index} must define hits.`);
      } else if (hits < MIN_SPECIAL_HITS || hits > MAX_SPECIAL_HITS) {
        errors.push(`Special step at index ${index} has hits outside ${MIN_SPECIAL_HITS}-${MAX_SPECIAL_HITS}.`);
      }
    }
  });

  if (totalHammerHits > MAX_TOTAL_HAMMER_HITS) {
    errors.push(`Total hammer hits exceed ${MAX_TOTAL_HAMMER_HITS}.`);
  }

  return { ok: errors.length === 0, errors };
}

export function isForgeStepScriptValid(stepScript: ForgeStepDef[]): boolean {
  return validateForgeStepScript(stepScript).ok;
}
