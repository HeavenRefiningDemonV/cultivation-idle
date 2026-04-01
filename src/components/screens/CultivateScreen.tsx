import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REALMS } from '../../constants/index.js';
import {
  clampRealmIndexToSemesterSlice,
  getGateTransitionItemIdForRealmIndex,
  getNextLiveRealm,
  isAtSemesterCap,
} from '../../systems/progression/runtime/index.js';
import { getBreathModeMultipliers } from '../../content/tuning/cultivationTuning.js';
import { getBreathModeSemantics, getPathDoctrineProfile, getPathDoctrineSummary, getFocusModeSemantics } from '../../systems/doctrine/index.js';
import { adaptSpiritRootDoctrineToSemanticView } from '../../systems/doctrine/spiritRootDoctrineSemanticAdapter.js';
import { getAffinityStatus } from '../../systems/heartLaw/heartLawLogic.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useContentStore, getItemDef } from '../../stores/contentStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import type { InsightMomentState, SpiritRootElement, SpiritRootGrade } from '../../types/index.js';
import { formatNumber, D } from '../../utils/numbers.js';
import { CULTIVATION_CONSUMABLE_FAMILY_REGISTRY } from '../../systems/consumables/cultivationConsumableTypes.js';
import { buildCultivationConsumableReadModel } from '../../systems/consumables/cultivationConsumableEffects.js';
import { PerkSelectionModal } from '../modals/PerkSelectionModal.js';
import { getAvailablePerks, getPerkById } from '../../data/pathPerks.js';
import { DaoHeartModal } from '../modals/DaoHeartModal.js';
import cultivator from '../../assets/onscreen/cbg_full.png';
import barLong from '../../assets/menus/bar_long.png';
import { CultivationHeaderRibbon } from '../../ui/cultivation/CultivationHeaderRibbon.js';
import { CultivationBreakthroughPanel } from '../../ui/cultivation/CultivationBreakthroughPanel.js';
import { CultivationDoctrineSummary } from '../../ui/cultivation/CultivationDoctrineSummary.js';
import { DantianOrb } from '../../ui/cultivation/DantianOrb.js';
import { VerseMiniBar } from '../../ui/cultivation/VerseMiniBar.js';
import { GameIcon } from '../../ui/icons/index.js';
import { RunCompass } from '../../ui/status/RunCompass.js';
import { useRunCompassSurface } from '../../ui/status/useRunCompassSurface.js';
import { performRunCompassAction } from '../../systems/ui/runCompass/performRunCompassAction.js';
import { getWorldModuleLabel } from '../../ui/text/playerFacingLabels.js';
import './CultivateScreen.scss';

