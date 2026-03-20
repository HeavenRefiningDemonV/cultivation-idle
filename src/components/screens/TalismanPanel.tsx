import { useEffect, useMemo, useState } from 'react';
import { formatPrice, getItemDef, useContentStore } from '../../stores/contentStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useProfessionStore } from '../../stores/professionStore';
import { greaterThanOrEqualTo, multiply } from '../../utils/numbers';
import { useBuffStore } from '../../stores/buffStore';
import { GameEvents } from '../../services/events/GameEvents';

interface TalismanPanelProps {
  cityId: string | null;
}

type StatusMessage = { type: 'success' | 'error'; message: string };

type CurrencyCosts = Partial<Record<'gold' | 'spiritStones' | 'merit', string>>;

type RecipeCostMap = Partial<Record<'gold' | 'spiritStones' | 'merit', number>>;

const MAX_QTY = 999;
const EMPTY_TALISMAN_RECIPES = Object.freeze([]) as ReadonlyArray<
  NonNullable<ReturnType<typeof useContentStore.getState>['raw']>['talisman_recipes'][number]
>;

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

function computeCosts(costs: RecipeCostMap | undefined, qty: number): CurrencyCosts {
  const totals: CurrencyCosts = {};
  if (!costs) return totals;
  (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
    const unit = costs[key];
    if (unit === undefined || unit === null) return;
    totals[key] = multiply(Math.max(0, unit), qty).toString();
  });
  return totals;
}

