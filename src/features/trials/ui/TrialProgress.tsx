import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useActivityStore } from '../../../stores/activityStore';
import { useCombatStore } from '../../../stores/combatStore';
import { useContentStore } from '../../../stores/contentStore';
import { useGameStore } from '../../../stores/gameStore';
import { useInventoryStore } from '../../../stores/inventoryStore';
import { useTrialStore } from '../../../stores/trialStore';
import { useCityStore } from '../../../stores/cityStore';
import { computeEffectiveHp, computeRollingDps, safeDurationSeconds } from '../../../systems/combat/theaterModel';
import { hpPercent } from '../../../systems/combat/minibarModel';
import { formatNumber, D } from '../../../utils/numbers';
import './TrialProgress.scss';

const TRIAL_RECOMMENDATIONS: Record<string, { minRealm?: number; suggestedDps?: number; suggestedHp?: number }> = {
  trial_novices_clearing: { minRealm: 0, suggestedDps: 38, suggestedHp: 500 },
  trial_stone_core_sanctum: { minRealm: 1, suggestedDps: 200, suggestedHp: 3000 },
  trial_patriarchs_seal: { minRealm: 2, suggestedDps: 800, suggestedHp: 10000 },
};

function clamp01(value: number | null | undefined): number {
  if (!Number.isFinite(value ?? NaN)) return 0;
  const n = Number(value);
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

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
  const progress = useTrialStore((state) => state.progressByTrialId[trialId]);
  const playerRealm = useGameStore((state) => state.realm.index);
  const playerStats = useGameStore((state) => state.stats);
  const absorptionShield = useGameStore((state) => state.absorptionShield);
  const getItemCount = useInventoryStore((state) => state.getItemCount);
  const cityFlagsById = useCityStore((state) => state.cityFlagsById);

  const trialDef = trialsById[trialId];
  const bossTemplate = trialDef ? enemiesById[trialDef.bossId] : undefined;
  const lastSummary = progress?.lastAttemptSummary ?? null;
  const cityFlags = trialDef?.cityId ? cityFlagsById[trialDef.cityId] : undefined;

  const recommendation = TRIAL_RECOMMENDATIONS[trialId] ?? {};
  const gateItemId = trialDef?.gateItemId;
  const gateItemName = gateItemId ? itemsById[gateItemId]?.name ?? gateItemId : 'No gate item';
  const gateItemOwned = gateItemId ? getItemCount(gateItemId) > 0 : true;
  const requiredItemId = trialDef?.requiredItemId;
  const requiredItemName = requiredItemId ? itemsById[requiredItemId]?.name ?? requiredItemId : 'No required item';
  const requiredItemOwned = requiredItemId ? getItemCount(requiredItemId) > 0 : true;

  const realmRequirement =
    trialDef?.minRealm ?? trialDef?.realmRequirement ?? (typeof recommendation.minRealm === 'number' ? recommendation.minRealm : null);
  const realmMet = realmRequirement == null ? true : playerRealm >= realmRequirement;

  const recommendedDps =
    trialDef?.suggestedDPS ??
    trialDef?.suggestedDps ??
    (typeof recommendation.suggestedDps === 'number' ? recommendation.suggestedDps : null);
  const recommendedHp =
    trialDef?.suggestedHP ??
    trialDef?.suggestedHp ??
    (typeof recommendation.suggestedHp === 'number' ? recommendation.suggestedHp : null);

  const playerOffense = D(playerStats.atk ?? 0).toNumber();
  const playerMaxHp = D(playerStats.maxHp ?? 0).toNumber();
  const offensePct = recommendedDps ? clamp01(playerOffense / recommendedDps) : null;
  const hpPct = recommendedHp ? clamp01(playerMaxHp / recommendedHp) : null;

  const rollingDps = useMemo(() => computeRollingDps(events, Date.now()), [events]);
  const now = Date.now();
  const bossHpPct = hpPercent(enemyHP, enemyMaxHP);
  const attemptDurationMs = progress?.attemptStartAt ? now - progress.attemptStartAt : null;
  const attemptsThisSession = progress?.sessionAttempts ?? 0;
  const attemptCap = trialDef?.failSafe?.thresholdAttempts ?? 3;

  const cleared = Boolean(progress?.cleared || cityFlags?.gateTrialCleared);
  const eligible = Boolean(realmMet && gateItemOwned && requiredItemOwned && !cleared);

  const ineligibleReason = cleared
    ? 'Already cleared'
    : !realmMet
      ? 'Realm too low'
      : !gateItemOwned
        ? 'Missing gate item'
        : !requiredItemOwned
          ? 'Missing required item'
          : null;

  const handleStart = () => {
    if (!trialDef || !eligible) return;
    startActivity('trial', { cityId: trialDef.cityId, sourceId: trialDef.id });
    setAutoAttack(true);
    setAutoCombatAI(true);
    startCombat(trialDef.bossId, {
      type: 'trial',
      cityId: trialDef.cityId,
      trialId: trialDef.id,
      gateItemId: trialDef.gateItemId,
      eligible,
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
            {realmMet ? '✅ Met' : '❌ Unmet'} — {realmRequirement != null ? `Req: Realm ${realmRequirement + 1}` : 'No listed realm gate'}
          </span>
        </div>
        <div className="trial-progress__requirement-row">
          <span className="trial-progress__badge">Gate Item</span>
          <span className={gateItemOwned ? 'trial-progress__status trial-progress__status--ok' : 'trial-progress__status trial-progress__status--warn'}>
            {gateItemOwned ? '✅ Owned' : '❌ Missing'} — {gateItemName}
          </span>
        </div>
        {requiredItemId ? (
          <div className="trial-progress__requirement-row">
            <span className="trial-progress__badge">Required Item</span>
            <span className={requiredItemOwned ? 'trial-progress__status trial-progress__status--ok' : 'trial-progress__status trial-progress__status--warn'}>
              {requiredItemOwned ? '✅ Owned' : '❌ Missing'} — {requiredItemName}
            </span>
          </div>
        ) : null}
      </div>

      <div className="trial-progress__controls">
        <button className="button-standard" onClick={handleStart} disabled={!eligible}>
          Start
        </button>
        <button className="button-standard" onClick={handleStop}>
          Stop
        </button>
        {!eligible && ineligibleReason ? (
          <div className="trial-progress__controls-note">{ineligibleReason}</div>
        ) : null}
      </div>

      <div className="trial-progress__metrics">
        <div className="trial-progress__metric">
          <div className="trial-progress__metric-label">Recommended DPS</div>
          <div className="trial-progress__bar">
            <div className="trial-progress__bar-fill" style={{ width: `${(offensePct ?? 0) * 100}%` }} />
          </div>
          <div className="trial-progress__metric-text">
            {recommendedDps ? `${recommendedDps} (you: ${playerOffense.toFixed(0)})` : 'No recommendation provided'}
          </div>
        </div>
        <div className="trial-progress__metric">
          <div className="trial-progress__metric-label">Recommended HP</div>
          <div className="trial-progress__bar">
            <div className="trial-progress__bar-fill trial-progress__bar-fill--hp" style={{ width: `${(hpPct ?? 0) * 100}%` }} />
          </div>
          <div className="trial-progress__metric-text">
            {recommendedHp ? `${recommendedHp} (you: ${playerMaxHp.toFixed(0)})` : 'No recommendation provided'}
          </div>
        </div>
      </div>

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
