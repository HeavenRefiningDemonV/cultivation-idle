import { useEffect, useMemo, useState } from 'react';
import { formatPrice, getItemDef, useContentStore } from '../../stores/contentStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useProfessionStore } from '../../stores/professionStore';
import { greaterThanOrEqualTo, multiply } from '../../utils/numbers';

interface AlchemyPanelProps {
  cityId: string | null;
}

type StatusMessage = { type: 'success' | 'error'; message: string };

type CurrencyCosts = Partial<Record<'gold' | 'spiritStones' | 'merit', string>>;

type RecipeCostMap = Partial<Record<'gold' | 'spiritStones' | 'merit', number>>;

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

function computeCosts(costs: RecipeCostMap | undefined, qty: number): CurrencyCosts {
  const totals: CurrencyCosts = {};
  if (!costs) return totals;
  (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
    const unit = costs[key];
    if (unit === undefined || unit === null) return;
    totals[key] = multiply(unit, qty).toString();
  });
  return totals;
}

export function AlchemyPanel({ cityId }: AlchemyPanelProps) {
  const recipes = useContentStore((state) => state.raw?.alchemy_recipes ?? []);
  const itemMap = useContentStore((state) => state.maps.itemsById);
  const startAlchemy = useProfessionStore((state) => state.startAlchemy);
  const claimAlchemy = useProfessionStore((state) => state.claimAlchemy);
  const queue = useProfessionStore((state) => state.alchemyQueue);
  const getQty = useInventoryStore((state) => state.getQty);
  const currencies = useInventoryStore((state) => state.currencies);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [recipeStatus, setRecipeStatus] = useState<Record<string, StatusMessage>>({});
  const [queueStatus, setQueueStatus] = useState<Record<string, StatusMessage>>({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(handle);
  }, []);

  const visibleRecipes = useMemo(() => {
    if (!cityId) return recipes;
    return recipes.filter((recipe) => !recipe.unlocksAtCityId || recipe.unlocksAtCityId === cityId);
  }, [cityId, recipes]);

  const handleSetQty = (recipeId: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [recipeId]: clampQty(value) }));
  };

  const canCraftRecipe = (recipe: (typeof recipes)[number], qty: number): { ok: boolean; reason?: string } => {
    const inputs = recipe.inputs ?? {};
    for (const [itemId, baseQty] of Object.entries(inputs)) {
      const perJob = Math.floor(baseQty);
      if (!Number.isFinite(perJob) || perJob <= 0) continue;
      const required = perJob * qty;
      if (getQty(itemId) < required) {
        const itemName = itemMap[itemId]?.name ?? itemId;
        return { ok: false, reason: `Need ${itemName}` };
      }
    }

    const costs = computeCosts((recipe as { costs?: RecipeCostMap }).costs, qty);
    const currencyKeys = Object.keys(costs) as Array<keyof CurrencyCosts>;
    for (const key of currencyKeys) {
      const required = costs[key];
      if (!required) continue;
      const current = currencies[key] ?? '0';
      if (!greaterThanOrEqualTo(current, required)) {
        return { ok: false, reason: `Need ${key}` };
      }
    }

    return { ok: true };
  };

  if (!cityId) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No Alchemy in this city</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>This city does not host an alchemy station.</div>
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No alchemy recipes</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Alchemy recipes were not found in content.</div>
      </div>
    );
  }

  return (
    <div className={'alchemyPanel'}>
      <div className={'alchemyPanelHeader'}>
        <div>
          <div className={'alchemyTitle'}>Alchemy</div>
          <div className={'alchemySubtitle'}>Queue size: {queue.length}</div>
        </div>
      </div>

      <div className={'alchemySections'}>
        <div className={'alchemySection'}>
          <div className={'alchemySectionHeader'}>
            <div className={'alchemySectionTitle'}>Recipes</div>
            <div className={'alchemySectionSub'}>Select a recipe and craft a batch.</div>
          </div>

          <div className={'alchemyRecipeList'}>
            {visibleRecipes.map((recipe) => {
              const qty = quantities[recipe.id] ?? 1;
              const inputs = recipe.inputs ?? {};
              const outputs = recipe.outputs ?? {};
              const costs = computeCosts((recipe as { costs?: RecipeCostMap }).costs, qty);
              const timePer = recipe.timeSec ?? 0;
              const totalTime = timePer * qty * 1000;
              const affordability = canCraftRecipe(recipe, qty);
              const status = recipeStatus[recipe.id];

              return (
                <div key={recipe.id} className={'alchemyRecipeCard'}>
                  <div className={'alchemyRecipeHeader'}>
                    <div>
                      <div className={'alchemyRecipeName'}>{recipe.id}</div>
                      <div className={'alchemyRecipeId'}>{recipe.station ?? 'alchemy'} recipe</div>
                    </div>
                    <div className={'alchemyRecipeMeta'}>
                      <div>Time per: {formatDuration(timePer * 1000)}</div>
                      <div>Total: {formatDuration(totalTime)}</div>
                    </div>
                  </div>

                  <div className={'alchemyRecipeBody'}>
                    <div className={'alchemyRecipeDetails'}>
                      <div>
                        <div className={'alchemyRecipeLabel'}>Ingredients</div>
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
                        <div className={'alchemyRecipeLabel'}>Outputs</div>
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
                        <div className={'alchemyRecipeLabel'}>Costs</div>
                        <div>{formatPrice(costs) || 'Free'}</div>
                      </div>
                    </div>

                    <div className={'alchemyRecipeControls'}>
                      <label className={'alchemyRecipeLabel'}>
                        Qty
                        <input
                          type="number"
                          min={1}
                          max={MAX_QTY}
                          value={qty}
                          onChange={(e) => handleSetQty(recipe.id, Number(e.target.value))}
                        />
                      </label>
                      <div className={'alchemyRecipeActions'}>
                        <button
                          className={`worldScreenModuleButton ${affordability.ok ? 'worldScreenModuleButton--active' : ''}`}
                          disabled={!affordability.ok}
                          onClick={() => {
                            const result = startAlchemy(recipe.id, qty);
                            if (!result.ok) {
                              setRecipeStatus((prev) => ({
                                ...prev,
                                [recipe.id]: { type: 'error', message: result.error },
                              }));
                              return;
                            }
                            setRecipeStatus((prev) => ({
                              ...prev,
                              [recipe.id]: { type: 'success', message: `Queued x${qty}` },
                            }));
                          }}
                        >
                          Craft
                        </button>
                        {!affordability.ok && affordability.reason && (
                          <div className={'alchemyRecipeHint'}>{affordability.reason}</div>
                        )}
                      </div>
                    </div>
                    {status && (
                      <div
                        className={`alchemyStatus alchemyStatus--${status.type}`}
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

        <div className={'alchemySection'}>
          <div className={'alchemySectionHeader'}>
            <div className={'alchemySectionTitle'}>Queue</div>
            <div className={'alchemySectionSub'}>Jobs process one at a time.</div>
          </div>

          {queue.length === 0 ? (
            <div className={'alchemyQueueEmpty'}>No alchemy jobs queued.</div>
          ) : (
            <div className={'alchemyQueueList'}>
              {queue.map((job) => {
                const recipe = recipes.find((entry) => entry.id === job.recipeId);
                const remainingMs = Math.max(0, job.endsAt - now);
                const ready = now >= job.endsAt;
                const status = queueStatus[job.id];

                return (
                  <div key={job.id} className={'alchemyQueueCard'}>
                    <div className={'alchemyQueueHeader'}>
                      <div>
                        <div className={'alchemyQueueName'}>{recipe?.id ?? job.recipeId}</div>
                        <div className={'alchemyQueueMeta'}>Qty: {job.qty}</div>
                      </div>
                      <div className={'alchemyQueueTiming'}>
                        <div>{ready ? 'Ready to claim' : 'In progress'}</div>
                        <div>{ready ? '00:00' : formatDuration(remainingMs)}</div>
                      </div>
                    </div>
                    <div className={'alchemyQueueActions'}>
                      <button
                        className={`worldScreenModuleButton ${ready ? 'worldScreenModuleButton--active' : ''}`}
                        disabled={!ready}
                        onClick={() => {
                          const result = claimAlchemy(job.id);
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
                        className={`alchemyStatus alchemyStatus--${status.type}`}
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
