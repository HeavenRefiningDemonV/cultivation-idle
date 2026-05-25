import type { IconId } from '../../../ui/icons/index.js';
import type { StatusRequirementKind, StatusRouteTarget } from './statusDashboardSurface.js';

export type StatusLedgerTone = 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'jade' | 'gold';

export type StatusSpiritRootElement = 'fire' | 'water' | 'earth' | 'metal' | 'wood' | 'dormant';

export type StatusLedgerCardId =
  | 'milestone'
  | 'cultivation_base'
  | 'mission_requirements'
  | 'best_improvements'
  | 'safety_net'
  | 'identity_doctrine'
  | 'current_work'
  | 'build_preparation'
  | 'recent_changes'
  | 'details';

export interface StatusLedgerActionSurface {
  id: string;
  label: string;
  detail: string;
  destinationLabel: string;
  target: StatusRouteTarget;
  disabled: boolean;
  disabledReason: string | null;
  tone: StatusLedgerTone;
  primary?: boolean;
  source: 'run_compass' | 'readiness' | 'economy' | 'activity' | 'prestige' | 'fallback' | 'safety_net';
}

export interface StatusLedgerFactRow {
  id: string;
  label: string;
  value: string | null;
  detail: string;
  tone: StatusLedgerTone;
  icon: IconId;
  sourceLabel: string;
  action?: StatusLedgerActionSurface | null;
  importance?: 'primary' | 'secondary' | 'detail';
  display?: 'row' | 'tile' | 'callout' | 'metric';
  maxLines?: 1 | 2 | 3;
}

export interface StatusDoctrineTileSurface {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: IconId;
  tone: StatusLedgerTone;
  accent?: 'path' | 'heartLaw' | 'spiritRoot' | 'focus' | 'breath' | 'city';
}

export interface StatusSpiritRootSurface {
  element: StatusSpiritRootElement;
  elementLabel: string;
  gradeLabel: string;
  purityLabel: string | null;
  totalMultiplierLabel: string | null;
  resonanceLabel: string | null;
  icon: IconId;
  tone: StatusLedgerTone;
}

export interface StatusBuildPrepGroupSurface {
  title: string;
  headline: string;
  tone: StatusLedgerTone;
  icon: IconId;
  tiles: StatusLedgerFactRow[];
  detailRows: StatusLedgerFactRow[];
}

export interface StatusLedgerRequirementRow extends StatusLedgerFactRow {
  kind: StatusRequirementKind;
  gapLabel: string | null;
  priorityLabel: string | null;
  sourceModuleLabel: string | null;
}

export interface StatusLedgerMilestoneNode {
  id: string;
  label: string;
  detail: string;
  state: 'done' | 'current' | 'locked' | 'future' | 'warning' | 'ready';
  icon: IconId;
}

export interface StatusLedgerSection<RowType = StatusLedgerFactRow> {
  id: StatusLedgerCardId;
  title: string;
  subtitle?: string | null;
  rows: RowType[];
  emptyState?: StatusLedgerFactRow | null;
}

export interface StatusLedgerSurfaceV1 {
  meta: {
    rootTestId: 'status-ledger';
    mode: 'live' | 'fallback';
    generatedAt: number;
    contentLoaded: boolean;
    schemaVersion: 'status-ledger-v1';
    debugNotes: string[];
  };
  hero: {
    realmName: string;
    stageText: string;
    pathLabel: string;
    heartLawLabel: string;
    spiritRootLabel: string;
    cityLabel: string;
    focusLabel: string;
    breathLabel: string;
    nextMajorGoalLabel: string;
    nextMajorGoalDetail: string;
    mainBottleneckLabel: string;
    mainBottleneckDetail: string;
    primaryAction: StatusLedgerActionSurface | null;
    pathTile: StatusDoctrineTileSurface;
    heartLawTile: StatusDoctrineTileSurface;
    spiritRoot: StatusSpiritRootSurface;
    focusTile: StatusDoctrineTileSurface;
    breathTile: StatusDoctrineTileSurface;
    cityTile: StatusDoctrineTileSurface;
  };
  metrics: StatusLedgerFactRow[];
  milestone: {
    id: 'milestone';
    title: 'Milestone';
    detail: string;
    readinessLabel: string;
    tone: StatusLedgerTone;
    nodes: StatusLedgerMilestoneNode[];
    rows: StatusLedgerFactRow[];
  };
  cultivationBase: {
    id: 'cultivation_base';
    title: 'Cultivation Base';
    rows: StatusLedgerFactRow[];
  };
  missionRequirements: {
    id: 'mission_requirements';
    title: 'Mission Requirements';
    rows: StatusLedgerRequirementRow[];
    emptyState: StatusLedgerFactRow | null;
  };
  bestImprovements: {
    id: 'best_improvements';
    title: 'Best Improvements';
    primary: StatusLedgerActionSurface | null;
    rows: StatusLedgerActionSurface[];
    emptyState: StatusLedgerFactRow | null;
  };
  safetyNet: {
    id: 'safety_net';
    title: 'Safety Net';
    rows: StatusLedgerFactRow[];
    action: StatusLedgerActionSurface | null;
  };
  identityDoctrine: {
    id: 'identity_doctrine';
    title: 'Identity & Doctrine';
    rows: StatusLedgerFactRow[];
    spiritRootElement: string;
    spiritRootTone: string;
    spiritRoot: StatusSpiritRootSurface;
    pathTile: StatusDoctrineTileSurface;
    heartLawTile: StatusDoctrineTileSurface;
    resonanceTile: StatusDoctrineTileSurface;
    focusTile: StatusDoctrineTileSurface;
    breathTile: StatusDoctrineTileSurface;
    cityTile: StatusDoctrineTileSurface;
  };
  currentWork: {
    id: 'current_work';
    title: 'Current Work';
    activityTiles: StatusLedgerFactRow[];
    rows: StatusLedgerFactRow[];
  };
  buildPreparation: {
    id: 'build_preparation';
    title: 'Build & Preparation';
    build: StatusBuildPrepGroupSurface;
    preparation: StatusBuildPrepGroupSurface;
    buildRows: StatusLedgerFactRow[];
    reserveRows: StatusLedgerFactRow[];
    topWarning: StatusLedgerFactRow | null;
  };
  recentChanges: {
    id: 'recent_changes';
    title: 'Recent Changes';
    rows: StatusLedgerFactRow[];
    emptyState: StatusLedgerFactRow;
  };
  details: {
    id: 'details';
    title: 'How calculated';
    summary: string;
    rows: StatusLedgerFactRow[];
    closedByDefault: true;
  };
}
