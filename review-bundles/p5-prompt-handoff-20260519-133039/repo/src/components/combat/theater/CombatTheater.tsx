import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useShallow } from 'zustand/shallow';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useCombatStore, DEFENSE_CONSTANT_K, ENEMY_ATTACK_COOLDOWN } from '../../../stores/combatStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { computeCombatSafety, hpPercent } from '../../../systems/combat/minibarModel.js';
import { formatNumber, D } from '../../../utils/numbers.js';
import { CombatCanvas } from '../CombatCanvas.js';
import { TechniqueStrip } from './TechniqueStrip.js';
import { FightIntelPanel } from './FightIntelPanel.js';
import { LootTicker } from './LootTicker.js';
import { StatusEffectRow } from './StatusEffectRow.js';
import { ProgressPanel, type CombatTheaterFocus } from './ProgressPanel.js';
import { AI_PROFILE_OPTIONS, buildAiReason, getTechniqueAiTags } from '../../../systems/combat/aiProfiles.js';
import { normalizeTechniqueEffects } from '../../../systems/techniques/effects.js';
import { MedicinePouchStrip } from '../MedicinePouchStrip.js';
import './CombatTheater.scss';

function formatActivityLabel(type: string | null | undefined): string {
  switch (type) {
    case 'outskirts':
      return 'Outskirts';
    case 'trial':
      return 'Trial';
    case 'ruins':
      return 'Ruins';
    default:
      return 'Combat';
  }
}

export type CombatTheaterMode = 'preview' | 'active';

