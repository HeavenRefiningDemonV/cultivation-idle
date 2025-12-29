import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import { formatPrice, getForgeBlueprint, getItemDef, listForgeBlueprintsForCity } from '../../stores/contentStore';
import { useCraftSessionStore } from '../../stores/craftSessionStore';
import { useEquipmentStore } from '../../stores/equipmentStore';
import { useProfessionStore } from '../../stores/professionStore';
import { useUIStore } from '../../stores/uiStore';
import { isRefineBlueprint, isRuneBlueprint, isTemperBlueprint } from '../../content';
import { summarizePrompts } from '../../systems/crafting/assistedPrompts';
import { AssistedPromptCard } from '../crafting/AssistedPromptCard';
import { ForgeHandsOnSession } from '../crafting/ForgeHandsOnSession';
import { UsedForLinks } from '../crafting/UsedForLinks';
import type { CraftStep, ForgeSessionOutcome, ForgeStepResult } from '../../systems/crafting/craftingTypes';
import type { ForgeServiceResult } from '../../services/forgeService';
import { RewardService } from '../../services/rewards';
import { listTemperAffixes } from '../../content/temperAffixes';

interface ForgePanelProps {
  cityId: string | null;
}

type StatusMessage = { type: 'success' | 'error'; message: string };

const MAX_QTY = 999;
const SESSION_QTY = 1;

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad = (value: number) => value.toString().padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

