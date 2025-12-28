import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import { formatPrice, getForgeBlueprint, getItemDef, listForgeBlueprintsForCity } from '../../stores/contentStore';
import { useCraftSessionStore } from '../../stores/craftSessionStore';
import { useEquipmentStore } from '../../stores/equipmentStore';
import { useProfessionStore } from '../../stores/professionStore';
import { useUIStore } from '../../stores/uiStore';
import { isRefineBlueprint, isRuneBlueprint } from '../../content';
import { summarizePrompts } from '../../systems/crafting/assistedPrompts';
import { AssistedPromptCard } from '../crafting/AssistedPromptCard';
import { UsedForLinks } from '../crafting/UsedForLinks';

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

  const modeByStation = useCraftSessionStore((state) => state.modeByStation);
  const setCraftMode = useCraftSessionStore((state) => state.setMode);
  const startSession = useCraftSessionStore((state) => state.startSession);
  const abortSession = useCraftSessionStore((state) => state.abortSession);
  const activeSession = useCraftSessionStore((state) => state.activeSession);
  const updateSessionPrompts = useCraftSessionStore((state) => state.updateActiveSessionPrompts);
  const completePromptAction = useCraftSessionStore((state) => state.completePrompt);
  const claimSession = useCraftSessionStore((state) => state.claimActiveSession);
  const addNotification = useUIStore((state) => state.addNotification);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [recipeStatus, setRecipeStatus] = useState<Record<string, StatusMessage>>({});
  const [queueStatus, setQueueStatus] = useState<Record<string, StatusMessage>>({});
  const [sessionStatus, setSessionStatus] = useState<StatusMessage | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(handle);
  }, []);

  useEffect(() => {
    updateSessionPrompts(now);
  }, [now, updateSessionPrompts]);

  useEffect(() => {
    setSessionStatus(null);
  }, [activeSession?.sessionId]);

  const blueprints = useMemo(() => {
    if (!cityId) return [];
    return listForgeBlueprintsForCity({ cityId });
  }, [cityId]);

  const runeBlueprints = useMemo(
    () => blueprints.filter((blueprint) => isRuneBlueprint(blueprint)),
    [blueprints],
  );

  const refineBlueprint = useMemo(
    () => blueprints.find((blueprint) => isRefineBlueprint(blueprint)) ?? null,
    [blueprints],
  );

  useEffect(() => {
    const first = runeBlueprints[0]?.id ?? refineBlueprint?.id ?? null;
    if (!selectedBlueprintId || !blueprints.find((bp) => bp.id === selectedBlueprintId)) {
      setSelectedBlueprintId(first);
    }
  }, [blueprints, refineBlueprint?.id, runeBlueprints, selectedBlueprintId]);

  const selectedBlueprint = useMemo(
    () => blueprints.find((bp) => bp.id === selectedBlueprintId) ?? blueprints[0] ?? null,
    [blueprints, selectedBlueprintId],
  );

  const activeOtherStation = activeSession && activeSession.station !== 'forge';
  const activeForgeSession = activeSession?.station === 'forge' ? activeSession : null;
  const activePrompts = activeForgeSession?.prompts ?? [];
  const promptSummary = summarizePrompts(activePrompts);
  const availablePrompt = activePrompts.find((prompt) => prompt.status === 'AVAILABLE');
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

  if (!cityId) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No Forge in this city</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>This city does not host a forge station.</div>
      </div>
    );
  }

  if (!blueprints.length) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No forge blueprints</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Forge blueprints were not found in content.</div>
      </div>
    );
  }

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
            <div className={'craftingSessionNote'}>Sessions craft 1 batch for now.</div>
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
            {activeForgeSession && (
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

                {activeForgeSession.mode === 'assisted' && availablePrompt && (
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

  const renderServiceContent = () => {
    const usageText = formatUsageLabel(undefined);
    return (
      <div className={'craftingDetailCard'}>
        <div className={'craftingDetailHeader'}>
          <div>
            <div className={'craftingDetailTitle'}>Refine Equipment</div>
            <div className={'craftingDetailSub'}>{selectedBlueprint?.id ?? 'refine_service'}</div>
          </div>
          <div className={'craftingDetailMeta'}>Upgrades equipped weapon and accessory.</div>
        </div>

        <UsedForLinks usageText={usageText} className={'craftingUsedFor craftUsedFor'} />
        {renderModeSelector(true)}
        {renderRefineContent()}
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

  return (
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
            {refineBlueprint ? (
              <button
                className={classNames('craftingListItem craftSidebarItem', {
                  'craftingListItem--active': refineBlueprint.id === selectedBlueprint?.id,
                  'craftSidebarItem--active': refineBlueprint.id === selectedBlueprint?.id,
                })}
                onClick={() => setSelectedBlueprintId(refineBlueprint.id)}
              >
                <div className={'craftingListName'}>{sidebarLabel(refineBlueprint.id)}</div>
                <div className={'craftingListSub'}>{refineBlueprint.id}</div>
              </button>
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
                            const result = claimForge(job.id);
                            if (!result.ok) {
                              setQueueStatus((prev) => ({
                                ...prev,
                                [job.id]: { type: 'error', message: result.error },
                              }));
                              return;
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
}
