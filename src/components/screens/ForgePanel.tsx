import classNames from 'classnames';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPrice, getForgeBlueprint, getItemDef, listForgeBlueprintsForCity } from '../../stores/contentStore';
import { useCraftSessionStore } from '../../stores/craftSessionStore';
import { useEquipmentStore } from '../../stores/equipmentStore';
import { useProfessionStore } from '../../stores/professionStore';
import { isRefineBlueprint, isRuneBlueprint, isTemperBlueprint } from '../../content';
import { ForgeHandsOnSession } from '../crafting/ForgeHandsOnSession';
import { UsedForLinks } from '../crafting/UsedForLinks';
import type { ForgeSessionOutcome } from '../../systems/crafting/craftingTypes';
import type { ForgeServiceResult } from '../../services/forgeService';
import { RewardService } from '../../services/rewards';
import { listTemperAffixes } from '../../content/temperAffixes';
import { GameEvents } from '../../services/events/GameEvents';

interface ForgePanelProps {
  cityId: string | null;
}

type StatusMessage = { type: 'success' | 'error'; message: string };

const MAX_QTY = 999;

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

export function ForgePanel({ cityId }: ForgePanelProps) {
  const startForgeJob = useProfessionStore((state) => state.startForgeJob);
  const claimForgeJob = useProfessionStore((state) => state.claimForgeJob);
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
  const activeSession = useCraftSessionStore((state) => state.activeSession);

  const activeOtherStation = activeSession && activeSession.station !== 'forge';
  const activeForgeSession = activeSession?.station === 'forge' ? activeSession : null;

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [recipeStatus, setRecipeStatus] = useState<Record<string, StatusMessage>>({});
  const [queueStatus, setQueueStatus] = useState<Record<string, StatusMessage>>({});
  const [sessionStatus, setSessionStatus] = useState<StatusMessage | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [binderOpen, setBinderOpen] = useState(true);
  const [binderTab, setBinderTab] = useState<'all' | 'runes' | 'services'>('all');
  const [specSheetOpen, setSpecSheetOpen] = useState(false);
  const [lastForgeOutcome, setLastForgeOutcome] = useState<ForgeSessionOutcome | null>(null);
  const [lastServiceResult, setLastServiceResult] = useState<ForgeServiceResult | null>(null);
  const lastServiceRef = useRef<ForgeServiceResult | null>(null);
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
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1100) {
      setBinderOpen(false);
    }
  }, []);

  useEffect(() => {
    setSessionStatus(null);
  }, [activeSession?.sessionId]);

  useEffect(() => {
    setLastForgeOutcome(null);
  }, [activeSession?.sessionId]);

  useEffect(() => {
    if (!lastServiceRef.current && lastServiceResult) {
      GameEvents.emit({ type: 'forge/delta_panel_opened', payload: {} });
    }
    if (lastServiceRef.current && !lastServiceResult) {
      GameEvents.emit({ type: 'forge/delta_panel_closed', payload: {} });
    }
    lastServiceRef.current = lastServiceResult;
  }, [lastServiceResult]);

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

  const selectedBlueprint = useMemo(
    () => blueprints.find((bp) => bp.id === selectedBlueprintId) ?? blueprints[0] ?? null,
    [blueprints, selectedBlueprintId],
  );

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
  const isHandsOnMode = currentMode === 'handsOn';
  const queueMode = currentMode === 'assisted' ? 'ASSISTED' : 'IDLE';

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
          className={`worldScreenModuleButton ${
            !isHandsOnMode && equippedWeaponId && refineLevelBySlot.weapon < refineCap && refineWeaponAffordability.ok
              ? 'worldScreenModuleButton--active'
              : ''
          }`}
          disabled={isHandsOnMode || !equippedWeaponId || refineLevelBySlot.weapon >= refineCap || !refineWeaponAffordability.ok}
          onClick={() => {
            if (!refineBlueprint) return;
            const result = startForgeJob({
              blueprintId: refineBlueprint.id,
              mode: queueMode,
              qty: 1,
              targetSlot: 'weapon',
            });
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
        {isHandsOnMode && <div className={'forgeHint'}>Hands-on forging applies to crafted items only.</div>}
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
          className={`worldScreenModuleButton ${
            !isHandsOnMode && equippedAccessoryId && refineLevelBySlot.accessory < refineCap && refineAccessoryAffordability.ok
              ? 'worldScreenModuleButton--active'
              : ''
          }`}
          disabled={
            isHandsOnMode || !equippedAccessoryId || refineLevelBySlot.accessory >= refineCap || !refineAccessoryAffordability.ok
          }
          onClick={() => {
            if (!refineBlueprint) return;
            const result = startForgeJob({
              blueprintId: refineBlueprint.id,
              mode: queueMode,
              qty: 1,
              targetSlot: 'accessory',
            });
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
    const refineStatus = recipeStatus.refine_weapon ?? recipeStatus.refine_accessory;
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
                className={`worldScreenModuleButton ${affordability.ok && !isHandsOnMode ? 'worldScreenModuleButton--active' : ''}`}
                disabled={!affordability.ok || isHandsOnMode}
                onClick={() => {
                  const result = startForgeJob({
                    blueprintId: selectedBlueprint.id,
                    mode: queueMode,
                    qty,
                  });
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
              {isHandsOnMode && <div className={'forgeHint'}>Hands-on sessions start below.</div>}
            </div>
          </div>
        )}

        {currentMode === 'handsOn' && (
          <div className={'craftingSessionBlock craftSessionCard'}>
            <div className={'craftingSessionNote'}>
              Hands-on sessions craft 1 batch for now. Complete the minigame to finish.
            </div>
            {activeOtherStation && (
              <div className={'forgeHint'}>Another crafting session is active. Finish or abort it first.</div>
            )}
            {!activeForgeSession && !activeOtherStation && (
              <button
                className={'worldScreenModuleButton worldScreenModuleButton--active'}
                onClick={() => {
                  const result = startForgeJob({
                    blueprintId: selectedBlueprint.id,
                    mode: 'HANDS_ON',
                    qty: 1,
                  });
                  if (!result.ok) {
                    setSessionStatus({ type: 'error', message: result.error });
                    return;
                  }
                  setSessionStatus({ type: 'success', message: 'Hands-on session started' });
                }}
              >
                Start Hands-on session
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
            className={`worldScreenModuleButton ${!isHandsOnMode ? 'worldScreenModuleButton--active' : ''}`}
            disabled={isHandsOnMode}
            onClick={() => {
              const result = startForgeJob({
                blueprintId: selectedBlueprint.id,
                mode: queueMode,
                qty: 1,
                targetSlot: selectedServiceSlot,
              });
              if (!result.ok) {
                setRecipeStatus((prev) => ({ ...prev, [selectedBlueprint.id]: { type: 'error', message: result.error } }));
                return;
              }
              setRecipeStatus((prev) => ({
                ...prev,
                [selectedBlueprint.id]: { type: 'success', message: `Tempering started (${queueMode.toLowerCase()})` },
              }));
            }}
          >
            Temper ({queueMode === 'ASSISTED' ? 'Assisted' : 'Idle'})
          </button>
          {isHandsOnMode && <div className={'forgeHint'}>Hands-on forging applies to crafted items only.</div>}
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

  const renderForgeStatusChip = () => {
    if (activeForgeSession) {
      return <span className="forgeStatusChip forgeStatusChip--active">Hands-on active</span>;
    }
    if (forgeQueue.length > 0) {
      return (
        <span className="forgeStatusChip forgeStatusChip--working">
          Queue running • {forgeQueue.length}
        </span>
      );
    }
    return <span className="forgeStatusChip">Idle</span>;
  };

  const renderResourceStrip = () => {
    const parts: Array<{ label: string }> = [];
    parts.push({ label: `Mode: ${currentMode === 'handsOn' ? 'Hands-on' : currentMode === 'assisted' ? 'Assisted' : 'Idle'}` });
    parts.push({ label: `Queue: ${forgeQueue.length}` });
    return (
      <div className="forgeTopResources">
        {parts.map((part) => (
          <div key={part.label} className="forgeTopResourceChip">
            {part.label}
          </div>
        ))}
      </div>
    );
  };

  const renderBlueprintBinder = () => {
    const hasRunes = runeBlueprints.length > 0;
    const hasServices = serviceBlueprints.length > 0;
    const showTabs = hasRunes && hasServices;
    const list =
      binderTab === 'services'
        ? serviceBlueprints
        : binderTab === 'runes'
          ? runeBlueprints
          : [...runeBlueprints, ...serviceBlueprints];

    return (
      <div className="forgeBinder">
        <div className="forgeBinderHeader">
          <div className="forgeBinderTitle">Blueprints</div>
          <button
            type="button"
            className="forgeBinderToggle"
            onClick={() => setBinderOpen((prev) => !prev)}
            aria-label={binderOpen ? 'Collapse binder' : 'Expand binder'}
          >
            {binderOpen ? '⟨' : '⟩'}
          </button>
        </div>
        {showTabs ? (
          <div className="forgeBinderTabs">
            {(['all', 'runes', 'services'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={classNames('forgeBinderTab', { 'forgeBinderTab--active': binderTab === tab })}
                onClick={() => setBinderTab(tab)}
              >
                {tab === 'all' ? 'All' : tab === 'runes' ? 'Runes' : 'Services'}
              </button>
            ))}
          </div>
        ) : (
          <div className="forgeBinderTabs">
            <button type="button" className="forgeBinderTab forgeBinderTab--active">
              All
            </button>
          </div>
        )}
        <div className="forgeBlueprintList">
          {list.length === 0 ? (
            <div className="forgeEmpty">No blueprints yet.</div>
          ) : (
            list.map((blueprint) => {
              const isSelected = blueprint.id === selectedBlueprint?.id;
              const canCraft =
                blueprint.type === 'service' ? true : canStartForge(blueprint.id, 1).ok;
              return (
                <button
                  key={blueprint.id}
                  type="button"
                  className={classNames('forgeBlueprintRow', {
                    'forgeBlueprintRow--active': isSelected,
                  })}
                  onClick={() => {
                    setSelectedBlueprintId(blueprint.id);
                    GameEvents.emit({
                      type: 'crafting/recipe_selected',
                      payload: { station: 'forge', recipeId: blueprint.id },
                    });
                  }}
                >
                  <span className="forgeBlueprintIcon">📜</span>
                  <span className="forgeBlueprintName">{sidebarLabel(blueprint.id)}</span>
                  <span
                    className={classNames('forgeBlueprintDot', {
                      'forgeBlueprintDot--ready': canCraft,
                    })}
                    aria-hidden="true"
                  />
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderWorkbenchStage = () => {
    if (!selectedBlueprint) {
      return (
        <div className="forgeWorkbenchEmpty">
          <div className="forgeWorkbenchEmptyTitle">Select a blueprint from the binder</div>
          <div className="forgeWorkbenchEmptyHint">Forging happens here. Heat, hammer, temper.</div>
        </div>
      );
    }

    const output = selectedBlueprint.output;
    const outputItem = output?.itemId ? getItemDef(output.itemId) : null;
    const outputName = outputItem?.name ?? output?.itemId ?? selectedBlueprint.name ?? selectedBlueprint.id;
    const qty = quantities[selectedBlueprint.id] ?? 1;
    const affordability = selectedBlueprint.type === 'service' ? null : canStartForge(selectedBlueprint.id, qty);
    const canQueue = affordability?.ok ?? true;
    const service = (selectedBlueprint as any)?.service ?? 'service';
    const isService = selectedBlueprint.type === 'service';
    const timePerMs = selectedBlueprint.timeSec * 1000;
    const totalTimeMs = selectedBlueprint.timeSec * qty * 1000;

    const handleQueueCraft = (amount: number) => {
      if (selectedBlueprint.type === 'service') return;
      const result = startForgeJob({
        blueprintId: selectedBlueprint.id,
        mode: queueMode,
        qty: amount,
      });
      if (!result.ok) {
        setRecipeStatus((prev) => ({
          ...prev,
          [selectedBlueprint.id]: { type: 'error', message: result.error },
        }));
        return;
      }
      setRecipeStatus((prev) => ({
        ...prev,
        [selectedBlueprint.id]: { type: 'success', message: `Queued x${amount}` },
      }));
    };

    const handleRefine = (targetSlot: 'weapon' | 'accessory') => {
      if (!refineBlueprint) return;
      const result = startForgeJob({
        blueprintId: refineBlueprint.id,
        mode: queueMode,
        qty: 1,
        targetSlot,
      });
      if (!result.ok) {
        setRecipeStatus((prev) => ({
          ...prev,
          [`refine_${targetSlot}`]: { type: 'error', message: result.error },
        }));
        return;
      }
      setRecipeStatus((prev) => ({
        ...prev,
        [`refine_${targetSlot}`]: { type: 'success', message: 'Queued refine (+1)' },
      }));
    };

    const handleTemper = () => {
      const result = startForgeJob({
        blueprintId: selectedBlueprint.id,
        mode: queueMode,
        qty: 1,
        targetSlot: selectedServiceSlot,
      });
      if (!result.ok) {
        setRecipeStatus((prev) => ({ ...prev, [selectedBlueprint.id]: { type: 'error', message: result.error } }));
        return;
      }
      setRecipeStatus((prev) => ({
        ...prev,
        [selectedBlueprint.id]: { type: 'success', message: `Tempering started (${queueMode.toLowerCase()})` },
      }));
    };

    return (
      <div className="forgeWorkbenchCard">
        <div className="forgeWorkbenchHeader">
          <div>
            <div className="forgeWorkbenchTitle">{outputName}</div>
            <div className="forgeWorkbenchMeta">{selectedBlueprint.id}</div>
          </div>
          <div className="forgeWorkbenchBadges">
            <span className="forgeBadge">{isService ? (service === 'temper' ? 'Temper' : 'Refine') : 'Craft'}</span>
          </div>
        </div>

        <div className="forgeWorkbenchHero">
          <div className="forgeWorkbenchSilhouette">🛠️</div>
        </div>

        {!isService && (
          <div className="forgeRequirements">
            {selectedBlueprint.costs.items.length === 0 ? (
              <div className="forgeRequirementChip">Free</div>
            ) : (
              selectedBlueprint.costs.items.map((item) => {
                const itemDef = getItemDef(item.itemId);
                const itemName = itemDef?.name ?? item.itemId;
                return (
                  <div key={item.itemId} className="forgeRequirementChip">
                    <span className="forgeRequirementIcon">⛏️</span>
                    {itemName} x{item.qty * qty}
                  </div>
                );
              })
            )}
          </div>
        )}

        {isService && service === 'temper' && (
          <div className="forgeServiceSlots">
            <button
              type="button"
              className={classNames('forgeServiceSlot', { 'forgeServiceSlot--active': selectedServiceSlot === 'weapon' })}
              onClick={() => setSelectedServiceSlot('weapon')}
            >
              Weapon
            </button>
            <button
              type="button"
              className={classNames('forgeServiceSlot', {
                'forgeServiceSlot--active': selectedServiceSlot === 'accessory',
              })}
              onClick={() => setSelectedServiceSlot('accessory')}
            >
              Accessory
            </button>
          </div>
        )}

        <div className="forgeActionRow">
          {!isService && currentMode !== 'handsOn' && (
            <>
              <label className="forgeQtyInput">
                Qty
                <input
                  type="number"
                  min={1}
                  max={MAX_QTY}
                  value={qty}
                  onChange={(e) => handleSetQty(selectedBlueprint.id, Number(e.target.value))}
                />
              </label>
              <button
                type="button"
                className={classNames('forgePrimaryButton', { 'forgePrimaryButton--active': canQueue })}
                disabled={!canQueue}
                onClick={() => handleQueueCraft(qty)}
              >
                Start forging
              </button>
              <div className="forgeSecondaryActions">
                <button type="button" className="forgeSecondaryButton" onClick={() => handleQueueCraft(1)}>
                  Queue x1
                </button>
                <button type="button" className="forgeSecondaryButton" onClick={() => handleQueueCraft(5)}>
                  Queue x5
                </button>
              </div>
            </>
          )}

          {!isService && currentMode === 'handsOn' && (
            <div className="forgeHandsOnBlock">
              {activeOtherStation && (
                <div className="forgeHint">Another crafting session is active. Finish or abort it first.</div>
              )}
              {!activeForgeSession && !activeOtherStation && (
                <button
                  type="button"
                  className="forgePrimaryButton forgePrimaryButton--active"
                  onClick={() => {
                    const result = startForgeJob({
                      blueprintId: selectedBlueprint.id,
                      mode: 'HANDS_ON',
                      qty: 1,
                    });
                    if (!result.ok) {
                      setSessionStatus({ type: 'error', message: result.error });
                      return;
                    }
                    setSessionStatus({ type: 'success', message: 'Hands-on session started' });
                  }}
                >
                  Start hands-on session
                </button>
              )}
              {activeForgeSession && activeForgeSession.mode === 'handsOn' && (
                <div className="forgeHandsOnSession">
                  <ForgeHandsOnSession
                    session={activeForgeSession}
                    now={now}
                    blueprintName={outputName}
                    bonus={selectedBlueprint.handsOnBonus ?? activeForgeSession.script.handsOnBonus}
                    onOutcome={(outcome) => {
                      setLastForgeOutcome(outcome);
                      setSessionStatus({ type: 'success', message: 'Hands-on forge complete' });
                    }}
                  />
                </div>
              )}
              {sessionStatus && <div className={`forgeStatus forgeStatus--${sessionStatus.type}`}>{sessionStatus.message}</div>}
            </div>
          )}

          {isService && service === 'temper' && (
            <button
              type="button"
              className="forgePrimaryButton forgePrimaryButton--active"
              disabled={isHandsOnMode}
              onClick={handleTemper}
            >
              Temper ({queueMode === 'ASSISTED' ? 'Assisted' : 'Idle'})
            </button>
          )}

          {isService && service !== 'temper' && (
            <div className="forgeSecondaryActions">
              <button type="button" className="forgeSecondaryButton" onClick={() => handleRefine('weapon')}>
                Refine weapon
              </button>
              <button type="button" className="forgeSecondaryButton" onClick={() => handleRefine('accessory')}>
                Refine accessory
              </button>
            </div>
          )}
        </div>

        {!isService && affordability && !affordability.ok && affordability.reason && (
          <div className="forgeHint">{affordability.reason}</div>
        )}
        {isService && service !== 'temper' && refineStatus && (
          <div className={`forgeStatus forgeStatus--${refineStatus.type}`}>{refineStatus.message}</div>
        )}

        <div className="forgeSpecSheet">
          <button type="button" className="forgeSpecToggle" onClick={() => setSpecSheetOpen((prev) => !prev)}>
            {specSheetOpen ? 'Hide details' : 'Show details'}
          </button>
          {specSheetOpen && (
            <div className="forgeSpecContent">
              <div className="forgeSpecSummary">
                <div>Time per: {formatDuration(timePerMs)}</div>
                <div>Total: {formatDuration(totalTimeMs)}</div>
              </div>
              {isService ? renderServiceContent() : renderCraftContent()}
              {renderToolStrip()}
              {renderServiceResultCard()}
            </div>
          )}
        </div>

        {recipeStatus[selectedBlueprint.id] && (
          <div
            className={`forgeStatus forgeStatus--${recipeStatus[selectedBlueprint.id].type}`}
            role={recipeStatus[selectedBlueprint.id].type === 'error' ? 'alert' : 'status'}
          >
            {recipeStatus[selectedBlueprint.id].message}
          </div>
        )}
      </div>
    );
  };

  const renderCoolingRack = () => {
    const inProgress = forgeQueue.filter((job) => !getForgeJobStatus(job, now).done);
    const ready = forgeQueue.filter((job) => getForgeJobStatus(job, now).done);

    return (
      <div className="forgeCoolingRackInner">
        <div className="forgeRackSection">
          <div className="forgeRackTitle">In Progress</div>
          {inProgress.length === 0 ? (
            <div className="forgeHint">No items heating.</div>
          ) : (
            <div className="forgeRackList">
              {inProgress.map((job) => {
                const blueprint = getForgeBlueprint(job.blueprintId);
                const remainingMs = Math.max(0, job.endsAt - now);
                const durationMs = Math.max(1, job.endsAt - job.startedAt);
                const progress = Math.min(1, Math.max(0, (now - job.startedAt) / durationMs));
                const outputItemId = blueprint?.output?.itemId;
                const outputName = outputItemId ? getItemDef(outputItemId)?.name ?? outputItemId : blueprint?.id ?? job.blueprintId;
                return (
                  <div key={job.id} className="forgeRackItem">
                    <div className="forgeRackItemHeader">
                      <span className="forgeRackIcon">🔥</span>
                      <div className="forgeRackName">{outputName}</div>
                      <div className="forgeRackTime">{formatDuration(remainingMs)}</div>
                    </div>
                    <div className="forgeRackBar">
                      <div className="forgeRackBarFill" style={{ width: `${progress * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="forgeRackSection">
          <div className="forgeRackTitle">Ready to Collect</div>
          {ready.length === 0 ? (
            <div className="forgeHint">Nothing cooling.</div>
          ) : (
            <div className="forgeRackList">
              {ready.map((job) => {
                const blueprint = getForgeBlueprint(job.blueprintId);
                const outputItemId = blueprint?.output?.itemId;
                const outputName = outputItemId ? getItemDef(outputItemId)?.name ?? outputItemId : blueprint?.id ?? job.blueprintId;
                const queueStatusMessage = queueStatus[job.id];
                return (
                  <div key={job.id} className="forgeRackItem">
                    <div className="forgeRackItemHeader">
                      <span className="forgeRackIcon">❄️</span>
                      <div className="forgeRackName">{outputName}</div>
                      <button
                        type="button"
                        className="forgeSecondaryButton"
                        onClick={() => {
                          const result = claimForgeJob(job.id) as {
                            ok: boolean;
                            error?: string;
                            result?: { serviceResult?: ForgeServiceResult };
                          };
                          if (!result.ok) {
                            setQueueStatus((prev) => ({
                              ...prev,
                              [job.id]: { type: 'error', message: result.error },
                            }));
                            return;
                          }
                          if (result.result?.serviceResult) {
                            setLastServiceResult(result.result.serviceResult);
                          }
                          setQueueStatus((prev) => ({
                            ...prev,
                            [job.id]: { type: 'success', message: 'Claimed' },
                          }));
                        }}
                      >
                        Collect
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

        <div className="forgeRackTip">Better fuel increases throughput.</div>
      </div>
    );
  };

  let content: JSX.Element;

  content = (
    <div className={'forgePanel forgePanel--v2'}>
      <header className={'forgeTopRibbon'}>
        <div className="forgeTopLeft">
          <div className="forgeTitle">Forge</div>
          <div className="forgeSubtitle">Smelt → Shape → Temper → Collect</div>
        </div>
        <div className="forgeTopCenter">{renderForgeStatusChip()}</div>
        <div className="forgeTopRight">{renderResourceStrip()}</div>
      </header>
      <main className={'forgeStage'}>
        <div
          className={classNames('forgeStageGrid', {
            'forgeStageGrid--binderClosed': !binderOpen,
          })}
        >
          <aside className={`forgeBlueprintBinder ${binderOpen ? 'is-open' : 'is-closed'}`}>
            {renderBlueprintBinder()}
          </aside>
          <section className="forgeWorkbenchStage">{renderWorkbenchStage()}</section>
          <aside className="forgeCoolingRack">{renderCoolingRack()}</aside>
        </div>
      </main>
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
