import classNames from 'classnames';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPrice, getItemDef, useContentStore } from '../../stores/contentStore.js';
import { listAlchemyRecipesForCity } from '../../content/alchemy.js';
import { useCraftSessionStore } from '../../stores/craftSessionStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useProfessionStore } from '../../stores/professionStore.js';
import { useRecipeMasteryStore } from '../../stores/recipeMasteryStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { summarizePrompts } from '../../systems/crafting/assistedPrompts.js';
import { getAlchemyTimeMultiplier } from '../../systems/crafting/alchemyBonuses.js';
import { multiply, greaterThanOrEqualTo } from '../../utils/numbers.js';
import { formatDurationHMS } from '../../utils/timeFormat.js';
import { AssistedPromptCard } from '../crafting/AssistedPromptCard.js';
import { HandsOnAlchemySession } from '../crafting/HandsOnAlchemySession.js';
import { UsedForLinks } from '../crafting/UsedForLinks.js';
import { AlchemyResultModal } from '../modals/AlchemyResultModal.js';
import type { AlchemyHandsOnResult } from '../../systems/crafting/craftingTypes.js';
import { GameEvents } from '../../services/events/GameEvents.js';

interface AlchemyPanelProps {
  cityId: string | null;
  embedded?: boolean;
}

type StatusMessage = { type: 'success' | 'error'; message: string };
type QueueToast = { kind: 'success' | 'error'; message: string } | null;

type CurrencyCosts = Partial<Record<'gold' | 'spiritStones' | 'merit', string>>;

type RecipeCostMap = Partial<Record<'gold' | 'spiritStones' | 'merit', number>>;
type BrewState = 'ready' | 'brewing' | 'queued';

interface BrewLedgerRow {
  jobId: string;
  recipeId: string;
  name: string;
  qty: number;
  startedAt: number;
  endsAt: number;
  state: BrewState;
  progress01: number;
  timeLabel: string;
}

const MAX_QTY = 999;
const EMPTY_ALCHEMY_RECIPES = Object.freeze([]) as ReadonlyArray<
  NonNullable<ReturnType<typeof useContentStore.getState>['raw']>['alchemy_recipes'][number]
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
    totals[key] = multiply(unit, qty).toString();
  });
  return totals;
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

const masteryThresholds: Array<{ value: 25 | 50 | 75 | 100; label: string }> = [
  { value: 25, label: 'Assisted prompts improve yield more.' },
  { value: 50, label: 'Batch crafting unlocked (x5 options).' },
  { value: 75, label: 'Alchemy time reduced slightly.' },
  { value: 100, label: 'Idle: higher baseline quality.' },
];

function getThresholdLabel(value: number): string {
  const match = masteryThresholds.find((entry) => entry.value === value);
  return match?.label ?? '';
}

