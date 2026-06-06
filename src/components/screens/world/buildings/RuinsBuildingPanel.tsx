import { useMemo } from 'react';
import { useBountyStore } from '../../../../stores/bountyStore.js';
import { useContentStore } from '../../../../stores/contentStore.js';
import { useRuinsStore } from '../../../../stores/ruinsStore.js';
import { resolveModuleRef } from '../worldUtils.js';
import { RuinsScreenOwner } from '../../../../features/world/ruinsExact/index.js';
import { FX_STAGE_IDS } from '../../../../ui/fx/constants.js';
import { FxStagePortal } from '../../../../ui/fx/FxStagePortal.js';
import { useFxQuality, useFxStageSnapshot } from '../../../../ui/fx/FxQualityProvider.js';
import { buildFxSceneContract } from '../../../../ui/fx/runtime.js';
import { RuinsFxScene } from '../../../../ui/fx/scenes/RuinsFxScene.js';
import { ScreenFxStage } from '../../../../ui/fx/ScreenFxStage.js';

interface RuinsBuildingPanelProps {
  cityId: string;
  forceFixture?: boolean;
}

export function RuinsBuildingPanel({ cityId, forceFixture }: RuinsBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const ruinsById = useContentStore((state) => state.maps.ruinsById);
  const ruinsPityCap = useContentStore((state) => state.economy?.tuning?.pityDefaults?.ruinsBossChestRare?.pityCap ?? 0);
  const activeRun = useRuinsStore((state) => state.activeRun);
  const progressByRuinId = useRuinsStore((state) => state.progressByRuinId);
  const trackedBountyId = useBountyStore((state) => state.trackedByCityId[cityId] ?? null);
  const fxStageSnapshot = useFxStageSnapshot(FX_STAGE_IDS.ruins);
  const { requestedQuality, effectiveQuality, prefersReducedMotion } = useFxQuality();
  const ruinRefId = useMemo(() => resolveModuleRef(city ?? null, 'ruins'), [city]);
  const ruinDef = ruinRefId ? ruinsById[ruinRefId] : undefined;
  const runActive = Boolean(activeRun && ruinDef && activeRun.ruinId === ruinDef.id);
  const ruinProgress = ruinDef ? progressByRuinId[ruinDef.id] : undefined;
  const pityNearGuaranteed = Boolean(
    ruinProgress && ruinsPityCap > 1 && ruinProgress.bossChestRareFailures >= ruinsPityCap - 1,
  );
  const trackedBountyVisible = Boolean(trackedBountyId);
  const ambientHazeTier =
    prefersReducedMotion || effectiveQuality === 'reducedMotion'
      ? 'static'
      : effectiveQuality === 'low'
        ? 'low'
        : 'active';
  const ruinsFxScene = useMemo(() => {
    if (!fxStageSnapshot || !ruinDef) return null;
    return buildFxSceneContract({
      stageId: FX_STAGE_IDS.ruins,
      sceneKind: 'ruins',
      snapshot: fxStageSnapshot,
      requestedQuality,
      effectiveQuality,
      prefersReducedMotion,
      documentHidden: typeof document !== 'undefined' ? document.hidden : false,
    });
  }, [effectiveQuality, fxStageSnapshot, prefersReducedMotion, requestedQuality, ruinDef]);

  if (!ruinDef) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Ruins</div>
          <div className={'worldScreenPlaceholderKey'}>ruins</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>
          <div className={'worldScreenPlaceholderLine'}>Unavailable for this city.</div>
        </div>
      </div>
    );
  }

  return (
    <ScreenFxStage
      stageId={FX_STAGE_IDS.ruins}
      className={`ruinsPanelFxStage ruinsPanelFxStage--${ambientHazeTier}`}
      stageClassName="ruinsPanelFxStage__layer"
      contentClassName="ruinsPanelFxStage__content"
      stageZIndex={0}
      contentZIndex={1}
    >
      {ruinsFxScene ? (
        <FxStagePortal stageId={FX_STAGE_IDS.ruins}>
          <RuinsFxScene
            {...ruinsFxScene}
            runActive={runActive}
            pityNearGuaranteed={pityNearGuaranteed}
            trackedBountyVisible={trackedBountyVisible}
          />
        </FxStagePortal>
      ) : null}
      <RuinsScreenOwner cityId={cityId} ruinId={ruinDef.id} forceFixture={forceFixture} />
    </ScreenFxStage>
  );
}
