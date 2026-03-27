import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useManualSatchelStore } from '../../stores/manualSatchelStore.js';
import { useTechCollectionStore, type ManualGrade, type TechRarity } from '../../stores/techCollectionStore.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useProfessionStore } from '../../stores/professionStore.js';
import { useExpeditionStore } from '../../stores/expeditionStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { SEMESTER_SLICE_CONTRACT } from '../../systems/progression/contract/semesterSlice.js';

export type ValidationSeverity = 'error' | 'warning';

export type ValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  domain?: 'content' | 'inventory' | 'manuals' | 'techniques' | 'activity' | 'professions' | 'expeditions' | 'progression' | 'save_load' | 'diagnostics_internal';
  message: string;
  hint?: string;
  repairable?: boolean;
  safeRepairActionId?: 'clamp_inventory' | 'clamp_fragments' | 'remove_invalid_manual';
};

const VALID_GRADES: ManualGrade[] = ['mortal', 'earth', 'heaven', 'mystic'];
const VALID_RARITIES: TechRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

function addIssue(collection: ValidationIssue[], issue: ValidationIssue) {
  collection.push(issue);
}

function isFiniteNonNegativeNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isValidCurrency(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0;
}

export function runRuntimeValidation(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  try {
    const inventory = useInventoryStore.getState();
    const currencies = inventory.currencies ?? {};
    (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
      if (!isValidCurrency(currencies[key])) {
        addIssue(issues, {
          id: `inventory_currency_invalid_${key}`,
          severity: 'error',
          message: `Currency ${key} is invalid or negative`,
          hint: 'Currency strings should be finite, non-negative decimals.',
          domain: 'inventory',
        });
      }
    });

    Object.entries(inventory.items ?? {}).forEach(([itemId, qty]) => {
      if (!Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) {
        addIssue(issues, {
          id: `inventory_item_invalid_${itemId}`,
          severity: 'error',
          message: `Item ${itemId} has invalid quantity (${String(qty)})`,
          hint: 'Quantities should be whole numbers and non-negative.',
          domain: 'inventory',
          repairable: true,
          safeRepairActionId: 'clamp_inventory',
        });
      }
    });
  } catch (error) {
    addIssue(issues, {
      id: 'inventory_validation_failed',
      severity: 'warning',
      message: `Inventory validation failed: ${String(error)}`,
      domain: 'diagnostics_internal',
    });
  }

  try {
    const content = useContentStore.getState();
    const manuals = useManualSatchelStore.getState();
    manuals.manuals.forEach((manual, index) => {
      if (!manual?.techId) {
        addIssue(issues, {
          id: `manual_missing_tech_${index}`,
          severity: 'error',
          message: 'Manual entry missing technique id',
          domain: 'manuals',
          repairable: true,
          safeRepairActionId: 'remove_invalid_manual',
        });
        return;
      }
      if (!VALID_GRADES.includes(manual.grade)) {
        addIssue(issues, {
          id: `manual_grade_invalid_${manual.id}`,
          severity: 'warning',
          message: `Manual ${manual.techId} has invalid grade ${manual.grade}`,
          hint: 'Grade will be normalized on repair.',
          domain: 'manuals',
        });
      }
      if (!VALID_RARITIES.includes(manual.rarity)) {
        addIssue(issues, {
          id: `manual_rarity_invalid_${manual.id}`,
          severity: 'warning',
          message: `Manual ${manual.techId} has invalid rarity ${manual.rarity}`,
          hint: 'Rarity will be normalized on repair.',
          domain: 'manuals',
        });
      }
      if (content.isLoaded && !content.maps.techniquesById[manual.techId]) {
        addIssue(issues, {
          id: `manual_unknown_tech_${manual.techId}`,
          severity: 'warning',
          message: `Manual references unknown technique ${manual.techId}`,
          domain: 'manuals',
        });
      }
    });
  } catch (error) {
    addIssue(issues, {
      id: 'manual_validation_failed',
      severity: 'warning',
      message: `Manual satchel validation failed: ${String(error)}`,
      domain: 'diagnostics_internal',
    });
  }

  try {
    const city = useCityStore.getState();
    if (city.currentCityId && !city.unlockedCityIds.includes(city.currentCityId)) {
      addIssue(issues, {
        id: 'current_city_not_unlocked',
        severity: 'error',
        domain: 'progression',
        message: `Current city ${city.currentCityId} is not unlocked.`,
      });
    }
    const outOfSlice = city.unlockedCityIds.filter((id) => !SEMESTER_SLICE_CONTRACT.liveCityIds.includes(id as never));
    if (outOfSlice.length > 0) {
      addIssue(issues, {
        id: 'unlocked_city_out_of_slice',
        severity: 'error',
        domain: 'progression',
        message: `Unlocked city ids outside semester slice: ${outOfSlice.join(', ')}`,
      });
    }
    if (city.unlockedCityIds.includes('city_six' as never)) {
      addIssue(issues, {
        id: 'fake_city_six_detected',
        severity: 'error',
        domain: 'progression',
        message: 'Fake city 6 detected in unlocked city ids.',
      });
    }
  } catch (error) {
    addIssue(issues, {
      id: 'progression_validation_failed',
      severity: 'warning',
      domain: 'diagnostics_internal',
      message: `Progression-state validation failed: ${String(error)}`,
    });
  }

  try {
    const techCollection = useTechCollectionStore.getState();
    const content = useContentStore.getState();
    Object.entries(techCollection.fragments ?? {}).forEach(([techId, qty]) => {
      if (!isFiniteNonNegativeNumber(qty)) {
        addIssue(issues, {
          id: `fragment_invalid_${techId}`,
          severity: 'error',
          message: `Fragment count for ${techId} is invalid (${String(qty)})`,
          hint: 'Fragments should be non-negative integers.',
          domain: 'techniques',
          repairable: true,
          safeRepairActionId: 'clamp_fragments',
        });
      }
    });

    Object.keys(techCollection.unlockedTechs ?? {}).forEach((techId) => {
      if (content.isLoaded && !content.maps.techniquesById[techId]) {
        addIssue(issues, {
          id: `tech_unknown_${techId}`,
          severity: 'warning',
          message: `Unlocked technique ${techId} missing from content`,
          domain: 'techniques',
        });
      }
    });
  } catch (error) {
    addIssue(issues, {
      id: 'tech_collection_validation_failed',
      severity: 'warning',
      message: `Technique collection validation failed: ${String(error)}`,
      domain: 'diagnostics_internal',
    });
  }

  try {
    const activity = useActivityStore.getState().active;
    const now = Date.now();
    if (activity) {
      const startedAt = (activity as any).startedAt;
      if (!(typeof startedAt === 'number' && Number.isFinite(startedAt))) {
        addIssue(issues, {
          id: 'activity_started_at_invalid',
          severity: 'warning',
          message: 'Active activity has invalid start time',
          domain: 'activity',
        });
      } else if (startedAt > now + 5 * 60 * 1000) {
        addIssue(issues, {
          id: 'activity_clock_skew',
          severity: 'warning',
          message: 'Active activity start time is in the future (possible clock skew)',
          domain: 'activity',
        });
      }
    }
  } catch (error) {
    addIssue(issues, {
      id: 'activity_validation_failed',
      severity: 'warning',
      message: `Activity validation failed: ${String(error)}`,
      domain: 'diagnostics_internal',
    });
  }

  try {
    const profession = useProfessionStore.getState();
    const now = Date.now();
    const checkJob = (job: { endsAt: number; startedAt?: number | null }, label: string) => {
      if (!Number.isFinite(job.endsAt)) {
        addIssue(issues, {
          id: `job_invalid_${label}`,
          severity: 'error',
          message: `${label} has invalid endsAt`,
          domain: 'professions',
        });
      } else if (job.endsAt < now - 24 * 60 * 60 * 1000) {
        addIssue(issues, {
          id: `job_expired_${label}`,
          severity: 'warning',
          message: `${label} endsAt is far in the past`,
          domain: 'professions',
        });
      }
      if (job.startedAt != null && !Number.isFinite(job.startedAt)) {
        addIssue(issues, {
          id: `job_started_invalid_${label}`,
          severity: 'warning',
          message: `${label} has invalid startedAt`,
          domain: 'professions',
        });
      }
    };

    profession.alchemyQueue.forEach((job, idx) => checkJob(job as any, `alchemy_${idx}`));
    profession.forgeQueue.forEach((job, idx) => checkJob(job as any, `forge_${idx}`));
    profession.talismanQueue.forEach((job, idx) => checkJob(job as any, `talisman_${idx}`));
  } catch (error) {
    addIssue(issues, {
      id: 'profession_validation_failed',
      severity: 'warning',
      message: `Profession validation failed: ${String(error)}`,
      domain: 'diagnostics_internal',
    });
  }

  try {
    const expeditions = useExpeditionStore.getState();
    const now = Date.now();
    expeditions.active.forEach((run, idx) => {
      if (!Number.isFinite(run.endsAt) || run.endsAt <= 0) {
        addIssue(issues, {
          id: `expedition_invalid_${idx}`,
          severity: 'error',
          message: `Expedition slot ${run.slotIndex} has invalid endsAt`,
          domain: 'expeditions',
        });
      }
      if (run.startedAt != null && !Number.isFinite(run.startedAt)) {
        addIssue(issues, {
          id: `expedition_started_invalid_${idx}`,
          severity: 'warning',
          message: `Expedition slot ${run.slotIndex} has invalid startedAt`,
          domain: 'expeditions',
        });
      }
      if (run.endsAt < now && run.status !== 'complete') {
        addIssue(issues, {
          id: `expedition_stuck_${idx}`,
          severity: 'warning',
          message: `Expedition slot ${run.slotIndex} should be complete but is not marked complete`,
          domain: 'expeditions',
        });
      }
    });
  } catch (error) {
    addIssue(issues, {
      id: 'expedition_validation_failed',
      severity: 'warning',
      message: `Expedition validation failed: ${String(error)}`,
      domain: 'diagnostics_internal',
    });
  }

  try {
    const content = useContentStore.getState();
    if (!content.isLoaded) {
      addIssue(issues, {
        id: 'content_not_loaded',
        severity: 'error',
        domain: 'content',
        message: 'Content store is not loaded.',
        hint: content.loadFailure?.message ?? content.error ?? 'Check content startup diagnostics.',
      });
    }
    if (content.loadFailure) {
      addIssue(issues, {
        id: `content_load_failure_${content.loadFailure.phase}`,
        severity: 'error',
        domain: 'content',
        message: `Startup content failure in phase "${content.loadFailure.phase}"`,
        hint: content.loadFailure.message,
      });
    }
  } catch (error) {
    addIssue(issues, {
      id: 'content_validation_failed',
      severity: 'warning',
      domain: 'diagnostics_internal',
      message: `Content-state validation failed: ${String(error)}`,
    });
  }

  return issues;
}

