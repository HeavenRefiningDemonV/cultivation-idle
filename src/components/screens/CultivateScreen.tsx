import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REALMS } from '../../constants/index.js';
import {
  clampRealmIndexToSemesterSlice,
  getGateTransitionItemIdForRealmIndex,
  getNextLiveRealm,
  isAtSemesterCap,
} from '../../systems/progression/runtime/index.js';
import { getBreathModeMultipliers } from '../../content/tuning/cultivationTuning.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useContentStore, getItemDef } from '../../stores/contentStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import type { InsightMomentState } from '../../types/index.js';
import { formatNumber, D } from '../../utils/numbers.js';
import { CULTIVATION_CONSUMABLE_FAMILY_REGISTRY } from '../../systems/consumables/cultivationConsumableTypes.js';
import { buildCultivationConsumableReadModel } from '../../systems/consumables/cultivationConsumableEffects.js';
import { PerkSelectionModal } from '../modals/PerkSelectionModal.js';
import { getAvailablePerks, getPerkById } from '../../data/pathPerks.js';
import { DaoHeartModal } from '../modals/DaoHeartModal.js';
import cultivator from "../../assets/onscreen/cbg_full.png";
import barLong from "../../assets/menus/bar_long.png";
import { CultivationHeaderRibbon } from '../../ui/cultivation/CultivationHeaderRibbon.js';
import { DantianOrb } from '../../ui/cultivation/DantianOrb.js';
import { GameIcon } from '../../ui/icons/index.js';
import { RunCompass } from '../../ui/status/RunCompass.js';
import { useRunCompassSurface } from '../../ui/status/useRunCompassSurface.js';
import { performRunCompassAction } from '../../systems/ui/runCompass/performRunCompassAction.js';
import './CultivateScreen.scss';

const ACTIVITY_LABELS: Record<string, string> = {
  meditate: 'Cultivating',
  outskirts: 'Adventuring',
  trial: 'Trial',
  ruins: 'Ruins',
};

export function QiProgressBar({
  current,
  required,
  pulse,
  isReady,
  rateLabel,
}: {
  current: string;
  required: string;
  pulse?: boolean;
  isReady?: boolean;
  rateLabel?: string;
}) {
  const currentVal = D(current);
  const requiredVal = D(required);
  const pct = requiredVal.greaterThan(0)
    ? Math.min(100, currentVal.div(requiredVal).times(100).toNumber())
    : 0;
  return (
    <div className={`progress-bar ${isReady ? 'progress-bar--ready' : ''}`} data-ui="qi-bar">
      <img className="progress-bar-shape" src={barLong} alt="" aria-hidden="true" />
      <div className={`qiProgressBar ${pulse ? 'qiProgressBar--pulse' : ''}`}>
        <div className="qiProgressFill" style={{ width: `${pct}%` }} />
        <div className="qiProgressLabel">
          Qi: {formatNumber(current)} / {formatNumber(required)}
        </div>
        {rateLabel ? <div className="qiProgressRate">+{rateLabel}/s</div> : null}
      </div>
      {isReady ? <div className="qiProgressReady">Ready</div> : null}
    </div>

  );
}

