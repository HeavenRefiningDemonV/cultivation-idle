import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REALMS } from '../../constants';
import { getBreathModeMultipliers } from '../../content/tuning/cultivationTuning';
import { GATE_ITEMS } from '../../systems/loot';
import { useActivityStore } from '../../stores/activityStore';
import { useContentStore, getItemDef } from '../../stores/contentStore';
import { useCultivationStore } from '../../stores/cultivationStore';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useUIStore } from '../../stores/uiStore';
import type { InsightMomentState } from '../../types';
import { formatNumber, D } from '../../utils/numbers';
import { PathSelectionModal } from '../modals/PathSelectionModal';
import { PerkSelectionModal } from '../modals/PerkSelectionModal';
import { getAvailablePerks, getPerkById } from '../../data/pathPerks';
import { DaoHeartModal } from '../modals/DaoHeartModal';
import cultivator from "../../assets/onscreen/cbg_full.png";
import barLong from "../../assets/menus/bar_long.png";
import { VerseMiniBar } from '../../ui/cultivation/VerseMiniBar';
import { CultivationHeaderRibbon } from '../../ui/cultivation/CultivationHeaderRibbon';
import { DantianOrb } from '../../ui/cultivation/DantianOrb';
import './CultivateScreen.scss';

const ACTIVITY_LABELS: Record<string, string> = {
  meditate: 'Cultivating',
  outskirts: 'Adventuring',
  trial: 'Trial',
  ruins: 'Ruins',
};

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

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
    <div className={`progress-bar ${isReady ? 'progress-bar--ready' : ''}`}>
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
  const showPathSelectionModal = useUIStore((state) => state.showPathSelectionModal);
  const showPerkSelectionModal = useUIStore((state) => state.showPerkSelectionModal);
  const perkSelectionRealm = useUIStore((state) => state.perkSelectionRealm);
  const showPathSelection = useUIStore((state) => state.showPathSelection);
  const hidePathSelection = useUIStore((state) => state.hidePathSelection);
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
  const chapter = useCultivationStore((state) => state.chapter);
  const comprehension = useCultivationStore((state) => state.comprehension);
  const stability = useCultivationStore((state) => state.stability);
  const stabilityCap = useCultivationStore((state) => state.stabilityCap);
  const selectedHeartLawId = useCultivationStore((state) => state.selectedHeartLawId);
  const nextRequirement = useCultivationStore((state) => state.getComprehensionRequirementForNextChapter());

  const heartLawsById = useContentStore((state) => state.maps.heartLawsById);

  const getItemCount = useInventoryStore((state) => state.getItemCount);

  const [isBreakingThrough, setIsBreakingThrough] = useState(false);
  const [showDaoHeart, setShowDaoHeart] = useState(false);

  const lastInsightRef = useRef<InsightMomentState | null>(null);
  const manualInsightHandled = useRef(false);

  const currentRealm = REALMS[realm.index] ?? REALMS[0];
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

  const requiredGateItem = useMemo(() => {
    const willAdvanceRealm = realm.substage >= currentRealm.substages && realm.index < REALMS.length - 1;
    if (willAdvanceRealm) {
      return GATE_ITEMS[realm.index] || null;
    }
    return null;
  }, [currentRealm.substages, realm.index, realm.substage]);

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
  const rateTooltip = [
    `Base: ${formatNumber(baseRate.toNumber())} Qi/s`,
    `Breath cycle: x${breathMultipliers.qiRateMult} (${breathMode})`,
    'Heart Law bonus: x1 (future tuning)',
  ].join('\n');

  const activityLabel = activeActivity ? ACTIVITY_LABELS[activeActivity.type] ?? 'Busy' : 'Idle';
  const isCultivating = activeActivity?.type === 'meditate';
  const headerRate = effectiveRate.toString();

  const heartLawDef = selectedHeartLawId ? heartLawsById[selectedHeartLawId] ?? null : null;
  const heartLawTags = (heartLawDef?.daoTags ?? []).map((tag) => tag.toLowerCase());
  const heartLawName = heartLawDef?.name ?? 'Heart Law';
  const verseRoman = ROMAN_NUMERALS[chapter - 1] ?? String(chapter);
  const verseTitle = `Verse ${verseRoman} — ${heartLawName}\n${comprehension.toFixed(1)} / ${nextRequirement}`;

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
    if (realm.index >= 1 && !selectedPath) {
      showPathSelection();
    }
  }, [realm.index, selectedPath, showPathSelection]);

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
        />
      </div>
      <div className="cultivationHudRail">
        <div className="cultivationHudStack">
          <div className="cultivationRealmTags">
            <div className="cultivationRealmTag cultivationRealmTag--current">
              <span className="cultivationRealmTagIcon" aria-hidden="true">
                ⛰
              </span>
              <span className="cultivationRealmTagText">{realmLabel}</span>
              <span className="cultivationRealmTagSub">Stage {realm.substage}</span>
            </div>
            <div className="cultivationRealmTag cultivationRealmTag--next">
              <span className="cultivationRealmTagIcon" aria-hidden="true">
                ➜
              </span>
              <span className="cultivationRealmTagText">Next Realm: {REALMS[realm.index + 1]?.name ?? '—'}</span>
            </div>
          </div>
          {(() => {
            const debug = false;
            return (
              <div
                className={`cultBarsCluster${debug ? ' debugOutline' : ''}`}
                data-ui="bars-cluster"
              >
                <div data-ui="qi-bar">
                  <QiProgressBar
                    current={qi}
                    required={breakthroughCost || '0'}
                    pulse={isCultivating}
                    isReady={canBreakthrough}
                    rateLabel={isCultivating ? formatNumber(headerRate) : undefined}
                  />
                </div>
                <VerseMiniBar
                  chapter={chapter}
                  comprehension={comprehension}
                  requirement={nextRequirement}
                  title={verseTitle}
                />
              </div>
            );
          })()}
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
      {showPathSelectionModal && <PathSelectionModal onClose={hidePathSelection} />}
      {showPerkSelectionModal && perkSelectionRealm !== null && (
        <PerkSelectionModal onClose={hidePerkSelection} realmIndex={perkSelectionRealm} />
      )}
    </div>
  );
}
