import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { getAvailablePerks, getPerkById } from '../../../data/pathPerks.js';
import { PerkSelectionModal } from '../../../components/modals/PerkSelectionModal.js';
import { DaoHeartModal } from '../../../components/modals/DaoHeartModal.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { usePrestigeStore } from '../../../stores/prestigeStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { useRunCompassSurface } from '../../../ui/status/useRunCompassSurface.js';
import { ScreenFxStage } from '../../../ui/fx/ScreenFxStage.js';
import { FX_STAGE_IDS } from '../../../ui/fx/constants.js';
import { FxStagePortal } from '../../../ui/fx/FxStagePortal.js';
import { useFxQuality, useFxStageSnapshot } from '../../../ui/fx/FxQualityProvider.js';
import { buildFxSceneContract } from '../../../ui/fx/runtime.js';
import { CultivationFxScene } from '../../../ui/fx/scenes/CultivationFxScene.js';
import type { CultivationExactFxQuality, CultivationExactSurfaceMode } from './cultivationExactTypes.js';
import { buildCultivationExactSurfaceFromStores } from './buildCultivationExactSurface.js';
import { CultivationExactScreen } from './CultivationExactScreen.js';
import { useCultivationExactActionController } from './useCultivationExactActionController.js';
import { BreakthroughRitualOverlay } from './BreakthroughRitualOverlay.js';
import { PERF_LABELS, time } from '../../../services/performance/index.js';
import { PerfProfiler, useRenderCounter } from '../../../services/performance/perfReact.js';
import './CultivationExactScreen.scss';

export interface CultivationExactScreenOwnerProps {
  forceFixture?: boolean;
}

function parseModeFromQuery(): CultivationExactSurfaceMode | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('cultivationExactMode');
  return value === 'fixture' || value === 'live' ? value : null;
}

function toSurfaceFxQuality(value: string): CultivationExactFxQuality {
  if (value === 'reducedMotion') return 'off';
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'medium';
}

