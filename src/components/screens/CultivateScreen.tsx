import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REALMS } from '../../constants';
import { getBreathModeMultipliers, INSIGHT_BURSTS } from '../../content/tuning/cultivationTuning';
import { MAX_OFFLINE_MS } from '../../systems/offline';
import { GATE_ITEMS } from '../../systems/loot';
import { useActivityStore } from '../../stores/activityStore';
import { useContentStore, getItemDef } from '../../stores/contentStore';
import { useCultivationStore } from '../../stores/cultivationStore';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useUIStore } from '../../stores/uiStore';
import type { BreathMode, InsightChoiceId, InsightMomentState } from '../../types';
import { formatNumber, D } from '../../utils/numbers';
import { PathSelectionModal } from '../modals/PathSelectionModal';
import { PerkSelectionModal } from '../modals/PerkSelectionModal';
import { getAvailablePerks, getPerkById } from '../../data/pathPerks';
import { HeartLawPanel } from '../../ui/cultivation/heartLaw/HeartLawPanel';
import { StudyModeWidget } from '../../ui/cultivation/StudyModeWidget';
import { InsightMomentToast } from '../../ui/cultivation/InsightMomentToast';
import './CultivateScreen.scss';

const BREATH_COPY: Record<BreathMode, string> = {
  balanced: 'Even flow. Standard Qi and Insight.',
  safe: 'Slower Qi. More stable. Slightly more Insight.',
  fast: 'Faster Qi. Less stable. Slightly less Insight.',
};

const ACTIVITY_LABELS: Record<string, string> = {
  meditate: 'Cultivating',
  outskirts: 'Adventuring',
  trial: 'Trial',
  ruins: 'Ruins',
};

function BreathCycleDial({ value, onChange }: { value: BreathMode; onChange: (mode: BreathMode) => void }) {
  const options: { label: string; mode: BreathMode; description: string }[] = [
    { label: 'Safe', mode: 'safe', description: BREATH_COPY.safe },
    { label: 'Balanced', mode: 'balanced', description: BREATH_COPY.balanced },
    { label: 'Fast', mode: 'fast', description: BREATH_COPY.fast },
  ];

  return (
    <div className="breathDial" role="group" aria-label="Breath Cycle">
      {options.map((opt) => (
        <button
          key={opt.mode}
          type="button"
          className={`breathDialOption ${value === opt.mode ? 'breathDialOption--active' : ''}`}
          onClick={() => onChange(opt.mode)}
        >
          <div className="breathDialLabel">{opt.label}</div>
          <div className="breathDialHint">{opt.description}</div>
        </button>
      ))}
    </div>
  );
}

function CultivationTabHeaderBar({
  realmLabel,
  substage,
  qi,
  qiPerSecond,
  rateTooltip,
  activityLabel,
  stability,
  stabilityCap,
}: {
  realmLabel: string;
  substage: number;
  qi: string;
  qiPerSecond: string;
  rateTooltip: string;
  activityLabel: string;
  stability: number;
  stabilityCap: number;
}) {
  const stabilityPct = stabilityCap > 0 ? Math.min(100, (stability / stabilityCap) * 100) : 0;
  return (
    <div className="cultivationHeader">
      <div className="cultivationHeaderItem">
        <div className="cultivationHeaderLabel">Realm</div>
        <div className="cultivationHeaderValue">{realmLabel}</div>
        <div className="cultivationHeaderSub">Stage {substage}</div>
      </div>
      <div className="cultivationHeaderItem">
        <div className="cultivationHeaderLabel">Qi</div>
        <div className="cultivationHeaderValue">{formatNumber(qi)}</div>
      </div>
      <div className="cultivationHeaderItem" title={rateTooltip}>
        <div className="cultivationHeaderLabel">Cultivation Rate</div>
        <div className="cultivationHeaderValue">{formatNumber(qiPerSecond)} /s</div>
        <div className="cultivationHeaderSub">Hover for breakdown</div>
      </div>
      <div className="cultivationHeaderItem">
        <div className="cultivationHeaderLabel">Stability</div>
        <div className="cultivationHeaderValue">{Math.round(stabilityPct)}%</div>
        <div className="cultivationHeaderSub">{stability}/{stabilityCap}</div>
      </div>
      <div className="cultivationHeaderItem">
        <div className="cultivationHeaderLabel">Foreground Activity</div>
        <div className="cultivationHeaderValue">{activityLabel}</div>
      </div>
    </div>
  );
}

