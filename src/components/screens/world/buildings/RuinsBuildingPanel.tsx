import { useMemo } from 'react';
import { useContentStore } from '../../../../stores/contentStore.js';
import { useRuinsStore } from '../../../../stores/ruinsStore.js';
import { resolveModuleRef } from '../worldUtils.js';
import { useRunCompassSurface } from '../../../../ui/status/useRunCompassSurface.js';
import { buildRuinsActivityRewardReadModel } from '../../../../systems/economy/activityRewardReadModel.js';
import { RuinsProgress } from '../../../../features/ruins/ui/RuinsProgress.js';
import { useBountyStore } from '../../../../stores/bountyStore.js';
import { useUIStore } from '../../../../stores/uiStore.js';
import { TrackedBountyProgressLine } from '../../../../ui/world/TrackedBountyProgressLine.js';
import { RuinsSummaryCard } from '../../../../ui/world/RuinsSummaryCard.js';
import { CombatModuleTopLane } from '../../../../ui/world/combat/CombatModuleTopLane.js';
import { getWorldCombatModuleTopLaneCopy } from '../../../../ui/world/combat/combatModuleTopLaneModel.js';
import { buildRuinsSummarySurface } from '../../../../ui/world/buildRuinsSummarySurface.js';
import './CombatStyles.scss';

interface RuinsBuildingPanelProps {
  cityId: string;
}

export function RuinsBuildingPanel({ cityId }: RuinsBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const ruinsById = useContentStore((state) => state.maps.ruinsById);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const contentRaw = useContentStore((state) => state.raw);
  const activeRun = useRuinsStore((state) => state.activeRun);
  const progressByRuinId = useRuinsStore((state) => state.progressByRuinId);
  const autoRepeatDefault = useRuinsStore((state) => state.autoRepeatDefault);
  const closeWorldBuildingModal = useUIStore((state) => state.closeWorldBuildingModal);
  const trackedBounty = useBountyStore((state) => state.getTrackedBounty(cityId));
  const runCompass = useRunCompassSurface();

  const ruinRefId = useMemo(() => resolveModuleRef(city ?? null, 'ruins'), [city]);
  const ruinDef = ruinRefId ? ruinsById[ruinRefId] : undefined;
  const ruinProgress = ruinRefId ? progressByRuinId[ruinRefId] : undefined;
  const ruinsRewardModel = useMemo(
    () => buildRuinsActivityRewardReadModel(contentRaw, cityId),
    [cityId, contentRaw],
  );
  const ruinsTopLaneCopy = useMemo(
    () => getWorldCombatModuleTopLaneCopy({ moduleKey: 'ruins', content: contentRaw, cityId }),
    [cityId, contentRaw],
  );

  const trackedRuinsBounty =
    trackedBounty && (trackedBounty.kind === 'RUINS_ROOM_CLEAR' || trackedBounty.kind === 'RUINS_RUN_CLEAR')
      ? trackedBounty
      : null;
  const ruinsSummarySurface = useMemo(() => {
    const leadMaterialNames = ruinsRewardModel.leadLocalMaterials
      .map((id) => itemsById[id]?.name ?? null)
      .filter((name): name is string => Boolean(name));
    const anchorName = ruinsRewardModel.deterministicFinalAnchor
      ? itemsById[ruinsRewardModel.deterministicFinalAnchor]?.name ?? null
      : null;
    const pityCap = contentRaw.economy?.tuning?.pityDefaults?.ruinsBossChestRare?.pityCap ?? 0;
    return buildRuinsSummarySurface({
      rewardModel: ruinsRewardModel,
      ruinName: ruinDef?.name ?? null,
      leadMaterialNames,
      anchorName,
      bossChestRareFailures: ruinProgress?.bossChestRareFailures ?? 0,
      pityCap,
      autoRepeatEnabled: autoRepeatDefault,
      activeRun: activeRun ? { roomIndex: activeRun.roomIndex, roomCount: activeRun.roomCount } : null,
      trackedBountyTitle: trackedRuinsBounty?.title ?? null,
    });
  }, [
    activeRun,
    autoRepeatDefault,
    contentRaw.economy,
    itemsById,
    ruinDef?.name,
    ruinProgress?.bossChestRareFailures,
    ruinsRewardModel,
    trackedRuinsBounty?.title,
  ]);

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

  const pityFailures = ruinProgress?.bossChestRareFailures ?? 0;

  return (
    <div className="worldScreenPlaceholder ruinsPanel combatPathModule combatPathModule--ruins">
      <CombatModuleTopLane
        moduleName={ruinsTopLaneCopy.moduleName}
        roleTag={ruinsTopLaneCopy.roleTag}
        bestUsedWhen={ruinsTopLaneCopy.bestUsedWhen}
        runCompassSurface={runCompass.compact}
        variant="ruins"
        onClose={closeWorldBuildingModal}
        chipRow={(
          <>
            <span className={`combatPathModule__chip ${activeRun ? 'combatPathModule__chip--active' : ''}`}>
              {activeRun ? 'Run Active' : 'Run Idle'}
            </span>
            <span className="combatPathModule__chip combatPathModule__chip--warning">
              Pity {pityFailures}
            </span>
          </>
        )}
      />
      <div className="ruinsPanel__summary combatPathModule__contextRail">
        <RuinsSummaryCard
          ruinName={ruinsSummarySurface.ruinName}
          roleTag={ruinsSummarySurface.roleTag}
          bestUsedWhen={ruinsSummarySurface.bestUsedWhen}
          roomCountLine={ruinsSummarySurface.roomCountLine}
          leadMaterialsLine={ruinsSummarySurface.leadMaterialsLine}
          anchorLine={ruinsSummarySurface.anchorPreviewLine}
          rarePityLine={ruinsSummarySurface.rarePityPreviewLine}
          goldSecondaryLine={ruinsSummarySurface.goldSecondaryBoundaryLine ?? undefined}
          autoRepeatLine={ruinsSummarySurface.autoRepeatLine}
          runStateLine={ruinsSummarySurface.runStateLine}
          trackedBountyLine={trackedRuinsBounty ? <TrackedBountyProgressLine bounty={trackedRuinsBounty} /> : undefined}
          trackedBountyVisible={ruinsSummarySurface.trackedBountyVisible}
        />
      </div>
      <div className="combatPathModule__scene">
        <RuinsProgress ruinsId={ruinDef.id} />
      </div>
    </div>
  );
}