export function CultivationExactScreenOwner({ forceFixture = false }: CultivationExactScreenOwnerProps) {
  useRenderCounter(PERF_LABELS.renderCultivationExactScreenOwner);
  const queryMode = parseModeFromQuery();
  const mode: CultivationExactSurfaceMode = forceFixture ? 'fixture' : queryMode ?? 'live';
  const suppressExactQueryChrome = forceFixture || queryMode !== null;
  const runCompass = useRunCompassSurface();
  const fxStageSnapshot = useFxStageSnapshot(FX_STAGE_IDS.cultivation);
  const { requestedQuality, effectiveQuality, prefersReducedMotion } = useFxQuality();

  const {
    showPerkSelectionModal,
    perkSelectionRealm,
    showPerkSelection,
    hidePerkSelection,
  } = useUIStore(
    useShallow((state) => ({
      showPerkSelectionModal: state.showPerkSelectionModal,
      perkSelectionRealm: state.perkSelectionRealm,
      showPerkSelection: state.showPerkSelection,
      hidePerkSelection: state.hidePerkSelection,
    })),
  );

  const gameSignature = useGameStore(
    useShallow((state) => ({
      realmIndex: state.realm.index,
      realmSubstage: state.realm.substage,
      qi: state.qi,
      qiPerSecond: state.qiPerSecond,
      breakthroughRequirement: state.getBreakthroughRequirement(),
      selectedPath: state.selectedPath,
      pathPerks: state.pathPerks.join('|'),
      focusMode: state.focusMode,
    })),
  );
  const selectedPath = useGameStore((state) => state.selectedPath);
  const pathPerks = useGameStore((state) => state.pathPerks);
  const realmIndex = useGameStore((state) => state.realm.index);

  const cultivationSignature = useCultivationStore(
    useShallow((state) => ({
      breathMode: state.breathMode,
      stability: state.stability,
      stabilityCap: state.stabilityCap,
      selectedHeartLawId: state.selectedHeartLawId,
      chapter: state.chapter,
      comprehension: state.comprehension,
      activeBuffCount: state.activeCultivationConsumables.length,
    })),
  );
  const contentVersion = useContentStore((state) => state.contentVersion);
  const inventoryVersion = useInventoryStore((state) => state.inventoryVersion);
  const prestigeSnapshot = usePrestigeStore(useShallow((state) => ({
    spiritRoot: state.spiritRoot,
    highestRealmReached: state.highestRealmReached,
    prestigeCount: state.prestigeCount,
  })));
  const guidanceSignature = useUIStore(useShallow((state) => ({
    guidanceOath: state.settings.guidanceOath,
    jadeSlipLessons: state.settings.jadeSlipLessons,
    localLensBanners: state.settings.localLensBanners,
    sourceRouteDetail: state.settings.sourceRouteDetail,
    advancedReadinessMath: state.settings.advancedReadinessMath,
    failureCoaching: state.settings.failureCoaching,
    backgroundReminders: state.settings.backgroundReminders,
    recentOmensFeed: state.settings.recentOmensFeed,
    mandateMotionMode: state.settings.mandateMotionMode,
    storyMotionMode: state.settings.storyMotionMode,
  })));
  const activeActivitySignature = useActivityStore((state) => {
    const active = state.active;
    if (!active) return 'none';
    return `${active.type}:${active.startedAt ?? ''}:${active.sourceId ?? ''}:${active.cityId ?? ''}`;
  });
  const runCompassActionKey = useMemo(
    () => (runCompass.full?.bestNextActions ?? [])
      .map((action) => {
        const entry = action as { id?: string; title?: string; label?: string; detail?: string; priority?: string | number };
        return `${entry.id ?? ''}:${entry.title ?? entry.label ?? ''}:${entry.detail ?? ''}:${entry.priority ?? ''}`;
      })
      .join('|'),
    [runCompass.full?.bestNextActions],
  );
  const [buffNow, setBuffNow] = useState(() => Date.now());
  const [dantianFxAnchor, setDantianFxAnchor] = useState<{ x: number; y: number } | null>(null);
  const activeBuffCount = cultivationSignature.activeBuffCount;

  useEffect(() => {
    if (activeBuffCount <= 0) return;
    setBuffNow(Date.now());
    const intervalId = window.setInterval(() => setBuffNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [activeBuffCount]);

  useEffect(() => {
    if (suppressExactQueryChrome || !selectedPath || realmIndex < 1) return;
    const hasRealmPerk = pathPerks.some((perkId) => getPerkById(perkId)?.requiredRealm === realmIndex);
    const availablePerks = getAvailablePerks(selectedPath, realmIndex);
    const perkModalAlreadyOpen = showPerkSelectionModal && perkSelectionRealm === realmIndex;
    if (availablePerks.length > 0 && !hasRealmPerk && !perkModalAlreadyOpen) {
      showPerkSelection(realmIndex);
    }
  }, [
    pathPerks,
    perkSelectionRealm,
    realmIndex,
    selectedPath,
    showPerkSelection,
    showPerkSelectionModal,
    suppressExactQueryChrome,
  ]);

  const baseSurface = useMemo(
    () => time(PERF_LABELS.surfaceCultivation, () => buildCultivationExactSurfaceFromStores({
      mode,
      reducedMotion: prefersReducedMotion,
      fxQuality: toSurfaceFxQuality(effectiveQuality),
      runCompassFull: runCompass.full,
      nowMs: buffNow,
    })),
    [
      activeActivitySignature,
      buffNow,
      contentVersion,
      cultivationSignature,
      effectiveQuality,
      gameSignature,
      guidanceSignature,
      inventoryVersion,
      mode,
      prefersReducedMotion,
      prestigeSnapshot,
      runCompass.full,
      runCompassActionKey,
    ],
  );

  const actions = useCultivationExactActionController(baseSurface);
  const surface = useMemo(() => ({
    ...baseSurface,
    meta: {
      ...baseSurface.meta,
      selectedDrawer: actions.selectedDrawer,
    },
    commandDeck: actions.isBreakingThrough && baseSurface.commandDeck.primary.actionKey === 'breakThrough'
      ? {
          ...baseSurface.commandDeck,
          primary: {
            ...baseSurface.commandDeck.primary,
            label: 'Gathering Qi...',
            disabled: true,
          },
        }
      : baseSurface.commandDeck,
  }), [actions.isBreakingThrough, actions.selectedDrawer, baseSurface]);

  const cultivationFxScene = useMemo(() => {
    if (!fxStageSnapshot) return null;
    return buildFxSceneContract({
      stageId: FX_STAGE_IDS.cultivation,
      sceneKind: 'cultivation',
      snapshot: fxStageSnapshot,
      requestedQuality,
      effectiveQuality,
      prefersReducedMotion,
      documentHidden: typeof document !== 'undefined' ? document.hidden : false,
    });
  }, [effectiveQuality, fxStageSnapshot, prefersReducedMotion, requestedQuality]);

  const isCultivating = surface.meta.activityState === 'cultivating' || surface.meta.activityState === 'near_edge';
  const isReady = surface.meta.activityState === 'breakthrough_ready';

  return (
    <PerfProfiler id={PERF_LABELS.renderCultivationExactScreenOwner}>
    <ScreenFxStage
      stageId={FX_STAGE_IDS.cultivation}
      className="cultivationExactFxStage"
      stageClassName="cultivationExactFxStage__layer"
      contentClassName="cultivationExactFxStage__content"
      stageZIndex={0}
      contentZIndex={1}
    >
      {cultivationFxScene ? (
        <FxStagePortal stageId={FX_STAGE_IDS.cultivation}>
          <CultivationFxScene
            {...cultivationFxScene}
            isCultivating={isCultivating}
            isReady={isReady}
            anchorX={dantianFxAnchor?.x}
            anchorY={dantianFxAnchor?.y}
          />
        </FxStagePortal>
      ) : null}
      <CultivationExactScreen
        surface={surface}
        onCommandAction={actions.onCommandAction}
        onOpenDrawer={actions.onOpenDrawer}
        onCloseDrawer={actions.onCloseDrawer}
        onOpenDaoHeart={actions.onOpenDaoHeart}
        onDantianAnchorChange={setDantianFxAnchor}
      />
      {actions.showDaoHeart ? <DaoHeartModal onClose={actions.onCloseDaoHeart} /> : null}
      {actions.ritualSurface ? (
        <BreakthroughRitualOverlay
          surface={actions.ritualSurface}
          onClose={actions.onCloseRitual}
          onRoute={actions.onRitualRoute}
        />
      ) : null}
      {!suppressExactQueryChrome && !actions.ritualSurface && showPerkSelectionModal && perkSelectionRealm !== null ? (
        <PerkSelectionModal onClose={hidePerkSelection} realmIndex={perkSelectionRealm} />
      ) : null}
    </ScreenFxStage>
    </PerfProfiler>
  );
}