export function CultivateScreen() {
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const showPerkSelectionModal = useUIStore((state) => state.showPerkSelectionModal);
  const perkSelectionRealm = useUIStore((state) => state.perkSelectionRealm);
  const showPerkSelection = useUIStore((state) => state.showPerkSelection);
  const hidePerkSelection = useUIStore((state) => state.hidePerkSelection);
  const addNotification = useUIStore((state) => state.addNotification);

  const realm = useGameStore((state) => state.realm);
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const breakthroughCost = useGameStore((state) => state.getBreakthroughRequirement());
  const breakthrough = useGameStore((state) => state.breakthrough);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const pathPerks = useGameStore((state) => state.pathPerks);

  const activeActivity = useActivityStore((state) => state.active);
  const startActivity = useActivityStore((state) => state.startActivity);
  const stopActivity = useActivityStore((state) => state.stopActivity);
  const breathMode = useCultivationStore((state) => state.breathMode);
  const insight = useCultivationStore((state) => state.insight);
  const stability = useCultivationStore((state) => state.stability);
  const stabilityCap = useCultivationStore((state) => state.stabilityCap);
  const selectedHeartLawId = useCultivationStore((state) => state.selectedHeartLawId);
  const activeCultivationConsumables = useCultivationStore((state) => state.activeCultivationConsumables);
  const runCompass = useRunCompassSurface();

  const heartLawsById = useContentStore((state) => state.maps.heartLawsById);

  const getItemCount = useInventoryStore((state) => state.getItemCount);

  const [isBreakingThrough, setIsBreakingThrough] = useState(false);
  const [showDaoHeart, setShowDaoHeart] = useState(false);
  const [buffNow, setBuffNow] = useState(() => Date.now());

  const lastInsightRef = useRef<InsightMomentState | null>(null);
  const manualInsightHandled = useRef(false);

  const liveRealmIndex = clampRealmIndexToSemesterSlice(realm.index);
  const currentRealm = REALMS[liveRealmIndex] ?? REALMS[0];
  const realmLabel = currentRealm?.name ?? 'Realm';
  useEffect(() => {
    setHeaderTitles('Cultivation', 'Guide your qi flow and heart law.');
  }, [setHeaderTitles]);

  useEffect(() => {
    const previous = lastInsightRef.current;
    if (insight && (!previous || previous.startedAt !== insight.startedAt)) {
      manualInsightHandled.current = false;
    }
    if (previous && !insight) {
      if (!manualInsightHandled.current) {
        addNotification('info', 'Insight Moment passed. (Auto)', 2500);
      }
      manualInsightHandled.current = false;
    }
    lastInsightRef.current = insight;
  }, [insight, addNotification]);

  useEffect(() => {
    if (activeCultivationConsumables.length === 0) return;

    setBuffNow(Date.now());
    const intervalId = window.setInterval(() => {
      setBuffNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeCultivationConsumables.length]);

  const requiredGateItem = useMemo(() => {
    const willAdvanceRealm = realm.substage >= currentRealm.substages && !isAtSemesterCap(liveRealmIndex);
    if (!willAdvanceRealm) return null;
    return getGateTransitionItemIdForRealmIndex(useContentStore.getState().raw, realm.index);
  }, [currentRealm.substages, liveRealmIndex, realm.index, realm.substage]);

  const gateItemCount = useMemo(() => {
    if (!requiredGateItem) return 0;
    return getItemCount(requiredGateItem);
  }, [getItemCount, requiredGateItem]);

  const requiredGateItemDefinition = useMemo(() => {
    if (!requiredGateItem) return null;
    return getItemDef(requiredGateItem) || null;
  }, [requiredGateItem]);

  const hasRequiredToken = useMemo(() => {
    if (!requiredGateItem) return true;
    return gateItemCount > 0;
  }, [gateItemCount, requiredGateItem]);

  const hasEnoughQi = useMemo(() => {
    const current = D(qi);
    const needed = D(breakthroughCost || '0');
    return current.greaterThanOrEqualTo(needed);
  }, [breakthroughCost, qi]);

  const canBreakthrough = hasEnoughQi && hasRequiredToken;

  const breathMultipliers = getBreathModeMultipliers(breathMode);
  const baseRate = D(qiPerSecond || '0');
  const effectiveRate = baseRate.times(breathMultipliers.qiRateMult);

  const activityLabel = activeActivity ? ACTIVITY_LABELS[activeActivity.type] ?? 'Busy' : 'Idle';
  const isCultivating = activeActivity?.type === 'meditate';
  const headerRate = effectiveRate.toString();

  const heartLawDef = selectedHeartLawId ? heartLawsById[selectedHeartLawId] ?? null : null;
  const heartLawTags = (heartLawDef?.daoTags ?? []).map((tag) => tag.toLowerCase());

  const cultivationBuffReadModel = useMemo(
    () => buildCultivationConsumableReadModel(activeCultivationConsumables, buffNow),
    [activeCultivationConsumables, buffNow],
  );

  const activeCultivationBuffs = useMemo(() => cultivationBuffReadModel.entries.map((entry) => ({
    ...entry,
    familyMeta: CULTIVATION_CONSUMABLE_FAMILY_REGISTRY[entry.family],
    remainingSeconds: Math.max(1, Math.ceil(entry.remainingMs / 1000)),
  })), [cultivationBuffReadModel.entries]);

  const activeBuffSummary = useMemo(() => (
    activeCultivationBuffs.length === 0
      ? 'No active cultivation tonics.'
      : activeCultivationBuffs
          .map((entry) => `${entry.familyMeta.shortLabel}: ${entry.shortLabel} (${entry.remainingSeconds}s)`)
          .join(' • ')
  ), [activeCultivationBuffs]);

  const rateTooltip = useMemo(() => [
    `Base: ${formatNumber(baseRate.toNumber())} Qi/s`,
    `Breath cycle: x${breathMultipliers.qiRateMult} (${breathMode})`,
    `Cultivation buffs: ${activeBuffSummary}`,
  ].join('\n'), [activeBuffSummary, baseRate, breathMode, breathMultipliers.qiRateMult]);

  const hasPerkForRealm = useCallback(
    (realmIndex: number) => pathPerks.some((perkId) => getPerkById(perkId)?.requiredRealm === realmIndex),
    [pathPerks],
  );

  const [breakthroughLabel, setBreakthroughLabel] = useState<'idle' | 'gathering' | 'success'>('idle');
  const breakthroughTimeoutsRef = useRef<number[]>([]);

  const handleBreakthroughClick = useCallback(() => {
    if (!canBreakthrough || isBreakingThrough) return;

    setIsBreakingThrough(true);
    setBreakthroughLabel('gathering');
    const startTimeout = window.setTimeout(() => {
      breakthrough();

      setBreakthroughLabel('success');
      const finishTimeout = window.setTimeout(() => {
        setIsBreakingThrough(false);
        setBreakthroughLabel('idle');
      }, 600);
      breakthroughTimeoutsRef.current.push(finishTimeout);
    }, 2000);
    breakthroughTimeoutsRef.current.push(startTimeout);

  }, [canBreakthrough, isBreakingThrough, breakthrough]);

  const handleCultivationToggle = useCallback(() => {
    if (isCultivating) {
      stopActivity('cultivation-button-stop');
      return;
    }

    startActivity('meditate', undefined, 'cultivation-button-start');
  }, [isCultivating, startActivity, stopActivity]);

  useEffect(() => {
    return () => {
      breakthroughTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      breakthroughTimeoutsRef.current = [];
    };
  }, []);

  const requiredQi = D(breakthroughCost || '0');
  const currentQi = D(qi);
  const missingQi = requiredQi.minus(currentQi);
  const qiRatio = requiredQi.greaterThan(0)
    ? currentQi.div(requiredQi).toNumber()
    : 0;
  const isNearReady = qiRatio >= 0.9 && !canBreakthrough;

  const breakthroughRequirementLabel = (() => {
    if (!hasEnoughQi) {
      return `Need ${formatNumber(Math.max(0, missingQi.toNumber()))} Qi`;
    }
    if (requiredGateItem && !hasRequiredToken) {
      return `Requires ${requiredGateItemDefinition?.name || requiredGateItem} (${gateItemCount}/1)`;
    }
    return 'Ready';
  })();

  const breakthroughButtonLabel =
    breakthroughLabel === 'gathering'
      ? 'Gathering Qi...'
      : breakthroughLabel === 'success'
        ? 'Breakthrough!'
        : 'Attempt Breakthrough';

  useEffect(() => {
    if (!selectedPath || realm.index < 1) return;
    const hasRealmPerk = hasPerkForRealm(realm.index);
    const availablePerks = getAvailablePerks(selectedPath, realm.index);
    const perkModalAlreadyOpen = showPerkSelectionModal && perkSelectionRealm === realm.index;
    if (availablePerks.length > 0 && !hasRealmPerk && !perkModalAlreadyOpen) {
      showPerkSelection(realm.index);
    }
  }, [
    realm.index,
    selectedPath,
    hasPerkForRealm,
    showPerkSelection,
    showPerkSelectionModal,
    perkSelectionRealm,
  ]);

  return (
    <div className="cultivationScreenRoot">
      <div className={`breakthrough-effects ${isBreakingThrough ? 'animate' : ''}`}></div>
      <div className="cultivationSceneLayer" aria-hidden="true">
        <img className="cultivationCultivatorArt" src={cultivator} alt="" />
        <DantianOrb
          heartLawTags={heartLawTags}
          isCultivating={isCultivating}
          isNearReady={isNearReady}
          isReady={canBreakthrough}
        />
      </div>
      <button
        type="button"
        className="daoHeartSealButton"
        aria-label="Open Dao Heart"
        aria-haspopup="dialog"
        aria-expanded={showDaoHeart}
        onClick={() => setShowDaoHeart(true)}
      >
        Dao
      </button>
      <div className="cultivationHeaderRail">
        <div className="cultivationRunCompassDock">
          <RunCompass
            surface={runCompass.full}
            tone="ink"
            className="cultivationRunCompass"
            onAction={performRunCompassAction}
          />
        </div>
        <CultivationHeaderRibbon
          realmLabel={realmLabel}
          substage={realm.substage}
          realmIndex={realm.index}
          qi={qi}
          qiPerSecond={headerRate}
          rateTooltip={rateTooltip}
          activityLabel={activityLabel}
          activityType={activeActivity?.type ?? null}
          stability={stability}
          stabilityCap={stabilityCap}
          breakthroughReady={canBreakthrough}
        />
      </div>
      <div className="cultivationHudRail">
        <div className="cultivationHudStack">
          <div className="cultivationRealmTags">
            <div className="cultivationRealmTag cultivationRealmTag--current">
              <span className="cultivationRealmTagIcon" aria-hidden="true">
                <GameIcon icon="bookEarth" size={16} decorative />
              </span>
              <span className="cultivationRealmTagText">{realmLabel}</span>
              <span className="cultivationRealmTagSub">Stage {realm.substage}</span>
            </div>
            <div className="cultivationRealmTag cultivationRealmTag--next">
              <span className="cultivationRealmTagIcon" aria-hidden="true">
                →
              </span>
              <span className="cultivationRealmTagText">Next Realm: {getNextLiveRealm(liveRealmIndex)?.name ?? 'Current content cap reached'}</span>
            </div>
          </div>
          <QiProgressBar
            current={qi}
            required={breakthroughCost || '0'}
            pulse={isCultivating}
            isReady={canBreakthrough}
            rateLabel={isCultivating ? formatNumber(headerRate) : undefined}
          />
          <div className="cultivationBuffSummary" aria-live="polite">
            <div className="cultivationBuffSummaryTitle">Cultivation buffs</div>
            {activeCultivationBuffs.length === 0 ? (
              <div className="cultivationBuffSummaryEmpty">No active tonics. Families overwrite weaker effects in the same lane.</div>
            ) : (
              <div className="cultivationBuffSummaryChips">
                {activeCultivationBuffs.map((entry) => (
                  <div key={entry.family} className="cultivationBuffChip" title={entry.description}>
                    <span className="cultivationBuffChipFamily">{entry.familyMeta.label}</span>
                    <span className="cultivationBuffChipBody">{entry.shortLabel}</span>
                    <span className="cultivationBuffChipTimer">{entry.remainingSeconds}s</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* VerseMiniBar hidden per request. */}
          <div className="cultivationActionStack">
            <button
              type="button"
              className="button-standard cultivationActionButton cultivationActionButton--primary"
              onClick={handleBreakthroughClick}
              disabled={!canBreakthrough || isBreakingThrough}
              title={!canBreakthrough ? 'Gather enough Qi and required items first' : undefined}
            >
              {breakthroughButtonLabel}
            </button>
            {!canBreakthrough ? (
              <div className="cultivationBreakthroughHint">{breakthroughRequirementLabel}</div>
            ) : null}
            <button
              type="button"
              className="button-standard cultivationActionButton cultivationActionButton--secondary"
              onClick={handleCultivationToggle}
            >
              {isCultivating ? 'Stop Cultivation' : 'Start Cultivation'}
            </button>
          </div>
        </div>
      </div>

      {showDaoHeart && <DaoHeartModal onClose={() => setShowDaoHeart(false)} />}
      {showPerkSelectionModal && perkSelectionRealm !== null && (
        <PerkSelectionModal onClose={hidePerkSelection} realmIndex={perkSelectionRealm} />
      )}
    </div>
  );
}