const ACTIVITY_LABELS: Record<string, string> = {
  meditate: 'Cultivating',
  outskirts: getWorldModuleLabel('outskirts'),
  trial: 'Gate Trial',
  ruins: getWorldModuleLabel('ruins'),
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const SPIRIT_ROOT_GRADES: Record<SpiritRootGrade, string> = {
  1: 'Mortal',
  2: 'Common',
  3: 'Uncommon',
  4: 'Rare',
  5: 'Legendary',
};
const SPIRIT_ROOT_ELEMENTS: Record<SpiritRootElement, string> = {
  fire: 'Fire',
  water: 'Water',
  earth: 'Earth',
  metal: 'Metal',
  wood: 'Wood',
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
  const focusMode = useGameStore((state) => state.focusMode);

  const activeActivity = useActivityStore((state) => state.active);
  const startActivity = useActivityStore((state) => state.startActivity);
  const stopActivity = useActivityStore((state) => state.stopActivity);
  const breathMode = useCultivationStore((state) => state.breathMode);
  const insight = useCultivationStore((state) => state.insight);
  const stability = useCultivationStore((state) => state.stability);
  const stabilityCap = useCultivationStore((state) => state.stabilityCap);
  const selectedHeartLawId = useCultivationStore((state) => state.selectedHeartLawId);
  const activeCultivationConsumables = useCultivationStore((state) => state.activeCultivationConsumables);
  const chapter = useCultivationStore((state) => state.chapter);
  const comprehension = useCultivationStore((state) => state.comprehension);
  const getComprehensionRequirementForNextChapter = useCultivationStore((state) => state.getComprehensionRequirementForNextChapter);
  const runCompass = useRunCompassSurface();

  const heartLawsById = useContentStore((state) => state.maps.heartLawsById);
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);

  const getItemCount = useInventoryStore((state) => state.getItemCount);

  const [isBreakingThrough, setIsBreakingThrough] = useState(false);
  const [showDaoHeart, setShowDaoHeart] = useState(false);
  const [buffNow, setBuffNow] = useState(() => Date.now());

  const lastInsightRef = useRef<InsightMomentState | null>(null);
  const manualInsightHandled = useRef(false);

  const liveRealmIndex = clampRealmIndexToSemesterSlice(realm.index);
  const currentRealm = REALMS[liveRealmIndex] ?? REALMS[0];
  const realmLabel = currentRealm?.name ?? 'Realm';
  const nextLiveRealm = getNextLiveRealm(liveRealmIndex);
  const atContentCap = isAtSemesterCap(liveRealmIndex);

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
    const willAdvanceRealm = realm.substage >= currentRealm.substages && !atContentCap;
    if (!willAdvanceRealm) return null;
    return getGateTransitionItemIdForRealmIndex(useContentStore.getState().raw, realm.index);
  }, [atContentCap, currentRealm.substages, realm.index, realm.substage]);

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

  const verseRequirement = getComprehensionRequirementForNextChapter();
  const verseTitle = heartLawDef
    ? verseRequirement > 0
      ? `${heartLawDef.name} • Next verse at ${verseRequirement.toFixed(1)} comprehension`
      : `${heartLawDef.name} • All verses comprehended`
    : 'Choose a Heart Law to unlock verse progress.';

  const versePlaceholderLabel = heartLawDef
    ? 'Verse Maxed'
    : 'Verse Unavailable';
  const versePlaceholderValue = heartLawDef
    ? `${heartLawDef.name} • All verses comprehended`
    : 'Choose a Heart Law in Dao to unlock scripture progress';

  const breakthroughMilestoneState = atContentCap
    ? 'content_cap'
    : realm.substage < currentRealm.substages
      ? 'cultivation_edge'
      : hasRequiredToken
        ? 'breakthrough_pending'
        : 'gate_trial';

  const breakthroughGateLine = atContentCap
    ? 'cap reached'
    : realm.substage < currentRealm.substages
      ? 'not yet at realm edge'
      : hasRequiredToken
        ? (requiredGateItem ? 'cleared' : 'bypassed')
        : 'unresolved';

  const breakthroughTokenLine = requiredGateItem
    ? hasRequiredToken
      ? 'ready'
      : 'missing'
    : 'ready';

  const breakthroughQiLine = hasEnoughQi
    ? 'ready'
    : `need ${formatNumber(Math.max(0, missingQi.toNumber()))} more`;

  const breakthroughGuidance = (() => {
    switch (breakthroughMilestoneState) {
      case 'content_cap':
        return 'This life has reached the current semester cap, so hold your gains or prepare for Prestige.';
      case 'cultivation_edge':
        return 'Keep cultivating toward the realm edge before the gate and breakthrough can matter.';
      case 'gate_trial':
        return `Your next real blocker is the Gate Trial${requiredGateItemDefinition ? ` and its ${requiredGateItemDefinition.name}` : ''}.`;
      case 'breakthrough_pending':
      default:
        return canBreakthrough
          ? 'The gate is settled and the center breakthrough action is ready now.'
          : 'The gate is settled; finish the last Qi needed and use the center breakthrough action.';
    }
  })();

  const breakthroughAction = useMemo(() => {
    const actions = runCompass.full?.bestNextActions ?? [];
    if (breakthroughMilestoneState === 'content_cap') {
      const prestigeAction = actions.find((action) => action.target?.kind === 'tab' && action.target.tab === 'prestige' && !action.blocked);
      return prestigeAction
        ? { label: 'Open Prestige', detail: prestigeAction.why, action: prestigeAction }
        : { label: 'Hold this life', detail: 'No further realm is exposed beyond the current content cap.', action: null };
    }
    if (breakthroughMilestoneState === 'gate_trial') {
      const gateAction = actions.find((action) => action.target?.kind === 'world_module' && action.target.moduleKey === 'gateTrial' && !action.blocked);
      return gateAction
        ? { label: 'Go to Gate Trial', detail: gateAction.why, action: gateAction }
        : { label: 'Resolve the current gate', detail: 'The gate is the blocker before breakthrough can happen.', action: null };
    }
    if (breakthroughMilestoneState === 'cultivation_edge') {
      return isCultivating
        ? { label: 'Continue Cultivation', detail: 'Meditation is already running; stay on the sacred center line.', action: null }
        : { label: 'Press Start Cultivation', detail: 'The center cultivation toggle is the next honest action.', action: null };
    }
    return { label: 'Use the center breakthrough action', detail: 'The main breakthrough button below remains the primary action.', action: null };
  }, [breakthroughMilestoneState, isCultivating, runCompass.full?.bestNextActions]);

  const pathProfile = getPathDoctrineProfile(selectedPath);
  const pathLabel = pathProfile?.label ?? 'No Path selected';
  const pathSummary = getPathDoctrineSummary(selectedPath);
  const spiritRootView = adaptSpiritRootDoctrineToSemanticView(spiritRoot);
  const spiritRootLine = spiritRootView
    ? `${SPIRIT_ROOT_ELEMENTS[spiritRootView.element]} • ${SPIRIT_ROOT_GRADES[spiritRootView.grade]} • ${Math.round(spiritRootView.purity)}% purity`
    : 'Dormant Spirit Root';
  const spiritRootDetail = spiritRootView
    ? `${spiritRootView.purityBand[0].toUpperCase()}${spiritRootView.purityBand.slice(1)} foundation • ${spiritRootView.powerBand[0].toUpperCase()}${spiritRootView.powerBand.slice(1)} potential`
    : 'Your Spirit Root has not manifested yet.';

  const heartLawVerseLabel = heartLawDef
    ? `Verse ${ROMAN[Math.max(0, chapter - 1)] ?? chapter} • Chapter ${chapter}`
    : 'No Heart Law selected';
  const heartLawDetail = heartLawDef
    ? `${heartLawDef.name} • ${heartLawDef.archetype ? `${heartLawDef.archetype[0].toUpperCase()}${heartLawDef.archetype.slice(1)}` : 'Unshaped'}${heartLawDef.daoTags?.length ? ` • ${heartLawDef.daoTags.slice(0, 2).map((tag) => tag[0].toUpperCase() + tag.slice(1)).join(' / ')}` : ''}`
    : 'Choose a Heart Law in Dao to unlock verse progress and doctrine resonance.';

  const resonance = getAffinityStatus(heartLawDef, spiritRoot);
  const resonanceLine = resonance.status === 'match'
    ? (resonance.percent >= 20 ? 'Strong Resonance' : 'Resonant')
    : resonance.status === 'mismatch'
      ? 'Mismatched'
      : 'Neutral';
  const resonanceDetail = resonance.status === 'none'
    ? 'No active Heart Law or Spirit Root pairing is available yet.'
    : resonance.status === 'mismatch'
      ? 'This pairing still works, but its signature affinity is not aligned.'
      : resonance.percent > 0
        ? `${resonance.percent}% signature affinity modifier from your current Spirit Root.`
        : 'Your current doctrine is aligned without a large visible affinity swing.';

  const breathSemantics = getBreathModeSemantics(breathMode);
  const focusSemantics = getFocusModeSemantics(focusMode);

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
        className="daoHeartSealButton uiNoShift"
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
          breakthroughReady={canBreakthrough}
        />
      </div>

      <div className="cultivationCommandDeck" aria-label="Cultivation command deck">
        <div className="cultivationCommandDeck__runCompass">
          <RunCompass
            surface={runCompass.full}
            tone="ink"
            density="dense"
            className="cultivationRunCompass cultivationRunCompass--native"
            onAction={performRunCompassAction}
          />
        </div>
        <div className="cultivationInfoRow">
          <CultivationBreakthroughPanel
            milestoneState={breakthroughMilestoneState}
            currentRealmLabel={realmLabel}
            nextRealmLabel={atContentCap ? null : nextLiveRealm?.name ?? null}
            stage={realm.substage}
            stageMax={currentRealm.substages}
            gateLine={breakthroughGateLine}
            tokenLine={breakthroughTokenLine}
            qiLine={breakthroughQiLine}
            guidance={breakthroughGuidance}
            action={breakthroughAction}
            onAction={performRunCompassAction}
          />
          <CultivationDoctrineSummary
            pathLabel={pathLabel}
            pathSummary={pathSummary}
            spiritRootLine={spiritRootLine}
            spiritRootDetail={spiritRootDetail}
            heartLawLine={heartLawVerseLabel}
            heartLawDetail={heartLawDetail}
            resonanceLine={resonanceLine}
            resonanceDetail={resonanceDetail}
            breathLabel={breathSemantics.label}
            breathSummary={breathSemantics.summary}
            focusLabel={focusSemantics.label}
            focusSummary={focusSemantics.summary}
            spiritRoot={spiritRoot}
          />
        </div>
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
              <span className="cultivationRealmTagText">Next Realm: {nextLiveRealm?.name ?? 'Current content cap reached'}</span>
            </div>
          </div>
          <QiProgressBar
            current={qi}
            required={breakthroughCost || '0'}
            pulse={isCultivating}
            isReady={canBreakthrough}
            rateLabel={isCultivating ? formatNumber(headerRate) : undefined}
          />
          <div className="cultivationVerseSlot">
            {heartLawDef ? (
              <VerseMiniBar
                chapter={chapter}
                comprehension={comprehension}
                requirement={verseRequirement}
                title={verseTitle}
                className="cultivationVerseSlot__bar"
                isComplete={verseRequirement <= 0}
              />
            ) : (
              <VerseMiniBar
                chapter={chapter}
                comprehension={0}
                requirement={0}
                title={verseTitle}
                className="cultivationVerseSlot__bar cultivationVerseSlot__bar--placeholder"
                placeholderLabel={versePlaceholderLabel}
                placeholderValue={versePlaceholderValue}
              />
            )}
          </div>
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
          <div className="cultivationActionStack">
            <button
              type="button"
              className="button-standard uiNoShift cultivationActionButton cultivationActionButton--primary"
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
              className="button-standard uiNoShift cultivationActionButton cultivationActionButton--secondary"
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
