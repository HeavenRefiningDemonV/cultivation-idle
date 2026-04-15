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

  const leadMaterialsLine = useMemo(() => {
    const names = ruinsRewardModel.leadLocalMaterials
      .map((id) => itemsById[id]?.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 3);
    return `Lead materials: ${names.length > 0 ? names.join(' • ') : 'Local support materials'}`;
  }, [itemsById, ruinsRewardModel.leadLocalMaterials]);

  const anchorLine = useMemo(() => {
    if (!ruinsRewardModel.deterministicFinalAnchor) return 'Final chest anchor: deterministic support payout.';
    const name = itemsById[ruinsRewardModel.deterministicFinalAnchor]?.name;
    return `Final chest anchor: ${name ?? 'Deterministic support payout'}`;
  }, [itemsById, ruinsRewardModel.deterministicFinalAnchor]);

  const rarePityLine = useMemo(() => {
    const failures = ruinProgress?.bossChestRareFailures ?? 0;
    const summary = ruinsRewardModel.rarePitySummary;
    if (!summary) return 'Boss Chest Rare Progress: not configured.';
    const threshold = Math.max(summary.pityCap - 1, 0);
    const guaranteed = threshold > 0 && failures >= threshold;
    return `Boss Chest Rare Progress: ${failures} / ${threshold || '—'}${guaranteed ? ' • Guaranteed next rare' : ''}`;
  }, [ruinProgress?.bossChestRareFailures, ruinsRewardModel.rarePitySummary]);

  const runStateLine = activeRun
    ? `Run state: Active (Room ${activeRun.roomIndex + 1}/${activeRun.roomCount})`
    : 'Run state: Idle';
  const autoRepeatLine = `Auto-repeat: ${autoRepeatDefault ? 'On' : 'Off'}`;
  const trackedRuinsBounty =
    trackedBounty && (trackedBounty.kind === 'RUINS_ROOM_CLEAR' || trackedBounty.kind === 'RUINS_RUN_CLEAR')
      ? trackedBounty
      : null;

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
          ruinName={ruinDef.name ?? 'Ruins'}
          roleTag={ruinsRewardModel.roleTag}
          bestUsedWhen={ruinsRewardModel.bestUsedWhen}
          roomCount={ruinsRewardModel.roomCount}
          leadMaterialsLine={leadMaterialsLine}
          anchorLine={anchorLine}
          rarePityLine={rarePityLine}
          goldSecondaryLine={ruinsRewardModel.goldIsSecondary ? ruinsRewardModel.boundaryLine : undefined}
          autoRepeatLine={autoRepeatLine}
          runStateLine={runStateLine}
          trackedBountyLine={trackedRuinsBounty ? <TrackedBountyProgressLine bounty={trackedRuinsBounty} /> : undefined}
        />
      </div>
      <div className="combatPathModule__scene">
        <RuinsProgress ruinsId={ruinDef.id} />
      </div>
    </div>
  );
}