export function AlchemyPanel({ cityId, embedded = false }: AlchemyPanelProps) {
  const raw = useContentStore((state) => state.raw);
  const recipes = useMemo(() => (raw ? listAlchemyRecipesForCity(cityId) : EMPTY_ALCHEMY_RECIPES), [cityId, raw]);
  const startAlchemy = useProfessionStore((state) => state.startAlchemy);
  const claimAlchemy = useProfessionStore((state) => state.claimAlchemy);
  const queue = useProfessionStore((state) => state.alchemyQueue);
  const getQty = useInventoryStore((state) => state.getQty);
  const currencies = useInventoryStore((state) => state.currencies);
  const getAlchemyMastery = useRecipeMasteryStore((state) => state.getAlchemyMastery);
  const getAlchemyThresholdInfo = useRecipeMasteryStore((state) => state.getAlchemyThresholdInfo);

  const modeByStation = useCraftSessionStore((state) => state.modeByStation);
  const setCraftMode = useCraftSessionStore((state) => state.setMode);
  const startSession = useCraftSessionStore((state) => state.startSession);
  const abortSession = useCraftSessionStore((state) => state.abortSession);
  const activeSession = useCraftSessionStore((state) => state.activeSession);
  const updateSessionPrompts = useCraftSessionStore((state) => state.updateActiveSessionPrompts);
  const completePromptAction = useCraftSessionStore((state) => state.completePrompt);
  const claimSession = useCraftSessionStore((state) => state.claimActiveSession);
  const markBackgroundResolving = useCraftSessionStore((state) => state.markBackgroundResolving);

  const addNotification = useUIStore((state) => state.addNotification);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [recipeStatus, setRecipeStatus] = useState<Record<string, StatusMessage>>({});
  const [queueToast, setQueueToast] = useState<QueueToast>(null);
  const [sessionStatus, setSessionStatus] = useState<StatusMessage | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ result: AlchemyHandsOnResult; recipeId: string } | null>(null);
  const readyJobsRef = useRef<Set<string>>(new Set());
  const readyNotificationPrimedRef = useRef(false);

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

  useEffect(() => {
    if (!queueToast) return;
    const handle = window.setTimeout(() => setQueueToast(null), 4500);
    return () => window.clearTimeout(handle);
  }, [queueToast]);

  const visibleRecipes = recipes;

  useEffect(() => {
    if (visibleRecipes.length === 0) return;
    const firstId = visibleRecipes[0]?.id;
    if (!selectedRecipeId || !visibleRecipes.find((recipe) => recipe.id === selectedRecipeId)) {
      setSelectedRecipeId(firstId);
    }
  }, [selectedRecipeId, visibleRecipes]);

  const selectedRecipe = useMemo(
    () => visibleRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? visibleRecipes[0] ?? null,
    [selectedRecipeId, visibleRecipes],
  );

  const handleSetQty = (recipeId: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [recipeId]: clampQty(value) }));
  };

  const computeSessionQty = (recipeId: string | null) => {
    if (!recipeId) return 1;
    const masteryValue = getAlchemyMastery(recipeId);
    return masteryValue >= 50 ? 5 : 1;
  };

  const canCraftRecipe = (recipe: (typeof recipes)[number], qty: number): { ok: boolean; reason?: string } => {
    const inputs = recipe.inputs ?? {};
    for (const [itemId, baseQty] of Object.entries(inputs)) {
      const perJob = Math.floor(baseQty);
      if (!Number.isFinite(perJob) || perJob <= 0) continue;
      const required = perJob * qty;
      if (getQty(itemId) < required) {
        const itemName = getItemDef(itemId)?.name ?? itemId;
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

  const selectedInputs = useMemo(() => selectedRecipe?.inputs ?? {}, [selectedRecipe]);
  const selectedOutputs = useMemo(() => selectedRecipe?.outputs ?? {}, [selectedRecipe]);
  const qty = selectedRecipe ? quantities[selectedRecipe.id] ?? 1 : 1;
  const masteryInfo = selectedRecipe
    ? getAlchemyThresholdInfo(selectedRecipe.id)
    : { mastery: 0, nextThreshold: null, unlocked: [] as number[] };
  const timePer = selectedRecipe?.timeSec ?? 0;
  const timeMultiplier = getAlchemyTimeMultiplier(masteryInfo.mastery ?? 0);
  const totalTime = timePer * timeMultiplier * qty * 1000;
  const costs = computeCosts((selectedRecipe as { costs?: RecipeCostMap })?.costs, qty);
  const affordability = selectedRecipe ? canCraftRecipe(selectedRecipe, qty) : { ok: false };
  const primaryOutputId = Object.keys(selectedOutputs)[0];
  const primaryUsage = formatUsageLabel(getItemDef(primaryOutputId)?.usage);
  const maxCraftable = useMemo(() => {
    if (!selectedRecipe) return MAX_QTY;
    const inputs = Object.entries(selectedInputs);
    if (inputs.length === 0) return MAX_QTY;
    const ratios = inputs
      .map(([itemId, baseQty]) => {
        const perJob = Math.max(1, Math.floor(baseQty));
        const current = getQty(itemId);
        return Math.floor(current / perJob);
      })
      .filter((value) => Number.isFinite(value));
    if (ratios.length === 0) return MAX_QTY;
    return clampQty(Math.max(1, Math.min(...ratios)));
  }, [getQty, selectedInputs, selectedRecipe]);

  const currentMode = modeByStation.alchemy;
  const activeOtherStation = activeSession && activeSession.station !== 'alchemy';
  const activeAlchemySession = activeSession?.station === 'alchemy' ? activeSession : null;
  const isHandsOnActive = activeAlchemySession?.mode === 'handsOn';
  const activePrompts = activeAlchemySession?.prompts ?? [];
  const promptSummary = summarizePrompts(activePrompts);
  const availablePrompt = activePrompts.find((prompt) => prompt.status === 'AVAILABLE');
  const sessionRemainingMs = activeAlchemySession ? Math.max(0, activeAlchemySession.endsAt - now) : 0;
  const sessionReady = activeAlchemySession ? now >= activeAlchemySession.endsAt : false;
  const masteryPercent = Math.min(100, Math.max(0, masteryInfo.mastery));
  const nextUnlockText = masteryInfo.nextThreshold
    ? `${masteryInfo.nextThreshold}: ${getThresholdLabel(masteryInfo.nextThreshold)}`
    : 'All unlocks reached';
  const sessionQty = computeSessionQty(selectedRecipe?.id ?? null);
  const resultRecipe = lastResult ? recipes.find((entry) => entry.id === lastResult.recipeId) : null;
  const resultOutputId = resultRecipe ? Object.keys(resultRecipe.outputs ?? {})[0] : undefined;
  const resultRecipeName =
    (resultOutputId ? getItemDef(resultOutputId)?.name : undefined) ??
    resultRecipe?.id ??
    lastResult?.recipeId ??
    'Alchemy result';

  const handleResultClose = () => setLastResult(null);
  const handleResultCraftAgain = () => {
    if (!lastResult) return;
    const qtyForSession = computeSessionQty(lastResult.recipeId);
    const outcome = startSession({
      station: 'alchemy',
      mode: 'handsOn',
      sourceId: lastResult.recipeId,
      qty: qtyForSession,
      now: Date.now(),
    });
    if (!outcome.ok) {
      setSessionStatus({ type: 'error', message: `Cannot start: ${outcome.reason}` });
      return;
    }
    setSessionStatus({ type: 'success', message: 'Hands-on session started' });
    setLastResult(null);
  };

  const handleResultQueueIdle = () => {
    if (!lastResult) return;
    const qtyForQueue = computeSessionQty(lastResult.recipeId);
    const outcome = startAlchemy(lastResult.recipeId, qtyForQueue);
    if (!outcome.ok) {
      setRecipeStatus((prev) => ({
        ...prev,
        [lastResult.recipeId]: { type: 'error', message: outcome.error },
      }));
      return;
    }
    setRecipeStatus((prev) => ({
      ...prev,
      [lastResult.recipeId]: { type: 'success', message: `Queued x${qtyForQueue}` },
    }));
    setLastResult(null);
  };

  useEffect(() => {
    return () => {
      if (activeAlchemySession?.mode === 'handsOn' && activeAlchemySession.cursor.backgroundResolveAt == null) {
        markBackgroundResolving('navigated');
      }
    };
  }, [activeAlchemySession, markBackgroundResolving]);

  const queueModel = useMemo(() => {
    const readyJobs = queue.filter((job) => now >= job.endsAt);
    const activeBrewingJob = queue.find((job) => now >= job.startedAt && now < job.endsAt) ?? null;
    const nextQueuedJob = queue.find((job) => now < job.startedAt) ?? null;

    return {
      readyJobs,
      readyCount: readyJobs.length,
      activeBrewingJob,
      nextQueuedJob,
      queuedCount: queue.length,
    };
  }, [now, queue]);

  const brewLedgerRows = useMemo<BrewLedgerRow[]>(() => {
    return queue.map((job) => {
      const recipe = recipes.find((entry) => entry.id === job.recipeId);
      const outputId = recipe ? Object.keys(recipe.outputs ?? {})[0] : undefined;
      const name = (outputId ? getItemDef(outputId)?.name : undefined) ?? recipe?.id ?? job.recipeId;
      const isReady = now >= job.endsAt;
      const isBrewing = now >= job.startedAt && now < job.endsAt;
      const state: BrewState = isReady ? 'ready' : isBrewing ? 'brewing' : 'queued';
      const duration = Math.max(1, job.endsAt - job.startedAt);
      const progress01 = isReady ? 1 : isBrewing ? Math.min(1, (now - job.startedAt) / duration) : 0;
      const timeLabel = isReady
        ? 'Ready'
        : isBrewing
          ? `${formatDurationHMS(job.endsAt - now)} remaining`
          : `Starts in ${formatDurationHMS(job.startedAt - now)}`;

      return {
        jobId: job.id,
        recipeId: job.recipeId,
        name,
        qty: job.qty,
        startedAt: job.startedAt,
        endsAt: job.endsAt,
        state,
        progress01,
        timeLabel,
      };
    });
  }, [now, queue, recipes]);

  const readyLedgerRows = useMemo(
    () => brewLedgerRows.filter((row) => row.state === 'ready').sort((a, b) => a.endsAt - b.endsAt),
    [brewLedgerRows],
  );
  const brewingLedgerRow = brewLedgerRows.find((row) => row.state === 'brewing') ?? null;
  const ledgerLastEndsAt = brewLedgerRows.reduce((max, row) => Math.max(max, row.endsAt), 0);
  const ledgerEta =
    ledgerLastEndsAt > 0 ? formatDurationHMS(Math.max(0, ledgerLastEndsAt - now)) : null;

  const activeJobRecipe = queueModel.activeBrewingJob
    ? recipes.find((entry) => entry.id === queueModel.activeBrewingJob?.recipeId)
    : null;
  const activeJobOutputId = activeJobRecipe ? Object.keys(activeJobRecipe.outputs ?? {})[0] : undefined;
  const activeJobName =
    (activeJobOutputId ? getItemDef(activeJobOutputId)?.name : undefined) ??
    activeJobRecipe?.id ??
    queueModel.activeBrewingJob?.recipeId ??
    'Unknown brew';
  const activeJobRemaining = queueModel.activeBrewingJob
    ? Math.max(0, queueModel.activeBrewingJob.endsAt - now)
    : 0;
  const activeJobDuration = queueModel.activeBrewingJob
    ? Math.max(1, queueModel.activeBrewingJob.endsAt - queueModel.activeBrewingJob.startedAt)
    : 1;
  const brewProgress = queueModel.activeBrewingJob
    ? Math.min(1, Math.max(0, (now - queueModel.activeBrewingJob.startedAt) / activeJobDuration))
    : 0;
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - (queueModel.readyCount > 0 ? 1 : brewProgress));
  const cauldronState =
    queueModel.readyCount > 0
      ? 'ready'
      : queueModel.activeBrewingJob
        ? 'brewing'
        : queueModel.queuedCount > 0
          ? 'queued'
          : 'idle';
  const showSteam = Boolean(queueModel.activeBrewingJob || activeAlchemySession);

  useEffect(() => {
    const readyIds = new Set(readyLedgerRows.map((row) => row.jobId));
    if (!readyNotificationPrimedRef.current) {
      readyNotificationPrimedRef.current = true;
      readyJobsRef.current = readyIds;
      return;
    }
    readyLedgerRows.forEach((row) => {
      if (!readyJobsRef.current.has(row.jobId)) {
        addNotification('success', `Brew complete: ${row.name}`, 3000);
      }
    });
    readyJobsRef.current = readyIds;
  }, [addNotification, readyLedgerRows]);

  if (!cityId) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No Apothecary brew station in this city</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>This city does not host a live brew station this semester.</div>
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>No brew recipes</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>Live Apothecary brew recipes were not found in content.</div>
      </div>
    );
  }

  return (
    <div className={'alchemyPanel alchemyPanel--workbench'}>
      {!embedded && (
        <div className={'alchemyPanelHeader stationBanner craftPurposeBanner'}>
          <div>
            <div className={'stationBannerTitle'}>Apothecary Brew</div>
            <div className={'stationBannerSubtitle'}>
              Convert reagents into combat and cultivation readiness.
            </div>
          </div>
          <div className={'stationBannerMeta'}>Queue size: {queue.length}</div>
        </div>
      )}

      <div className={'alchemyStage'}>
        <aside className={'alchemyRecipeRack'}>
          <div className={'alchemyRecipeRackHeader'}>Recipe Rack</div>
          <div className={'alchemyRecipeRackList'}>
            {visibleRecipes.map((recipe) => {
              const outputEntries = Object.entries(recipe.outputs ?? {});
              const firstOutput = outputEntries[0];
              const outputName = firstOutput ? getItemDef(firstOutput[0])?.name ?? firstOutput[0] : recipe.id;
              const isSelected = recipe.id === selectedRecipe?.id;
              const rackTime = formatDuration((recipe.timeSec ?? 0) * 1000);
              const canCraft = canCraftRecipe(recipe, 1).ok;

              return (
                <button
                  key={recipe.id}
                  className={classNames('alchemyRecipeRackItem', {
                    'alchemyRecipeRackItem--active': isSelected,
                  })}
                  onClick={() => {
                    setSelectedRecipeId(recipe.id);
                    GameEvents.emit({
                      type: 'crafting/recipe_selected',
                      payload: { station: 'alchemy', recipeId: recipe.id },
                    });
                  }}
                >
                  <div className={'alchemyRecipeRackRow'}>
                    <div className={'alchemyRecipeRackName'}>{outputName}</div>
                    <span
                      className={classNames('alchemyRecipeRackStatus', {
                        'alchemyRecipeRackStatus--ready': canCraft,
                      })}
                      aria-hidden="true"
                    />
                  </div>
                  <div className={'alchemyRecipeRackMeta'}>Time: {rackTime}</div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className={'alchemyWorkbench'}>
          <section
            className={classNames('alchemyWorkbenchCard alchemyWorkbenchCard--cauldron', {
              'is-ready': queueModel.readyCount > 0,
            })}
            data-state={cauldronState}
            data-steam={showSteam}
          >
            <div className={'alchemyCauldronHeader'}>
              <div className={'alchemyWorkbenchTitle'}>Cauldron</div>
              {queueModel.activeBrewingJob && (
                <span className={'alchemyBrewPill'}>
                  Brewing · {formatDuration(activeJobRemaining)}
                </span>
              )}
            </div>
            <div className={'alchemyCauldronBody'}>
              <div className={'alchemyCauldronViz'} aria-hidden="true">
                <div className={'alchemyCauldronRing'}>
                  <svg viewBox="0 0 120 120" className={'alchemyCauldronRingSvg'}>
                    <circle
                      className={'alchemyCauldronRingTrack'}
                      cx="60"
                      cy="60"
                      r={ringRadius}
                    />
                    <circle
                      className={'alchemyCauldronRingProgress'}
                      cx="60"
                      cy="60"
                      r={ringRadius}
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                </div>
                <div className={'alchemyCauldronPot'}>
                  <div className={'alchemyCauldronLiquid'} />
                  <div className={'alchemyCauldronBubbles'} />
                  <div className={'alchemyCauldronSteam'} />
                </div>
              </div>
              <div className={'alchemyCauldronCopy'}>
                {queueModel.queuedCount === 0 && (
                  <>
                    <div className={'alchemyWorkbenchSummary'}>
                      The cauldron is cold. Select a recipe and begin refining.
                    </div>
                    <div className={'alchemyCauldronSubtext'}>Queue is empty.</div>
                  </>
                )}
                {queueModel.readyCount > 0 && (
                  <>
                    <div className={'alchemyWorkbenchSummary'}>
                      Ready to decant: {queueModel.readyCount} batch
                      {queueModel.readyCount > 1 ? 'es' : ''}.
                    </div>
                    <div className={'alchemyCauldronSubtext'}>
                      Claim to move results into your pouch.
                    </div>
                  </>
                )}
                {queueModel.readyCount === 0 && queueModel.activeBrewingJob && (
                  <>
                    <div className={'alchemyWorkbenchSummary'}>
                      Brewing: {activeJobName} ×{queueModel.activeBrewingJob.qty}
                    </div>
                    <div className={'alchemyCauldronSubtext'}>
                      Time remaining: {formatDuration(activeJobRemaining)}
                    </div>
                  </>
                )}
                {queueModel.readyCount === 0 &&
                  !queueModel.activeBrewingJob &&
                  queueModel.queuedCount > 0 && (
                    <div className={'alchemyWorkbenchSummary'}>
                      Queue primed with {queueModel.queuedCount} batch
                      {queueModel.queuedCount > 1 ? 'es' : ''}.
                    </div>
                  )}
              </div>
            </div>
            {queueModel.readyCount > 0 && (
              <div className={'alchemyCauldronActions'}>
                <button
                  className={'worldScreenModuleButton worldScreenModuleButton--active alchemyClaimButton alchemyClaimButton--ready'}
                  onClick={() => {
                    const readyJob = queueModel.readyJobs[0];
                    if (!readyJob) return;
                    const result = claimAlchemy(readyJob.id);
                    if (!result.ok) {
                      setQueueToast({ kind: 'error', message: result.error });
                      return;
                    }
                    setQueueToast({ kind: 'success', message: 'Claimed 1 batch.' });
                  }}
                >
                  Claim Ready
                </button>
                {queueModel.readyCount > 1 && (
                  <button
                    className={'worldScreenModuleButton alchemyClaimButton alchemyClaimButton--ready'}
                    onClick={() => {
                      let claimed = 0;
                      for (const job of queueModel.readyJobs) {
                        const result = claimAlchemy(job.id);
                        if (!result.ok) {
                          setQueueToast({ kind: 'error', message: result.error });
                          return;
                        }
                        claimed += 1;
                      }
                      setQueueToast({
                        kind: 'success',
                        message: `Claimed ${claimed} batch${claimed === 1 ? '' : 'es'}.`,
                      });
                    }}
                  >
                    Claim All Ready ({queueModel.readyCount})
                  </button>
                )}
              </div>
            )}
          </section>

          {!selectedRecipe ? (
            <section className={'alchemyWorkbenchCard alchemyWorkbenchCard--empty'}>
              <div className={'alchemyQueueEmpty'}>Select a recipe to view details.</div>
            </section>
          ) : (
            <section className={'alchemyWorkbenchCard alchemyWorkbenchCard--selectedRecipe craftingDetailCard'}>
              <div className={'craftingDetailHeader'}>
                <div>
                  <div className={'craftingDetailTitle'}>
                    {getItemDef(primaryOutputId)?.name ?? selectedRecipe.id}
                  </div>
                  <div className={'craftingDetailSub'}>{selectedRecipe.id}</div>
                </div>
                <div className={'craftingDetailMeta'}>
                  <div>Time per: {formatDuration(timePer * 1000)}</div>
                  <div>Total: {formatDuration(totalTime)}</div>
                </div>
              </div>

              <UsedForLinks usageText={primaryUsage} className={'craftingUsedFor craftUsedFor'} />

              <div className={'alchemyMastery'}>
                <div className={'alchemyMasteryHeader'}>
                  <span>Mastery: {masteryInfo.mastery}/100</span>
                  <span className={'alchemyMasteryNext'}>Next unlock: {nextUnlockText}</span>
                </div>
                <div className={'alchemyMasteryBar'}>
                  <div className={'alchemyMasteryBarFill'} style={{ width: `${masteryPercent}%` }} />
                </div>
              </div>

              <div className={'alchemyRecipeDetails'}>
                <div>
                  <div className={'alchemyRecipeLabel'}>Ingredients</div>
                  <ul>
                    {Object.entries(selectedInputs).map(([itemId, baseQty]) => {
                      const perJob = Math.floor(baseQty);
                      if (!Number.isFinite(perJob) || perJob <= 0) return null;
                      const itemName = getItemDef(itemId)?.name ?? itemId;
                      return (
                        <li key={itemId}>
                          {itemName} x{perJob * qty}
                        </li>
                      );
                    })}
                    {Object.keys(selectedInputs).length === 0 && <li>None</li>}
                  </ul>
                </div>
                <div>
                  <div className={'alchemyRecipeLabel'}>Outputs</div>
                  <ul>
                    {Object.entries(selectedOutputs).map(([itemId, baseQty]) => {
                      const perJob = Math.floor(baseQty);
                      if (!Number.isFinite(perJob) || perJob <= 0) return null;
                      const itemName = getItemDef(itemId)?.name ?? itemId;
                      return (
                        <li key={itemId}>
                          {itemName} x{perJob * qty}
                        </li>
                      );
                    })}
                    {Object.keys(selectedOutputs).length === 0 && <li>None</li>}
                  </ul>
                </div>
                <div>
                  <div className={'alchemyRecipeLabel'}>Costs</div>
                  <div>{formatPrice(costs) || 'Free'}</div>
                </div>
              </div>

              <div className={'craftingModeSelector'}>
                <div className={'craftingModeLabel'}>Mode</div>
                <div className={'craftingModeButtons craftModeTabs'}>
                  {(['idle', 'assisted', 'handsOn'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={classNames('craftingModeButton craftModeTab', {
                        'craftingModeButton--active': currentMode === mode,
                        'craftModeTab--active': currentMode === mode,
                      })}
                      onClick={() => setCraftMode('alchemy', mode)}
                    >
                      {mode === 'idle' ? 'Idle' : mode === 'assisted' ? 'Assisted' : 'Hands-on'}
                    </button>
                  ))}
                </div>
                <div className={'craftModeNote'}>
                  Assisted: optional prompts improve this batch. Ignoring prompts has no penalty.
                </div>
              </div>

              {currentMode === 'idle' && (
                <div className={'alchemyRecipeControls'}>
                  <label className={'alchemyRecipeLabel'}>
                    Qty
                    <input
                      type="number"
                      min={1}
                      max={MAX_QTY}
                      value={qty}
                      onChange={(e) => handleSetQty(selectedRecipe.id, Number(e.target.value))}
                    />
                  </label>
                  <div className={'alchemyQtyButtons'}>
                    <button
                      type="button"
                      className={'worldScreenModuleButton'}
                      onClick={() => handleSetQty(selectedRecipe.id, 1)}
                    >
                      x1
                    </button>
                    <button
                      type="button"
                      className={classNames('worldScreenModuleButton', {
                        'worldScreenModuleButton--active': masteryInfo.mastery >= 50,
                      })}
                      disabled={masteryInfo.mastery < 50}
                      onClick={() => handleSetQty(selectedRecipe.id, Math.min(5, maxCraftable))}
                    >
                      x5
                    </button>
                    <button
                      type="button"
                      className={'worldScreenModuleButton'}
                      onClick={() => handleSetQty(selectedRecipe.id, maxCraftable)}
                    >
                      Max
                    </button>
                  </div>
                  <div className={'alchemyRecipeActions'}>
                    <button
                      className={`worldScreenModuleButton ${affordability.ok ? 'worldScreenModuleButton--active' : ''}`}
                      disabled={!affordability.ok}
                      title={!affordability.ok ? affordability.reason : undefined}
                      onClick={() => {
                        const result = startAlchemy(selectedRecipe.id, qty);
                        if (!result.ok) {
                          setRecipeStatus((prev) => ({
                            ...prev,
                            [selectedRecipe.id]: { type: 'error', message: result.error },
                          }));
                          return;
                        }
                        setRecipeStatus((prev) => ({
                          ...prev,
                          [selectedRecipe.id]: { type: 'success', message: `Queued x${qty}` },
                        }));
                      }}
                    >
                      Craft
                    </button>
                    {!affordability.ok && affordability.reason && (
                      <>
                        <div className={'alchemyRecipeHint'}>{affordability.reason}</div>
                        <span className={'alchemySealBadge'} title={affordability.reason}>
                          Blocked
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {currentMode !== 'idle' && (
                <div className={'alchemySessionStarter'}>
                  <div className={'alchemySessionNote'}>
                    Sessions craft {sessionQty} batch{sessionQty > 1 ? 'es' : ''} at a time.
                  </div>
                  {activeOtherStation && (
                    <div className={'alchemyRecipeHint'}>
                      Another crafting session is active. Finish or abort it first.
                    </div>
                  )}
                  {!activeAlchemySession && !activeOtherStation && (
                    <>
                      <button
                        className={'worldScreenModuleButton worldScreenModuleButton--active'}
                        onClick={() => {
                          const result = startSession({
                            station: 'alchemy',
                            mode: currentMode as 'assisted' | 'handsOn',
                            sourceId: selectedRecipe.id,
                            qty: sessionQty,
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
                      {currentMode === 'handsOn' && (
                        <div className={'alchemySessionHint'}>
                          Hands-on sessions appear below once started.
                        </div>
                      )}
                    </>
                  )}
                  {sessionStatus && (
                    <div className={`alchemyStatus alchemyStatus--${sessionStatus.type}`}>
                      {sessionStatus.message}
                    </div>
                  )}
                </div>
              )}

              {recipeStatus[selectedRecipe.id] && (
                <div
                  className={`alchemyStatus alchemyStatus--${recipeStatus[selectedRecipe.id].type}`}
                  role={recipeStatus[selectedRecipe.id].type === 'error' ? 'alert' : 'status'}
                >
                  {recipeStatus[selectedRecipe.id].message}
                </div>
              )}
            </section>
          )}

          {activeAlchemySession && (
            <section className={'alchemyWorkbenchCard alchemyWorkbenchCard--handsOn'}>
              {isHandsOnActive ? (
                <div className={'craftingSessionDetails craftSessionCard'}>
                  <div className={'craftingSessionRow'}>
                    <div>Hands-on session</div>
                    <div className={'craftingSessionMeta'}>{activeAlchemySession.sourceId}</div>
                  </div>
                  <div className={'craftingSessionMeta'}>
                    <div>{sessionReady ? 'Ready to claim' : `Time left: ${formatDuration(sessionRemainingMs)}`}</div>
                  </div>
                  <HandsOnAlchemySession
                    session={activeAlchemySession}
                    now={now}
                    onResult={(result) => setLastResult({ result, recipeId: activeAlchemySession.sourceId })}
                  />
                  <div className={'craftingSessionActions'}>
                    <div className={'craftingSessionNote'}>
                      Complete within the hands-on UI to grant rewards immediately.
                    </div>
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
              ) : (
                <div className={'craftingSessionDetails craftSessionCard'}>
                  <div className={'craftingSessionRow'}>
                    <div>Session active</div>
                    <div className={'craftingSessionMeta'}>
                      {activeAlchemySession.mode} · {activeAlchemySession.sourceId}
                    </div>
                  </div>
                  <div className={'craftingSessionMeta'}>
                    <div>{sessionReady ? 'Ready to claim' : `Time left: ${formatDuration(sessionRemainingMs)}`}</div>
                    <div>
                      Assisted: {promptSummary.completed}/{promptSummary.total} prompts completed
                    </div>
                  </div>

                  {activeAlchemySession.mode === 'assisted' && availablePrompt && (
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
                        const toastLabel =
                          availablePrompt.type === 'ADD_CATALYST' ? 'Catalyst added' : 'Flame stabilized';
                        addNotification('success', `${toastLabel}${bonusLabel}`, 2500);
                        setSessionStatus({ type: 'success', message: `${toastLabel}${bonusLabel}` });
                      }}
                    />
                  )}

                  <div className={'craftingStepList'}>
                    {activeAlchemySession.script.steps.map((step) => (
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
                          const message =
                            result.reason === 'not_ready' ? 'Session not finished yet' : 'Unable to claim session';
                          setSessionStatus({ type: 'error', message });
                          return;
                        }
                        const bonusTotal = (result.bonus?.bonusItems ?? []).reduce(
                          (sum, entry) => sum + entry.qty,
                          0,
                        );
                        const summaryText =
                          result.bonus && result.bonus.total > 0
                            ? `Assisted bonus: +${bonusTotal} (${result.bonus.completed}/${result.bonus.total} prompts).`
                            : 'Session claimed at baseline.';
                        setSessionStatus({ type: 'success', message: summaryText });
                      }}
                    >
                      Claim batch
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
            </section>
          )}

          <section className={'alchemyWorkbenchCard alchemyWorkbenchCard--queue'}>
            <div className={'alchemyLedgerHeader'}>
              <div>
                <div className={'alchemySectionTitle'}>Brew Ledger</div>
                <div className={'alchemyLedgerSummary'}>
                  {brewLedgerRows.length} queued • {readyLedgerRows.length} ready
                  {brewingLedgerRow ? ` • Brewing now: ${brewingLedgerRow.name}` : ''}
                  {ledgerEta ? ` • ETA ${ledgerEta}` : ''}
                </div>
              </div>
              {readyLedgerRows.length > 0 && (
                <button
                  className={'worldScreenModuleButton alchemyLedgerClaimAll'}
                  onClick={() => {
                    let claimed = 0;
                    for (const row of readyLedgerRows) {
                      const result = claimAlchemy(row.jobId);
                      if (!result.ok) {
                        setQueueToast({ kind: 'error', message: result.error });
                        return;
                      }
                      claimed += 1;
                    }
                    setQueueToast({
                      kind: 'success',
                      message: `Claimed ${claimed} batch${claimed === 1 ? '' : 'es'}.`,
                    });
                  }}
                >
                  Claim All Ready ({readyLedgerRows.length})
                </button>
              )}
            </div>

            {queueToast && (
              <div className={`alchemyLedgerToast alchemyLedgerToast--${queueToast.kind}`}>
                {queueToast.message}
              </div>
            )}

            {brewLedgerRows.length === 0 ? (
              <div className={'alchemyQueueEmpty'}>Ledger is empty.</div>
            ) : (
              <div className={'alchemyLedger'}>
                {brewLedgerRows.map((row) => (
                  <div
                    key={row.jobId}
                    className={classNames('alchemyLedgerRow', `alchemyLedgerRow--${row.state}`)}
                    data-state={row.state}
                  >
                    <div className={'alchemyLedgerRowMain'}>
                      <div className={'alchemyLedgerStatus'}>
                        <span className={'alchemyLedgerDot'} aria-hidden="true" />
                        <span className={'alchemyLedgerLabel'}>
                          {row.state === 'ready' ? 'Ready' : row.state === 'brewing' ? 'Brewing' : 'Queued'}
                        </span>
                      </div>
                      <div className={'alchemyLedgerName'}>
                        {row.name} ×{row.qty}
                      </div>
                      <div className={'alchemyLedgerTime'}>{row.timeLabel}</div>
                      {row.state === 'ready' && (
                        <button
                          className={'worldScreenModuleButton alchemyLedgerClaim alchemyClaimButton alchemyClaimButton--ready'}
                          onClick={() => {
                            const result = claimAlchemy(row.jobId);
                            if (!result.ok) {
                              setQueueToast({ kind: 'error', message: result.error });
                              return;
                            }
                            setQueueToast({ kind: 'success', message: 'Claimed 1 batch.' });
                          }}
                        >
                          Claim
                        </button>
                      )}
                    </div>
                    {row.state === 'brewing' && (
                      <div className={'alchemyLedgerProgress'}>
                        <div
                          className={'alchemyLedgerProgressFill'}
                          style={{ width: `${Math.round(row.progress01 * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {lastResult && (
        <AlchemyResultModal
          result={lastResult.result}
          recipeName={resultRecipeName}
          onClose={handleResultClose}
          onCraftAgain={handleResultCraftAgain}
          onQueueIdle={handleResultQueueIdle}
        />
      )}
    </div>
  );
}
