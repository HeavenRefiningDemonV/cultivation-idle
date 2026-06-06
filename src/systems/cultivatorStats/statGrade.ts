import type { CultivatorStatGrade } from '../../content/types.js';

export function getCultivatorStatGrade(rating: number): CultivatorStatGrade {
  if (rating <= 0) return 'absent';
  if (rating < 20) return 'unformed';
  if (rating < 40) return 'formed';
  if (rating < 60) return 'refined';
  if (rating < 80) return 'tempered';
  if (rating < 100) return 'perfected';
  return 'transcendent';
}