export function TalismanPanel({ cityId }: TalismanPanelProps) {
  const raw = useContentStore((state) => state.raw);
  const recipes = raw?.talisman_recipes ?? EMPTY_TALISMAN_RECIPES;
  const getQty = useInventoryStore((state) => state.getQty);
  const currencies = useInventoryStore((state) => state.currencies);
  const startTalisman = useProfessionStore((state) => state.startTalisman);
  const claimTalisman = useProfessionStore((state) => state.claimTalisman);
  const queue = useProfessionStore((state) => state.talismanQueue);
  const activeTalismans = useBuffStore((state) => state.activeTalismans);
  const purgeExpired = useBuffStore((state) => state.purgeExpired);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [recipeStatus, setRecipeStatus] = useState<Record<string, StatusMessage>>({});
  const [queueStatus, setQueueStatus] = useState<Record<string, StatusMessage>>({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(handle);
  }, []);

  useEffect(() => {
    const handle = window.setInterval(() => purgeExpired(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, [purgeExpired]);

  const visibleRecipes = useMemo(() => {
    if (!cityId) return recipes;
    return recipes.filter((recipe) => !recipe.unlocksAtCityId || recipe.unlocksAtCityId === cityId);
  }, [cityId, recipes]);

  const handleSetQty = (recipeId: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [recipeId]: clampQty(value) }));
  };

  const canCraftRecipe = (recipe: (typeof recipes)[number], qty: number): { ok: boolean; reason?: string } => {
    if (recipe.station && recipe.station !== 'talisman') {
      return { ok: false, reason: 'Wrong station' };
    }

    const inputs = recipe.inputs ?? {};
    for (const [itemId, baseQty] of Object.entries(inputs)) {
      const perJob = Math.floor(baseQty);
      if (!Number.isFinite(perJob) || perJob <= 0) continue;
      const required = perJob * qty;
      if (getQty(itemId) < required) {
        const itemName = getItemDef(itemId)?.name ?? itemId;
        return { ok: false, reason: `Need ${required} ${itemName}` };
      }
    }

    const costs = computeCosts((recipe as { costs?: RecipeCostMap; cost?: RecipeCostMap }).costs ?? recipe.cost, qty);
    const currencyKeys = Object.keys(costs) as Array<keyof CurrencyCosts>;
    for (const key of currencyKeys) {
      const required = costs[key];
      if (!required) continue;
      const current = currencies[key] ?? '0';
      if (!greaterThanOrEqualTo(current, required)) {
        return { ok: false, reason: `Need ${required} ${key}` };
      }
    }

    return { ok: true };
  };

  if (!cityId) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No Talisman Studio here</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>This city does not host a talisman studio.</div>
      </div>
    );
  }

  if (!recipes.length) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No talisman recipes</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Talisman recipes were not found in content.</div>
      </div>
    );
  }

  return (
    <div className={'talismanPanel'}>
      <div className={'talismanPanelHeader'}>
        <div>
          <div className={'talismanTitle'}>Talisman Studio</div>
          <div className={'talismanSubtitle'}>Queue size: {queue.length}</div>
        </div>
      </div>

      <div className={'talismanSections'}>
        <div className={'talismanSection'}>
          <div className={'talismanSectionHeader'}>
            <div className={'talismanSectionTitle'}>Active Talismans</div>
            <div className={'talismanSectionSub'}>Active bonuses (max per bonus type).</div>
          </div>
          {activeTalismans.length === 0 ? (
            <div className={'talismanQueueEmpty'}>No active talismans.</div>
          ) : (
            <div className={'talismanQueueList'}>
              {activeTalismans.map((entry) => {
                const itemName = getItemDef(entry.itemId)?.name ?? entry.itemId;
                const remainingMs = Math.max(0, entry.endsAt - now);
                const bonuses = entry.bonuses;
                const bonusParts = [
                  bonuses.goldDropBonusPct ? `Gold +${Math.round(bonuses.goldDropBonusPct * 100)}%` : null,
                  bonuses.matDropBonusPct ? `Mats +${Math.round(bonuses.matDropBonusPct * 100)}%` : null,
                  bonuses.fragmentDropBonusPct
                    ? `Fragments +${Math.round(bonuses.fragmentDropBonusPct * 100)}%`
                    : null,
                  bonuses.damageBonusPct ? `Damage +${Math.round(bonuses.damageBonusPct * 100)}%` : null,
                ].filter(Boolean);

                return (
                  <div key={entry.id} className={'talismanQueueCard'}>
                    <div className={'talismanQueueHeader'}>
                      <div>
                        <div className={'talismanQueueName'}>{itemName}</div>
                        <div className={'talismanQueueMeta'}>
                          {bonusParts.length > 0 ? bonusParts.join(' • ') : 'No bonuses'}
                        </div>
                      </div>
                      <div className={'talismanQueueTiming'}>
                        <div>Active</div>
                        <div>{formatDuration(remainingMs)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className={'talismanSection'}>
          <div className={'talismanSectionHeader'}>
            <div className={'talismanSectionTitle'}>Recipes</div>
            <div className={'talismanSectionSub'}>Craft talismans for later activation.</div>
          </div>

          <div className={'talismanRecipeList'}>
            {visibleRecipes.map((recipe) => {
              const qty = quantities[recipe.id] ?? 1;
              const inputs = recipe.inputs ?? {};
              const outputs = recipe.outputs ?? {};
              const costs = computeCosts((recipe as { costs?: RecipeCostMap; cost?: RecipeCostMap }).costs ?? recipe.cost, qty);
              const timePer = recipe.timeSec ?? (recipe as { timeSeconds?: number }).timeSeconds ?? 0;
              const totalTime = timePer * qty * 1000;
              const affordability = canCraftRecipe(recipe, qty);
              const status = recipeStatus[recipe.id];

              return (
                <div key={recipe.id} className={'talismanRecipeCard'}>
                  <div className={'talismanRecipeHeader'}>
                    <div>
                      <div className={'talismanRecipeName'}>{recipe.id}</div>
                      <div className={'talismanRecipeId'}>{recipe.station ?? 'talisman'} recipe</div>
                    </div>
                    <div className={'talismanRecipeMeta'}>
                      <div>Time per: {formatDuration(timePer * 1000)}</div>
                      <div>Total: {formatDuration(totalTime)}</div>
                    </div>
                  </div>

                  <div className={'talismanRecipeBody'}>
                    <div className={'talismanRecipeDetails'}>
                      <div>
                        <div className={'talismanRecipeLabel'}>Ingredients</div>
                        <ul>
                          {Object.entries(inputs).map(([itemId, baseQty]) => {
                            const perJob = Math.floor(baseQty);
                            if (!Number.isFinite(perJob) || perJob <= 0) return null;
                            const itemName = getItemDef(itemId)?.name ?? itemId;
                            return (
                              <li key={itemId}>
                                {itemName} x{perJob * qty}
                              </li>
                            );
                          })}
                          {Object.keys(inputs).length === 0 && <li>None</li>}
                        </ul>
                      </div>
                      <div>
                        <div className={'talismanRecipeLabel'}>Outputs</div>
                        <ul>
                          {Object.entries(outputs).map(([itemId, baseQty]) => {
                            const perJob = Math.floor(baseQty);
                            if (!Number.isFinite(perJob) || perJob <= 0) return null;
                            const itemName = getItemDef(itemId)?.name ?? itemId;
                            return (
                              <li key={itemId}>
                                {itemName} x{perJob * qty}
                              </li>
                            );
                          })}
                          {Object.keys(outputs).length === 0 && <li>None</li>}
                        </ul>
                      </div>
                      <div>
                        <div className={'talismanRecipeLabel'}>Costs</div>
                        <div>{formatPrice(costs) || 'Free'}</div>
                      </div>
                    </div>

                    <div className={'talismanRecipeControls'}>
                      <label className={'talismanRecipeLabel'}>
                        Qty
                        <input
                          type="number"
                          min={1}
                          max={MAX_QTY}
                          value={qty}
                          onChange={(e) => handleSetQty(recipe.id, Number(e.target.value))}
                        />
                      </label>
                      <div className={'talismanRecipeActions'}>
                        <button
                          className={`worldScreenModuleButton ${affordability.ok ? 'worldScreenModuleButton--active' : ''}`}
                          disabled={!affordability.ok}
                          onClick={() => {
                            GameEvents.emit({ type: 'talisman/paper_pickup', payload: {} });
                            GameEvents.emit({ type: 'talisman/ink_dip', payload: {} });
                            GameEvents.emit({ type: 'talisman/brush_stroke', payload: {} });
                            const result = startTalisman(recipe.id, qty);
                            if (!result.ok) {
                              setRecipeStatus((prev) => ({
                                ...prev,
                                [recipe.id]: { type: 'error', message: result.error },
                              }));
                              GameEvents.emit({ type: 'talisman/craft_result', payload: { ok: false } });
                              return;
                            }
                            setRecipeStatus((prev) => ({
                              ...prev,
                              [recipe.id]: { type: 'success', message: `Queued x${qty}` },
                            }));
                            GameEvents.emit({ type: 'talisman/seal_stamp', payload: {} });
                          }}
                        >
                          Craft
                        </button>
                        {!affordability.ok && affordability.reason && (
                          <div className={'talismanRecipeHint'}>{affordability.reason}</div>
                        )}
                      </div>
                    </div>
                    {status && (
                      <div
                        className={`talismanStatus talismanStatus--${status.type}`}
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
        </div>

        <div className={'talismanSection'}>
          <div className={'talismanSectionHeader'}>
            <div className={'talismanSectionTitle'}>Queue</div>
            <div className={'talismanSectionSub'}>Jobs process in order.</div>
          </div>

          {queue.length === 0 ? (
            <div className={'talismanQueueEmpty'}>No talisman jobs queued.</div>
          ) : (
            <div className={'talismanQueueList'}>
              {queue.map((job) => {
                const recipe = recipes.find((entry) => entry.id === job.recipeId);
                const remainingMs = Math.max(0, job.endsAt - now);
                const ready = now >= job.endsAt;
                const status = queueStatus[job.id];

                const label = recipe?.outputs
                  ? Object.keys(recipe.outputs)
                      .map((itemId) => getItemDef(itemId)?.name ?? itemId)
                      .join(', ')
                  : job.recipeId;

                return (
                  <div key={job.id} className={'talismanQueueCard'}>
                    <div className={'talismanQueueHeader'}>
                      <div>
                        <div className={'talismanQueueName'}>{label}</div>
                        <div className={'talismanQueueMeta'}>Qty: {job.qty}</div>
                      </div>
                      <div className={'talismanQueueTiming'}>
                        <div>{ready ? 'Ready to claim' : 'In progress'}</div>
                        <div>{ready ? '00:00' : formatDuration(remainingMs)}</div>
                      </div>
                    </div>
                    <div className={'talismanQueueActions'}>
                      <button
                        className={`worldScreenModuleButton ${ready ? 'worldScreenModuleButton--active' : ''}`}
                        disabled={!ready}
                        onClick={() => {
                          const result = claimTalisman(job.id);
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
                    {status && (
                      <div
                        className={`talismanStatus talismanStatus--${status.type}`}
                        role={status.type === 'error' ? 'alert' : 'status'}
                      >
                        {status.message}
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
