import { useEffect, useMemo, useState } from 'react';
import { formatPrice, getItemDef, getForgeBlueprint, listForgeBlueprintsForCity } from '../../stores/contentStore';
import { useEquipmentStore } from '../../stores/equipmentStore';
import { useProfessionStore } from '../../stores/professionStore';
import { isRefineBlueprint, isRuneBlueprint } from '../../content';

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

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [recipeStatus, setRecipeStatus] = useState<Record<string, StatusMessage>>({});
  const [queueStatus, setQueueStatus] = useState<Record<string, StatusMessage>>({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(handle);
  }, []);

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

  const handleSetQty = (blueprintId: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [blueprintId]: clampQty(value) }));
  };

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

  return (
    <div className={'forgePanel'}>
      <div className={'forgePanelHeader'}>
        <div>
          <div className={'forgeTitle'}>Forge</div>
          <div className={'forgeSubtitle'}>Queue size: {forgeQueue.length}</div>
        </div>
      </div>

      <div className={'forgeSections'}>
        <div className={'forgeSection'}>
          <div className={'forgeSectionHeader'}>
            <div className={'forgeSectionTitle'}>Rune Crafting</div>
            <div className={'forgeSectionSub'}>Craft rune blueprints available in this city.</div>
          </div>

          {runeBlueprints.length === 0 ? (
            <div className={'forgeEmpty'}>No rune blueprints unlocked here.</div>
          ) : (
            <div className={'forgeBlueprintList'}>
              {runeBlueprints.map((blueprint) => {
                const qty = quantities[blueprint.id] ?? 1;
                const output = blueprint.output;
                const outputItem = output?.itemId ? getItemDef(output.itemId) : null;
                const outputName = outputItem?.name ?? output?.itemId ?? blueprint.id;
                const outputQty = (output?.qty ?? 1) * qty;
                const timePerMs = blueprint.timeSec * 1000;
                const totalTimeMs = blueprint.timeSec * qty * 1000;
                const status = recipeStatus[blueprint.id];
                const affordability = canStartForge(blueprint.id, qty);

                return (
                  <div key={blueprint.id} className={'forgeBlueprintCard'}>
                    <div className={'forgeBlueprintHeader'}>
                      <div>
                        <div className={'forgeBlueprintName'}>{outputName}</div>
                        <div className={'forgeBlueprintMeta'}>{blueprint.id}</div>
                      </div>
                      <div className={'forgeBlueprintMetaRight'}>
                        <div>Time per: {formatDuration(timePerMs)}</div>
                        <div>Total: {formatDuration(totalTimeMs)}</div>
                      </div>
                    </div>

                    <div className={'forgeBlueprintBody'}>
                      <div className={'forgeBlueprintDetails'}>
                        <div>
                          <div className={'forgeBlueprintLabel'}>Inputs</div>
                          <ul>
                            {blueprint.costs.items.map((item) => {
                              const itemDef = getItemDef(item.itemId);
                              const itemName = itemDef?.name ?? item.itemId;
                              return (
                                <li key={item.itemId}>
                                  {itemName} x{item.qty * qty}
                                </li>
                              );
                            })}
                            {blueprint.costs.items.length === 0 && <li>None</li>}
                          </ul>
                        </div>
                        <div>
                          <div className={'forgeBlueprintLabel'}>Costs</div>
                          <div>
                            {formatPrice({
                              gold: blueprint.costs.gold ? (blueprint.costs.gold * qty).toString() : undefined,
                              spiritStones: blueprint.costs.spiritStones
                                ? (blueprint.costs.spiritStones * qty).toString()
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

                      <div className={'forgeBlueprintControls'}>
                        <label className={'forgeBlueprintLabel'}>
                          Qty
                          <input
                            type="number"
                            min={1}
                            max={MAX_QTY}
                            value={qty}
                            onChange={(e) => handleSetQty(blueprint.id, Number(e.target.value))}
                          />
                        </label>
                        <div className={'forgeBlueprintActions'}>
                          <button
                            className={`worldScreenModuleButton ${affordability.ok ? 'worldScreenModuleButton--active' : ''}`}
                            disabled={!affordability.ok}
                            onClick={() => {
                              const result = startForge(blueprint.id, qty);
                              if (!result.ok) {
                                setRecipeStatus((prev) => ({
                                  ...prev,
                                  [blueprint.id]: { type: 'error', message: result.error },
                                }));
                                return;
                              }
                              setRecipeStatus((prev) => ({
                                ...prev,
                                [blueprint.id]: { type: 'success', message: `Queued x${qty}` },
                              }));
                            }}
                          >
                            Craft
                          </button>
                          {!affordability.ok && affordability.reason && (
                            <div className={'forgeHint'}>{affordability.reason}</div>
                          )}
                        </div>
                      </div>

                      {status && (
                        <div
                          className={`forgeStatus forgeStatus--${status.type}`}
                          role={status.type === 'error' ? 'alert' : 'status'}
                        >
                          {status.message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={'forgeSection'}>
          <div className={'forgeSectionHeader'}>
            <div className={'forgeSectionTitle'}>Refine Equipment</div>
            <div className={'forgeSectionSub'}>Upgrade equipped weapon and accessory.</div>
          </div>

          {!refineBlueprint ? (
            <div className={'forgeEmpty'}>No refine service available in this city.</div>
          ) : (
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
                  disabled={
                    !equippedWeaponId ||
                    refineLevelBySlot.weapon >= refineCap ||
                    !refineWeaponAffordability.ok
                  }
                  onClick={() => {
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
                    {equippedAccessoryId
                      ? getItemDef(equippedAccessoryId)?.name ?? equippedAccessoryId
                      : 'None equipped'}
                  </div>
                </div>
                <div className={'forgeRefineMeta'}>
                  Refine: {refineLevelBySlot.accessory} / {refineCap}
                </div>
                <div className={'forgeRefineMeta'}>Bonus: +{refineLevelBySlot.accessory * 2}%</div>
                <button
                  className={'worldScreenModuleButton worldScreenModuleButton--active'}
                  disabled={
                    !equippedAccessoryId ||
                    refineLevelBySlot.accessory >= refineCap ||
                    !refineAccessoryAffordability.ok
                  }
                  onClick={() => {
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
                {accessoryRefineBlockedReason && (
                  <div className={'forgeHint'}>{accessoryRefineBlockedReason}</div>
                )}
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
          )}
        </div>

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
  );
}
