import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useCombatStore } from '../../../stores/combatStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { getTrialGateRewardBundle, getTrialLifecycleSnapshot } from '../../../systems/progression/runtime/index.js';
import { useTrialStore } from '../../../stores/trialStore.js';
import { computeEffectiveHp, computeRollingDps, safeDurationSeconds } from '../../../systems/combat/theaterModel.js';
import { hpPercent } from '../../../systems/combat/minibarModel.js';
import { formatNumber } from '../../../utils/numbers.js';
import { GameIcon } from '../../../ui/icons/index.js';
import './TrialProgress.scss';
import { GATE_SUPPORT_LABELS } from '../../../ui/text/playerFacingLabels.js';
import { buildGateTrialAttemptPresentation, buildGateTrialReadinessSurface } from '../../../systems/readiness/section5Adapters.js';
import { GateTrialReadinessCard } from '../../../ui/trials/GateTrialReadinessCard.js';
import { GateTrialChecklist } from '../../../ui/trials/GateTrialChecklist.js';

function TrialProgressContent({ trialId }: { trialId: string }) {
  const {
    events,
    currentEnemy,
    enemyHP,
    enemyMaxHP,
    combatShield,
    startCombat,
    setAutoAttack,
    setAutoCombatAI,
    exitCombat,
    combatContext,
  } = useCombatStore(
    useShallow((state) => ({
      events: state.events,
      currentEnemy: state.currentEnemy,
      enemyHP: state.enemyHP,
      enemyMaxHP: state.enemyMaxHP,
      combatShield: state.combatShield,
      startCombat: state.startCombat,
      setAutoAttack: state.setAutoAttack,
      setAutoCombatAI: state.setAutoCombatAI,
      exitCombat: state.exitCombat,
      combatContext: state.combatContext,
    })),
  );

  const { trialsById, itemsById, enemiesById } = useContentStore(
    useShallow((state) => ({
      trialsById: state.maps.trialsById,
      itemsById: state.maps.itemsById,
      enemiesById: state.maps.enemiesById,
    })),
  );

  const startActivity = useActivityStore((state) => state.startActivity);
  const stopActivity = useActivityStore((state) => state.stopActivity);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const progress = useTrialStore((state) => state.progressByTrialId[trialId]);
  const playerRealm = useGameStore((state) => state.realm.index);
  const playerStats = useGameStore((state) => state.stats);
  const absorptionShield = useGameStore((state) => state.absorptionShield);
  const getItemCount = useInventoryStore((state) => state.getItemCount);
  const trialDef = trialsById[trialId];
  const bossTemplate = trialDef ? enemiesById[trialDef.bossId] : undefined;
  const lastSummary = progress?.lastAttemptSummary ?? null;

  const requiredItemId = trialDef?.requiredItemId;
  const requiredItemName = requiredItemId ? itemsById[requiredItemId]?.name ?? requiredItemId : 'No required item';
  const requiredItemOwned = requiredItemId ? getItemCount(requiredItemId) > 0 : true;
  const lifecycle = getTrialLifecycleSnapshot({
    content: useContentStore.getState().raw,
    trial: trialDef,
    progress: progress ?? null,
    realm: useGameStore.getState().realm,
    qi: useGameStore.getState().qi,
    breakthroughRequirement: useGameStore.getState().getBreakthroughRequirement(),
    requiredItemSatisfied: requiredItemOwned,
  });
  const gateItemName = lifecycle.gateItemId ? itemsById[lifecycle.gateItemId]?.name ?? lifecycle.gateItemId : 'No gate reward';

  const realmRequirement = trialDef?.minRealm ?? trialDef?.realmRequirement ?? null;
  const realmMet = realmRequirement == null ? true : playerRealm >= realmRequirement;
  const gateReadinessSurface = useMemo(
    () => buildGateTrialReadinessSurface(trialId),
    [trialId, lifecycle.state, lifecycle.reasonCode, lifecycle.failSafe.eligibleFailures, playerRealm, requiredItemOwned],
  );
  const attemptPresentation = gateReadinessSurface ? buildGateTrialAttemptPresentation(gateReadinessSurface) : null;

  const rollingDps = useMemo(() => computeRollingDps(events, Date.now()), [events]);
  const now = Date.now();
  const bossHpPct = hpPercent(enemyHP, enemyMaxHP);
  const attemptDurationMs = progress?.attemptStartAt ? now - progress.attemptStartAt : null;
  const attemptsThisSession = progress?.sessionAttempts ?? 0;
  const attemptCap = lifecycle.failSafe.threshold;

  const gateStateLabel = lifecycle.state === 'bypassed' ? 'Bypassed' : lifecycle.state.charAt(0).toUpperCase() + lifecycle.state.slice(1);

  const handleStart = () => {
    if (!trialDef) return;
    if (attemptPresentation?.state === 'break_through') {
      setActiveTab('cultivation');
      return;
    }
    if (!lifecycle.canStart) return;
    startActivity('trial', { cityId: trialDef.cityId, sourceId: trialDef.id });
    setAutoAttack(true);
    setAutoCombatAI(true);
    startCombat(trialDef.bossId, {
      type: 'trial',
      cityId: trialDef.cityId,
      trialId: trialDef.id,
      countsTowardFailSafe: lifecycle.countsTowardFailSafeOnStart,
      rewardBundle: getTrialGateRewardBundle(useContentStore.getState().raw, trialDef),
    });
  };

  const handleStop = () => {
    stopActivity('trial-progress-stop');
    if (combatContext?.type === 'trial') {
      exitCombat();
    }
  };

  const summaryDurationText = lastSummary
    ? `${lastSummary.durationSec.toFixed(1)}s`
    : safeDurationSeconds(attemptDurationMs ?? 0);

  const summaryBossHp = lastSummary ? `${lastSummary.bossHpPct.toFixed(1)}%` : `${bossHpPct.toFixed(1)}%`;
  const maxHitLine = lastSummary
    ? `${formatNumber(lastSummary.maxHit)} — ${lastSummary.maxHitLabel}`
    : 'Awaiting attempt data';

  const suggestions = lastSummary?.suggestions ?? [
    'Stay mobile and weave defensive casts.',
    'Upgrade offense to shorten the fight window.',
  ];

  return (
    <div className="trial-progress">
      <div className="trial-progress__header">
        <div>
          <div className="trial-progress__title">{trialDef?.name ?? 'Gate Trial'}</div>
          <div className="trial-progress__subtitle">{currentEnemy?.name ?? bossTemplate?.name ?? 'Boss ready'}</div>
        </div>
        <div className="trial-progress__attempts">Attempts: {attemptsThisSession} / {attemptCap}</div>
      </div>

      <div className="trial-progress__requirements">
        <div className="trial-progress__requirement-row">
          <span className="trial-progress__badge">Realm</span>
          <span className={realmMet ? 'trial-progress__status trial-progress__status--ok' : 'trial-progress__status trial-progress__status--warn'}>
            <GameIcon icon={realmMet ? 'inkCheck' : 'inkX'} size={14} decorative />
            <span>
              {realmMet ? 'Met' : 'Unmet'} — {realmRequirement != null ? `Req: Realm ${realmRequirement + 1}` : 'No listed realm gate'}
            </span>
          </span>
        </div>
        <div className="trial-progress__requirement-row">
          <span className="trial-progress__badge">Gate Reward</span>
          <span className={'trial-progress__status trial-progress__status--ok'}>
            <GameIcon icon={'inkCheck'} size={14} decorative />
            <span>Breakthrough proof — {gateItemName}</span>
          </span>
        </div>
        <div className="trial-progress__requirement-row">
          <span className="trial-progress__badge">Gate State</span>
          <span className={'trial-progress__status trial-progress__status--ok'}>
            <GameIcon icon={'inkCheck'} size={14} decorative />
            <span>{gateStateLabel}</span>
          </span>
        </div>
        {requiredItemId ? (
          <div className="trial-progress__requirement-row">
            <span className="trial-progress__badge">Required Item</span>
            <span className={requiredItemOwned ? 'trial-progress__status trial-progress__status--ok' : 'trial-progress__status trial-progress__status--warn'}>
              <GameIcon icon={requiredItemOwned ? 'inkCheck' : 'inkX'} size={14} decorative />
              <span>{requiredItemOwned ? 'Owned' : 'Missing'} — {requiredItemName}</span>
            </span>
          </div>
        ) : null}
      </div>

      <div className="trial-progress__controls">
        <button className="button-standard" onClick={handleStart} disabled={attemptPresentation?.primaryDisabled ?? !lifecycle.canStart}>
          {attemptPresentation?.primaryLabel ?? 'Attempt Gate'}
        </button>
        <button className="button-standard" onClick={handleStop}>
          Stop
        </button>
        {attemptPresentation ? (
          <div className="trial-progress__controls-note">{attemptPresentation.detail}</div>
        ) : null}
      </div>

      <div className="trial-progress__controls-note">
        {GATE_SUPPORT_LABELS.support}: {lifecycle.failSafe.status === 'resolved' ? 'Resolved' : lifecycle.failSafe.canPurchase ? 'Available' : `Locked (${lifecycle.failSafe.eligibleFailures}/${lifecycle.failSafe.threshold} Eligible Defeats)`}
      </div>

      {gateReadinessSurface ? (
        <div className="trial-progress__metrics">
          <GateTrialReadinessCard surface={gateReadinessSurface} />
          <GateTrialChecklist title="Minimum Floor" lines={gateReadinessSurface.minimumChecklist} />
          <GateTrialChecklist title="Recommended Floor" lines={gateReadinessSurface.recommendedChecklist} />
        </div>
      ) : null}

      <div className="trial-progress__intel">
        <div className="trial-progress__intel-item">
          <div className="trial-progress__intel-label">Boss HP remaining</div>
          <div className="trial-progress__intel-value">{summaryBossHp}</div>
        </div>
        <div className="trial-progress__intel-item">
          <div className="trial-progress__intel-label">Time survived</div>
          <div className="trial-progress__intel-value">{summaryDurationText}</div>
        </div>
        <div className="trial-progress__intel-item">
          <div className="trial-progress__intel-label">Biggest hit taken</div>
          <div className="trial-progress__intel-value">{maxHitLine}</div>
        </div>
        <div className="trial-progress__intel-item">
          <div className="trial-progress__intel-label">Recent DPS window</div>
          <div className="trial-progress__intel-value">
            <span className="trial-progress__dps">You: {rollingDps.playerDps.toFixed(1)} /s</span>
            <span className="trial-progress__dps">Boss: {rollingDps.enemyDps.toFixed(1)} /s</span>
          </div>
        </div>
      </div>

      <div className="trial-progress__summary-card">
        <div className="trial-progress__summary-title">Defeat summary</div>
        <ul className="trial-progress__suggestions">
          {suggestions.slice(0, 3).map((line, idx) => (
            <li key={`${line}-${idx}`}>{line}</li>
          ))}
        </ul>
        <div className="trial-progress__ehp">
          Effective HP (with shields):
          {` ${formatNumber(computeEffectiveHp(playerStats.maxHp, absorptionShield, combatShield?.amount ?? 0))}`}
        </div>
      </div>
    </div>
  );
}

export function TrialProgress({ trialId }: { trialId?: string }) {
  const activity = useActivityStore((state) => state.active);
  const combatContext = useCombatStore((state) => state.combatContext);

  const activityType = activity?.type;
  const activitySourceId = activity?.sourceId;
  const activityPayloadSourceId = activity?.payload?.sourceId;

  const effectiveTrialId = useMemo(() => {
    if (trialId) return trialId;
    if (activityType === 'trial') {
      return activitySourceId ?? activityPayloadSourceId ?? null;
    }
    if (combatContext?.type === 'trial') {
      return combatContext.trialId;
    }
    return null;
  }, [activityPayloadSourceId, activitySourceId, activityType, combatContext, trialId]);

  if (!effectiveTrialId) {
    return <div className="combat-theater__progress-placeholder">No trial selected.</div>;
  }

  return <TrialProgressContent trialId={effectiveTrialId} />;
}