export function CombatTheater({
  onClose,
  mode,
  previewOverlay,
  focus,
}: {
  onClose: () => void;
  mode?: CombatTheaterMode;
  previewOverlay?: ReactNode;
  focus?: CombatTheaterFocus;
}) {
  const activity = useActivityStore((state) => state.active);
  const showFloatingNumbers = useUIStore((state) => state.settings.showCombatFloatingNumbers);
  const setSettings = useUIStore((state) => state.setSettings);
  const uiSettings = useUIStore(
    useShallow((state) => ({
      profile: state.settings.combatAIProfile,
      explainAIEnabled: state.settings.explainAIEnabled,
      explainAIHintsRemaining: state.settings.explainAIHintsRemaining,
      autoRetryOnDeath: state.settings.autoRetryOnDeath,
      useConsumablesInCombat: state.settings.useConsumablesInCombat,
      preferredTarget: state.settings.preferredTarget,
    })),
  );

  const [aiHint, setAiHint] = useState<{ text: string; at: number } | null>(null);

  const {
    currentEnemy,
    enemyHP,
    enemyMaxHP,
    isBoss,
    enemyMechanics,
    activeAura,
    combatShield,
    techniqueLog,
    inCombat,
    playerHP,
    playerMaxHP,
  } = useCombatStore(
    useShallow((state) => ({
      currentEnemy: state.currentEnemy,
      enemyHP: state.enemyHP,
      enemyMaxHP: state.enemyMaxHP,
      isBoss: state.isBoss,
      enemyMechanics: state.enemyMechanics,
      activeAura: state.activeAura,
      combatShield: state.combatShield,
      techniqueLog: state.techniqueLog,
      inCombat: state.inCombat,
      playerHP: state.playerHP,
      playerMaxHP: state.playerMaxHP,
    }))
  );

  const absorptionShield = useGameStore((state) => state.absorptionShield);
  const playerDef = useGameStore((state) => state.stats.def);

  const playerHpPct = hpPercent(playerHP, playerMaxHP);
  const enemyHpPct = hpPercent(enemyHP, enemyMaxHP);
  const activityLabel = formatActivityLabel(activity?.type);
  const safety = useMemo(() => {
    if (currentEnemy && (inCombat || activity)) {
      return computeCombatSafety({
        playerHp: playerHP,
        playerMaxHp: playerMaxHP,
        playerDef,
        absorptionShield,
        combatShieldAmount: combatShield?.amount ?? 0,
        enemyAtk: currentEnemy.atk,
        enemyCritChance: currentEnemy.crit ?? 0,
        enemyCritDmgPct: currentEnemy.critDmg ?? 100,
        enemyIsBoss: isBoss || currentEnemy.isBoss || false,
        enemyAuraDps: activeAura?.damagePerSec ?? 0,
        enemyHasEnrageMechanic: enemyMechanics?.some((m) => m.type === 'enrage') ?? false,
        enemyEnrageMultiplier: undefined,
        defenseConstantK: DEFENSE_CONSTANT_K,
        enemyAttackCooldownMs: ENEMY_ATTACK_COOLDOWN,
      });
    }

    return { tier: 'safe' as const, reasons: ['No active enemy (between fights).'] };
  }, [
    absorptionShield,
    activeAura?.damagePerSec,
    activity,
    combatShield?.amount,
    currentEnemy,
    enemyMechanics,
    inCombat,
    isBoss,
    playerHP,
    playerMaxHP,
    playerDef,
  ]);

  const latestTechniqueEntries = useMemo(() => {
    return [...techniqueLog]
      .slice(-6)
      .reverse()
      .map((entry, idx) => (
        <li key={`${entry.at}-${idx}`} className="combat-theater__event">
          <span className="combat-theater__event-time">{new Date(entry.at).toLocaleTimeString([], { hour12: false })}</span>
          <span className="combat-theater__event-text">{entry.message}</span>
        </li>
      ));
  }, [techniqueLog]);

  const safetyLabel = safety.tier === 'safe' ? 'Safe' : safety.tier === 'risky' ? 'Risky' : 'Deadly';

  const handleFloatingToggle = (checked: boolean) => {
    setSettings({ showCombatFloatingNumbers: checked });
  };

  useEffect(() => {
    const unsubscribe = useCombatStore.subscribe(
      (state) => state.events[state.events.length - 1],
      (event) => {
        if (!event || event.type !== 'SKILL_CAST' || event.source !== 'ai') return;
        const uiState = useUIStore.getState();
        const settings = uiState.settings;
        const shouldExplain = settings.explainAIEnabled || settings.explainAIHintsRemaining > 0;
        if (!shouldExplain) return;

        const content = useContentStore.getState();
        const combat = useCombatStore.getState();
        const def = content.maps.techniquesById[event.techniqueId];
        if (!def) return;

        const effects = normalizeTechniqueEffects(def, { includeSecondary: true });
        const tags = getTechniqueAiTags(def, effects);
        const playerHp = D(combat.playerHP);
        const playerMaxHp = D(combat.playerMaxHP);
        const enemyHp = D(combat.enemyHP);
        const enemyMaxHp = D(combat.enemyMaxHP);
        const hpPct = playerMaxHp.greaterThan(0) ? playerHp.dividedBy(playerMaxHp).toNumber() : 0;
        const enemyHpPct = enemyMaxHp.greaterThan(0) ? enemyHp.dividedBy(enemyMaxHp).toNumber() : 0;
        const reason = buildAiReason(def.name ?? 'Technique', tags, {
          profile: settings.combatAIProfile,
          hpPct,
          enemyHpPct,
          enemyIsBoss: combat.isBoss || combat.currentEnemy?.isBoss || combat.combatContext.type === 'trial',
        });
        setAiHint({ text: reason, at: Date.now() });

        if (!settings.explainAIEnabled && settings.explainAIHintsRemaining > 0) {
          uiState.setSettings({ explainAIHintsRemaining: Math.max(0, settings.explainAIHintsRemaining - 1) });
        }
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!aiHint) return;
    const timer = window.setTimeout(() => setAiHint(null), 4500);
    return () => window.clearTimeout(timer);
  }, [aiHint]);

  const resolvedMode: CombatTheaterMode = mode ?? (inCombat ? 'active' : 'preview');
  const isPreview = resolvedMode === 'preview';
  const isActive = resolvedMode === 'active';

  return (
    <div className={`combat-theater combat-theater--${resolvedMode}`}>
      <div className="combat-theater__header">
        <div>
          <div className="combat-theater__title">Combat Theater</div>
          <div className="combat-theater__enemy-line">
            <span className="combat-theater__enemy-name">{currentEnemy?.name ?? 'No active enemy'}</span>
            {currentEnemy && (
              <>
                <span className="combat-theater__enemy-level">Lv. {currentEnemy.level}</span>
                {(isBoss || currentEnemy.isBoss) && <span className="combat-theater__badge">Boss</span>}
              </>
            )}
            <span className={`combat-theater__mode-chip combat-theater__mode-chip--${resolvedMode}`}>
              {isPreview ? 'Preview' : 'Live'}
            </span>
          </div>
        </div>
        <button className="button-standard" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="combat-theater__stage">
        <div className="combat-theater__stage-header">
          <div className="combat-theater__stage-title">Battle Stage</div>
          <label className="combat-theater__toggle">
            <input
              type="checkbox"
              checked={showFloatingNumbers}
              onChange={(e) => handleFloatingToggle(e.target.checked)}
            />
            Floating numbers
          </label>
        </div>
        <div className="combat-theater__stage-canvas">
          <CombatCanvas
            inCombat={inCombat}
            playerHP={D(playerHP).toNumber()}
            enemyHP={D(enemyHP).toNumber()}
            showFloatingNumbers={showFloatingNumbers}
          />
        </div>
        <div className="combat-theater__subheader">{activityLabel}</div>
      </div>

      <ProgressPanel focus={focus} />

      {isActive ? (
        <div className="combat-theater__controls">
          <label className="combat-theater__control">
            <span className="combat-theater__control-label">AI Profile</span>
            <select
              value={uiSettings.profile}
              onChange={(e) => setSettings({ combatAIProfile: e.target.value as typeof uiSettings.profile })}
            >
              {AI_PROFILE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} title={option.description}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="combat-theater__control combat-theater__control--checkbox">
            <input
              type="checkbox"
              checked={uiSettings.explainAIEnabled}
              onChange={(e) => setSettings({ explainAIEnabled: e.target.checked })}
            />
            <div>
              <div className="combat-theater__control-label">Explain AI</div>
              <div className="combat-theater__control-note">
                {uiSettings.explainAIEnabled
                  ? 'Always show reasoning.'
                  : `Hints remaining: ${uiSettings.explainAIHintsRemaining}`}
              </div>
            </div>
          </label>

          <label className="combat-theater__control combat-theater__control--checkbox">
            <input
              type="checkbox"
              checked={uiSettings.autoRetryOnDeath}
              onChange={(e) => setSettings({ autoRetryOnDeath: e.target.checked })}
            />
            <div>
              <div className="combat-theater__control-label">Auto-retry on defeat</div>
              <div className="combat-theater__control-note">Restarts Outskirts/Ruins when possible.</div>
            </div>
          </label>

          <label className="combat-theater__control combat-theater__control--checkbox">
            <input
              type="checkbox"
              checked={uiSettings.useConsumablesInCombat}
              onChange={(e) => setSettings({ useConsumablesInCombat: e.target.checked })}
            />
            <div>
              <div className="combat-theater__control-label">Use consumables in combat</div>
              <div className="combat-theater__control-note">Reserved for Medicine Pouch support.</div>
            </div>
          </label>

          <label className="combat-theater__control">
            <span className="combat-theater__control-label">Preferred target</span>
            <select
              value={uiSettings.preferredTarget}
              onChange={(e) => setSettings({ preferredTarget: e.target.value as typeof uiSettings.preferredTarget })}
            >
              <option value="trash">Trash</option>
              <option value="elite">Elite</option>
              <option value="boss">Boss</option>
            </select>
            <div className="combat-theater__control-note">Used when multiple targets exist.</div>
          </label>
        </div>
      ) : null}

      {isActive && aiHint ? <div className="combat-theater__ai-hint">{aiHint.text}</div> : null}

      {isActive ? <MedicinePouchStrip /> : null}

      {isActive ? <StatusEffectRow /> : null}

      {isActive ? (
        <div className="combat-theater__layout">
          <div className="combat-theater__column">
            <TechniqueStrip />
          </div>
          <div className="combat-theater__column combat-theater__column--secondary">
            <FightIntelPanel />
          </div>
        </div>
      ) : null}

      {isActive ? <LootTicker /> : null}

      {isActive ? (
        <div className="combat-theater__snapshot">
          <div className="combat-theater__bar">
            <div className="combat-theater__bar-label">Player HP</div>
            <div className="combat-theater__bar-track">
              <div
                className="combat-theater__bar-fill combat-theater__bar-fill--player"
                style={{ width: `${playerHpPct}%` }}
              />
              <div className="combat-theater__bar-text">
                {formatNumber(playerHP)} / {formatNumber(playerMaxHP)} ({playerHpPct.toFixed(1)}%)
              </div>
            </div>
          </div>

          <div className="combat-theater__bar">
            <div className="combat-theater__bar-label">Enemy HP</div>
            <div className="combat-theater__bar-track">
              <div className="combat-theater__bar-fill combat-theater__bar-fill--enemy" style={{ width: `${enemyHpPct}%` }} />
              <div className="combat-theater__bar-text">
                {currentEnemy ? (
                  <span>
                    {formatNumber(enemyHP)} / {formatNumber(enemyMaxHP)} ({enemyHpPct.toFixed(1)}%)
                  </span>
                ) : (
                  <span>Waiting for next fight…</span>
                )}
              </div>
            </div>
          </div>

          <div className={`combat-theater__safety combat-theater__safety--${safety.tier}`}>
            <div className="combat-theater__safety-label">{safetyLabel}</div>
            <ul className="combat-theater__safety-reasons">
              {safety.reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {isActive ? (
        <div className="combat-theater__events">
          <div className="combat-theater__events-title">Recent techniques</div>
          {latestTechniqueEntries.length > 0 ? (
            <ul className="combat-theater__events-list">{latestTechniqueEntries}</ul>
          ) : (
            <div className="combat-theater__events-empty">No technique activations yet.</div>
          )}
        </div>
      ) : null}

      {isPreview && previewOverlay ? <div className="combat-theater__preview-overlay">{previewOverlay}</div> : null}
    </div>
  );
}
