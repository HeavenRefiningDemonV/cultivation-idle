import type {
  HeartLawDef,
  SpiritRootProgressionDef,
  SpiritRootShape,
} from '../../content/types.js';
import type { RootHeartFitResult } from '../../systems/spiritRoots/rootHeartFitResolver.js';
import type { SpiritRootProgressionSnapshot } from '../../systems/spiritRoots/spiritRootProgressionResolver.js';
import type { SpiritRoot } from '../../types/index.js';

export type SpiritRootObservationTabId =
  | 'profile'
  | 'fit'
  | 'effects'
  | 'variants'
  | 'practice_routes'
  | 'history';

export interface SpiritRootObservationRow {
  id: string;
  label: string;
  value: string | null;
  detail: string;
  tone: 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'jade' | 'gold';
}

export interface SpiritRootObservationTab {
  id: SpiritRootObservationTabId;
  label: string;
  rows: SpiritRootObservationRow[];
}

export interface SpiritRootObservationHistoryEntry {
  id: string;
  label: string;
  detail: string;
  at: number;
}

export interface BuildSpiritRootObservationSurfaceInput {
  root: SpiritRoot | null;
  rootDef?: SpiritRootProgressionDef | null;
  heartLaw: HeartLawDef | null;
  selectedHeartLawId?: string | null;
  heartLawLevel?: number | null;
  currentRootResonance?: number | null;
  shape?: SpiritRootShape | null;
  unlockedVariantIds?: readonly string[] | null;
  trainingRatingsById?: Record<string, number> | null;
  daoHeartClarity?: number | null;
  verseMastery?: number | null;
  activeTab?: SpiritRootObservationTabId;
  history?: readonly SpiritRootObservationHistoryEntry[] | null;
}

export interface SpiritRootObservationSurfaceV1 {
  version: 'spirit-root-observation-v1';
  owner: 'status';
  activeTab: SpiritRootObservationTabId;
  route: {
    openTarget: {
      kind: 'status_observation';
      tab: SpiritRootObservationTabId;
    };
    returnAnchorId: 'status-ledger-root';
    forbiddenGlobalTabId: 'spiritRoot';
  };
  profile: {
    elementId: string;
    displayName: string;
    playstyleLabel: string;
    temperamentTags: string[];
    purityLabel: string;
    awakeningLabel: string;
    shapeLabel: string;
  };
  fit: RootHeartFitResult;
  progression: SpiritRootProgressionSnapshot;
  effects: {
    rows: SpiritRootObservationRow[];
  };
  variants: {
    rows: SpiritRootObservationRow[];
  };
  practiceRoutes: {
    rows: SpiritRootObservationRow[];
  };
  history: {
    rows: SpiritRootObservationRow[];
  };
  vfxRows: SpiritRootObservationRow[];
  tabs: SpiritRootObservationTab[];
}
