import type { DaoMandateModuleSourceSinkProjection } from '../../../systems/ui/daoMandate/index.js';

export type ExpeditionsExactSurfaceMode = 'fixture' | 'live';

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

export type ExpeditionsExactIconKey =
  | 'hourglass'
  | 'hourglassProgress'
  | 'lock'
  | 'forage'
  | 'mine'
  | 'scout'
  | 'herb'
  | 'pouch'
  | 'elixir'
  | 'ore'
  | 'coin'
  | 'ingot'
  | 'paper'
  | 'fragment'
  | 'token'
  | 'mapNode';

export type DispatchSlotSurface = {
  visualIndex: 0 | 1 | 2 | 3;
  roman: 'I' | 'II' | 'III' | 'IV';
  realSlotIndex: number | null;
  status: 'active' | 'claim-ready' | 'idle' | 'locked';
  statusLabel: string;
  title: string;
  subtitle: string;
  progressPct: number;
  iconKey: 'hourglass' | 'hourglassProgress' | 'lock' | string;
  action: ExactButtonSurface;
};

export type ExpeditionRouteCardSurface = {
  routeId: 'forage' | 'mine' | 'scout' | string;
  title: string;
  purpose: string;
  durationLabel: string;
  yieldIcons: Array<{ id: string; label: string; iconKey: string; qtyLabel?: string }>;
  recommended: boolean;
  selected: boolean;
  defaultDurationId: string | null;
  button: ExactButtonSurface;
};

export type ExpeditionsRouteMapSurface = {
  title: 'Route Map';
  footer: string;
  nodes: Array<{ id: string; label: string; x: number; y: number }>;
};

export type ExpeditionsDispatchLedgerSurface = {
  title: 'Dispatch Ledger';
  claimBlock: {
    stamp: 'Claim Ready';
    headline: string;
    body: string;
    button: ExactButtonSurface;
    iconKey: ExpeditionsExactIconKey;
  };
  recommendedBlock: {
    title: 'Recommended Now';
    headline: string;
    body: string;
    button: ExactButtonSurface;
    iconKey: ExpeditionsExactIconKey;
  };
  footer: string;
};

export type ExpeditionsExactSurfaceV1 = {
  meta: {
    surfaceId: 'expeditions-exact';
    version: 1;
    mode: ExpeditionsExactSurfaceMode;
    cityId: string;
    cityIndex: number | null;
    selectedRouteId: 'forage' | 'mine' | 'scout' | string | null;
    selectedDurationId: string | null;
    selectedSlotIndex: number | null;
    idleSlotCount: number;
    activeSlotCount: number;
    claimReadyCount: number;
    rootTestId: 'expeditions-exact-page';
  };
  shell: {
    useScreenOwnedExactPage: true;
    showLegacyPanel: false;
    showContextStrip: false;
  };
  assets: ExpeditionsExactAssetMap;
  page: {
    title: 'Expeditions';
    subtitle: string;
    statusPlaque: string;
  };
  dispatchSlots: [DispatchSlotSurface, DispatchSlotSurface, DispatchSlotSurface, DispatchSlotSurface];
  routeMap: ExpeditionsRouteMapSurface;
  availableRoutes: {
    title: 'Available Routes';
    routes: [ExpeditionRouteCardSurface, ExpeditionRouteCardSurface, ExpeditionRouteCardSurface];
  };
  dispatchLedger: ExpeditionsDispatchLedgerSurface;
  bottomActions: {
    dispatch: ExactButtonSurface;
    claimAllReady: ExactButtonSurface;
  };
  mandateSourceSink?: DaoMandateModuleSourceSinkProjection | null;
  debug?: {
    notes: string[];
    regionOrder: string[];
  };
};

export type ExpeditionsExactAssetKey =
  | 'paperUnderlay'
  | 'hourglass'
  | 'hourglassProgress'
  | 'herb'
  | 'ore'
  | 'taskComplete'
  | 'sourceExpedition';

export type ExpeditionsExactAssetDescriptor = {
  key: ExpeditionsExactAssetKey;
  src: string;
  role: string;
  sourcePath: string;
  status: 'ready' | 'fallback';
};

export type ExpeditionsExactAssetMap = Record<ExpeditionsExactAssetKey, ExpeditionsExactAssetDescriptor>;
