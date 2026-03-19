// Heart law store is now anchored in the cultivation store to keep a single source of truth
// for heart law progression, breath modes, and insight scheduling.
export {
  useCultivationStore as useHeartLawStore,
  getAvailableHeartLaws,
  getDefaultUnlockedHeartLawIds,
  getSelectedHeartLawDef,
} from './cultivationStore';
export type { ComprehensionSource } from '../types/index.js';
