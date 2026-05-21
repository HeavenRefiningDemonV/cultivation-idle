import type { DaoMandateModuleSourceSinkProjection } from '../../../systems/ui/daoMandate/index.js';

export type BountiesExactSurfaceMode = 'fixture' | 'live';

export type ExactButtonSurface = {
  id: string;
  label: string;
  enabled: boolean;
  visible?: boolean;
  tone?: 'primary' | 'secondary' | 'gold' | 'jade' | 'muted' | 'danger';
  reason?: string | null;
  ariaLabel?: string;
  intent?: string;
};

export type ExactStatCardSurface = {
  id: string;
  label: string;
  value: string;
  iconKey: BountiesExactIconKey;
  tone?: 'neutral' | 'jade' | 'gold' | 'cinnabar' | 'muted';
};

export type BountiesExactIconKey =
  | 'foundationGate'
  | 'merit'
  | 'trackedNotice'
  | 'claimable'
  | 'bestRouteRuins'
  | 'refresh'
  | 'city'
  | 'herb'
  | 'ore'
  | 'challengeSword'
  | 'spiritStone'
  | 'boardTruth'
  | 'seal';

export type BountiesExactRewardChip = {
  id: string;
  label: string;
  iconKey: string;
  tone: string;
};

export type BountiesExactNoteSurface = {
  id: string;
  role: 'support' | 'route' | 'challenge';
  roleLabel: string;
  stateRibbon?: string | null;
  title: string;
  subtitle: string;
  objective: string;
  progressPct: number;
  progressText: string;
  rewardLine: string;
  rewardChips: BountiesExactRewardChip[];
  iconKey: BountiesExactIconKey;
  selected: boolean;
  tracked: boolean;
  claimReady: boolean;
  claimed: boolean;
  primaryButton: ExactButtonSurface;
  routeTarget?: { cityId: string; moduleKey: string; label: string } | null;
};

export type BountiesTrackedNoticeSurface = {
  title: 'Tracked Notice';
  noticeTitle: string;
  body: string;
  progressPct: number;
  progressText: string;
  rewardLine: string;
  routeButton: ExactButtonSurface;
  untrackButton: ExactButtonSurface;
  boardTruth: {
    title: 'Board Truth';
    body: string;
  };
};

export type BountiesOfficeSurface = {
  title: 'Bounty Office';
  meritReserve: {
    title: 'Merit Reserve';
    value: string;
    progressPct: number;
    body: string;
  };
  claimQueue: {
    title: 'Claim Queue';
    countText: string;
    primaryButton: ExactButtonSurface;
    secondaryButton: ExactButtonSurface;
  };
  nextBestUse: {
    title: 'Next Best Use';
    body: string;
  };
};

export type BountiesExactSurfaceV1 = {
  meta: {
    surfaceId: 'bounties-exact';
    version: 1;
    mode: BountiesExactSurfaceMode;
    cityId: string;
    cityIndex: number | null;
    selectedOrderId: string | null;
    trackedOrderId: string | null;
    claimReadyCount: number;
    refreshReady: boolean;
    rootTestId: 'bounties-exact-page';
  };
  shell: {
    useScreenOwnedExactPage: true;
    showLegacyPanel: false;
    showContextStrip: false;
  };
  assets: BountiesExactAssetMap;
  page: {
    title: 'Bounties';
    subtitle: string;
    statusPlaque: string;
  };
  statCards: [
    ExactStatCardSurface,
    ExactStatCardSurface,
    ExactStatCardSurface,
    ExactStatCardSurface,
    ExactStatCardSurface,
    ExactStatCardSurface,
    ExactStatCardSurface,
  ];
  trackedNotice: BountiesTrackedNoticeSurface;
  postedOrders: {
    title: 'Posted Orders';
    subtitle: string;
    notes: [BountiesExactNoteSurface, BountiesExactNoteSurface, BountiesExactNoteSurface];
  };
  office: BountiesOfficeSurface;
  bottomActions: {
    trackSelected: ExactButtonSurface;
    claimReady: ExactButtonSurface;
    routeNow: ExactButtonSurface;
  };
  mandateSourceSink?: DaoMandateModuleSourceSinkProjection | null;
  debug?: {
    notes: string[];
    regionOrder: string[];
  };
};

export type BountiesExactAssetKey =
  | 'paperUnderlay'
  | 'boardTexture'
  | 'herb'
  | 'ore'
  | 'foundationGate'
  | 'challengeSword'
  | 'taskComplete';

export type BountiesExactAssetDescriptor = {
  key: BountiesExactAssetKey;
  src: string;
  role: string;
  sourcePath: string;
  status: 'ready' | 'fallback';
};

export type BountiesExactAssetMap = Record<BountiesExactAssetKey, BountiesExactAssetDescriptor>;
