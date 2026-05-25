import type { PrestigeUpgradeDef } from '../../../content/index.js';
import type { ApBreakdown } from '../../../stores/prestigeStore.js';
import type { CultivationPath, Realm, SpiritRoot } from '../../../types/index.js';
import type { PrestigeAdvisorStateLabel, PrestigeResetPreviewBuckets } from '../prestigeAdvisorSurface.js';
import type { PrestigeForecastSurfaceV2 } from '../prestigeForecastSurface.js';
import type { PostResetReclaimObjectiveSurface } from '../postResetReclaimObjectiveSurface.js';

export type PrestigeLedgerButtonVariant = 'primary' | 'secondary' | 'danger' | 'disabled';

export type PrestigeLedgerButtonSurface = {
  label: string;
  enabled: boolean;
  variant: PrestigeLedgerButtonVariant;
  ariaLabel?: string;
  reason?: string;
};

export type PrestigeLedgerSealState = 'locked' | 'viable' | 'recommended' | 'complete';

export type PrestigeLedgerLifeThreadNode = {
  label: string;
  state: 'reached' | 'current' | 'future';
};

export type PrestigeRecommendedDecreeCard = {
  id: string;
  displayTitle: string;
  actualUpgradeName?: string;
  costLabel: string;
  effectLine: string;
  whyLine: string;
  sealTone: 'jade' | 'gold' | 'cinnabar' | 'ink';
  affordance: 'buy_now' | 'save_for_next' | 'locked' | 'owned' | 'info';
  runtimeHonesty?: 'live' | 'deferred' | 'unsupported_hidden' | 'unknown_blocked';
  levelLine?: string;
  button?: PrestigeLedgerButtonSurface;
};

export type PrestigeLedgerExactSurfaceV1 = {
  meta: {
    mode: 'fixture' | 'live';
    rootTestId: 'prestige-ledger-exact-page';
    advisorState: PrestigeAdvisorStateLabel;
    canPrestige: boolean;
    apGain: number;
    contentCapReached: boolean;
    hasLastLifeSummary: boolean;
  };
  shell: {
    topLevelTabPage: true;
    useExistingBottomNav: true;
    showLegacyVerticalStack: false;
    showFullDecreeTreeByDefault: false;
    singleDominantCta: true;
  };
  header: {
    title: 'Prestige';
    subtitle: 'Reincarnation Ledger';
    sealText?: string;
    lifeThread: PrestigeLedgerLifeThreadNode[];
    chips: { label: 'AP Reserve' | 'Lifetime AP' | 'Lives'; value: string }[];
  };
  currentLifeLedger: {
    title: 'Current Life Ledger';
    identityRows: { label: string; value: string }[];
    progressRows: { label: string; value: string; emphasis?: 'warning' | 'normal' }[];
    apReceiptRows: { label: string; value: string; hint?: string }[];
    projectedGainLabel: string;
    projectedGainValue: string;
    viewLifeSummaryButton: PrestigeLedgerButtonSurface;
    viewLastLifeSummaryButton: PrestigeLedgerButtonSurface;
  };
  reincarnationDecree: {
    title: 'Reincarnation Decree';
    sealState: PrestigeLedgerSealState;
    verdictLabel: string;
    apValueLabel: string;
    statusLine: string;
    advisorySentence: string;
    primaryAction: PrestigeLedgerButtonSurface;
    secondaryAction: PrestigeLedgerButtonSurface;
  };
  nextLifeRail: {
    previewBullets: string[];
    recommendedDecrees: PrestigeRecommendedDecreeCard[];
    openLibraryButton: PrestigeLedgerButtonSurface;
  };
  resetContract: {
    title: 'Reset Contract';
    tablets: { title: string; bullets: string[]; tone: 'reset' | 'carry' | 'rebuild' | 'hybrid' }[];
  };
  forecast: {
    title: 'Reclaim Forecast';
    lines: PrestigeForecastSurfaceV2['reclaimForecast'];
    objective: PrestigeForecastSurfaceV2['postResetObjective'];
    warnings: string[];
  };
  postResetReclaimObjective?: PostResetReclaimObjectiveSurface | null;
  debug?: { notes: string[] };
};

export type PrestigeLedgerExactAdvisorInput = {
  stateLabel: PrestigeAdvisorStateLabel;
  stateDetail: string;
  resetPreview: PrestigeResetPreviewBuckets;
};

export type PrestigeLedgerExactLiveInput = {
  mode: 'live';
  prestige: {
    totalAP: number;
    lifetimeAP: number;
    prestigeCount: number;
    apGain: number;
    canPrestige: boolean;
    contentCapReached: boolean;
    hasLastLifeSummary: boolean;
    highestRealmReached: number;
    spiritRoot: SpiritRoot | null;
    breakdown: ApBreakdown;
    purchasesById: Record<string, number>;
  };
  game: {
    selectedPath: CultivationPath | null;
    realm: Realm;
  };
  advisor: PrestigeLedgerExactAdvisorInput;
  forecast?: PrestigeForecastSurfaceV2;
  heartLawName: string | null;
  cityNamesReached: string[];
  resolvedGateCount: number;
  visibleUpgrades: PrestigeUpgradeDef[];
  postResetReclaimObjective?: PostResetReclaimObjectiveSurface | null;
};

export type PrestigeLedgerExactScreenActions = {
  onReviewAndReincarnate: () => void;
  onOpenLibrary: () => void;
  onViewLifeSummary: () => void;
  onViewLastCompletedLifeSummary: () => void;
  onOpenApBreakdown: () => void;
  onSelectRecommendedDecree: (upgradeId: string) => void;
  onRoutePostResetObjective: () => void;
  onDismissPostResetObjective: () => void;
};