export function applySafeRepairs(issues: ValidationIssue[]): { repairedCount: number; notes: string[] } {
  let repairedCount = 0;
  const notes: string[] = [];

  try {
    const inventoryIssues = issues.filter((issue) => issue.id.startsWith('inventory_item_invalid_'));
    if (inventoryIssues.length > 0) {
      useInventoryStore.setState((state) => {
        Object.entries(state.items).forEach(([itemId, qty]) => {
          if (!Number.isFinite(qty)) {
            state.items[itemId] = 0;
            repairedCount += 1;
            notes.push(`Reset invalid qty for ${itemId}`);
          } else if (qty < 0) {
            state.items[itemId] = 0;
            repairedCount += 1;
            notes.push(`Clamped negative qty for ${itemId}`);
          }
          if (state.items[itemId] === 0) {
            delete state.items[itemId];
          }
        });
      });
    }
  } catch (error) {
    notes.push(`Failed to repair inventory items: ${String(error)}`);
  }

  try {
    const fragmentIssues = issues.filter((issue) => issue.id.startsWith('fragment_invalid_'));
    if (fragmentIssues.length > 0) {
      useTechCollectionStore.setState((state) => {
        Object.entries(state.fragments).forEach(([techId, qty]) => {
          if (!Number.isFinite(qty) || qty < 0) {
            state.fragments[techId] = Math.max(0, Math.floor(Number.isFinite(qty) ? Number(qty) : 0));
            repairedCount += 1;
            notes.push(`Clamped fragment count for ${techId}`);
          }
        });
      });
    }
  } catch (error) {
    notes.push(`Failed to repair fragments: ${String(error)}`);
  }

  try {
    const manualIssues = issues.filter((issue) => issue.id.startsWith('manual_missing_tech_'));
    if (manualIssues.length > 0) {
      useManualSatchelStore.setState((state) => {
        state.manuals = state.manuals.filter((manual) => {
          if (!manual?.techId) {
            repairedCount += 1;
            notes.push('Removed manual entry with missing techId');
            return false;
          }
          return true;
        });
        if (state.activeStudy && !state.activeStudy.manual?.techId) {
          state.activeStudy = null;
          repairedCount += 1;
          notes.push('Cleared active study with invalid manual');
        }
      });
    }
  } catch (error) {
    notes.push(`Failed to repair manuals: ${String(error)}`);
  }

  return { repairedCount, notes };
}