function clampQty(value: number): number {
  const parsed = Math.floor(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.min(parsed, MAX_QTY);
}

function formatUsageLabel(usage?: string): string | undefined {
  switch (usage) {
    case 'combat_only':
      return 'Combat techniques and battles';
    case 'combat_or_world':
      return 'Techniques and combat while exploring';
    case 'cultivate_only':
      return 'Cultivation and Qi training';
    default:
      return undefined;
  }
}

function buildAssistedPerformance(step: CraftStep): ForgeStepResult | null {
  switch (step.type) {
    case 'HEAT_MATERIAL':
      return {
        stepId: step.id,
        type: 'HEAT_MATERIAL',
        achievedMin: step.targetMin,
        achievedMax: step.targetMax,
        holdMs: step.holdMs,
      };
    case 'HAMMER_PATTERN':
      return {
        stepId: step.id,
        type: 'HAMMER_PATTERN',
        hitsLanded: step.hits,
        hitsRequired: step.hits,
        timingScore: 0.75,
      };
    case 'QUENCH':
      return {
        stepId: step.id,
        type: 'QUENCH',
        medium: step.mediumOptions[0] ?? 'water',
        timingMs: step.timingWindow ? (step.timingWindow.goodMin + step.timingWindow.goodMax) / 2 : undefined,
      };
    case 'TEMPER':
      return {
        stepId: step.id,
        type: 'TEMPER',
        achievedMin: step.targetMin ?? step.targetHeat - 15,
        achievedMax: step.targetMax ?? step.targetHeat + 15,
        holdMs: step.holdMs ?? step.durationMs,
      };
    case 'ALLOY_MIX': {
      const choice = step.options[0];
      return {
        stepId: step.id,
        type: 'ALLOY_MIX',
        choiceId: choice?.id,
        qualityDelta: choice?.qualityDelta,
      };
    }
    case 'CAST_OR_SHAPE':
      return { stepId: step.id, type: 'CAST_OR_SHAPE', variant: step.variant, precision: 0.7, success: true };
    case 'ENGRAVE_RUNE':
      return { stepId: step.id, type: 'ENGRAVE_RUNE', success: true, precision: 0.65, optional: step.optional };
    case 'FINISH':
    default:
      return null;
  }
}

export function ForgePanel({ cityId }: ForgePanelProps) {
  const startForge = useProfessionStore((state) => state.startForge);
  const claimForge = useProfessionStore((state) => state.claimForge);
  const forgeQueue = useProfessionStore((state) => state.forgeQueue);
  const canStartForge = useProfessionStore((state) => state.canStartForge);
  const getForgeJobStatus = useProfessionStore((state) => state.getForgeJobStatus);

  const equippedWeaponId = useEquipmentStore((state) => state.equippedWeaponId);
  const equippedAccessoryId = useEquipmentStore((state) => state.equippedAccessoryId);
  const refineLevelBySlot = useEquipmentStore((state) => state.refineLevelBySlot);
  const getRefineCapForCurrentProgress = useEquipmentStore((state) => state.getRefineCapForCurrentProgress);
  const temperBonusesBySlot = useEquipmentStore((state) => state.temperBonusesBySlot);
  const forgeToolTiers = useEquipmentStore((state) => state.forgeToolTiers);
  const upgradeForgeTool = useEquipmentStore((state) => state.upgradeForgeTool);

  const modeByStation = useCraftSessionStore((state) => state.modeByStation);
  const setCraftMode = useCraftSessionStore((state) => state.setMode);
  const startSession = useCraftSessionStore((state) => state.startSession);
  const abortSession = useCraftSessionStore((state) => state.abortSession);
  const activeSession = useCraftSessionStore((state) => state.activeSession);
  const recordForgeStepResult = useCraftSessionStore((state) => state.recordForgeStepResult);
  const updateSessionPrompts = useCraftSessionStore((state) => state.updateActiveSessionPrompts);
  const completePromptAction = useCraftSessionStore((state) => state.completePrompt);
  const claimSession = useCraftSessionStore((state) => state.claimActiveSession);
  const markBackgroundResolving = useCraftSessionStore((state) => state.markBackgroundResolving);
  const addNotification = useUIStore((state) => state.addNotification);

  const activeOtherStation = activeSession && activeSession.station !== 'forge';
  const activeForgeSession = activeSession?.station === 'forge' ? activeSession : null;
  const activePrompts = activeForgeSession?.prompts ?? [];
  const promptSummary = summarizePrompts(activePrompts);
  const availablePrompt = activePrompts.find((prompt) => prompt.status === 'AVAILABLE');

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [recipeStatus, setRecipeStatus] = useState<Record<string, StatusMessage>>({});
  const [queueStatus, setQueueStatus] = useState<Record<string, StatusMessage>>({});
  const [sessionStatus, setSessionStatus] = useState<StatusMessage | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [lastForgeOutcome, setLastForgeOutcome] = useState<ForgeSessionOutcome | null>(null);
  const [lastServiceResult, setLastServiceResult] = useState<ForgeServiceResult | null>(null);
  const [selectedServiceSlot, setSelectedServiceSlot] = useState<'weapon' | 'accessory'>('weapon');
  const affixLabels = useMemo(() => {
    const map: Record<string, string> = {};
    listTemperAffixes().forEach((affix) => {
      map[affix.id] = affix.label;
    });
    return map;
  }, []);

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(handle);
  }, []);

  useEffect(() => {
    updateSessionPrompts(now);
  }, [now, updateSessionPrompts]);

  useEffect(() => {
    if (!activeForgeSession || activeForgeSession.mode !== 'assisted') return;
    const existingIds = new Set((activeForgeSession.cursor.forgeStepResults ?? []).map((entry) => entry.stepId));
    activeForgeSession.script.steps.forEach((step) => {
      if (existingIds.has(step.id)) return;
      const perf = buildAssistedPerformance(step);
      if (perf) {
        recordForgeStepResult(perf);
      }
    });
  }, [activeForgeSession, recordForgeStepResult]);

  useEffect(() => {
    setSessionStatus(null);
  }, [activeSession?.sessionId]);

  useEffect(() => {
    setLastForgeOutcome(null);
  }, [activeSession?.sessionId]);

  const blueprints = useMemo(() => {
    if (!cityId) return [];
    return listForgeBlueprintsForCity({ cityId });
  }, [cityId]);

  const runeBlueprints = useMemo(
    () => blueprints.filter((blueprint) => isRuneBlueprint(blueprint)),
    [blueprints],
  );

  const serviceBlueprints = useMemo(() => blueprints.filter((bp) => bp.type === 'service'), [blueprints]);
  const refineBlueprint = useMemo(
    () => serviceBlueprints.find((blueprint) => isRefineBlueprint(blueprint)) ?? null,
    [serviceBlueprints],
  );
  const temperBlueprint = useMemo(
    () => serviceBlueprints.find((blueprint) => isTemperBlueprint(blueprint)) ?? null,
    [serviceBlueprints],
  );

  useEffect(() => {
    const first = runeBlueprints[0]?.id ?? refineBlueprint?.id ?? temperBlueprint?.id ?? null;
    if (!selectedBlueprintId || !blueprints.find((bp) => bp.id === selectedBlueprintId)) {
      setSelectedBlueprintId(first);
    }
  }, [blueprints, refineBlueprint?.id, temperBlueprint?.id, runeBlueprints, selectedBlueprintId]);

  useEffect(() => {
    return () => {
      if (activeForgeSession?.mode === 'handsOn' && activeForgeSession.cursor.backgroundResolveAt == null) {
        markBackgroundResolving('navigated');
      }
    };
  }, [activeForgeSession, markBackgroundResolving]);

  const selectedBlueprint = useMemo(
    () => blueprints.find((bp) => bp.id === selectedBlueprintId) ?? blueprints[0] ?? null,
    [blueprints, selectedBlueprintId],
  );

  const sessionRemainingMs = activeForgeSession ? Math.max(0, activeForgeSession.endsAt - now) : 0;
  const sessionReady = activeForgeSession ? now >= activeForgeSession.endsAt : false;

  const handleSetQty = (blueprintId: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [blueprintId]: clampQty(value) }));
  };

  const refineWeaponAffordability = useMemo(() => {
    if (!refineBlueprint) return { ok: false, reason: 'Missing blueprint' };
    return canStartForge(refineBlueprint.id, 1, 'weapon');
  }, [canStartForge, refineBlueprint]);

  const refineAccessoryAffordability = useMemo(() => {
    if (!refineBlueprint) return { ok: false, reason: 'Missing blueprint' };
    return canStartForge(refineBlueprint.id, 1, 'accessory');
  }, [canStartForge, refineBlueprint]);

  const refineCap = getRefineCapForCurrentProgress();
  const weaponRefineBlockedReason = !equippedWeaponId
    ? 'No weapon equipped'
    : refineLevelBySlot.weapon >= refineCap
      ? 'Refine cap reached'
      : refineWeaponAffordability.ok
        ? null
        : refineWeaponAffordability.reason ?? 'Cannot refine';
  const accessoryRefineBlockedReason = !equippedAccessoryId
    ? 'No accessory equipped'
    : refineLevelBySlot.accessory >= refineCap
      ? 'Refine cap reached'
      : refineAccessoryAffordability.ok
        ? null
        : refineAccessoryAffordability.reason ?? 'Cannot refine';

  const isServiceBlueprint = selectedBlueprint ? selectedBlueprint.type === 'service' : false;
  const currentMode = modeByStation.forge;

  useEffect(() => {
    if (isServiceBlueprint && currentMode !== 'idle') {
      setCraftMode('forge', 'idle');
    }
  }, [currentMode, isServiceBlueprint, setCraftMode]);

  const renderRefineContent = () => (
    <div className={'forgeRefinePanel'}>
      <div className={'forgeRefineRow'}>
        <div>
          <div className={'forgeBlueprintLabel'}>Weapon</div>
          <div className={'forgeRefineName'}>
            {equippedWeaponId ? getItemDef(equippedWeaponId)?.name ?? equippedWeaponId : 'None equipped'}
          </div>
        </div>
        <div className={'forgeRefineMeta'}>
          Refine: {refineLevelBySlot.weapon} / {refineCap}
        </div>
        <div className={'forgeRefineMeta'}>Bonus: +{refineLevelBySlot.weapon * 2}%</div>
        <button
          className={'worldScreenModuleButton worldScreenModuleButton--active'}
          disabled={!equippedWeaponId || refineLevelBySlot.weapon >= refineCap || !refineWeaponAffordability.ok}
          onClick={() => {
            if (!refineBlueprint) return;
            const result = startForge(refineBlueprint.id, 1, { targetSlot: 'weapon' });
            if (!result.ok) {
              setRecipeStatus((prev) => ({
                ...prev,
                refine_weapon: { type: 'error', message: result.error },
              }));
              return;
            }
            setRecipeStatus((prev) => ({
              ...prev,
              refine_weapon: { type: 'success', message: 'Queued refine (+1)' },
            }));
          }}
        >
          Refine Weapon (+1)
        </button>
        {weaponRefineBlockedReason && <div className={'forgeHint'}>{weaponRefineBlockedReason}</div>}
      </div>

      <div className={'forgeRefineRow'}>
        <div>
          <div className={'forgeBlueprintLabel'}>Accessory</div>
          <div className={'forgeRefineName'}>
            {equippedAccessoryId ? getItemDef(equippedAccessoryId)?.name ?? equippedAccessoryId : 'None equipped'}
          </div>
        </div>
        <div className={'forgeRefineMeta'}>
          Refine: {refineLevelBySlot.accessory} / {refineCap}
        </div>
        <div className={'forgeRefineMeta'}>Bonus: +{refineLevelBySlot.accessory * 2}%</div>
        <button
          className={'worldScreenModuleButton worldScreenModuleButton--active'}
          disabled={!equippedAccessoryId || refineLevelBySlot.accessory >= refineCap || !refineAccessoryAffordability.ok}
          onClick={() => {
            if (!refineBlueprint) return;
            const result = startForge(refineBlueprint.id, 1, { targetSlot: 'accessory' });
            if (!result.ok) {
              setRecipeStatus((prev) => ({
                ...prev,
                refine_accessory: { type: 'error', message: result.error },
              }));
              return;
            }
            setRecipeStatus((prev) => ({
              ...prev,
              refine_accessory: { type: 'success', message: 'Queued refine (+1)' },
            }));
          }}
        >
          Refine Accessory (+1)
        </button>
        {accessoryRefineBlockedReason && <div className={'forgeHint'}>{accessoryRefineBlockedReason}</div>}
      </div>

      {(recipeStatus.refine_weapon || recipeStatus.refine_accessory) && (
        <div
          className={`forgeStatus forgeStatus--${
            recipeStatus.refine_weapon?.type ?? recipeStatus.refine_accessory?.type ?? 'success'
          }`}
        >
          {recipeStatus.refine_weapon?.message ?? recipeStatus.refine_accessory?.message}
        </div>
      )}
    </div>
  );

  const renderModeSelector = (servicesIdleOnly: boolean) => (
    <div className={'craftingModeSelector'}>
      <div className={'craftingModeLabel'}>Mode</div>
      <div className={'craftingModeButtons craftModeTabs'}>
        {(['idle', 'assisted', 'handsOn'] as const).map((mode) => {
          const disabled = servicesIdleOnly && mode !== 'idle';
          return (
            <button
              key={mode}
              type="button"
              className={classNames('craftingModeButton craftModeTab', {
                'craftingModeButton--active': currentMode === mode,
                'craftModeTab--active': currentMode === mode,
                'craftingModeButton--disabled': disabled,
                'craftModeTab--disabled': disabled,
              })}
              disabled={disabled}
              onClick={() => setCraftMode('forge', mode)}
            >
              {mode === 'idle' ? 'Idle' : mode === 'assisted' ? 'Assisted' : 'Hands-on'}
            </button>
          );
        })}
      </div>
      <div className={'craftModeNote'}>
        Assisted: optional prompts improve this batch. Ignoring prompts has no penalty.
      </div>
      {servicesIdleOnly && <div className={'forgeHint'}>Services are idle-only.</div>}
    </div>
  );

  const renderToolStrip = () => {
    const toolEntries: Array<{ key: keyof typeof forgeToolTiers; label: string; hint: string }> = [
      { key: 'anvil', label: 'Anvil', hint: 'Stability' },
      { key: 'hammer', label: 'Hammer', hint: 'Timing leniency' },
      { key: 'bellows', label: 'Bellows', hint: 'Heat window' },
      { key: 'quenchTub', label: 'Quench Tub', hint: 'Quench consistency' },
    ];

    const handleUpgrade = (key: keyof typeof forgeToolTiers) => {
      const nextTier = (forgeToolTiers[key] ?? 1) + 1;
      const cost = Math.max(200, nextTier * 500);
      const spent = RewardService.spendCurrency({ gold: cost.toString() }, `forge_tool:${key}:${nextTier}`);
      if (spent) {
        upgradeForgeTool(key, 1);
      }
    };

    return (
      <div className="forgeToolStrip">
        {toolEntries.map((entry) => (
          <div key={entry.key} className="forgeTool">
            <div className="forgeToolLabel">{entry.label}</div>
            <div className="forgeToolTier">Tier {forgeToolTiers[entry.key]}</div>
            <div className="forgeHint">{entry.hint}</div>
            <button
              type="button"
              className="worldScreenModuleButton forgeToolButton"
              onClick={() => handleUpgrade(entry.key)}
            >
              Upgrade
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderCraftContent = () => {
    if (!selectedBlueprint) return null;
    const qty = quantities[selectedBlueprint.id] ?? 1;
    const output = selectedBlueprint.output;
    const outputItem = output?.itemId ? getItemDef(output.itemId) : null;
    const outputName = outputItem?.name ?? output?.itemId ?? selectedBlueprint.id;
    const outputQty = (output?.qty ?? 1) * qty;
    const timePerMs = selectedBlueprint.timeSec * 1000;
    const totalTimeMs = selectedBlueprint.timeSec * qty * 1000;
    const status = recipeStatus[selectedBlueprint.id];
    const affordability = canStartForge(selectedBlueprint.id, qty);
    const usageText = formatUsageLabel(outputItem?.usage);
    const blueprintForSession = activeForgeSession
      ? blueprints.find((bp) => bp.id === activeForgeSession.sourceId) ?? selectedBlueprint
      : selectedBlueprint;
    const handsOnBonus = blueprintForSession?.handsOnBonus ?? activeForgeSession?.script.handsOnBonus;
    const activeOutputName = blueprintForSession?.output?.itemId
      ? getItemDef(blueprintForSession.output.itemId)?.name ?? blueprintForSession.output.itemId
      : blueprintForSession?.name ?? outputName;

    return (
      <div className={'craftingDetailCard'}>
        <div className={'craftingDetailHeader'}>
          <div>
            <div className={'craftingDetailTitle'}>{outputName}</div>
            <div className={'craftingDetailSub'}>{selectedBlueprint.id}</div>
          </div>
          <div className={'craftingDetailMeta'}>
            <div>Time per: {formatDuration(timePerMs)}</div>
            <div>Total: {formatDuration(totalTimeMs)}</div>
          </div>
        </div>

        <UsedForLinks usageText={usageText} className={'craftingUsedFor craftUsedFor'} />

        <div className={'forgeBlueprintDetails'}>
          <div>
            <div className={'forgeBlueprintLabel'}>Inputs</div>
            <ul>
              {selectedBlueprint.costs.items.map((item) => {
                const itemDef = getItemDef(item.itemId);
                const itemName = itemDef?.name ?? item.itemId;
                return (
                  <li key={item.itemId}>
                    {itemName} x{item.qty * qty}
                  </li>
                );
              })}
              {selectedBlueprint.costs.items.length === 0 && <li>None</li>}
            </ul>
          </div>
          <div>
            <div className={'forgeBlueprintLabel'}>Costs</div>
            <div>
              {formatPrice({
                gold: selectedBlueprint.costs.gold ? (selectedBlueprint.costs.gold * qty).toString() : undefined,
                spiritStones: selectedBlueprint.costs.spiritStones
                  ? (selectedBlueprint.costs.spiritStones * qty).toString()
                  : undefined,
              }) || 'Free'}
            </div>
          </div>
          <div>
            <div className={'forgeBlueprintLabel'}>Output</div>
            <div>
              {outputName} x{outputQty}
            </div>
          </div>
        </div>

        {renderModeSelector(false)}

        {currentMode === 'idle' && (
          <div className={'forgeBlueprintControls'}>
            <label className={'forgeBlueprintLabel'}>
              Qty
              <input
                type="number"
                min={1}
                max={MAX_QTY}
                value={qty}
                onChange={(e) => handleSetQty(selectedBlueprint.id, Number(e.target.value))}
              />
            </label>
            <div className={'forgeBlueprintActions'}>
              <button
                className={`worldScreenModuleButton ${affordability.ok ? 'worldScreenModuleButton--active' : ''}`}
                disabled={!affordability.ok}
                onClick={() => {
                  const result = startForge(selectedBlueprint.id, qty);
                  if (!result.ok) {
                    setRecipeStatus((prev) => ({
                      ...prev,
                      [selectedBlueprint.id]: { type: 'error', message: result.error },
                    }));
                    return;
                  }
                  setRecipeStatus((prev) => ({
                    ...prev,
                    [selectedBlueprint.id]: { type: 'success', message: `Queued x${qty}` },
                  }));
                }}
              >
                Craft
              </button>
              {!affordability.ok && affordability.reason && <div className={'forgeHint'}>{affordability.reason}</div>}
            </div>
          </div>
        )}

        {currentMode !== 'idle' && (
          <div className={'craftingSessionBlock craftSessionCard'}>
            <div className={'craftingSessionNote'}>
              Sessions craft 1 batch for now. Assisted auto-resolves at a good grade; hands-on is interactive.
            </div>
            {activeOtherStation && (
              <div className={'forgeHint'}>Another crafting session is active. Finish or abort it first.</div>
            )}
            {!activeForgeSession && !activeOtherStation && (
              <button
                className={'worldScreenModuleButton worldScreenModuleButton--active'}
                onClick={() => {
                  const result = startSession({
                    station: 'forge',
                    mode: currentMode as 'assisted' | 'handsOn',
                    sourceId: selectedBlueprint.id,
                    qty: SESSION_QTY,
                    now: Date.now(),
                  });
                  if (!result.ok) {
                    setSessionStatus({ type: 'error', message: `Cannot start: ${result.reason}` });
                    return;
                  }
                  setSessionStatus({ type: 'success', message: 'Session started' });
                }}
              >
                Start {currentMode === 'assisted' ? 'Assisted' : 'Hands-on'} session
              </button>
            )}
            {activeForgeSession && activeForgeSession.mode === 'handsOn' && (
              <div className={'craftingSessionDetails craftSessionCard'}>
                <ForgeHandsOnSession
                  session={activeForgeSession}
                  now={now}
                  blueprintName={activeOutputName}
                  bonus={handsOnBonus}
                  onOutcome={(outcome) => {
                    setLastForgeOutcome(outcome);
                    setSessionStatus({ type: 'success', message: 'Hands-on forge complete' });
                  }}
                />
                {lastForgeOutcome && (
                  <div className={'forgeOutcomeCard'}>
                    <div className={'forgeOutcomeTitle'}>Outcome summary</div>
                    <div className={'forgeOutcomeGrid'}>
                      <div>Overall: {Math.round(lastForgeOutcome.scoreOverall * 100)}%</div>
                      <div>Heat: {Math.round(lastForgeOutcome.heatScore * 100)}%</div>
                      <div>Hammer: {Math.round(lastForgeOutcome.hammerScore * 100)}%</div>
                      <div>Quench: {Math.round(lastForgeOutcome.quenchScore * 100)}%</div>
                      <div>Temper: {Math.round(lastForgeOutcome.temperScore * 100)}%</div>
                      <div>Time bonus: +{Math.round(lastForgeOutcome.timeReductionPctApplied)}%</div>
                      <div>Quality proc: +{Math.round(lastForgeOutcome.qualityProcChanceBonusPct)}%</div>
                      <div>Mastery mult: x{lastForgeOutcome.masteryMultApplied.toFixed(2)}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeForgeSession && activeForgeSession.mode === 'assisted' && (
              <div className={'craftingSessionDetails craftSessionCard'}>
                <div className={'craftingSessionRow'}>
                  <div>Session active</div>
                  <div className={'craftingSessionMeta'}>
                    {activeForgeSession.mode} · {activeForgeSession.sourceId}
                  </div>
                </div>
                <div className={'craftingSessionMeta'}>
                  <div>{sessionReady ? 'Ready to claim' : `Time left: ${formatDuration(sessionRemainingMs)}`}</div>
                  <div>Assisted: {promptSummary.completed}/{promptSummary.total} prompts completed</div>
                </div>

                {availablePrompt && (
                  <AssistedPromptCard
                    prompt={availablePrompt}
                    now={now}
                    onComplete={() => {
                      const result = completePromptAction(availablePrompt.id, Date.now());
                      if (!result.ok) {
                        setSessionStatus({ type: 'error', message: 'Prompt not available right now' });
                        return;
                      }
                      const bonusLabel =
                        availablePrompt.bonus?.yieldPct && availablePrompt.bonus.yieldPct > 0
                          ? ` (+${availablePrompt.bonus.yieldPct}% yield)`
                          : '';
                      const toastLabel = availablePrompt.type === 'ADD_CATALYST' ? 'Catalyst added' : 'Heat stabilized';
                      addNotification('success', `${toastLabel}${bonusLabel}`, 2500);
                      setSessionStatus({ type: 'success', message: `${toastLabel}${bonusLabel}` });
                    }}
                  />
                )}

                <div className={'craftingStepList'}>
                  {activeForgeSession.script.steps.map((step) => (
                    <div key={step.id} className={'craftingStepItem'}>
                      <div className={'craftingStepType'}>{step.uiLabel ?? step.type}</div>
                    </div>
                  ))}
                </div>
                <div className={'craftingSessionActions'}>
                  <button
                    className={`worldScreenModuleButton ${sessionReady ? 'worldScreenModuleButton--active' : ''}`}
                    disabled={!sessionReady}
                    onClick={() => {
                      const result = claimSession(Date.now());
                      if (!result.ok) {
                        const message = result.reason === 'not_ready' ? 'Session not finished yet' : 'Unable to claim session';
                        setSessionStatus({ type: 'error', message });
                        return;
                      }
                      const bonusTotal = result.bonus?.bonusItems?.reduce((acc, item) => acc + item.qty, 0) ?? 0;
                      const summary = result.bonus
                        ? `Assisted bonus: +${bonusTotal} (${result.bonus.completed}/${result.bonus.total} prompts).`
                        : 'Session claimed.';
                      setSessionStatus({ type: 'success', message: summary });
                    }}
                  >
                    Claim session
                  </button>
                  <button
                    className={'worldScreenModuleButton'}
                    onClick={() => {
                      abortSession();
                      setSessionStatus({ type: 'success', message: 'Session aborted and refunded' });
                    }}
                  >
                    Abort session
                  </button>
                </div>
              </div>
            )}

            {sessionStatus && (
              <div className={`forgeStatus forgeStatus--${sessionStatus.type}`}>
                {sessionStatus.message}
              </div>
            )}
          </div>
        )}

        {status && (
          <div
            className={`forgeStatus forgeStatus--${status.type}`}
            role={status.type === 'error' ? 'alert' : 'status'}
          >
            {status.message}
          </div>
        )}
      </div>
    );
  };

  const renderTemperContent = () => {
    if (!selectedBlueprint) return null;
    const effect = (selectedBlueprint as any).effect ?? {};
    const baseChance = typeof effect.baseProcChancePct === 'number' ? effect.baseProcChancePct : 25;
    const toolBonus = Math.max(0, (forgeToolTiers.hammer - 1) * 0.5 + (forgeToolTiers.bellows - 1) * 0.25);
    const displayedChance = Math.min(100, baseChance + toolBonus);
    const activeAffixes = temperBonusesBySlot[selectedServiceSlot] ?? [];
    const allowedAffixes: string[] | undefined = Array.isArray(effect.affixPool)
      ? (effect.affixPool as string[])
      : undefined;

    return (
      <div className={'forgeRefinePanel'}>
        <div className={'forgeRefineRow'}>
          <div>
            <div className={'forgeBlueprintLabel'}>Target Slot</div>
            <div className={'forgeRefineName'}>
              <label>
                <input
                  type="radio"
                  name="temperSlot"
                  checked={selectedServiceSlot === 'weapon'}
                  onChange={() => setSelectedServiceSlot('weapon')}
                />
                Weapon
              </label>
              <label>
                <input
                  type="radio"
                  name="temperSlot"
                  checked={selectedServiceSlot === 'accessory'}
                  onChange={() => setSelectedServiceSlot('accessory')}
                />
                Accessory
              </label>
            </div>
          </div>
          <div className={'forgeRefineMeta'}>Base chance: {displayedChance.toFixed(1)}%</div>
          <div className={'forgeRefineMeta'}>Tool bonus included</div>
          <button
            className={'worldScreenModuleButton worldScreenModuleButton--active'}
            onClick={() => {
              const result = startForge(selectedBlueprint.id, 1, { targetSlot: selectedServiceSlot });
              if (!result.ok) {
                setRecipeStatus((prev) => ({ ...prev, [selectedBlueprint.id]: { type: 'error', message: result.error } }));
                return;
              }
              setRecipeStatus((prev) => ({
                ...prev,
                [selectedBlueprint.id]: { type: 'success', message: 'Tempering started (idle)' },
              }));
            }}
          >
            Temper (Idle)
          </button>
        </div>

        <div className={'forgeBlueprintLabel'}>Current affixes</div>
        {activeAffixes.length === 0 ? (
          <div className={'forgeHint'}>No temper bonuses on this slot yet.</div>
        ) : (
          <ul className={'forgeAffixList'}>
            {activeAffixes.map((affix) => (
              <li key={affix.id}>
                {affix.label} ({affix.stat}) +{Math.round(affix.valuePct * 100)}%
              </li>
            ))}
          </ul>
        )}

        {allowedAffixes && (
          <div className={'forgeHint'}>
            Possible lines: {allowedAffixes.map((id) => affixLabels[id] ?? id).join(', ')}
          </div>
        )}
      </div>
    );
  };

  const renderServiceContent = () => {
    const usageText = formatUsageLabel(undefined);
    const service = (selectedBlueprint as any)?.service ?? 'service';
    const serviceTitle = service === 'temper' ? 'Tempering' : 'Refine Equipment';
    return (
      <div className={'craftingDetailCard'}>
        <div className={'craftingDetailHeader'}>
          <div>
            <div className={'craftingDetailTitle'}>{serviceTitle}</div>
            <div className={'craftingDetailSub'}>{selectedBlueprint?.id ?? 'service'} </div>
          </div>
          <div className={'craftingDetailMeta'}>
            {service === 'temper'
              ? 'Add a safe bonus line to gear. Failures do nothing.'
              : 'Upgrades equipped weapon and accessory.'}
          </div>
        </div>

        <UsedForLinks usageText={usageText} className={'craftingUsedFor craftUsedFor'} />
        {renderModeSelector(true)}
        {service === 'temper' ? renderTemperContent() : renderRefineContent()}
      </div>
    );
  };

  const sidebarLabel = (blueprintId: string) => {
    const blueprint = blueprints.find((bp) => bp.id === blueprintId);
    if (!blueprint) return blueprintId;
    const output = blueprint.output;
    const outputItem = output?.itemId ? getItemDef(output.itemId) : null;
    return outputItem?.name ?? blueprint.name ?? blueprint.id;
  };

  const renderServiceResultCard = () => {
    if (!lastServiceResult) return null;
    const statsToShow: Array<{ key: keyof ForgeServiceResult['beforeStats']; label: string }> = [
      { key: 'hp', label: 'HP' },
      { key: 'atk', label: 'ATK' },
      { key: 'def', label: 'DEF' },
      { key: 'crit', label: 'Crit %' },
      { key: 'dodge', label: 'Dodge %' },
    ];

    const formatDelta = (key: keyof ForgeServiceResult['beforeStats']) => {
      const before = Number(lastServiceResult.beforeStats[key] ?? 0);
      const after = Number(lastServiceResult.afterStats[key] ?? 0);
      const diff = after - before;
      const sign = diff >= 0 ? '+' : '';
      return `${after.toFixed(0)} (${sign}${diff.toFixed(0)})`;
    };

    return (
      <div className={'forgeResultCard'}>
        <div className={'forgeResultHeader'}>
          <div className={'forgeResultTitle'}>
            {lastServiceResult.type === 'temper' ? 'Tempering result' : 'Refinement result'} ({
              lastServiceResult.slot
            })
          </div>
          {lastServiceResult.type === 'temper' && (
            <div className={'forgeResultSub'}>
              {lastServiceResult.success
                ? lastServiceResult.affix
                  ? `New affix: ${lastServiceResult.affix.label}`
                  : 'Temper proc succeeded.'
                : 'No temper proc this attempt.'}
              {lastServiceResult.procChancePct !== undefined &&
                ` Chance: ${lastServiceResult.procChancePct.toFixed(1)}%.`}
            </div>
          )}
        </div>
        <div className={'forgeResultGrid'}>
          {statsToShow.map((stat) => (
            <div key={stat.key} className={'forgeResultRow'}>
              <div className={'forgeResultLabel'}>{stat.label}</div>
              <div className={'forgeResultValue'}>{formatDelta(stat.key)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  let content: JSX.Element;

  content = (
    <div className={'forgePanel'}>
      <div className={'stationBanner craftPurposeBanner'}>
        <div>
          <div className={'stationBannerTitle'}>Forge</div>
          <div className={'stationBannerSubtitle'}>
            Craft runes and refine equipment to improve your combat performance.
          </div>
        </div>
        <div className={'stationBannerMeta'}>Queue size: {forgeQueue.length}</div>
      </div>

      {renderToolStrip()}

      <div className={'craftingLayout craftWorkspace'}>
        <div className={'craftingSidebar craftSidebar'}>
          <div className={'craftingSidebarHeader craftSidebarHeader'}>Blueprints</div>
          <div className={'craftingSidebarGroupLabel'}>Runes</div>
          <div className={'craftingList craftSidebarList'}>
            {runeBlueprints.map((blueprint) => {
              const isSelected = blueprint.id === selectedBlueprint?.id;
              return (
                <button
                  key={blueprint.id}
                  className={classNames('craftingListItem craftSidebarItem', {
                    'craftingListItem--active': isSelected,
                    'craftSidebarItem--active': isSelected,
                  })}
                  onClick={() => setSelectedBlueprintId(blueprint.id)}
                >
                  <div className={'craftingListName'}>{sidebarLabel(blueprint.id)}</div>
                  <div className={'craftingListSub'}>{blueprint.id}</div>
                </button>
              );
            })}
          </div>
          <div className={'craftingSidebarGroupLabel'}>Services</div>
          <div className={'craftingList craftSidebarList'}>
            {serviceBlueprints.length > 0 ? (
              serviceBlueprints.map((bp) => {
                const isSelected = bp.id === selectedBlueprint?.id;
                return (
                  <button
                    key={bp.id}
                    className={classNames('craftingListItem craftSidebarItem', {
                      'craftingListItem--active': isSelected,
                      'craftSidebarItem--active': isSelected,
                    })}
                    onClick={() => setSelectedBlueprintId(bp.id)}
                  >
                    <div className={'craftingListName'}>{sidebarLabel(bp.id)}</div>
                    <div className={'craftingListSub'}>{bp.id}</div>
                  </button>
                );
              })
            ) : (
              <div className={'forgeHint'}>No services unlocked.</div>
            )}
          </div>
        </div>

        <div className={'craftingMain craftMain'}>
          {!selectedBlueprint ? (
            <div className={'forgeEmpty'}>Select a blueprint to view details.</div>
          ) : isServiceBlueprint ? (
            renderServiceContent()
          ) : (
            renderCraftContent()
          )}

          {renderServiceResultCard()}

          <div className={'forgeSection'}>
            <div className={'forgeSectionHeader'}>
              <div className={'forgeSectionTitle'}>Forge Queue</div>
              <div className={'forgeSectionSub'}>Jobs process in order.</div>
            </div>

            {forgeQueue.length === 0 ? (
              <div className={'forgeEmpty'}>No forge jobs queued.</div>
            ) : (
              <div className={'forgeQueueList'}>
                {forgeQueue.map((job) => {
                  const blueprint = getForgeBlueprint(job.blueprintId);
                  const status = getForgeJobStatus(job, now);
                  const done = status.done;
                  const remainingMs = Math.max(0, job.endsAt - now);
                  const queueStatusMessage = queueStatus[job.id];

                  const label = blueprint
                    ? blueprint.type === 'service'
                      ? `Refine ${job.targetSlot ?? 'equipment'} +${job.qty}`
                      : (() => {
                          const outputItemId = blueprint.output?.itemId;
                          const outputName = outputItemId ? getItemDef(outputItemId)?.name ?? outputItemId : blueprint.id;
                          return `Craft ${outputName} x${job.qty}`;
                        })()
                    : job.blueprintId;

                  return (
                    <div key={job.id} className={'forgeQueueCard'}>
                      <div className={'forgeQueueHeader'}>
                        <div>
                          <div className={'forgeQueueName'}>{label}</div>
                          <div className={'forgeQueueMeta'}>{blueprint?.id ?? job.blueprintId}</div>
                        </div>
                        <div className={'forgeQueueTiming'}>
                          <div>{done ? 'Ready to claim' : 'In progress'}</div>
                          <div>{done ? '00:00' : formatDuration(remainingMs)}</div>
                        </div>
                      </div>
                      <div className={'forgeQueueActions'}>
                        <button
                          className={`worldScreenModuleButton ${done ? 'worldScreenModuleButton--active' : ''}`}
                          disabled={!done}
                          onClick={() => {
                            const result = claimForge(job.id) as { ok: boolean; error?: string; result?: ForgeServiceResult };
                            if (!result.ok) {
                              setQueueStatus((prev) => ({
                                ...prev,
                                [job.id]: { type: 'error', message: result.error },
                              }));
                              return;
                            }
                            if (result.result) {
                              setLastServiceResult(result.result);
                            }
                            setQueueStatus((prev) => ({
                              ...prev,
                              [job.id]: { type: 'success', message: 'Claimed' },
                            }));
                          }}
                        >
                          Claim
                        </button>
                      </div>
                      {queueStatusMessage && (
                        <div
                          className={`forgeStatus forgeStatus--${queueStatusMessage.type}`}
                          role={queueStatusMessage.type === 'error' ? 'alert' : 'status'}
                        >
                          {queueStatusMessage.message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!cityId) {
    content = (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No Forge in this city</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>This city does not host a forge station.</div>
      </div>
    );
  } else if (!blueprints.length) {
    content = (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No forge blueprints</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Forge blueprints were not found in content.</div>
      </div>
    );
  }

  return content;
}