function QiProgressBar({ current, required, pulse }: { current: string; required: string; pulse?: boolean }) {
  const currentVal = D(current);
  const requiredVal = D(required);
  const pct = requiredVal.greaterThan(0)
    ? Math.min(100, currentVal.div(requiredVal).times(100).toNumber())
    : 0;
  return (
    <div className={`qiProgressBar ${pulse ? 'qiProgressBar--pulse' : ''}`}>
      <div className="qiProgressFill" style={{ width: `${pct}%` }} />
      <div className="qiProgressText">{pct.toFixed(1)}%</div>
    </div>
  );
}

function SectionShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <details className="cultivationSection" open>
      <summary>
        <div>
          <div className="panelTitle">{title}</div>
          {subtitle ? <div className="panelSub">{subtitle}</div> : null}
        </div>
        <span className="sectionToggleHint">Tap to collapse</span>
      </summary>
      <div className="sectionBody">{children}</div>
    </details>
  );
}

const roman = ['I', 'II', 'III', 'IV', 'V'];

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
  const setBreathMode = useCultivationStore((state) => state.setBreathMode);
  const insight = useCultivationStore((state) => state.insight);
  const chapter = useCultivationStore((state) => state.chapter);
  const comprehension = useCultivationStore((state) => state.comprehension);
  const stability = useCultivationStore((state) => state.stability);
  const stabilityCap = useCultivationStore((state) => state.stabilityCap);
  const selectedHeartLawId = useCultivationStore((state) => state.selectedHeartLawId);
  const nextRequirement = useCultivationStore((state) => state.getComprehensionRequirementForNextChapter());
  const resolveInsight = useCultivationStore((state) => state.resolveInsight);

  const heartLawsById = useContentStore((state) => state.maps.heartLawsById);

  const getItemCount = useInventoryStore((state) => state.getItemCount);

  const [now, setNow] = useState(Date.now());
  const lastInsightRef = useRef<InsightMomentState | null>(null);
  const manualInsightHandled = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

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

  const currentRealm = REALMS[realm.index] ?? REALMS[0];
  const realmLabel = currentRealm?.name ?? 'Realm';
  const nextSubstage = realm.substage + 1;
  const isLastSubstage = nextSubstage > currentRealm.substages;

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
  const blockingActivity = activeActivity && activeActivity.type !== 'meditate';

  const toggleCultivation = useCallback(() => {
    if (blockingActivity) return;
    if (isCultivating) {
      stopActivity('cultivation_stop');
    } else {
      startActivity('meditate', undefined, 'cultivation_start');
    }
  }, [blockingActivity, isCultivating, startActivity, stopActivity]);

  const handleInsightChoice = useCallback(
    (choiceId: InsightChoiceId) => {
      manualInsightHandled.current = true;
      resolveInsight(choiceId);
      let message = 'Insight resolved.';
      if (choiceId === 'contemplate') {
        message = `Insight gained: +${INSIGHT_BURSTS.comprehension} Comprehension`;
      } else if (choiceId === 'drawQi') {
        message = `Qi surged (+${INSIGHT_BURSTS.qiSecondsWorth}s worth of Qi income)`;
      } else {
        message = 'Foundation stabilized.';
      }
      addNotification('success', message, 3500);
    },
    [resolveInsight, addNotification],
  );

  const headerRate = effectiveRate.toString();
  const offlineHoursCap = Math.round(MAX_OFFLINE_MS / (1000 * 60 * 60));

  const heartLawName = selectedHeartLawId
    ? heartLawsById[selectedHeartLawId]?.name ?? selectedHeartLawId
    : 'No Heart Law selected';

  const comprehensionPct = nextRequirement > 0 ? Math.min(100, (comprehension / nextRequirement) * 100) : 100;

  const realmStageLabel = isLastSubstage ? 'Maximum stage reached' : `Stage ${realm.substage} → ${nextSubstage}`;

  const insightCard =
    insight && insight.pending ? (
      <InsightMomentToast insight={insight} now={now} onChoose={handleInsightChoice} />
    ) : null;

  const hasPerkForRealm = useCallback(
    (realmIndex: number) => pathPerks.some((perkId) => getPerkById(perkId)?.requiredRealm === realmIndex),
    [pathPerks],
  );

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
    <div className="cultivationTab">
      <CultivationTabHeaderBar
        realmLabel={realmLabel}
        substage={realm.substage}
        qi={qi}
        qiPerSecond={headerRate}
        rateTooltip={rateTooltip}
        activityLabel={activityLabel}
        stability={stability}
        stabilityCap={stabilityCap}
      />

      <div className="cultivationGrid">
        <div className="cultivationColumn cultivationColumn--left">
          <SectionShell title="Cultivate" subtitle="Control your breath and focus">
            <div className="cultivationPanel">
              <div className="panelHeader">
                <div>
                  <div className="panelTitle">Cultivate</div>
                  <div className="panelSub">Foreground activity required to gain Insight and Study</div>
                </div>
                <button
                  type="button"
                  className={`primaryButton ${isCultivating ? 'primaryButton--secondary' : ''}`}
                  onClick={toggleCultivation}
                  disabled={Boolean(blockingActivity)}
                  title={blockingActivity ? 'Stop your current activity to cultivate' : undefined}
                >
                  {isCultivating ? 'Stop Cultivating' : 'Start Cultivating'}
                </button>
              </div>
              {blockingActivity ? (
                <div className="inlineMessage inlineMessage--warning">
                  Currently {activityLabel.toLowerCase()}. Stop that activity to resume cultivation.
                </div>
              ) : null}
              <div className="breathSection">
                <div className="breathSectionLabel">Breath Cycle</div>
                <BreathCycleDial value={breathMode} onChange={setBreathMode} />
              </div>
              <div className="offlineHint">Offline progress capped at ~{offlineHoursCap}h.</div>
            </div>
          </SectionShell>

          <SectionShell title="Progress" subtitle="Qi, breakthroughs, and verses">
            <div className="cultivationPanel">
              <div className="panelHeader">
                <div>
                  <div className="panelTitle">Breakthrough Progress</div>
                  <div className="panelSub">{realmStageLabel}</div>
                </div>
                <button
                  type="button"
                  className="primaryButton"
                  onClick={() => canBreakthrough && breakthrough()}
                  disabled={!canBreakthrough}
                  title={!canBreakthrough ? 'Gather enough Qi and required items first' : undefined}
                >
                  Attempt Breakthrough
                </button>
              </div>
              <div className="progressRow">
                <div>
                  <div className="progressLabel">Qi</div>
                  <div className="progressValue">
                    {formatNumber(qi)} / {formatNumber(breakthroughCost)}
                  </div>
                </div>
                <div className={`progressStatus ${canBreakthrough ? 'progressStatus--ready' : ''}`}>
                  {canBreakthrough ? 'Ready' : 'Not ready'}
                </div>
              </div>
              <QiProgressBar current={qi} required={breakthroughCost} pulse={isCultivating} />
              {requiredGateItem ? (
                <div className="inlineMessage inlineMessage--muted">
                  {hasRequiredToken ? (
                    <span>
                      {requiredGateItemDefinition?.name || 'Gate Item'} ready ({gateItemCount}/1)
                    </span>
                  ) : (
                    <span>
                      Requires {requiredGateItemDefinition?.name || requiredGateItem} ({gateItemCount}/1)
                    </span>
                  )}
                </div>
              ) : null}
            </div>

            <div className="cultivationPanel">
              <div className="panelHeader">
                <div>
                  <div className="panelTitle">Verse Progress</div>
                  <div className="panelSub">
                    Verse {roman[chapter - 1] ?? chapter} — {heartLawName}
                  </div>
                </div>
              </div>
              <div className="progressRow">
                <div>
                  <div className="progressLabel">Comprehension</div>
                  <div className="progressValue">{comprehension.toFixed(1)} / {nextRequirement}</div>
                </div>
                <div className="progressStatus">{comprehensionPct.toFixed(1)}%</div>
              </div>
              <div className="qiProgressBar">
                <div className="qiProgressFill" style={{ width: `${Math.min(100, comprehensionPct)}%` }} />
                <div className="qiProgressText">Verse {roman[chapter - 1] ?? chapter}</div>
              </div>
            </div>
          </SectionShell>

          {insightCard ? (
            <SectionShell title="Insight" subtitle="Respond before it fades">
              {insightCard}
            </SectionShell>
          ) : (
            <SectionShell title="Insight" subtitle="Moments surface while cultivating">
              <div className="inlineMessage inlineMessage--muted">Your mind is steady. Keep cultivating for insight.</div>
            </SectionShell>
          )}
        </div>

        <div className="cultivationColumn cultivationColumn--right">
          <SectionShell title="Heart Law" subtitle="Meditation Hall">
            <HeartLawPanel />
          </SectionShell>

          <SectionShell title="Study" subtitle="Optional trickle while cultivating">
            <StudyModeWidget />
          </SectionShell>
        </div>
      </div>

      {showPathSelectionModal && <PathSelectionModal onClose={hidePathSelection} />}
      {showPerkSelectionModal && perkSelectionRealm !== null && (
        <PerkSelectionModal onClose={hidePerkSelection} realmIndex={perkSelectionRealm} />
      )}
    </div>
  );
}
